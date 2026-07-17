import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isInstalled: vi.fn(),
  mutateCatalog: vi.fn(),
  resolveBin: vi.fn(),
  runCli: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: mocks.spawn,
}));

vi.mock("./higgsfieldCli", () => ({
  HIGGSFIELD_VENDOR_KEY: "higgsfield-cli",
  buildHiggsfieldEnv: () => ({ PATH: process.env.PATH || "" }),
  isHiggsfieldInstalled: () => mocks.isInstalled(),
  parseJson: <T>(text: string, fallback: T): T => {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  },
  resolveHiggsfieldBin: () => mocks.resolveBin(),
  runHiggsfieldCli: (...args: unknown[]) => mocks.runCli(...args),
}));

vi.mock("./catalogStore", () => ({
  mutateCatalog: (...args: unknown[]) => mocks.mutateCatalog(...args),
}));

import { createHiggsfieldProviderAdapter } from "./higgsfieldProviderAdapter";
import { HIGGSFIELD_PROVIDER_MANIFEST } from "./higgsfieldProviderManifest";
import {
  higgsfieldInstall,
  higgsfieldLogin,
  higgsfieldStatus,
  higgsfieldSyncCatalog,
} from "./higgsfieldIpc";

type FakeChild = EventEmitter & {
  stdout: PassThrough;
  stderr: PassThrough;
  kill: ReturnType<typeof vi.fn>;
};

const RAW_SECRET = "hf_live_setup_boundary_0123456789";
const RAW_PROCESS_TEXT = `Bearer ${RAW_SECRET} /Users/tester/.config/higgsfield/credentials.json`;

function cliResult(stdout: string, stderr = "", code = 0) {
  return { code, stdout, stderr };
}

function fakeChild(code: number, stdout: string, stderr: string): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = vi.fn();
  setImmediate(() => {
    child.stdout.end(stdout);
    child.stderr.end(stderr);
    child.emit("close", code);
  });
  return child;
}

beforeEach(() => {
  mocks.isInstalled.mockReset().mockReturnValue(false);
  mocks.resolveBin.mockReset().mockReturnValue("");
  mocks.runCli.mockReset();
  mocks.spawn.mockReset();
  mocks.mutateCatalog.mockReset().mockImplementation((mutate: (tx: unknown) => void) => {
    mutate({
      upsertVendor: vi.fn(),
      upsertModel: vi.fn(),
      upsertMapping: vi.fn(),
    });
  });
});

describe("Higgsfield setup IPC compatibility", () => {
  it("preserves the exact status shape while projecting account and workspace data", async () => {
    mocks.isInstalled.mockReturnValue(true);
    mocks.runCli.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");
      if (command === "version") return cliResult(`higgsfield 1.1.13\n${RAW_PROCESS_TEXT}`);
      if (command === "account status --json") {
        return cliResult(JSON.stringify({
          credits: 42,
          subscription_plan_type: "enterprise",
          email: "owner@example.com",
          token: RAW_SECRET,
        }));
      }
      if (command === "workspace status --json") {
        return cliResult(JSON.stringify({ name: "Everville Media", plan_type: "team", credential: RAW_SECRET }));
      }
      if (command === "model list --json") return cliResult(JSON.stringify([{ job_type: "image-model" }]));
      if (command === "workflow list --json") return cliResult(JSON.stringify([{ job_type: "brand-workflow" }]));
      if (command === "voices list --json") return cliResult(JSON.stringify({ total: 3, authorization: RAW_SECRET }));
      throw new Error(`Unexpected fixture command: ${command}`);
    });

    const response = await higgsfieldStatus();

    expect(response).toEqual({
      installed: true,
      loggedIn: true,
      version: "1.1.13",
      latestVersion: "",
      planType: "enterprise",
      credits: 42,
      workspaceName: "Everville Media",
      modelCount: 1,
      workflowCount: 1,
      voiceCount: 3,
      error: "",
    });
    expect(JSON.stringify(response)).not.toContain(RAW_SECRET);
    expect(JSON.stringify(response)).not.toContain("owner@example.com");
    expect(JSON.stringify(response)).not.toContain("credentials.json");
  });

  it("preserves the install response shape without returning captured process output", async () => {
    mocks.spawn.mockReturnValue(fakeChild(1, RAW_PROCESS_TEXT, RAW_SECRET) as never);

    const response = await higgsfieldInstall();

    expect(response).toEqual({ ok: false, message: "Install did not finish." });
    expect(Object.keys(response).sort()).toEqual(["message", "ok"]);
    expect(JSON.stringify(response)).not.toContain(RAW_SECRET);
    expect(JSON.stringify(response)).not.toContain("credentials.json");
  });

  it("preserves the login response shape and maps raw CLI failure text to a curated message", async () => {
    mocks.runCli.mockResolvedValue(cliResult(RAW_PROCESS_TEXT, `login failed: ${RAW_SECRET}`, 1));

    const response = await higgsfieldLogin();

    expect(response).toEqual({
      ok: false,
      message: "Higgsfield CLI needs sign-in. Open Model setup and sign in to Higgsfield again.",
    });
    expect(Object.keys(response).sort()).toEqual(["message", "ok"]);
    expect(JSON.stringify(response)).not.toContain(RAW_SECRET);
    expect(JSON.stringify(response)).not.toContain("credentials.json");
  });

  it("preserves the catalog-sync response shape without exposing extra provider fields", async () => {
    mocks.runCli.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");
      if (command === "model list --json") {
        return cliResult(JSON.stringify([{ display_name: "Image Model", job_type: "image-model", type: "image", token: RAW_SECRET }]));
      }
      if (command === "workflow list --json") {
        return cliResult(JSON.stringify([{ display_name: "Brand Workflow", job_type: "brand-workflow", type: "video", token: RAW_SECRET }]));
      }
      if (command === "model get image-model --json" || command === "workflow get brand-workflow --json") {
        return cliResult(JSON.stringify({ params: [], stderr: RAW_PROCESS_TEXT }));
      }
      throw new Error(`Unexpected fixture command: ${command}`);
    });

    const response = await higgsfieldSyncCatalog();

    expect(response).toEqual({
      ok: true,
      models: 2,
      workflows: 1,
      message: "Enabled 1 Higgsfield models and 1 workflows.",
    });
    expect(Object.keys(response).sort()).toEqual(["message", "models", "ok", "workflows"]);
    expect(JSON.stringify(response)).not.toContain(RAW_SECRET);
    expect(JSON.stringify(response)).not.toContain("credentials.json");
  });

  it("projects provider output through the closed result schema before returning it", async () => {
    const executor = {
      execute: vi.fn(async () => ({
        kind: "success" as const,
        exitCode: 0,
        stdout: JSON.stringify({
          subscription_plan_type: "enterprise",
          credits: 42,
          email: "owner@example.com",
          token: RAW_SECRET,
          raw_process_text: RAW_PROCESS_TEXT,
        }),
        stderr: "",
      })),
    };
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: { models: {}, workflows: {} },
      environment: {},
      platform: "posix",
    });

    const response = await provider.invoke({
      requestId: "request-account-status-001",
      manifestVersion: HIGGSFIELD_PROVIDER_MANIFEST.manifestVersion,
      operationId: "higgsfield.account.status",
      input: {},
      policyContext: { claimIds: [] },
    });

    expect(response).toMatchObject({
      ok: true,
      value: {
        subscription_plan_type: "enterprise",
        credits: 42,
      },
    });
    expect(response.ok && response.value).toEqual({
      subscription_plan_type: "enterprise",
      credits: 42,
    });
    expect(JSON.stringify(response)).not.toContain(RAW_SECRET);
    expect(JSON.stringify(response)).not.toContain("owner@example.com");
    expect(JSON.stringify(response)).not.toContain("credentials.json");
  });
});
