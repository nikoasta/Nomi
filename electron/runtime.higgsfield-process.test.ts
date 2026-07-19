import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let mockedUserDataRoot = "";
const tempRoots: string[] = [];

const runHiggsfieldCli = vi.fn();

vi.mock("electron", () => ({
  app: {
    getPath: () => mockedUserDataRoot,
    getAppPath: () => process.cwd(),
  },
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (s: string) => Buffer.from(s),
    decryptString: (b: Buffer) => b.toString(),
  },
}));

vi.mock("./catalog/higgsfieldCli", () => ({
  HIGGSFIELD_VENDOR_KEY: "higgsfield-cli",
  buildHiggsfieldEnv: () => process.env,
  isHiggsfieldInstalled: () => true,
  parseJson: (text: string, fallback: unknown) => {
    try { return JSON.parse(text); } catch { return fallback; }
  },
  resolveHiggsfieldBin: () => "/fake/bin/higgsfield",
  runHiggsfieldCli: (...args: unknown[]) => runHiggsfieldCli(...args),
}));

function makeTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(dir);
  return dir;
}

beforeEach(() => {
  mockedUserDataRoot = makeTempDir("nomi-higgsfield-process-");
  runHiggsfieldCli.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("Higgsfield process runtime", () => {
  it("routes audio models through process mapping and returns audio assets", async () => {
    const store = await import("./catalog/catalogStore");
    const { HIGGSFIELD_GENERATE_OP, HIGGSFIELD_STATUS_MAPPING } = await import("./catalog/higgsfieldTransport");
    store.upsertModelCatalogVendor({ key: "higgsfield-cli", name: "Higgsfield CLI", enabled: true, authType: "none", baseUrlHint: "higgsfield://cli" });
    store.upsertModelCatalogModel({ vendorKey: "higgsfield-cli", modelKey: "seed_audio", kind: "audio", enabled: true });
    store.upsertModelCatalogMapping({
      vendorKey: "higgsfield-cli",
      taskKind: "text_to_audio",
      name: "Higgsfield CLI audio",
      create: HIGGSFIELD_GENERATE_OP,
      statusMapping: HIGGSFIELD_STATUS_MAPPING,
    });

    runHiggsfieldCli.mockResolvedValue({
      code: 0,
      stdout: '[{"id":"aud-1","status":"completed","result_url":"https://cdn.example.com/out.wav"}]',
      stderr: "",
    });

    const { runTask } = await import("./runtime");
    const { mintSpendGrant } = await import("./spendGrant");
    const result = await runTask({
      vendor: "higgsfield-cli",
      request: { kind: "text_to_audio", prompt: "soft click", extras: { modelKey: "seed_audio", grantId: mintSpendGrant({ nodeIds: [] }) } },
    });

    expect(result.status).toBe("succeeded");
    expect(result.assets).toEqual([{ type: "audio", url: "https://cdn.example.com/out.wav", thumbnailUrl: null }]);
    expect(runHiggsfieldCli).toHaveBeenCalledWith(
      ["generate", "create", "seed_audio", "--prompt", "soft click", "--wait", "--wait-timeout", "20m", "--wait-interval", "5s", "--json"],
      expect.anything(),
    );
  });
});
