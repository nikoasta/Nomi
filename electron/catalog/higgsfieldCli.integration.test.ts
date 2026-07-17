import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";

import type { OutputLimits, SafeProcessEnvironment } from "./higgsfieldProviderAdapter";
import { buildHiggsfieldEnv, createHiggsfieldCliExecutor } from "./higgsfieldCli";

const TEST_LIMITS: OutputLimits = {
  stdoutBytes: 64 * 1024,
  stderrBytes: 64 * 1024,
  combinedBytes: 128 * 1024,
  jsonDepth: 32,
  arrayItems: 1_000,
  stringBytes: 16 * 1024,
  artifactCount: 10,
};

type FixturePids = {
  leaderPid: number;
  childPid: number;
};

const fixtureScript = String.raw`
const { spawn } = require("node:child_process");
const { writeFileSync } = require("node:fs");

const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
  stdio: "ignore",
});
writeFileSync(process.argv[1], JSON.stringify({
  leaderPid: process.pid,
  childPid: child.pid,
}));
setInterval(() => {}, 1000);
`;

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
    throw error;
  }
}

async function readFixturePids(pidFile: string): Promise<FixturePids> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    try {
      const parsed = JSON.parse(await readFile(pidFile, "utf8")) as Partial<FixturePids>;
      if (Number.isInteger(parsed.leaderPid) && Number.isInteger(parsed.childPid)) {
        return parsed as FixturePids;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
    }
    await delay(20);
  }
  throw new Error("The process-tree fixture did not publish its PIDs.");
}

async function expectProcessTreeTerminated(pids: FixturePids): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (!processExists(pids.leaderPid) && !processExists(pids.childPid)) return;
    await delay(20);
  }
  expect(processExists(pids.leaderPid), "fixture process-group leader must terminate").toBe(false);
  expect(processExists(pids.childPid), "fixture descendant must terminate with its process group").toBe(false);
}

function forceCleanup(pids: FixturePids | undefined): void {
  if (!pids) return;
  try {
    process.kill(-pids.leaderPid, "SIGKILL");
  } catch {
    // The production executor may already have reaped the complete group.
  }
  for (const pid of [pids.leaderPid, pids.childPid]) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Already terminated.
    }
  }
}

describe.skipIf(process.platform === "win32")("Higgsfield CLI process lifecycle", () => {
  it("terminates a real spawned process tree when an in-flight execution is cancelled", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "nomi-higgsfield-tree-"));
    const pidFile = path.join(tempDir, "pids.json");
    const controller = new AbortController();
    let pids: FixturePids | undefined;

    try {
      const execution = createHiggsfieldCliExecutor(process.execPath).execute({
        argv: ["-e", fixtureScript, pidFile],
        timeoutMs: 10_000,
        signal: controller.signal,
        limits: TEST_LIMITS,
        env: buildHiggsfieldEnv() as SafeProcessEnvironment,
      });

      pids = await readFixturePids(pidFile);
      expect(processExists(pids.leaderPid)).toBe(true);
      expect(processExists(pids.childPid)).toBe(true);

      controller.abort();

      await expect(execution).resolves.toEqual({
        kind: "cancelled",
        remoteState: "unknown",
        cancellation: "local_wait_stopped",
      });
      await expectProcessTreeTerminated(pids);
    } finally {
      controller.abort();
      forceCleanup(pids);
      await rm(tempDir, { recursive: true, force: true });
    }
  }, 15_000);
});
