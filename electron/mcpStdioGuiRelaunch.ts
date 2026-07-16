import type { App, Event } from "electron";
import { spawn as defaultSpawn } from "node:child_process";
import path from "node:path";

type SpawnLike = typeof defaultSpawn;

export interface McpGuiRelaunchApp {
  readonly isPackaged: boolean;
  getAppPath(): string;
}

export interface McpGuiRelaunchCommand {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
}

export function resolvePackagedAppBundlePath(execPath: string): string {
  return path.resolve(path.dirname(execPath), "../..");
}

export function buildMcpGuiRelaunchCommand(
  app: McpGuiRelaunchApp,
  execPath = process.execPath,
  env: NodeJS.ProcessEnv = process.env,
): McpGuiRelaunchCommand {
  const cleanEnv = { ...env };
  delete cleanEnv.NOMI_MCP_STDIO;

  if (app.isPackaged) {
    return {
      command: "/usr/bin/open",
      args: ["-na", resolvePackagedAppBundlePath(execPath)],
      env: cleanEnv,
    };
  }

  return {
    command: execPath,
    args: [app.getAppPath()],
    env: { ...cleanEnv, NOMI_E2E_ALLOW_MULTI_INSTANCE: "1" },
  };
}

export function registerMcpStdioGuiRelaunch(
  app: App,
  options: { spawn?: SpawnLike; minIntervalMs?: number } = {},
): void {
  const spawn = options.spawn ?? defaultSpawn;
  const minIntervalMs = options.minIntervalMs ?? 1500;
  let lastLaunchAt = 0;

  const launchGui = () => {
    const now = Date.now();
    if (now - lastLaunchAt < minIntervalMs) return;
    lastLaunchAt = now;

    const { command, args, env } = buildMcpGuiRelaunchCommand(app);
    const child = spawn(command, args, { detached: true, env, stdio: "ignore" });
    child.unref();
  };

  app.on("activate", launchGui);
  app.on("open-file", (event: Event) => {
    event.preventDefault();
    launchGui();
  });
}
