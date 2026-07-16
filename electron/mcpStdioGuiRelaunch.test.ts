import { describe, expect, it } from "vitest";
import { buildMcpGuiRelaunchCommand, resolvePackagedAppBundlePath } from "./mcpStdioGuiRelaunch";

describe("mcpStdioGuiRelaunch", () => {
  it("resolves the packaged .app bundle from the macOS executable path", () => {
    expect(resolvePackagedAppBundlePath("/Applications/Nomi.app/Contents/MacOS/Nomi")).toBe("/Applications/Nomi.app");
  });

  it("uses LaunchServices to open a fresh GUI instance for packaged builds", () => {
    const command = buildMcpGuiRelaunchCommand(
      { isPackaged: true, getAppPath: () => "/unused" },
      "/Applications/Nomi.app/Contents/MacOS/Nomi",
      { NOMI_MCP_STDIO: "1", KEEP_ME: "yes" },
    );

    expect(command.command).toBe("/usr/bin/open");
    expect(command.args).toEqual(["-na", "/Applications/Nomi.app"]);
    expect(command.env.NOMI_MCP_STDIO).toBeUndefined();
    expect(command.env.KEEP_ME).toBe("yes");
  });

  it("relaunches the app path directly in dev without inheriting stdio mode", () => {
    const command = buildMcpGuiRelaunchCommand(
      { isPackaged: false, getAppPath: () => "/repo/app" },
      "/usr/local/bin/electron",
      { NOMI_MCP_STDIO: "1" },
    );

    expect(command.command).toBe("/usr/local/bin/electron");
    expect(command.args).toEqual(["/repo/app"]);
    expect(command.env.NOMI_MCP_STDIO).toBeUndefined();
    expect(command.env.NOMI_E2E_ALLOW_MULTI_INSTANCE).toBe("1");
  });
});
