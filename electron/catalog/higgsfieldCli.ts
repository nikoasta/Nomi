import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const HIGGSFIELD_VENDOR_KEY = "higgsfield-cli";

type RunOptions = { timeoutMs?: number; bin?: string };
export type HiggsfieldRunResult = { code: number; stdout: string; stderr: string };

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
  return { ...base, PATH: mergedPath };
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

export function runHiggsfieldCli(args: string[], opts: RunOptions = {}): Promise<HiggsfieldRunResult> {
  const bin = opts.bin || resolveHiggsfieldBin();
  if (!bin) {
    return Promise.reject(new Error("Higgsfield CLI is not installed. Install it from https://higgsfield.ai/cli or run: npm install -g @higgsfield/cli"));
  }
  return new Promise<HiggsfieldRunResult>((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true, env: buildHiggsfieldEnv() });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill("SIGKILL"); } catch { /* already gone */ }
      reject(new Error(`Higgsfield CLI timed out (${args[0] || "command"})`));
    }, opts.timeoutMs ?? 60_000);
    child.stdout?.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}

export function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
