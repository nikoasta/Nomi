import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  BoundedCliResult,
  HiggsfieldCliExecutor,
  OutputLimits,
  SafeProcessEnvironment,
} from "./higgsfieldProviderAdapter";

export const HIGGSFIELD_VENDOR_KEY = "higgsfield-cli";

type RunOptions = {
  timeoutMs?: number;
  bin?: string;
  signal?: AbortSignal;
  limits?: OutputLimits;
  env?: SafeProcessEnvironment;
};
export type HiggsfieldRunResult = { code: number; stdout: string; stderr: string };
type HiggsfieldCliTerminalFailure = Exclude<BoundedCliResult, { kind: "success" } | { kind: "failure" }>;

export class HiggsfieldCliRunError extends Error {
  readonly result: HiggsfieldCliTerminalFailure;

  constructor(result: HiggsfieldCliTerminalFailure) {
    super(`Higgsfield CLI ${result.kind.replace(/_/g, " ")}.`);
    this.name = "HiggsfieldCliRunError";
    this.result = result;
  }
}

const DEFAULT_LIMITS: OutputLimits = {
  stdoutBytes: 1_048_576,
  stderrBytes: 262_144,
  combinedBytes: 1_310_720,
  jsonDepth: 32,
  arrayItems: 10_000,
  stringBytes: 65_536,
  artifactCount: 100,
};

const POSIX_ENV_KEYS = ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR"] as const;
const WINDOWS_ENV_KEYS = ["PATH", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "TEMP", "TMP"] as const;

function candidateBinPaths(): string[] {
  const home = os.homedir();
  const isWin = process.platform === "win32";
  const names = isWin ? ["higgsfield.exe", "higgsfield.cmd", "higgsfield", "higgs.exe", "higgs.cmd", "higgs"] : ["higgsfield", "higgs"];
  const dirs = isWin
    ? [path.join(home, ".local", "bin"), path.join(home, "AppData", "Roaming", "npm"), path.join(home, "AppData", "Local", "Microsoft", "WindowsApps")]
    : [path.join(home, ".local", "bin"), "/usr/local/bin", "/opt/homebrew/bin", path.join(home, "bin")];
  return dirs.flatMap((dir) => names.map((name) => path.join(dir, name)));
}

function extraPathDirs(): string[] {
  const home = os.homedir();
  return process.platform === "win32"
    ? [path.join(home, ".local", "bin"), path.join(home, "AppData", "Roaming", "npm")]
    : [path.join(home, ".local", "bin"), "/usr/local/bin", "/opt/homebrew/bin", path.join(home, "bin")];
}

export function buildHiggsfieldEnv(base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const mergedPath = [...extraPathDirs(), base.PATH || ""].filter(Boolean).join(path.delimiter);
  const keys = process.platform === "win32" ? WINDOWS_ENV_KEYS : POSIX_ENV_KEYS;
  const safe: NodeJS.ProcessEnv = {};
  for (const key of keys) {
    const value = key === "PATH" ? mergedPath : base[key];
    if (typeof value === "string" && value.length > 0) safe[key] = value;
  }
  return safe;
}

export function resolveHiggsfieldBin(): string {
  const override = (process.env.HIGGSFIELD_BIN || process.env.HIGGS_BIN || "").trim();
  if (override && existsSync(override)) return override;
  for (const candidate of candidateBinPaths()) {
    if (existsSync(candidate)) return candidate;
  }
  return "";
}

export function isHiggsfieldInstalled(): boolean {
  return resolveHiggsfieldBin() !== "";
}

function terminateProcessTree(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        shell: false,
        stdio: "ignore",
      });
      killer.unref();
      return;
    } catch {
      // Fall through to direct termination.
    }
  } else {
    try {
      process.kill(-child.pid, "SIGKILL");
      return;
    } catch {
      // The process may have exited before its group was terminated.
    }
  }
  try {
    child.kill("SIGKILL");
  } catch {
    // Already gone.
  }
}

export function createHiggsfieldCliExecutor(binOverride?: string): HiggsfieldCliExecutor {
  return {
    execute(input): Promise<BoundedCliResult> {
      if (input.signal?.aborted) {
        return Promise.resolve({ kind: "cancelled", remoteState: "not_started", cancellation: "before_start" });
      }
      const bin = binOverride || resolveHiggsfieldBin();
      if (!bin) return Promise.resolve({ kind: "not_installed" });

      return new Promise<BoundedCliResult>((resolve) => {
        let child: ChildProcess;
        try {
          child = spawn(bin, [...input.argv], {
            windowsHide: true,
            shell: false,
            detached: process.platform !== "win32",
            env: input.env,
          });
        } catch {
          resolve({ kind: "unavailable" });
          return;
        }

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let settled = false;

        const finish = (result: BoundedCliResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          input.signal?.removeEventListener("abort", onAbort);
          resolve(result);
        };
        const stopWithLimit = (limit: string) => {
          terminateProcessTree(child);
          finish({ kind: "output_limit_exceeded", limit });
        };
        const collect = (stream: "stdout" | "stderr", chunk: Buffer | string) => {
          if (settled) return;
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          if (stream === "stdout") {
            stdoutBytes += buffer.length;
            if (stdoutBytes > input.limits.stdoutBytes) return stopWithLimit("stdoutBytes");
            stdoutChunks.push(buffer);
          } else {
            stderrBytes += buffer.length;
            if (stderrBytes > input.limits.stderrBytes) return stopWithLimit("stderrBytes");
            stderrChunks.push(buffer);
          }
          if (stdoutBytes + stderrBytes > input.limits.combinedBytes) stopWithLimit("combinedBytes");
        };
        const onAbort = () => {
          terminateProcessTree(child);
          finish({ kind: "cancelled", remoteState: "unknown", cancellation: "local_wait_stopped" });
        };
        const timer = setTimeout(() => {
          terminateProcessTree(child);
          finish({ kind: "timed_out" });
        }, input.timeoutMs);

        input.signal?.addEventListener("abort", onAbort, { once: true });
        if (input.signal?.aborted) onAbort();
        child.stdout?.on("data", (chunk) => collect("stdout", chunk));
        child.stderr?.on("data", (chunk) => collect("stderr", chunk));
        child.on("error", () => finish({ kind: "unavailable" }));
        child.on("close", (code) => {
          const stdout = Buffer.concat(stdoutChunks).toString("utf8");
          const stderr = Buffer.concat(stderrChunks).toString("utf8");
          if ((code ?? -1) === 0) finish({ kind: "success", exitCode: 0, stdout, stderr });
          else finish({ kind: "failure", exitCode: code ?? -1, stdout, stderr });
        });
      });
    },
  };
}

export async function runHiggsfieldCli(args: string[], opts: RunOptions = {}): Promise<HiggsfieldRunResult> {
  const result = await createHiggsfieldCliExecutor(opts.bin).execute({
    argv: args,
    timeoutMs: opts.timeoutMs ?? 60_000,
    signal: opts.signal,
    limits: opts.limits ?? DEFAULT_LIMITS,
    env: opts.env ?? (buildHiggsfieldEnv() as SafeProcessEnvironment),
  });
  if (result.kind === "success") {
    return { code: result.exitCode, stdout: result.stdout, stderr: result.stderr };
  }
  if (result.kind === "failure") {
    return { code: result.exitCode ?? -1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  }
  throw new HiggsfieldCliRunError(result);
}

export function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
