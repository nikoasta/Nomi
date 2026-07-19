/* eslint-disable @typescript-eslint/no-explicit-any -- Planned store exports do not have implementation types yet. */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

const STORE_URL = new URL("./projectAssetStore.ts", import.meta.url);
const IDENTITY_URL = new URL("./assetIdentity.ts", import.meta.url);
const STORE_EXPORTS = [
  "importAssetRecordFile",
  "listProjectAssetRecords",
  "resolveProjectAssetRecord",
  "listProjectAssets",
] as const;
const IDENTITY_EXPORTS = [
  "generateAssetId",
  "generateAssetVersionId",
  "computeAssetIntegrity",
  "createAssetIdentityEnvelope",
  "parseAssetIdentityEnvelope",
  "serializeAssetIdentityEnvelope",
] as const;

type PlatformResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; retryable: boolean; details?: unknown } };

type AssetIdentityModule = {
  generateAssetId(): string;
  generateAssetVersionId(): string;
  computeAssetIntegrity(bytes: Uint8Array): Promise<{
    algorithm: "sha256";
    digest: string;
    sizeBytes: number;
    mediaType: string;
  }>;
  createAssetIdentityEnvelope(input: Record<string, unknown>): unknown;
  parseAssetIdentityEnvelope(value: unknown, context: Record<string, unknown>): unknown;
  serializeAssetIdentityEnvelope(value: unknown): unknown;
};

type ProjectAssetStoreModule = {
  importAssetRecordFile(options: Record<string, unknown>): Promise<PlatformResult<any>>;
  listProjectAssetRecords(options: Record<string, unknown>): Promise<PlatformResult<any>>;
  resolveProjectAssetRecord(options: Record<string, unknown>): Promise<PlatformResult<any>>;
  listProjectAssets(options: Record<string, unknown>): Promise<any[]> | any[];
};

async function guardedImport<T>(url: URL, contract: string, requiredNames: readonly string[]): Promise<T> {
  const modulePath = fileURLToPath(url);
  expect(
    existsSync(modulePath),
    `RED_CONTRACT: ${contract} must exist before the filesystem contract is imported`,
  ).toBe(true);
  const source = readFileSync(modulePath, "utf8");
  for (const name of requiredNames) {
    expect(source, `RED_CONTRACT: ${contract} must declare ${name} before module import`).toMatch(
      new RegExp(`\\b${name}\\b`),
    );
  }
  return import(/* @vite-ignore */ url.href) as Promise<T>;
}

const SCOPE = { organizationId: "org-everville", projectId: "project-alpha" } as const;
const SESSION = {
  principalId: "principal-niko",
  activeOrganizationId: SCOPE.organizationId,
  memberships: [{ organizationId: SCOPE.organizationId, role: "owner" }],
} as const;
const BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

function makeProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "nomi-asset-records-"));
  roots.push(root);
  mkdirSync(join(root, "assets"), { recursive: true });
  return root;
}

function authorizeAll() {
  return vi.fn(async () => ({ ok: true, value: { decision: "allow" } }));
}

function importRequest(overrides: Record<string, unknown> = {}) {
  return {
    ...SCOPE,
    fileName: "frame.png",
    claimedMediaType: "image/png",
    bytes: BYTES.buffer.slice(BYTES.byteOffset, BYTES.byteOffset + BYTES.byteLength),
    classification: "internal",
    idempotencyKey: "file-import-1",
    ...overrides,
  };
}

function storeOptions(projectRoot: string, request: Record<string, unknown>) {
  return { projectRoot, session: SESSION, authorize: authorizeAll(), request };
}

function unwrap<T>(result: PlatformResult<T>): T {
  expect(result).toEqual(expect.objectContaining({ ok: true }));
  if (!result.ok) throw new Error(`Expected success, received ${result.error.code}`);
  return result.value;
}

function filesBelow(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

function findAssetAndSidecar(projectRoot: string): { assetPath: string; sidecarPath: string } {
  const files = filesBelow(join(projectRoot, "assets"));
  const sidecars = files.filter((path) => basename(path).includes(".meta"));
  const assets = files.filter((path) => !basename(path).includes(".meta"));
  expect(assets).toHaveLength(1);
  expect(sidecars).toHaveLength(1);
  return { assetPath: assets[0], sidecarPath: sidecars[0] };
}

function findEnvelopeNode(value: unknown): Record<string, unknown> {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    const record = current as Record<string, unknown>;
    const bundle = record.bundle as Record<string, any> | undefined;
    if (bundle?.asset?.schemaVersion === "asset.v1") return record;
    queue.push(...Object.values(record));
  }
  throw new Error("Platform identity envelope not found in sidecar JSON");
}

function walkJson(value: unknown, visit: (key: string | null, value: unknown) => void) {
  const queue: Array<{ key: string | null; value: unknown }> = [{ key: null, value }];
  while (queue.length > 0) {
    const current = queue.shift()!;
    visit(current.key, current.value);
    if (Array.isArray(current.value)) {
      current.value.forEach((item) => queue.push({ key: null, value: item }));
    } else if (current.value && typeof current.value === "object") {
      Object.entries(current.value).forEach(([key, child]) => queue.push({ key, value: child }));
    }
  }
}

function assertNoPersistedLocatorStorageOrSecret(value: unknown) {
  const forbiddenKey =
    /^(?:url|uri|locator|path|absolutePath|relativePath|storagePath|bucket|bucketKey|objectKey|credential|credentials|authorization|headers|cookie|token|secret|rawPrompt|prompt|rawResponse|rawPayload|providerResponse|stack)$/i;
  const forbiddenValue =
    /(?:nomi-local:|file:|blob:|https?:\/\/|[?&](?:signature|token|credential)=|(?:^|\/)\.\.(?:\/|$)|^\/(?:Users|home|tmp)\/)/i;

  walkJson(value, (key, child) => {
    if (key !== null) expect(key).not.toMatch(forbiddenKey);
    if (typeof child === "string") expect(child).not.toMatch(forbiddenValue);
  });
}

async function importOne(projectRoot: string, overrides: Record<string, unknown> = {}) {
  const store = await guardedImport<ProjectAssetStoreModule>(
    STORE_URL,
    "project asset-store identity integration",
    STORE_EXPORTS,
  );
  const result = await store.importAssetRecordFile(storeOptions(projectRoot, importRequest(overrides)));
  return { store, bundle: unwrap<any>(result) };
}

describe("project asset store identity projection", () => {
  it("creates opaque IDs and canonical integrity without encoding path or scope", async () => {
    const identity = await guardedImport<AssetIdentityModule>(
      IDENTITY_URL,
      "opaque asset identity helpers",
      IDENTITY_EXPORTS,
    );
    const assetIds = new Set(Array.from({ length: 32 }, () => identity.generateAssetId()));
    const versionIds = new Set(Array.from({ length: 32 }, () => identity.generateAssetVersionId()));

    expect(
      [...assetIds],
      "RED_CONTRACT: asset IDs must use cryptographically random canonical opaque values",
    ).toHaveLength(32);
    expect(versionIds).toHaveLength(32);
    for (const id of assetIds)
      expect(id).toMatch(/^ast_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    for (const id of versionIds)
      expect(id).toMatch(/^av_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect([...assetIds, ...versionIds].join(" ")).not.toMatch(/project|org|assets|imported|frame|png/i);

    const integrity = await identity.computeAssetIntegrity(BYTES);
    expect(integrity).toEqual({
      algorithm: "sha256",
      digest: createHash("sha256").update(BYTES).digest("hex"),
      sizeBytes: BYTES.byteLength,
      mediaType: "image/png",
    });
  });

  it("imports bytes once and persists an allowlisted identity envelope beside them", async () => {
    const projectRoot = makeProjectRoot();
    const { bundle } = await importOne(projectRoot);
    const { assetPath, sidecarPath } = findAssetAndSidecar(projectRoot);
    const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
    const envelope = findEnvelopeNode(sidecar);

    expect(readFileSync(assetPath)).toEqual(Buffer.from(BYTES));
    expect(bundle.asset.id).toMatch(/^ast_[0-9a-f-]{36}$/);
    expect(bundle.version.id).toMatch(/^av_[0-9a-f-]{36}$/);
    expect(envelope.bundle).toEqual(bundle);
    expect(JSON.stringify(envelope)).not.toContain("file-import-1");
    assertNoPersistedLocatorStorageOrSecret(envelope);
  });

  it("keeps identity stable across repeated lists and a bytes-plus-sidecar move", async () => {
    const projectRoot = makeProjectRoot();
    const { store, bundle: imported } = await importOne(projectRoot);
    const listRequest = { ...SCOPE, cursor: null, limit: 100 };
    const first = unwrap<any>(await store.listProjectAssetRecords(storeOptions(projectRoot, listRequest)));
    const second = unwrap<any>(await store.listProjectAssetRecords(storeOptions(projectRoot, listRequest)));

    expect(first).toEqual(second);
    expect(first.items).toHaveLength(1);
    expect(first.items[0].asset.id).toBe(imported.asset.id);
    expect(first.items[0].version.id).toBe(imported.version.id);

    const { assetPath, sidecarPath } = findAssetAndSidecar(projectRoot);
    const movedDirectory = join(projectRoot, "assets", "relocated");
    mkdirSync(movedDirectory, { recursive: true });
    const movedAsset = join(movedDirectory, "renamed.png");
    const sidecarSuffix = basename(sidecarPath).slice(basename(assetPath).length);
    const movedSidecar = `${movedAsset}${sidecarSuffix}`;
    renameSync(assetPath, movedAsset);
    renameSync(sidecarPath, movedSidecar);

    const afterMove = unwrap<any>(await store.listProjectAssetRecords(storeOptions(projectRoot, listRequest)));
    expect(afterMove.items).toHaveLength(1);
    expect(afterMove.items[0].asset.id).toBe(imported.asset.id);
    expect(afterMove.items[0].version.id).toBe(imported.version.id);
    expect(JSON.stringify(afterMove)).not.toMatch(/relocated|renamed\.png|nomi-local:/);
  });

  it("returns the same bundle and creates no new bytes for same-key replay", async () => {
    const projectRoot = makeProjectRoot();
    const { store, bundle: first } = await importOne(projectRoot);
    const beforeFiles = filesBelow(join(projectRoot, "assets")).sort();
    const second = unwrap<any>(await store.importAssetRecordFile(storeOptions(projectRoot, importRequest())));

    expect(second).toEqual(first);
    expect(filesBelow(join(projectRoot, "assets")).sort()).toEqual(beforeFiles);
  });

  it("serializes process-wide concurrent replay for the same key", async () => {
    const projectRoot = makeProjectRoot();
    const store = await guardedImport<ProjectAssetStoreModule>(
      STORE_URL,
      "project asset-store identity integration",
      STORE_EXPORTS,
    );
    const options = storeOptions(projectRoot, importRequest());
    const results = await Promise.all(Array.from({ length: 8 }, () => store.importAssetRecordFile(options)));
    const bundles = results.map((result) => unwrap<any>(result));

    expect(new Set(bundles.map((bundle) => bundle.asset.id))).toHaveLength(1);
    expect(new Set(bundles.map((bundle) => bundle.version.id))).toHaveLength(1);
    findAssetAndSidecar(projectRoot);
  });

  it.each([
    { fileName: "other.png" },
    { classification: "restricted" },
    { claimedMediaType: "image/jpeg" },
    { bytes: new Uint8Array([9, 9, 9]).buffer },
    { projectId: "project-other" },
  ])("returns conflict before write when an idempotency key is rebound %#", async (change) => {
    const projectRoot = makeProjectRoot();
    const { store } = await importOne(projectRoot);
    const before = filesBelow(join(projectRoot, "assets")).map((path) => [path, readFileSync(path)]);
    const result = await store.importAssetRecordFile(
      storeOptions(projectRoot, importRequest({ ...change, idempotencyKey: "file-import-1" })),
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "CONFLICT", retryable: false }),
    });
    expect(filesBelow(join(projectRoot, "assets"))).toHaveLength(before.length);
    for (const [path, bytes] of before) expect(readFileSync(path as string)).toEqual(bytes);
  });

  it("[asset-records][project-root] rejects explicit roots not bound to request project", async () => {
    const projectRoot = makeProjectRoot();
    const store = await guardedImport<ProjectAssetStoreModule>(
      STORE_URL,
      "project asset-store identity integration",
      STORE_EXPORTS,
    );
    const authorize = authorizeAll();
    const ownerImport = await store.importAssetRecordFile({
      projectRoot,
      session: SESSION,
      authorize,
      request: importRequest(),
    });
    unwrap(ownerImport);
    const before = filesBelow(projectRoot)
      .sort()
      .map((path) => [path, readFileSync(path)] as const);

    const crossProjectImport = await store.importAssetRecordFile({
      projectRoot,
      session: SESSION,
      authorize,
      request: importRequest({
        projectId: "project-other",
        fileName: "cross-project.png",
        bytes: new Uint8Array([...BYTES, 0xff]).buffer,
        idempotencyKey: "file-import-cross-project-root",
      }),
    });

    expect(crossProjectImport).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "PERMISSION_DENIED", retryable: false }),
    });
    expect(authorize).toHaveBeenCalled();
    expect(filesBelow(projectRoot).sort()).toEqual(before.map(([path]) => path));
    for (const [path, bytes] of before) expect(readFileSync(path)).toEqual(bytes);
  });

  it("uses distinct immutable version IDs for distinct byte snapshots", async () => {
    const projectRoot = makeProjectRoot();
    const { store, bundle: first } = await importOne(projectRoot);
    const second = unwrap<any>(
      await store.importAssetRecordFile(
        storeOptions(
          projectRoot,
          importRequest({
            fileName: "frame-v2.png",
            bytes: new Uint8Array([...BYTES, 0xff]).buffer,
            idempotencyKey: "file-import-2",
          }),
        ),
      ),
    );

    expect(second.asset.id).not.toBe(first.asset.id);
    expect(second.version.id).not.toBe(first.version.id);
    expect(second.version.integrity.digest).not.toBe(first.version.integrity.digest);
  });

  it.each([
    ["digest", (bytes: Buffer) => Buffer.concat([bytes, Buffer.from([0xff])])],
    ["size", (bytes: Buffer) => bytes.subarray(0, Math.max(0, bytes.length - 1))],
  ])("quarantines a stored-byte %s mismatch and returns no locator", async (_kind, mutate) => {
    const projectRoot = makeProjectRoot();
    const { store, bundle } = await importOne(projectRoot);
    const { assetPath } = findAssetAndSidecar(projectRoot);
    writeFileSync(assetPath, mutate(readFileSync(assetPath)));

    const list = unwrap<any>(
      await store.listProjectAssetRecords(storeOptions(projectRoot, { ...SCOPE, cursor: null, limit: 100 })),
    );
    expect(list.items).toEqual([]);

    const resolved = await store.resolveProjectAssetRecord(
      storeOptions(projectRoot, {
        ...SCOPE,
        assetId: bundle.asset.id,
        versionId: bundle.version.id,
        purpose: "display",
      }),
    );
    expect(resolved).toEqual({
      ok: false,
      error: expect.objectContaining({ retryable: false }),
    });
    expect(JSON.stringify(resolved)).toMatch(/INTEGRITY|QUARANTIN|DIGEST_MISMATCH|SIZE_MISMATCH/);
    expect(JSON.stringify(resolved)).not.toMatch(/nomi-local:|file:|absolutePath|relativePath/);
  });

  it("rejects or quarantines a claimed MIME mismatch without returning a locator", async () => {
    const projectRoot = makeProjectRoot();
    const store = await guardedImport<ProjectAssetStoreModule>(
      STORE_URL,
      "project asset-store identity integration",
      STORE_EXPORTS,
    );
    const result = await store.importAssetRecordFile(
      storeOptions(projectRoot, importRequest({ claimedMediaType: "image/jpeg" })),
    );

    if (result.ok) {
      expect(result.value.version.validation).toEqual(
        expect.objectContaining({ state: "quarantined", reasonCodes: expect.arrayContaining(["MIME_MISMATCH"]) }),
      );
    } else {
      expect(JSON.stringify(result.error)).toMatch(/INVALID_ARGUMENT|INTEGRITY|QUARANTIN|MIME_MISMATCH/);
    }
    expect(JSON.stringify(result)).not.toMatch(/nomi-local:|file:|absolutePath|relativePath/);
  });

  it("omits malformed and scope-mismatched envelopes without path-derived fallback", async () => {
    for (const mutate of [
      (envelope: Record<string, any>) => {
        envelope.bundle.asset.id = "ast_../forged";
      },
      (envelope: Record<string, any>) => {
        envelope.bundle.version.scope.projectId = "project-other";
      },
    ]) {
      const projectRoot = makeProjectRoot();
      const { store } = await importOne(projectRoot);
      const { sidecarPath } = findAssetAndSidecar(projectRoot);
      const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
      mutate(findEnvelopeNode(sidecar));
      writeFileSync(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);

      const result = unwrap<any>(
        await store.listProjectAssetRecords(storeOptions(projectRoot, { ...SCOPE, cursor: null, limit: 100 })),
      );
      expect(result.items).toEqual([]);
      expect(JSON.stringify(result)).not.toMatch(/asset-[0-9a-f]{40}|nomi-local:|relativePath/);
    }
  });

  it("resolves only a validated identity to an ephemeral nomi-local URL", async () => {
    const projectRoot = makeProjectRoot();
    const { store, bundle } = await importOne(projectRoot);
    const resolution = unwrap<any>(
      await store.resolveProjectAssetRecord(
        storeOptions(projectRoot, {
          ...SCOPE,
          assetId: bundle.asset.id,
          versionId: bundle.version.id,
          purpose: "display",
        }),
      ),
    );

    expect(resolution).toEqual(
      expect.objectContaining({
        schemaVersion: "asset-resolution.v1",
        assetId: bundle.asset.id,
        versionId: bundle.version.id,
        scope: SCOPE,
        purpose: "display",
        integrity: bundle.version.integrity,
        locator: {
          kind: "runtime-url",
          runtime: "electron",
          url: expect.stringMatching(/^nomi-local:\/\/asset\//),
          expiresAt: null,
        },
      }),
    );

    const { sidecarPath } = findAssetAndSidecar(projectRoot);
    assertNoPersistedLocatorStorageOrSecret(findEnvelopeNode(JSON.parse(readFileSync(sidecarPath, "utf8"))));
  });

  it("keeps a legacy-only item on the legacy facade and never rewrites its bytes or sidecar", async () => {
    const projectRoot = makeProjectRoot();
    const relativePath = "imported/2026-07-18/legacy.png";
    const assetPath = join(projectRoot, "assets", relativePath);
    const sidecarPath = `${assetPath}.meta`;
    mkdirSync(dirname(assetPath), { recursive: true });
    writeFileSync(assetPath, BYTES);
    writeFileSync(
      sidecarPath,
      `${JSON.stringify({ originalName: "legacy.png", kind: "imported", originalUrl: "https://legacy.example.test/frame.png" }, null, 2)}\n`,
    );
    const beforeBytes = readFileSync(assetPath);
    const beforeSidecar = readFileSync(sidecarPath);
    const store = await guardedImport<ProjectAssetStoreModule>(
      STORE_URL,
      "project asset-store identity integration",
      STORE_EXPORTS,
    );

    const records = unwrap<any>(
      await store.listProjectAssetRecords(storeOptions(projectRoot, { ...SCOPE, cursor: null, limit: 100 })),
    );
    const legacy = await store.listProjectAssets({ projectRoot, projectId: SCOPE.projectId });
    const legacyItem = legacy.find((item) => item.data?.absolutePath === assetPath);
    expect(legacyItem).toBeDefined();
    const expectedLegacyId = `asset-${createHash("sha1")
      .update(`${SCOPE.projectId}:${legacyItem.data.relativePath}`)
      .digest("hex")}`;

    expect(records.items).toEqual([]);
    expect(legacyItem).toEqual(
      expect.objectContaining({
        id: expectedLegacyId,
        data: expect.objectContaining({
          relativePath: expect.stringContaining(relativePath),
          absolutePath: assetPath,
          url: expect.stringMatching(/^nomi-local:\/\//),
        }),
      }),
    );
    expect(readFileSync(assetPath)).toEqual(beforeBytes);
    expect(readFileSync(sidecarPath)).toEqual(beforeSidecar);
  });

  it("rejects forbidden identity-envelope keys and values recursively", async () => {
    const identity = await guardedImport<AssetIdentityModule>(
      IDENTITY_URL,
      "opaque asset identity helpers",
      IDENTITY_EXPORTS,
    );
    const forbiddenEntries: Array<[string, unknown]> = [
      ["url", "nomi-local://asset/project/frame.png"],
      ["absolutePath", "/Users/niko.dev/private/frame.png"],
      ["relativePath", "../assets/frame.png"],
      ["bucketKey", "tenant/project/frame.png"],
      ["authorization", "Bearer secret"],
      ["headers", { cookie: "session=secret" }],
      ["credential", "secret"],
      ["token", "secret"],
      ["rawPrompt", "API_KEY=secret"],
      ["rawResponse", { output: "secret" }],
      ["rawPayload", { providerResponse: "secret" }],
      ["providerResponse", { signedUrl: "https://provider.test/out?signature=secret" }],
    ];

    for (const [key, value] of forbiddenEntries) {
      const candidate = { schemaVersion: "asset-identity-envelope.v1", nested: [{ [key]: value }] };
      expect(() => identity.serializeAssetIdentityEnvelope(candidate)).toThrow();
      expect(() =>
        identity.parseAssetIdentityEnvelope(candidate, {
          scope: SCOPE,
          expectedIntegrity: {
            algorithm: "sha256",
            digest: createHash("sha256").update(BYTES).digest("hex"),
            sizeBytes: BYTES.byteLength,
            mediaType: "image/png",
          },
        }),
      ).toThrow();
    }
  });

  it("does not promote legacy path metadata into the stable domain bundle", async () => {
    const projectRoot = makeProjectRoot();
    const { store, bundle } = await importOne(projectRoot);
    const { sidecarPath } = findAssetAndSidecar(projectRoot);
    const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
    const envelope = findEnvelopeNode(sidecar);
    const stableBundle = envelope.bundle;
    const legacy = await store.listProjectAssets({ projectRoot, projectId: SCOPE.projectId });
    const legacyProjection = legacy.find((item) => item.id !== undefined);

    expect(legacyProjection).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        data: expect.objectContaining({
          relativePath: expect.any(String),
          absolutePath: expect.any(String),
          url: expect.stringMatching(/^nomi-local:\/\//),
        }),
      }),
    );
    expect(envelope.bundle).toEqual(bundle);
    expect(JSON.stringify(stableBundle)).not.toMatch(
      /nomi-local:|https?:\/\/|file:|blob:|absolutePath|relativePath|originalUrl|\/(?:Users|home|tmp)\//,
    );
  });
});
