import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hardenedFetch } from "../hardenedFetch";
import { isJsonRecord, nowIso, type JsonRecord } from "../jsonUtils";
import { listProjects, projectDirById, sanitizeName } from "../projects/repository";
import { ensureDir, getSettingsRoot } from "../runtimePaths";
import { broadcastAssetsUpdated } from "./assetEvents";
import { collectFilesRecursively, parseDataUrl } from "./assetBytes";
import { assetBucketFromMeta, assetKindFromContentType, contentTypeFromPath, extensionFromMime, extensionFromUrl, localAssetUrl, sanitizeAssetMetaForKind, stableAssetId } from "./assetPaths";
import { ASSET_IDENTITY_SIDECAR_KEY, authorizeLocalAssetRecord, computeAssetIntegrity, createElectronAssetResolution, createAssetIdentityEnvelope, createImportedAssetBundle, createLocalAssetRecordSession,
  fingerprintAssetRecordRequest, generateAssetId, hashAssetIdempotencyKey, parseAssetRecordImportFileRequest, parseAssetRecordImportRemoteUrlRequest, parseAssetRecordListRequest, parseAssetResolveRequest, parseAssetIdentityEnvelope, validateAssetRecordGraph, type AssetRecordBundle, type AssetRecordImportFileRequest, type AssetRecordImportRemoteUrlRequest, type AssetScope, type AssetIdentityEnvelope } from "./assetIdentity";
type LocalAssetRecord = {
  id: string; name: string; userId: "local"; projectId: string; createdAt: string; updatedAt: string;
  data: { url: string; relativePath: string; absolutePath: string; contentType: string; size: number; kind: string } & JsonRecord;
};
type AssetRecordStoreErrorCode = "INVALID_ARGUMENT" | "NOT_FOUND" | "PERMISSION_DENIED" | "CONFLICT" |
  "NETWORK_ERROR" | "IO_ERROR" | "INTEGRITY_ERROR" | "INTERNAL";
type AssetRecordStoreResult<T> = { ok: true; value: T } | { ok: false; error: { code: AssetRecordStoreErrorCode; retryable: boolean; details?: Readonly<Record<string, unknown>> } };
type AssetRecordStoreOptions = { projectRoot?: string; session?: unknown; authorize?: (request: Record<string, unknown>) => Promise<unknown>; request: unknown };
type RecordImportOperation = "import-file" | "import-remote-url";
const importLocks = new Map<string, Promise<AssetRecordStoreResult<AssetRecordBundle>>>();
const ASSET_IDENTITY_AUTHORITY_TAG_KEY = "platformAssetIdentityAuthorityTag";
const PROJECT_ROOT_SCOPE_BINDING_FILE = "platform-asset-project-scope.json";
const PROJECT_ROOT_SCOPE_BINDING_SCHEMA = "platform-asset-project-scope.v1";
const observedProjectRoots = new Set<string>();
function assetIdentityAuthorityRoot(explicitProjectRoot?: string): string {
  let settingsRoot: unknown;
  try { settingsRoot = getSettingsRoot(); } catch { settingsRoot = null; }
  if (typeof settingsRoot === "string" && settingsRoot.trim()) return path.resolve(settingsRoot);
  const projectRoot = typeof explicitProjectRoot === "string" ? explicitProjectRoot.trim() : "";
  if (!projectRoot || !path.isAbsolute(projectRoot)) throw new Error("Asset identity authority is unavailable");
  return path.join(path.resolve(projectRoot), ".nomi");
}
function assetIdentityAuthorityKey(explicitProjectRoot?: string, createIfMissing = true): Buffer {
  const authorityRoot = assetIdentityAuthorityRoot(explicitProjectRoot);
  ensureDir(authorityRoot);
  const keyPath = path.join(authorityRoot, "asset-identity-authority.key");
  let descriptor: number;
  try {
    descriptor = fs.openSync(keyPath, fs.constants.O_RDONLY | (process.platform === "win32" ? 0 : fs.constants.O_NOFOLLOW));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" || !createIfMissing) throw error;
    const candidate = crypto.randomBytes(32);
    try { fs.writeFileSync(keyPath, candidate, { flag: "wx", mode: 0o600 }); }
    catch (writeError) {
      if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") throw writeError;
    }
    descriptor = fs.openSync(keyPath, fs.constants.O_RDONLY | (process.platform === "win32" ? 0 : fs.constants.O_NOFOLLOW));
  }
  try {
    const stat = fs.fstatSync(descriptor);
    const wrongOwner = typeof process.getuid === "function" && stat.uid !== process.getuid();
    const unsafeMode = process.platform !== "win32" && (stat.mode & 0o077) !== 0;
    if (!stat.isFile() || wrongOwner || unsafeMode) throw new Error("Unsafe asset identity authority key");
    const authorityKey = fs.readFileSync(descriptor);
    if (authorityKey.byteLength !== 32) throw new Error("Invalid asset identity authority key");
    return authorityKey;
  } finally {
    fs.closeSync(descriptor);
  }
}
function durableAssetIdentityAuthority(explicitProjectRoot?: string): Buffer | null {
  try { return assetIdentityAuthorityKey(explicitProjectRoot); } catch { return null; }
}
function existingAssetIdentityAuthority(explicitProjectRoot?: string): Buffer | null {
  try { return assetIdentityAuthorityKey(explicitProjectRoot, false); } catch { return null; }
}
function assetIdentityAuthorityTag(envelope: AssetIdentityEnvelope, authorityKey: Buffer): string {
  return crypto.createHmac("sha256", authorityKey).update(JSON.stringify(envelope)).digest("hex");
}
function hasValidAssetIdentityAuthorityTag(envelope: AssetIdentityEnvelope, value: unknown, authorityKey: Buffer): boolean {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) return false;
  const actual = Buffer.from(value, "hex");
  const expected = Buffer.from(assetIdentityAuthorityTag(envelope, authorityKey), "hex");
  return actual.byteLength === expected.byteLength && crypto.timingSafeEqual(actual, expected);
}
async function fetchPublicRemoteAsset(rawUrl: string): Promise<{ bytes: Buffer; contentType: string }> {
  const url = new URL(rawUrl);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error("Invalid remote URL");
  const fetched = await hardenedFetch(url.toString(), { timeoutMs: 60_000, maxBytes: 200 * 1024 * 1024,
    allowContentTypes: ["image/", "video/", "audio/", "application/octet-stream"] });
  return { bytes: fetched.bytes, contentType: fetched.contentType };
}
function readAssetSidecarMeta(absolutePath: string): JsonRecord {
  try {
    const parsed = JSON.parse(fs.readFileSync(`${absolutePath}.meta`, "utf8"));
    return isJsonRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function writeAssetSidecarMeta(absolutePath: string, meta: JsonRecord): boolean {
  const sidecar: JsonRecord = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined) sidecar[key] = value;
  }
  if (Object.keys(sidecar).length === 0) return true;
  try {
    fs.writeFileSync(`${absolutePath}.meta`, JSON.stringify(sidecar));
    return true;
  } catch {
    return false;
  }
}
function uniqueAssetPath(projectId: string, fileName: string, bucket: "generated" | "imported" = "generated", explicitProjectRoot?: string): { absolutePath: string; relativePath: string } {
  const projectDir = explicitProjectRoot || projectDirById(projectId);
  if (!projectDir) throw new Error("Project not found");
  const today = new Date().toISOString().slice(0, 10);
  const assetDir = path.join(projectDir, "assets", bucket, today);
  ensureDir(assetDir);
  const parsed = path.parse(sanitizeName(fileName, "asset.bin"));
  const base = parsed.name || "asset";
  const ext = parsed.ext || ".bin";
  let absolutePath = path.join(assetDir, `${base}${ext}`);
  for (let index = 2; fs.existsSync(absolutePath); index += 1) {
    absolutePath = path.join(assetDir, `${base}-${index}${ext}`);
  }
  return {
    absolutePath,
    relativePath: path.relative(projectDir, absolutePath).replace(/\\/g, "/"),
  };
}
export function writeAsset(projectId: string, bytes: Buffer, fileName: string, contentType: string, rawMeta: JsonRecord,
  options: { projectRoot?: string; identityEnvelope?: AssetIdentityEnvelope; authorityKey?: Buffer } = {}): unknown {
  // 唯一 sidecar 写入者之一：capture 族 originalUrl 恒 null 的不变量在此收口（见 assetPaths）。
  const meta = sanitizeAssetMetaForKind(rawMeta);
  const { absolutePath, relativePath } = uniqueAssetPath(
    projectId,
    fileName,
    assetBucketFromMeta(meta),
    options.projectRoot,
  );
  const sidecarMeta: JsonRecord = { ...meta };
  if (options.identityEnvelope) {
    if (!options.authorityKey) throw new Error("Asset identity authority is unavailable");
    sidecarMeta[ASSET_IDENTITY_SIDECAR_KEY] = options.identityEnvelope;
    sidecarMeta[ASSET_IDENTITY_AUTHORITY_TAG_KEY] = assetIdentityAuthorityTag(
      options.identityEnvelope,
      options.authorityKey,
    );
  }
  fs.writeFileSync(absolutePath, bytes);
  const sidecarWritten = writeAssetSidecarMeta(absolutePath, sidecarMeta);
  if (options.identityEnvelope && !sidecarWritten) {
    fs.rmSync(absolutePath, { force: true });
    fs.rmSync(`${absolutePath}.meta`, { force: true });
    throw new Error("Asset identity sidecar write failed");
  }
  broadcastAssetsUpdated(projectId);
  const url = localAssetUrl(projectId, relativePath);
  const t = nowIso();
  return {
    id: `asset-${crypto.randomUUID()}`,
    name: sanitizeName(fileName, "asset"),
    userId: "local",
    projectId,
    createdAt: t,
    updatedAt: t,
    data: { ...sidecarMeta, url, relativePath, absolutePath, contentType, size: bytes.byteLength },
  };
}
export function moveAssetFile(projectId: string, sourcePath: string, fileName: string, contentType: string, rawMeta: JsonRecord): unknown {
  // 唯一 sidecar 写入者之二：与 writeAsset 同一道 capture 族隐私收口。
  const meta = sanitizeAssetMetaForKind(rawMeta);
  const { absolutePath, relativePath } = uniqueAssetPath(projectId, fileName, assetBucketFromMeta(meta));
  try {
    fs.renameSync(sourcePath, absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
    fs.copyFileSync(sourcePath, absolutePath);
    fs.rmSync(sourcePath, { force: true });
  }
  const stat = fs.statSync(absolutePath);
  writeAssetSidecarMeta(absolutePath, meta);
  broadcastAssetsUpdated(projectId);
  const url = localAssetUrl(projectId, relativePath);
  const t = nowIso();
  return {
    id: `asset-${crypto.randomUUID()}`,
    name: sanitizeName(fileName, "asset"),
    userId: "local",
    projectId,
    createdAt: t,
    updatedAt: t,
    data: {
      ...meta,
      url,
      relativePath,
      absolutePath,
      contentType,
      size: stat.size,
    },
  };
}
type RemoteAssetImportOptions = {
  /** 仅供 main 进程内部已配置的本地生成服务使用；renderer IPC 无法注入第二参数。 */
  trustedPrivateOrigin?: string;
};

export async function importRemoteAsset(payload: unknown, options: RemoteAssetImportOptions = {}): Promise<unknown> {
  const raw = payload as JsonRecord;
  const projectId = String(raw.projectId || "").trim();
  const url = String(raw.url || "").trim();
  if (!projectId) throw new Error("projectId is required");
  if (!url) throw new Error("url is required");
  if (url.startsWith("nomi-local://")) {
    return {
      id: `asset-${crypto.randomUUID()}`,
      name: String(raw.fileName || "local asset"),
      userId: "local",
      projectId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      data: { url, kind: raw.kind || "local" },
    };
  }
  if (url.startsWith("data:")) {
    const parsed = parseDataUrl(url);
    const ext = extensionFromMime(parsed.contentType, "bin");
    return writeAsset(
      projectId,
      parsed.bytes,
      String(raw.fileName || `asset-${Date.now()}.${ext}`),
      parsed.contentType,
      { kind: raw.kind || "generated", originalUrl: null },
    );
  }
  if (!/^https?:\/\//i.test(url)) throw new Error("Only http(s), data, and nomi-local assets are supported");
  const fetched = options.trustedPrivateOrigin
    ? await hardenedFetch(url, {
        timeoutMs: 60_000,
        maxBytes: 200 * 1024 * 1024,
        allowContentTypes: ["image/", "video/", "audio/", "application/octet-stream"],
        allowedPrivateOrigins: [options.trustedPrivateOrigin],
      })
    : await fetchPublicRemoteAsset(url);
  const contentType = fetched.contentType || "application/octet-stream";
  const bytes = fetched.bytes;
  const ext = extensionFromMime(contentType, extensionFromUrl(url));
  const fileName = String(raw.fileName || path.basename(new URL(url).pathname) || `asset-${Date.now()}.${ext}`);
  return writeAsset(projectId, bytes, fileName.includes(".") ? fileName : `${fileName}.${ext}`, contentType, {
    kind: raw.kind || "generated",
    originalUrl: url,
    ownerNodeId: raw.ownerNodeId || null,
  });
}
export function listProjectAssets(payload: { projectRoot: string; projectId: string }): LocalAssetRecord[];
export function listProjectAssets(payload: unknown): { items: LocalAssetRecord[]; cursor: string | null };
export function listProjectAssets(payload: unknown): { items: LocalAssetRecord[]; cursor: string | null } | LocalAssetRecord[] {
  const raw = payload as JsonRecord | undefined;
  const projectId = String(raw?.projectId || "").trim();
  if (!projectId) throw new Error("projectId is required");
  const explicitProjectRoot = typeof raw?.projectRoot === "string" && raw.projectRoot.trim() ? raw.projectRoot : "";
  const projectDir = explicitProjectRoot || projectDirById(projectId);
  if (!projectDir) return explicitProjectRoot ? [] : { items: [], cursor: null };
  const assetsDir = path.join(projectDir, "assets");
  const requestedLimit = typeof raw?.limit === "number" && Number.isFinite(raw.limit) ? Math.floor(raw.limit) : 200;
  const limit = Math.max(1, Math.min(500, requestedLimit));
  const offset = Math.max(0, Number.parseInt(String(raw?.cursor || "0"), 10) || 0);
  const kindFilter = typeof raw?.kind === "string" && raw.kind.trim() ? raw.kind.trim() : "";
  const records = collectFilesRecursively(assetsDir)
    .flatMap((absolutePath): LocalAssetRecord[] => {
      try {
        if (absolutePath.endsWith(".meta")) return [];
        const stat = fs.statSync(absolutePath);
        const relativePath = path.relative(projectDir, absolutePath).replace(/\\/g, "/");
        const contentType = contentTypeFromPath(absolutePath);
        const sidecarMeta = readAssetSidecarMeta(absolutePath);
        const mediaKind = assetKindFromContentType(contentType);
        const sidecarKind =
          typeof sidecarMeta.kind === "string" && sidecarMeta.kind.trim() ? sidecarMeta.kind.trim() : "";
        const kind = sidecarKind || mediaKind;
        if (kindFilter && kind !== kindFilter) return [];
        const createdAt = new Date(stat.birthtimeMs || stat.mtimeMs).toISOString();
        const updatedAt = new Date(stat.mtimeMs).toISOString();
        return [
          {
            id: explicitProjectRoot
              ? `asset-${crypto.createHash("sha1").update(`${projectId}:${relativePath}`).digest("hex")}`
              : stableAssetId(projectId, relativePath),
            name: path.basename(absolutePath),
            userId: "local",
            projectId,
            createdAt,
            updatedAt,
            data: {
              ...sidecarMeta,
              url: localAssetUrl(projectId, relativePath),
              relativePath,
              absolutePath,
              contentType,
              size: stat.size,
              kind,
              mediaType:
                typeof sidecarMeta.mediaType === "string" && sidecarMeta.mediaType
                  ? sidecarMeta.mediaType
                  : mediaKind === "image" || mediaKind === "video" || mediaKind === "audio"
                    ? mediaKind
                    : undefined,
            },
          },
        ];
      } catch {
        return [];
      }
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const items = records.slice(offset, offset + limit);
  const nextOffset = offset + items.length;
  const page = {
    items,
    cursor: nextOffset < records.length ? String(nextOffset) : null,
  };
  return explicitProjectRoot ? page.items : page;
}
function storeFailure<T>(code: AssetRecordStoreErrorCode, details?: Readonly<Record<string, unknown>>): AssetRecordStoreResult<T> {
  return { ok: false, error: { code, retryable: code === "NETWORK_ERROR" || code === "IO_ERROR", ...(details ? { details } : {}) } };
}
function localAssetRecordStoreOptions(request: unknown, boundProjectId: unknown): AssetRecordStoreOptions | null {
  const projectId = typeof boundProjectId === "string" ? boundProjectId.trim() : "";
  const projectRoot = projectId ? projectDirById(projectId) : null;
  if (!projectRoot) return null;
  const session = createLocalAssetRecordSession(projectId);
  return { request, projectRoot, session,
    authorize: (candidate) => authorizeLocalAssetRecord(session, candidate),
  };
}
export function listPlatformAssetRecords(request: unknown, boundProjectId?: unknown) {
  const options = localAssetRecordStoreOptions(request, boundProjectId);
  return options ? listProjectAssetRecords(options) : Promise.resolve(storeFailure("PERMISSION_DENIED"));
}
export function importPlatformAssetRecordFile(request: unknown, boundProjectId?: unknown) {
  const options = localAssetRecordStoreOptions(request, boundProjectId);
  return options ? importAssetRecordFile(options) : Promise.resolve(storeFailure("PERMISSION_DENIED"));
}
export function importPlatformAssetRecordRemoteUrl(request: unknown, boundProjectId?: unknown) {
  const options = localAssetRecordStoreOptions(request, boundProjectId);
  return options ? importAssetRecordRemoteUrl(options) : Promise.resolve(storeFailure("PERMISSION_DENIED"));
}
export function resolvePlatformAssetRecord(request: unknown, boundProjectId?: unknown) {
  const options = localAssetRecordStoreOptions(request, boundProjectId);
  return options ? resolveProjectAssetRecord(options) : Promise.resolve(storeFailure("PERMISSION_DENIED"));
}
function readProjectRootScopeBinding(bindingPath: string): AssetScope {
  const descriptor = fs.openSync(bindingPath, fs.constants.O_RDONLY | (process.platform === "win32" ? 0 : fs.constants.O_NOFOLLOW));
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.size <= 0 || stat.size > 4_096) throw new Error("Invalid project root scope binding");
    const parsed: unknown = JSON.parse(fs.readFileSync(descriptor, "utf8"));
    if (!isJsonRecord(parsed) || parsed.schemaVersion !== PROJECT_ROOT_SCOPE_BINDING_SCHEMA) {
      throw new Error("Invalid project root scope binding");
    }
    const organizationId = typeof parsed.organizationId === "string" ? parsed.organizationId.trim() : "";
    const projectId = typeof parsed.projectId === "string" ? parsed.projectId.trim() : "";
    if (!organizationId || !projectId) throw new Error("Invalid project root scope binding");
    return { organizationId, projectId };
  } finally {
    fs.closeSync(descriptor);
  }
}
function establishProjectRootScopeBinding(projectRoot: string, scope: AssetScope): boolean {
  try {
    const requestedRoot = path.resolve(projectRoot);
    const requestedStat = fs.lstatSync(requestedRoot);
    if (!requestedStat.isDirectory() || requestedStat.isSymbolicLink()) return false;
    const root = fs.realpathSync(requestedRoot);
    const bindingDirectory = path.join(root, ".nomi");
    try {
      fs.mkdirSync(bindingDirectory, { mode: 0o700 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") return false;
    }
    const directoryStat = fs.lstatSync(bindingDirectory);
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) return false;
    const bindingPath = path.join(bindingDirectory, PROJECT_ROOT_SCOPE_BINDING_FILE);
    const candidate = `${JSON.stringify({
      schemaVersion: PROJECT_ROOT_SCOPE_BINDING_SCHEMA,
      organizationId: scope.organizationId,
      projectId: scope.projectId,
    })}\n`;
    try {
      fs.writeFileSync(bindingPath, candidate, { flag: "wx", mode: 0o600 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") return false;
    }
    const bindingStat = fs.lstatSync(bindingPath);
    if (!bindingStat.isFile() || bindingStat.isSymbolicLink()) return false;
    return sameAssetScope(readProjectRootScopeBinding(bindingPath), scope);
  } catch {
    return false;
  }
}
function projectRootFor(options: AssetRecordStoreOptions, scope: AssetScope): AssetRecordStoreResult<string | null> {
  const configuredRoot = typeof options.projectRoot === "string" ? options.projectRoot.trim() : "";
  const localProjectRoot = projectDirById(scope.projectId);
  if (!configuredRoot) {
    if (localProjectRoot) observedProjectRoots.add(path.resolve(localProjectRoot));
    return { ok: true, value: localProjectRoot };
  }
  const resolvedConfiguredRoot = path.resolve(configuredRoot);
  if (localProjectRoot && path.resolve(localProjectRoot) === resolvedConfiguredRoot) {
    observedProjectRoots.add(resolvedConfiguredRoot);
    return { ok: true, value: localProjectRoot };
  }
  try {
    for (const project of listProjects()) {
      const otherRoot = projectDirById(project.id);
      if (otherRoot && path.resolve(otherRoot) === resolvedConfiguredRoot && project.id !== scope.projectId) {
        return storeFailure("PERMISSION_DENIED", { reasonCode: "PROJECT_ROOT_SCOPE_MISMATCH" });
      }
    }
  } catch { /* The persisted binding remains authoritative for standalone callers. */ }
  if (!establishProjectRootScopeBinding(resolvedConfiguredRoot, scope)) {
    return storeFailure("PERMISSION_DENIED", { reasonCode: "PROJECT_ROOT_SCOPE_MISMATCH" });
  }
  const canonicalRoot = fs.realpathSync(resolvedConfiguredRoot);
  observedProjectRoots.add(canonicalRoot);
  return { ok: true, value: canonicalRoot };
}
function sessionFacts(session: unknown): { principalId: string; organizationId: string } | null {
  if (!session || typeof session !== "object") return null;
  const raw = session as Record<string, unknown>;
  const principal = isJsonRecord(raw.principal) ? raw.principal : {};
  const membership = isJsonRecord(raw.activeMembership) ? raw.activeMembership : {};
  const principalId = String(raw.principalId || principal.id || "").trim();
  const organizationId = String(raw.activeOrganizationId || membership.organizationId || "").trim();
  return principalId && organizationId ? { principalId, organizationId } : null;
}
function hasRequestedOrganization(options: AssetRecordStoreOptions, organizationId: string): boolean {
  const facts = sessionFacts(options.session);
  return Boolean(facts && facts.organizationId === organizationId);
}
async function authorizeStore(options: AssetRecordStoreOptions,
  capability: "project.read" | "project.write" | "asset.read" | "asset.write",
  scope: AssetScope, assetId?: string): Promise<boolean> {
  if (!options.authorize) return false;
  try {
    const response = await options.authorize({ capability, ...scope, ...(assetId ? { assetId } : {}) });
    if (!response || typeof response !== "object") return false;
    const raw = response as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(raw, "ok") && raw.ok !== true) return false;
    const value = Object.prototype.hasOwnProperty.call(raw, "ok") ? raw.value : raw;
    if (!isJsonRecord(value)) return false;
    if (value.allowed === false || value.decision === "deny") return false;
    return value.allowed === true || value.decision === "allow";
  } catch {
    return false;
  }
}
function identityEntries(projectRoot: string, authorityKey: Buffer): Array<{ absolutePath: string; envelope: AssetIdentityEnvelope }> {
  const assetsRoot = path.join(projectRoot, "assets");
  const entries = collectFilesRecursively(assetsRoot).flatMap((absolutePath) => {
    if (absolutePath.endsWith(".meta")) return [];
    const sidecar = readAssetSidecarMeta(absolutePath);
    const rawEnvelope = sidecar[ASSET_IDENTITY_SIDECAR_KEY];
    if (!rawEnvelope) return [];
    try {
      const envelope = parseAssetIdentityEnvelope(rawEnvelope);
      if (!hasValidAssetIdentityAuthorityTag(envelope, sidecar[ASSET_IDENTITY_AUTHORITY_TAG_KEY], authorityKey)) return [];
      return [{ absolutePath, envelope }];
    } catch {
      return [];
    }
  });
  return entries;
}
function identityEntriesAcrossProjects(projectRoot: string, authorityKey: Buffer) {
  const roots = new Set(observedProjectRoots);
  roots.add(path.resolve(projectRoot));
  try {
    for (const project of listProjects()) {
      const root = projectDirById(project.id);
      if (root) roots.add(path.resolve(root));
    }
  } catch { /* Explicit roots still preserve isolation in non-Electron callers. */ }
  return [...roots].flatMap((root) => identityEntries(root, authorityKey));
}
function sameAssetScope(left: AssetScope, right: AssetScope): boolean {
  return left.organizationId === right.organizationId && left.projectId === right.projectId;
}
function isProjectRootBoundToDifferentScope(projectRoot: string, scope: AssetScope): boolean {
  try {
    const requestedRoot = path.resolve(projectRoot);
    const stat = fs.lstatSync(requestedRoot);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
    const bindingPath = path.join(fs.realpathSync(requestedRoot), ".nomi", PROJECT_ROOT_SCOPE_BINDING_FILE);
    const bindingStat = fs.lstatSync(bindingPath);
    return bindingStat.isFile() && !bindingStat.isSymbolicLink() && !sameAssetScope(readProjectRootScopeBinding(bindingPath), scope);
  } catch { return false; }
}
function hasIdempotencyConflictAtRoot(projectRoot: string, authorityKey: Buffer, idempotencyHash: string, requestFingerprint: string, operation: RecordImportOperation, scope: AssetScope): boolean {
  return identityEntriesAcrossProjects(projectRoot, authorityKey).some(({ envelope }) =>
    envelope.idempotencyHash === idempotencyHash && (!sameAssetScope(envelope.bundle.asset.scope, scope) ||
      envelope.requestFingerprint !== requestFingerprint || envelope.operation !== operation));
}
function hasBoundScopeIdempotencyConflict(options: AssetRecordStoreOptions, scope: AssetScope, idempotencyHash: string, requestFingerprint: string, operation: RecordImportOperation): boolean {
  const root = typeof options.projectRoot === "string" ? options.projectRoot.trim() : "";
  const key = root && isProjectRootBoundToDifferentScope(root, scope) ? existingAssetIdentityAuthority(root) : null;
  return Boolean(key && hasIdempotencyConflictAtRoot(root, key, idempotencyHash, requestFingerprint, operation, scope));
}
async function authorizeImportedAsset(options: AssetRecordStoreOptions, scope: AssetScope,
  assetId: string): Promise<boolean> {
  return authorizeStore(options, "asset.write", scope, assetId);
}
async function verifyIdentityEntry(entry: { absolutePath: string; envelope: AssetIdentityEnvelope },
  scope: AssetScope): Promise<AssetRecordBundle> {
  const bytes = new Uint8Array(fs.readFileSync(entry.absolutePath));
  const integrity = await computeAssetIntegrity(bytes);
  return parseAssetIdentityEnvelope(entry.envelope, { scope, expectedIntegrity: integrity }).bundle;
}
function importFileFingerprint(request: AssetRecordImportFileRequest, byteDigest: string): string {
  return fingerprintAssetRecordRequest({
    operation: "import-file",
    scope: { organizationId: request.organizationId, projectId: request.projectId },
    fileName: request.fileName,
    claimedMediaType: request.claimedMediaType ?? null,
    classification: request.classification,
    byteDigest,
  });
}
function importRemoteFingerprint(request: AssetRecordImportRemoteUrlRequest): string {
  return fingerprintAssetRecordRequest({
    operation: "import-remote-url",
    scope: { organizationId: request.organizationId, projectId: request.projectId },
    sourceDigest: crypto.createHash("sha256").update(request.url).digest("hex"),
    fileName: request.fileName ?? null,
    claimedMediaType: request.claimedMediaType ?? null,
    classification: request.classification,
  });
}
async function existingIdempotentImport(options: AssetRecordStoreOptions, projectRoot: string,
  idempotencyHash: string, requestFingerprint: string, operation: RecordImportOperation,
  scope: AssetScope, authorityKey: Buffer): Promise<AssetRecordStoreResult<AssetRecordBundle> | null> {
  const entries = identityEntriesAcrossProjects(projectRoot, authorityKey)
    .filter((candidate) => candidate.envelope.idempotencyHash === idempotencyHash);
  if (entries.length === 0) return null;
  if (entries.some(({ envelope }) => !sameAssetScope(envelope.bundle.asset.scope, scope) ||
    envelope.requestFingerprint !== requestFingerprint || envelope.operation !== operation)) {
    return storeFailure("CONFLICT", { reasonCode: "IDEMPOTENCY_KEY_REBOUND" });
  }
  const entry = entries[0]!;
  if (!(await authorizeImportedAsset(options, scope, entry.envelope.bundle.asset.id))) {
    return storeFailure("PERMISSION_DENIED");
  }
  try {
    return { ok: true, value: await verifyIdentityEntry(entry, scope) };
  } catch {
    return storeFailure("INTEGRITY_ERROR", { reasonCode: "INTEGRITY_MISMATCH" });
  }
}
function withImportLock(key: string, operation: () => Promise<AssetRecordStoreResult<AssetRecordBundle>>): Promise<AssetRecordStoreResult<AssetRecordBundle>> {
  const prior = importLocks.get(key) ?? Promise.resolve({ ok: true as const, value: undefined as unknown as AssetRecordBundle });
  const current = prior.catch(() => undefined).then(operation);
  importLocks.set(key, current);
  void current.finally(() => {
    if (importLocks.get(key) === current) importLocks.delete(key);
  });
  return current;
}
function mediaTypeConflict(claimedMediaType: string | undefined, actualMediaType: string): boolean {
  return Boolean(claimedMediaType && claimedMediaType !== actualMediaType);
}
export async function importAssetRecordFile(options: AssetRecordStoreOptions):
Promise<AssetRecordStoreResult<AssetRecordBundle>> {
  let request: AssetRecordImportFileRequest;
  try {
    request = parseAssetRecordImportFileRequest(options.request);
  } catch {
    return storeFailure("INVALID_ARGUMENT", { reasonCode: "MALFORMED_REQUEST" });
  }
  const scope = { organizationId: request.organizationId, projectId: request.projectId };
  if (!hasRequestedOrganization(options, request.organizationId)) return storeFailure("PERMISSION_DENIED");
  if (!(await authorizeStore(options, "project.write", scope))) return storeFailure("PERMISSION_DENIED");
  const bytes = new Uint8Array(request.bytes.slice(0));
  const integrity = await computeAssetIntegrity(bytes);
  const idempotencyHash = hashAssetIdempotencyKey(request.idempotencyKey);
  const requestFingerprint = importFileFingerprint(request, integrity.digest);
  const projectRootResult = projectRootFor(options, scope);
  if (!projectRootResult.ok) return hasBoundScopeIdempotencyConflict(options, scope, idempotencyHash, requestFingerprint, "import-file") ? storeFailure("CONFLICT", { reasonCode: "IDEMPOTENCY_KEY_REBOUND" }) : projectRootResult;
  const projectRoot = projectRootResult.value;
  if (!projectRoot) return storeFailure("NOT_FOUND");
  const authorityKey = existingAssetIdentityAuthority(options.projectRoot) ?? durableAssetIdentityAuthority(options.projectRoot);
  if (!authorityKey) return storeFailure("IO_ERROR", { reasonCode: "IDENTITY_AUTHORITY_UNAVAILABLE" });
  const lockKey = idempotencyHash;
  return withImportLock(lockKey, async () => {
    const replay = await existingIdempotentImport(
      options,
      projectRoot,
      idempotencyHash,
      requestFingerprint,
      "import-file",
      scope,
      authorityKey,
    );
    if (replay) return replay;
    if (mediaTypeConflict(request.claimedMediaType, integrity.mediaType)) {
      return storeFailure("INVALID_ARGUMENT", { reasonCode: "MIME_MISMATCH" });
    }
    const assetId = generateAssetId();
    if (!(await authorizeImportedAsset(options, scope, assetId))) return storeFailure("PERMISSION_DENIED");
    const facts = sessionFacts(options.session)!;
    const createdAt = nowIso();
    const bundle = createImportedAssetBundle({
      scope,
      principalId: facts.principalId,
      integrity,
      classification: request.classification,
      method: "file",
      originalName: request.fileName,
      createdAt,
      assetId,
    });
    const envelope = createAssetIdentityEnvelope({
      bundle,
      idempotencyHash,
      requestFingerprint,
      operation: "import-file",
    });
    try {
      writeAsset(request.projectId, Buffer.from(bytes), request.fileName, integrity.mediaType, {
        kind: "imported",
        originalName: request.fileName,
      }, { projectRoot, identityEnvelope: envelope, authorityKey });
      return { ok: true, value: bundle };
    } catch {
      return storeFailure("IO_ERROR");
    }
  });
}
export async function importAssetRecordRemoteUrl(options: AssetRecordStoreOptions):
Promise<AssetRecordStoreResult<AssetRecordBundle>> {
  let request: AssetRecordImportRemoteUrlRequest;
  try {
    request = parseAssetRecordImportRemoteUrlRequest(options.request);
  } catch {
    return storeFailure("INVALID_ARGUMENT", { reasonCode: "MALFORMED_REQUEST" });
  }
  const scope = { organizationId: request.organizationId, projectId: request.projectId };
  if (!hasRequestedOrganization(options, request.organizationId)) return storeFailure("PERMISSION_DENIED");
  if (!(await authorizeStore(options, "project.write", scope))) return storeFailure("PERMISSION_DENIED");
  const idempotencyHash = hashAssetIdempotencyKey(request.idempotencyKey);
  const requestFingerprint = importRemoteFingerprint(request);
  const projectRootResult = projectRootFor(options, scope);
  if (!projectRootResult.ok) return hasBoundScopeIdempotencyConflict(options, scope, idempotencyHash, requestFingerprint, "import-remote-url") ? storeFailure("CONFLICT", { reasonCode: "IDEMPOTENCY_KEY_REBOUND" }) : projectRootResult;
  const projectRoot = projectRootResult.value;
  if (!projectRoot) return storeFailure("NOT_FOUND");
  const authorityKey = existingAssetIdentityAuthority(options.projectRoot) ?? durableAssetIdentityAuthority(options.projectRoot);
  if (!authorityKey) return storeFailure("IO_ERROR", { reasonCode: "IDENTITY_AUTHORITY_UNAVAILABLE" });
  const lockKey = idempotencyHash;
  return withImportLock(lockKey, async () => {
    const replay = await existingIdempotentImport(
      options,
      projectRoot,
      idempotencyHash,
      requestFingerprint,
      "import-remote-url",
      scope,
      authorityKey,
    );
    if (replay) return replay;
    const assetId = generateAssetId();
    if (!(await authorizeImportedAsset(options, scope, assetId))) return storeFailure("PERMISSION_DENIED");
    let bytes: Buffer;
    let sourceMediaType: string;
    let method: "remote" | "data";
    try {
      if (request.url.startsWith("data:")) {
        const parsed = parseDataUrl(request.url);
        bytes = parsed.bytes;
        sourceMediaType = parsed.contentType.toLowerCase().split(";", 1)[0];
        method = "data";
      } else {
        const fetched = await fetchPublicRemoteAsset(request.url);
        bytes = fetched.bytes;
        sourceMediaType = String(fetched.contentType || "application/octet-stream").toLowerCase().split(";", 1)[0];
        method = "remote";
      }
    } catch {
      return storeFailure("NETWORK_ERROR");
    }
    const integrity = await computeAssetIntegrity(new Uint8Array(bytes));
    if (
      mediaTypeConflict(request.claimedMediaType, integrity.mediaType) ||
      (sourceMediaType !== "application/octet-stream" && sourceMediaType !== integrity.mediaType)
    ) {
      return storeFailure("INVALID_ARGUMENT", { reasonCode: "MIME_MISMATCH" });
    }
    const facts = sessionFacts(options.session)!;
    const createdAt = nowIso();
    const defaultExtension = extensionFromMime(integrity.mediaType, "bin");
    const fileName = request.fileName || `asset-${Date.now()}.${defaultExtension}`;
    const bundle = createImportedAssetBundle({
      scope,
      principalId: facts.principalId,
      integrity,
      classification: request.classification,
      method,
      originalName: request.fileName ?? null,
      createdAt,
      assetId,
    });
    const envelope = createAssetIdentityEnvelope({
      bundle,
      idempotencyHash,
      requestFingerprint,
      operation: "import-remote-url",
    });
    try {
      writeAsset(request.projectId, bytes, fileName, integrity.mediaType, {
        kind: "imported",
        originalName: request.fileName ?? null,
        originalUrl: null,
      }, { projectRoot, identityEnvelope: envelope, authorityKey });
      return { ok: true, value: bundle };
    } catch {
      return storeFailure("IO_ERROR");
    }
  });
}
export async function listProjectAssetRecords(options: AssetRecordStoreOptions):
Promise<AssetRecordStoreResult<{ items: AssetRecordBundle[]; cursor: string | null }>> {
  let request;
  try {
    request = parseAssetRecordListRequest(options.request);
  } catch {
    return storeFailure("INVALID_ARGUMENT", { reasonCode: "MALFORMED_REQUEST" });
  }
  const scope = { organizationId: request.organizationId, projectId: request.projectId };
  if (!hasRequestedOrganization(options, request.organizationId)) return storeFailure("PERMISSION_DENIED");
  if (!(await authorizeStore(options, "project.read", scope))) return storeFailure("PERMISSION_DENIED");
  const projectRootResult = projectRootFor(options, scope);
  if (!projectRootResult.ok) return projectRootResult;
  const projectRoot = projectRootResult.value;
  if (!projectRoot) return { ok: true, value: { items: [], cursor: null } };
  const authorityKey = durableAssetIdentityAuthority(options.projectRoot);
  if (!authorityKey) return storeFailure("IO_ERROR", { reasonCode: "IDENTITY_AUTHORITY_UNAVAILABLE" });
  const visible: AssetRecordBundle[] = [];
  for (const entry of identityEntries(projectRoot, authorityKey)) {
    const candidate = entry.envelope.bundle;
    if (!sameAssetScope(candidate.asset.scope, scope)) continue;
    if (!(await authorizeStore(options, "asset.read", scope, candidate.asset.id))) continue;
    try {
      const bundle = await verifyIdentityEntry(entry, scope);
      if (bundle.version.validation.state !== "validated") continue;
      visible.push(bundle);
    } catch {
      // Malformed, scope-mismatched, and integrity-mismatched identities stay legacy-only.
    }
  }
  let validatedVisible: AssetRecordBundle[];
  try {
    validatedVisible = [...validateAssetRecordGraph(visible)];
  } catch {
    return storeFailure("INTEGRITY_ERROR", { reasonCode: "INVALID_VISIBLE_GRAPH" });
  }
  validatedVisible.sort((left, right) => left.asset.id.localeCompare(right.asset.id));
  const offset = Math.max(0, Number.parseInt(String(request.cursor || "0"), 10) || 0);
  const limit = request.limit ?? 200;
  const items = validatedVisible.slice(offset, offset + limit);
  const nextOffset = offset + items.length;
  return { ok: true, value: { items, cursor: nextOffset < validatedVisible.length ? String(nextOffset) : null } };
}
export async function resolveProjectAssetRecord(options: AssetRecordStoreOptions):
Promise<AssetRecordStoreResult<ReturnType<typeof createElectronAssetResolution>>> {
  let request;
  try {
    request = parseAssetResolveRequest(options.request);
  } catch {
    return storeFailure("INVALID_ARGUMENT", { reasonCode: "MALFORMED_REQUEST" });
  }
  const scope = { organizationId: request.organizationId, projectId: request.projectId };
  if (!hasRequestedOrganization(options, request.organizationId)) return storeFailure("PERMISSION_DENIED");
  if (!(await authorizeStore(options, "asset.read", scope, request.assetId))) return storeFailure("PERMISSION_DENIED");
  const projectRootResult = projectRootFor(options, scope);
  if (!projectRootResult.ok) return projectRootResult;
  const projectRoot = projectRootResult.value;
  if (!projectRoot) return storeFailure("NOT_FOUND");
  const authorityKey = durableAssetIdentityAuthority(options.projectRoot);
  if (!authorityKey) return storeFailure("IO_ERROR", { reasonCode: "IDENTITY_AUTHORITY_UNAVAILABLE" });
  const entry = identityEntries(projectRoot, authorityKey).find(
    (candidate) =>
      sameAssetScope(candidate.envelope.bundle.asset.scope, scope) &&
      candidate.envelope.bundle.asset.id === request.assetId && candidate.envelope.bundle.version.id === request.versionId,
  );
  if (!entry) return storeFailure("NOT_FOUND");
  let bundle: AssetRecordBundle;
  try {
    bundle = await verifyIdentityEntry(entry, scope);
  } catch {
    return storeFailure("INTEGRITY_ERROR", { reasonCode: "INTEGRITY_MISMATCH" });
  }
  try {
    const relativePath = path.relative(projectRoot, entry.absolutePath).replace(/\\/g, "/");
    return { ok: true, value: createElectronAssetResolution({ bundle, request,
      url: localAssetUrl(request.projectId, relativePath) }) };
  } catch {
    return storeFailure("INTEGRITY_ERROR", { reasonCode: "QUARANTINED" });
  }
}
