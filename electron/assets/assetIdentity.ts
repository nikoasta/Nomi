import crypto from "node:crypto";
export type AssetId = string & { readonly __brand: "AssetId" };
export type AssetVersionId = string & { readonly __brand: "AssetVersionId" };
export type AssetScope = { organizationId: string; projectId: string };
export type AssetClassification = "unknown" | "public" | "internal" | "confidential" | "restricted";
export type AssetIntegrity = { algorithm: "sha256"; digest: string; sizeBytes: number; mediaType: string };
export type ImportedProvenance = { kind: "imported"; method: "file" | "remote" | "data" | "capture"; recordedAt: string; actorPrincipalId: string; originalName: string | null };
export type AssetRecordBundle = {
  asset: { schemaVersion: "asset.v1"; id: AssetId; scope: AssetScope; createdAt: string; createdByPrincipalId: string };
  version: {
    schemaVersion: "asset-version.v1";
    id: AssetVersionId; assetId: AssetId; scope: AssetScope;
    predecessorVersionId: AssetVersionId | null;
    derivedFromVersionIds: readonly AssetVersionId[];
    integrity: AssetIntegrity; classification: AssetClassification;
    validation: { state: "pending"; reasonCodes: readonly string[] }
      | { state: "validated"; validatedAt: string; validator: "electron-local-v1"; reasonCodes: readonly [] }
      | { state: "quarantined" | "rejected"; validatedAt: string; validator: "electron-local-v1"; reasonCodes: readonly string[] }
      | { state: "legacy-unverified"; reasonCodes: readonly ["LEGACY_FACTS_UNKNOWN"] };
    provenance:
      | ImportedProvenance
      | {
          kind: "generated"; recordedAt: string; actorPrincipalId: string; providerId: string; modelId: string;
          operationId: string | null; providerRequestId: string | null; promptRef: string | null; promptDigest: string | null;
        }
      | {
          kind: "derived"; recordedAt: string; actorPrincipalId: string; operation: string;
          sourceVersionIds: readonly AssetVersionId[];
        }
      | { kind: "legacy-unverified"; recordedAt: string; actorPrincipalId: null; unknownFacts: readonly string[] };
    createdAt: string; createdByPrincipalId: string | null;
  };
};
export type AssetRecordListRequest = AssetScope & { cursor?: string | null; limit?: number };
export type AssetRecordImportFileRequest = AssetScope & {
  fileName: string; claimedMediaType?: string; bytes: ArrayBuffer;
  classification: AssetClassification; idempotencyKey: string;
};
export type AssetRecordImportRemoteUrlRequest = AssetScope & {
  url: string; fileName?: string; claimedMediaType?: string;
  classification: AssetClassification; idempotencyKey: string;
};
export type AssetResolutionPurpose = "display" | "download" | "provider-input";
export type AssetResolveRequest = AssetScope & { assetId: AssetId; versionId: AssetVersionId; purpose: AssetResolutionPurpose };
export type AssetResolution = {
  schemaVersion: "asset-resolution.v1"; assetId: AssetId; versionId: AssetVersionId;
  scope: AssetScope; purpose: AssetResolutionPurpose; integrity: AssetIntegrity;
  locator: { kind: "runtime-url"; runtime: "electron"; url: string; expiresAt: null };
};
export const ASSET_IDENTITY_SIDECAR_KEY = "platformAssetIdentity";
export type AssetIdentityEnvelope = {
  schemaVersion: "asset-identity-envelope.v1"; bundle: AssetRecordBundle;
  idempotencyHash: string; requestFingerprint: string;
  operation: "import-file" | "import-remote-url";
};
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const ASSET_ID_PATTERN = /^ast_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const VERSION_ID_PATTERN = /^av_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MEDIA_TYPE_PATTERN = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/;
const OPAQUE_PROVENANCE_ID_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)*$/;
const OPAQUE_PROMPT_REF_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)+$/;
const SECRET_BEARING_REF_PATTERN = /(?:api[_-]?key|authorization|bearer|credential|password|secret|token)/i;
const SECRET_VALUE_PATTERN = /(?:\bbearer\s+[A-Za-z0-9._~+/=-]+|\b(?:api[_-]?key|authorization|credential|password|secret|token|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key)\b["']?\s*[:=]\s*["']?[^\s"',;}\]]+)/i;
const SCOPE_ID_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)*$/;
const URL_SCHEME_PATTERN = /^(?:https?|file|data|blob|nomi-local):/i;
const CLASSIFICATIONS: readonly AssetClassification[] = ["unknown", "public", "internal", "confidential", "restricted"];
const VIDEO_MP4_BRANDS = new Set(["mp41", "mp42", "avc1", "M4V ", "MSNV"]);
const MAX_LOCAL_ASSET_BYTES = 200 * 1024 * 1024;
const LOCAL_PRINCIPAL_ID = "local-runtime:principal";
const LOCAL_ORGANIZATION_ID = "local-runtime:organization";
const FORBIDDEN_KEY =
  /^(?:url|uri|locator|path|absolutePath|relativePath|storagePath|bucket|bucketKey|objectKey|credential|credentials|authorization|headers|cookie|token|secret|rawPrompt|prompt|rawResponse|rawPayload|providerResponse|stack)$/i;
const FORBIDDEN_VALUE =
  /(?:nomi-local:|file:|blob:|https?:\/\/|[?&][a-z0-9_-]{1,64}=|(?:^|[\\/])\.\.(?:[\\/]|$)|^\/|^[a-z]:[\\/]|^\\\\[^\\/]+[\\/][^\\/]+(?:[\\/]|$))/i;
export type LocalAssetRecordSession = {
  state: "authenticated";
  principal: { id: string; kind: "local-runtime"; displayName: string };
  activeMembership: {
    principalId: string;
    organizationId: string;
    status: "active";
    organizationPermissions: readonly [];
    projects: readonly [{ projectId: string; permissions: readonly ["project.read", "project.write", "asset.read", "asset.write"] }];
  };
};
export function createLocalAssetRecordSession(boundProjectId: string): LocalAssetRecordSession {
  return {
    state: "authenticated",
    principal: { id: LOCAL_PRINCIPAL_ID, kind: "local-runtime", displayName: "Local runtime" },
    activeMembership: {
      principalId: LOCAL_PRINCIPAL_ID,
      organizationId: LOCAL_ORGANIZATION_ID,
      status: "active",
      organizationPermissions: [],
      projects: [{ projectId: boundProjectId, permissions: ["project.read", "project.write", "asset.read", "asset.write"] }],
    },
  };
}
export async function authorizeLocalAssetRecord(session: LocalAssetRecordSession, candidate: Record<string, unknown>): Promise<unknown> {
  const capability = candidate.capability;
  const organizationId = candidate.organizationId;
  const projectId = candidate.projectId;
  if (
    (capability !== "project.read" &&
      capability !== "project.write" &&
      capability !== "asset.read" &&
      capability !== "asset.write") ||
    typeof organizationId !== "string" ||
    typeof projectId !== "string"
  ) {
    return { ok: true, value: { allowed: false, reason: "DENY_MALFORMED_REQUEST" } };
  }
  const membership = session.activeMembership;
  const project = membership.projects.find((entry) => entry.projectId === projectId);
  const allowed =
    membership.status === "active" &&
    membership.organizationId === organizationId &&
    session.principal.id === membership.principalId &&
    Boolean(project?.permissions.includes(capability));
  return {
    ok: true,
    value: allowed
      ? { allowed: true, reason: "ALLOW_EXPLICIT_PERMISSION" }
      : { allowed: false, reason: "DENY_PROJECT_SCOPE_MISMATCH" },
  };
}
function jsonRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) {
    throw new TypeError(`${label} has an invalid shape`);
  }
}
function allowedKeys(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[], label: string): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw new TypeError(`${label} has an invalid shape`);
  if (required.some((key) => !Object.prototype.hasOwnProperty.call(value, key))) {
    throw new TypeError(`${label} is missing a field`);
  }
}
function assertSafeJson(value: unknown): void {
  const seen = new Set<object>();
  const visit = (current: unknown, key: string | null): void => {
    if (key !== null && FORBIDDEN_KEY.test(key)) throw new TypeError("Forbidden identity field");
    if (typeof current === "string" && (FORBIDDEN_VALUE.test(current) || SECRET_VALUE_PATTERN.test(current))) {
      throw new TypeError("Forbidden identity value");
    }
    if (current === null || typeof current === "string" || typeof current === "boolean") return;
    if (typeof current === "number") {
      if (!Number.isFinite(current)) throw new TypeError("Identity envelope must contain JSON values");
      return;
    }
    if (typeof current !== "object") throw new TypeError("Identity envelope must contain JSON values");
    if (seen.has(current)) throw new TypeError("Identity envelope must not be cyclic");
    seen.add(current);
    if (Array.isArray(current)) current.forEach((child) => visit(child, null));
    else Object.entries(current as Record<string, unknown>).forEach(([childKey, child]) => visit(child, childKey));
    seen.delete(current);
  };
  visit(value, null);
}
function sameScope(left: AssetScope, right: AssetScope): boolean {
  return left.organizationId === right.organizationId && left.projectId === right.projectId;
}
function sameIntegrity(left: AssetIntegrity, right: AssetIntegrity): boolean {
  return (
    left.algorithm === right.algorithm &&
    left.digest === right.digest &&
    left.sizeBytes === right.sizeBytes &&
    left.mediaType === right.mediaType
  );
}
function hasControlCharacter(value: string): boolean { return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f || character.charCodeAt(0) === 0x7f); }
function boundedString(value: unknown, label: string, max = 256): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > max ||
    value !== value.trim() ||
    hasControlCharacter(value)
  ) {
    throw new TypeError(`${label} must be a bounded canonical string`);
  }
  return value;
}
function scopeId(value: unknown, label: string): string {
  const id = boundedString(value, label);
  if (!SCOPE_ID_PATTERN.test(id) || URL_SCHEME_PATTERN.test(id)) {
    throw new TypeError(`${label} must be an opaque identifier`);
  }
  return id;
}
function basename(value: unknown, label: string): string {
  const name = boundedString(value, label, 512);
  if (
    name === "." ||
    name === ".." ||
    /[\\/]/.test(name) ||
    /^[A-Za-z]:/.test(name) ||
    URL_SCHEME_PATTERN.test(name)
  ) {
    throw new TypeError(`${label} must be a basename`);
  }
  return name;
}
function nullableOriginalName(value: unknown): string | null {
  return value === null ? null : basename(value, "originalName");
}
function opaqueProvenanceId(value: unknown, label: string, max = 256): string {
  const id = boundedString(value, label, max);
  if (!OPAQUE_PROVENANCE_ID_PATTERN.test(id) || SECRET_BEARING_REF_PATTERN.test(id)) {
    throw new TypeError(`${label} must be an opaque identifier`);
  }
  return id;
}
function nullableOpaqueProvenanceId(value: unknown, label: string): string | null {
  return value === null ? null : opaqueProvenanceId(value, label, 512);
}
function isoDate(value: unknown, label: string): string {
  const text = boundedString(value, label, 64);
  const date = new Date(text);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== text) throw new TypeError(`${label} must be canonical ISO`);
  return text;
}
function nullablePromptRef(value: unknown): string | null {
  if (value === null) return null;
  const ref = boundedString(value, "promptRef", 256);
  if (!OPAQUE_PROMPT_REF_PATTERN.test(ref) || SECRET_BEARING_REF_PATTERN.test(ref)) {
    throw new TypeError("promptRef must be an opaque reference");
  }
  return ref;
}
function parseScope(value: unknown): AssetScope {
  const input = jsonRecord(value, "scope");
  exactKeys(input, ["organizationId", "projectId"], "scope");
  return {
    organizationId: scopeId(input.organizationId, "organizationId"),
    projectId: scopeId(input.projectId, "projectId"),
  };
}
export function parseAssetId(value: unknown): AssetId {
  if (typeof value !== "string" || !ASSET_ID_PATTERN.test(value)) throw new TypeError("Invalid asset ID");
  return value as AssetId;
}
export function parseAssetVersionId(value: unknown): AssetVersionId {
  if (typeof value !== "string" || !VERSION_ID_PATTERN.test(value)) throw new TypeError("Invalid asset version ID");
  return value as AssetVersionId;
}
export function parseAssetIntegrity(value: unknown): AssetIntegrity {
  const input = jsonRecord(value, "integrity");
  exactKeys(input, ["algorithm", "digest", "sizeBytes", "mediaType"], "integrity");
  if (input.algorithm !== "sha256" || typeof input.digest !== "string" || !HASH_PATTERN.test(input.digest)) {
    throw new TypeError("Invalid integrity digest");
  }
  if (!Number.isSafeInteger(input.sizeBytes) || (input.sizeBytes as number) < 0) {
    throw new TypeError("Invalid integrity size");
  }
  if (typeof input.mediaType !== "string" || !MEDIA_TYPE_PATTERN.test(input.mediaType)) {
    throw new TypeError("Invalid canonical media type");
  }
  return {
    algorithm: "sha256",
    digest: input.digest,
    sizeBytes: input.sizeBytes as number,
    mediaType: input.mediaType,
  };
}
function parseReasonCodes(value: unknown, allowEmpty: boolean): readonly string[] {
  if (!Array.isArray(value) || value.length > 32 || (!allowEmpty && value.length === 0)) {
    throw new TypeError("Invalid validation reason codes");
  }
  const codes = value.map((entry) => boundedString(entry, "reasonCode", 64));
  if (codes.some((code) => !/^[A-Z][A-Z0-9_]{0,63}$/.test(code)) || new Set(codes).size !== codes.length) {
    throw new TypeError("Invalid validation reason codes");
  }
  return codes;
}
function parseValidation(value: unknown): AssetRecordBundle["version"]["validation"] {
  const input = jsonRecord(value, "validation");
  if (input.state === "pending") {
    exactKeys(input, ["state", "reasonCodes"], "pending validation");
    return { state: "pending", reasonCodes: parseReasonCodes(input.reasonCodes, true) };
  }
  if (input.state === "legacy-unverified") {
    exactKeys(input, ["state", "reasonCodes"], "legacy validation");
    if (!Array.isArray(input.reasonCodes) || input.reasonCodes.length !== 1 || input.reasonCodes[0] !== "LEGACY_FACTS_UNKNOWN") {
      throw new TypeError("Invalid legacy validation");
    }
    return { state: "legacy-unverified", reasonCodes: ["LEGACY_FACTS_UNKNOWN"] };
  }
  if (input.state === "validated" || input.state === "quarantined" || input.state === "rejected") {
    exactKeys(input, ["state", "validatedAt", "validator", "reasonCodes"], "completed validation");
    if (input.validator !== "electron-local-v1") throw new TypeError("Invalid validator");
    const reasonCodes = parseReasonCodes(input.reasonCodes, input.state === "validated");
    if (input.state === "validated" && reasonCodes.length !== 0) throw new TypeError("Validated records have no reasons");
    return {
      state: input.state,
      validatedAt: isoDate(input.validatedAt, "validatedAt"),
      validator: "electron-local-v1",
      reasonCodes,
    } as AssetRecordBundle["version"]["validation"];
  }
  throw new TypeError("Invalid validation state");
}
function parseVersionIds(value: unknown): readonly AssetVersionId[] {
  if (!Array.isArray(value) || value.length > 128) throw new TypeError("Invalid version lineage");
  const ids = value.map(parseAssetVersionId);
  const sorted = [...ids].sort();
  if (new Set(ids).size !== ids.length || ids.some((id, index) => id !== sorted[index])) {
    throw new TypeError("Version lineage must be unique and canonical");
  }
  return ids;
}
function parseProvenance(value: unknown, derivedFromVersionIds: readonly AssetVersionId[]): AssetRecordBundle["version"]["provenance"] {
  const input = jsonRecord(value, "provenance");
  if (input.kind === "imported") {
    exactKeys(input, ["kind", "method", "recordedAt", "actorPrincipalId", "originalName"], "imported provenance");
    if (!(["file", "remote", "data", "capture"] as const).includes(input.method as ImportedProvenance["method"])) {
      throw new TypeError("Invalid import method");
    }
    if (derivedFromVersionIds.length !== 0) throw new TypeError("Imported provenance cannot claim derivation");
    return {
      kind: "imported",
      method: input.method as ImportedProvenance["method"],
      recordedAt: isoDate(input.recordedAt, "recordedAt"),
      actorPrincipalId: opaqueProvenanceId(input.actorPrincipalId, "actorPrincipalId"),
      originalName: nullableOriginalName(input.originalName),
    };
  }
  if (input.kind === "generated") {
    exactKeys(
      input,
      [
        "kind",
        "recordedAt",
        "actorPrincipalId",
        "providerId",
        "modelId",
        "operationId",
        "providerRequestId",
        "promptRef",
        "promptDigest",
      ],
      "generated provenance",
    );
    if (derivedFromVersionIds.length !== 0) throw new TypeError("Generated provenance cannot claim derivation");
    const promptDigest = input.promptDigest;
    if (promptDigest !== null && (typeof promptDigest !== "string" || !HASH_PATTERN.test(promptDigest))) {
      throw new TypeError("Invalid prompt digest");
    }
    return {
      kind: "generated",
      recordedAt: isoDate(input.recordedAt, "recordedAt"),
      actorPrincipalId: opaqueProvenanceId(input.actorPrincipalId, "actorPrincipalId"),
      providerId: opaqueProvenanceId(input.providerId, "providerId"),
      modelId: opaqueProvenanceId(input.modelId, "modelId"),
      operationId: nullableOpaqueProvenanceId(input.operationId, "operationId"),
      providerRequestId: nullableOpaqueProvenanceId(input.providerRequestId, "providerRequestId"),
      promptRef: nullablePromptRef(input.promptRef),
      promptDigest,
    };
  }
  if (input.kind === "derived") {
    exactKeys(input, ["kind", "recordedAt", "actorPrincipalId", "operation", "sourceVersionIds"], "derived provenance");
    const sourceVersionIds = parseVersionIds(input.sourceVersionIds);
    if (
      sourceVersionIds.length !== derivedFromVersionIds.length ||
      sourceVersionIds.some((id, index) => id !== derivedFromVersionIds[index])
    ) {
      throw new TypeError("Derived provenance does not match lineage");
    }
    return {
      kind: "derived",
      recordedAt: isoDate(input.recordedAt, "recordedAt"),
      actorPrincipalId: opaqueProvenanceId(input.actorPrincipalId, "actorPrincipalId"),
      operation: opaqueProvenanceId(input.operation, "operation"),
      sourceVersionIds,
    };
  }
  if (input.kind === "legacy-unverified") {
    exactKeys(input, ["kind", "recordedAt", "actorPrincipalId", "unknownFacts"], "legacy provenance");
    if (input.actorPrincipalId !== null || !Array.isArray(input.unknownFacts) || input.unknownFacts.length === 0 || input.unknownFacts.length > 32) {
      throw new TypeError("Invalid legacy provenance");
    }
    const unknownFacts = input.unknownFacts.map((fact) => boundedString(fact, "unknownFact", 64));
    if (new Set(unknownFacts).size !== unknownFacts.length) throw new TypeError("Duplicate unknown fact");
    return {
      kind: "legacy-unverified",
      recordedAt: isoDate(input.recordedAt, "recordedAt"),
      actorPrincipalId: null,
      unknownFacts,
    };
  }
  throw new TypeError("Invalid provenance kind");
}
export function parseAssetRecordBundle(value: unknown): AssetRecordBundle {
  assertSafeJson(value);
  const input = jsonRecord(value, "bundle");
  exactKeys(input, ["asset", "version"], "bundle");
  const assetInput = jsonRecord(input.asset, "asset");
  exactKeys(assetInput, ["schemaVersion", "id", "scope", "createdAt", "createdByPrincipalId"], "asset");
  if (assetInput.schemaVersion !== "asset.v1") throw new TypeError("Invalid asset schema");
  const asset = {
    schemaVersion: "asset.v1" as const,
    id: parseAssetId(assetInput.id),
    scope: parseScope(assetInput.scope),
    createdAt: isoDate(assetInput.createdAt, "createdAt"),
    createdByPrincipalId: boundedString(assetInput.createdByPrincipalId, "createdByPrincipalId"),
  };
  const versionInput = jsonRecord(input.version, "version");
  exactKeys(
    versionInput,
    [
      "schemaVersion",
      "id",
      "assetId",
      "scope",
      "predecessorVersionId",
      "derivedFromVersionIds",
      "integrity",
      "classification",
      "validation",
      "provenance",
      "createdAt",
      "createdByPrincipalId",
    ],
    "version",
  );
  if (versionInput.schemaVersion !== "asset-version.v1") throw new TypeError("Invalid version schema");
  if (!CLASSIFICATIONS.includes(versionInput.classification as AssetClassification)) {
    throw new TypeError("Invalid classification");
  }
  const versionId = parseAssetVersionId(versionInput.id);
  const derivedFromVersionIds = parseVersionIds(versionInput.derivedFromVersionIds);
  const predecessorVersionId =
    versionInput.predecessorVersionId === null ? null : parseAssetVersionId(versionInput.predecessorVersionId);
  if (predecessorVersionId === versionId || derivedFromVersionIds.includes(versionId)) {
    throw new TypeError("Version lineage cannot reference itself");
  }
  const version = {
    schemaVersion: "asset-version.v1" as const,
    id: versionId,
    assetId: parseAssetId(versionInput.assetId),
    scope: parseScope(versionInput.scope),
    predecessorVersionId,
    derivedFromVersionIds,
    integrity: parseAssetIntegrity(versionInput.integrity),
    classification: versionInput.classification as AssetClassification,
    validation: parseValidation(versionInput.validation),
    provenance: parseProvenance(versionInput.provenance, derivedFromVersionIds),
    createdAt: isoDate(versionInput.createdAt, "createdAt"),
    createdByPrincipalId:
      versionInput.createdByPrincipalId === null
        ? null
        : boundedString(versionInput.createdByPrincipalId, "createdByPrincipalId"),
  };
  if (version.assetId !== asset.id || !sameScope(version.scope, asset.scope)) {
    throw new TypeError("Asset and version ownership mismatch");
  }
  if (
    (version.validation.state === "legacy-unverified") !== (version.provenance.kind === "legacy-unverified") ||
    (version.validation.state === "legacy-unverified" && version.createdByPrincipalId !== null)
  ) {
    throw new TypeError("Legacy facts must remain unknown");
  }
  return { asset, version };
}
export function serializeAssetRecordBundle(value: unknown): AssetRecordBundle {
  return parseAssetRecordBundle(value);
}
export function validateAssetRecordGraph(values: readonly unknown[]): readonly AssetRecordBundle[] {
  if (!Array.isArray(values) || values.length > 10_000) throw new TypeError("Invalid asset graph");
  const bundles = values.map(parseAssetRecordBundle);
  const byAsset = new Map<AssetId, AssetRecordBundle["asset"]>();
  const byVersion = new Map<AssetVersionId, AssetRecordBundle>();
  for (const bundle of bundles) {
    const priorAsset = byAsset.get(bundle.asset.id);
    if (priorAsset && JSON.stringify(priorAsset) !== JSON.stringify(bundle.asset)) {
      throw new TypeError("Immutable asset was changed");
    }
    byAsset.set(bundle.asset.id, bundle.asset);
    const priorVersion = byVersion.get(bundle.version.id);
    if (priorVersion && JSON.stringify(priorVersion) !== JSON.stringify(bundle))
      throw new TypeError("Immutable version was changed");
    if (priorVersion) throw new TypeError("Duplicate asset version");
    byVersion.set(bundle.version.id, bundle);
  }
  for (const bundle of byVersion.values()) {
    const predecessorId = bundle.version.predecessorVersionId;
    if (predecessorId) {
      const predecessor = byVersion.get(predecessorId);
      if (
        !predecessor ||
        predecessor.asset.id !== bundle.asset.id ||
        !sameScope(predecessor.asset.scope, bundle.asset.scope) ||
        predecessor.version.createdAt > bundle.version.createdAt
      ) {
        throw new TypeError("Invalid predecessor");
      }
    }
    for (const sourceId of bundle.version.derivedFromVersionIds) {
      const source = byVersion.get(sourceId);
      if (!source || !sameScope(source.asset.scope, bundle.asset.scope)) {
        throw new TypeError("Invalid derivation source");
      }
    }
  }
  const visiting = new Set<AssetVersionId>();
  const visited = new Set<AssetVersionId>();
  const visit = (versionId: AssetVersionId): void => {
    if (visiting.has(versionId)) throw new TypeError("Lineage cycle");
    if (visited.has(versionId)) return;
    visiting.add(versionId);
    const bundle = byVersion.get(versionId);
    if (bundle) {
      const dependencies = [
        ...(bundle.version.predecessorVersionId ? [bundle.version.predecessorVersionId] : []),
        ...bundle.version.derivedFromVersionIds,
      ];
      dependencies.forEach(visit);
    }
    visiting.delete(versionId);
    visited.add(versionId);
  };
  for (const versionId of byVersion.keys()) visit(versionId);
  return bundles;
}
function parseClassification(value: unknown): AssetClassification {
  if (!CLASSIFICATIONS.includes(value as AssetClassification)) throw new TypeError("Invalid classification");
  return value as AssetClassification;
}
function parseClaimedMediaType(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !MEDIA_TYPE_PATTERN.test(value)) throw new TypeError("Invalid claimed media type");
  return value;
}
function parseIdempotencyKey(value: unknown): string {
  const key = boundedString(value, "idempotencyKey", 256);
  if (!/^[A-Za-z0-9._:-]+$/.test(key)) throw new TypeError("Invalid idempotency key");
  return key;
}
export function parseAssetRecordListRequest(value: unknown): AssetRecordListRequest {
  const input = jsonRecord(value, "asset record list request");
  allowedKeys(input, ["organizationId", "projectId", "cursor", "limit"], ["organizationId", "projectId"], "list request");
  const scope = parseScope({ organizationId: input.organizationId, projectId: input.projectId });
  const cursor = input.cursor === undefined || input.cursor === null ? input.cursor : boundedString(input.cursor, "cursor", 128);
  if (input.limit !== undefined && (!Number.isSafeInteger(input.limit) || (input.limit as number) < 1 || (input.limit as number) > 500)) {
    throw new TypeError("Invalid list limit");
  }
  return {
    ...scope,
    ...(cursor !== undefined ? { cursor } : {}),
    ...(input.limit !== undefined ? { limit: input.limit as number } : {}),
  };
}
export function parseAssetRecordImportFileRequest(value: unknown): AssetRecordImportFileRequest {
  const input = jsonRecord(value, "asset record file import request");
  allowedKeys(
    input,
    ["organizationId", "projectId", "fileName", "claimedMediaType", "bytes", "classification", "idempotencyKey"],
    ["organizationId", "projectId", "fileName", "bytes", "classification", "idempotencyKey"],
    "file import request",
  );
  if (!(input.bytes instanceof ArrayBuffer)) throw new TypeError("bytes must be an ArrayBuffer");
  if (input.bytes.byteLength > MAX_LOCAL_ASSET_BYTES) throw new TypeError("Asset payload is too large");
  const scope = parseScope({ organizationId: input.organizationId, projectId: input.projectId });
  return {
    ...scope,
    fileName: basename(input.fileName, "fileName"),
    ...(input.claimedMediaType !== undefined
      ? { claimedMediaType: parseClaimedMediaType(input.claimedMediaType) }
      : {}),
    bytes: input.bytes,
    classification: parseClassification(input.classification),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
  };
}
export function parseAssetRecordImportRemoteUrlRequest(value: unknown): AssetRecordImportRemoteUrlRequest {
  const input = jsonRecord(value, "asset record remote import request");
  allowedKeys(
    input,
    ["organizationId", "projectId", "url", "fileName", "claimedMediaType", "classification", "idempotencyKey"],
    ["organizationId", "projectId", "url", "classification", "idempotencyKey"],
    "remote import request",
  );
  const scope = parseScope({ organizationId: input.organizationId, projectId: input.projectId });
  const url = boundedString(input.url, "url", 4096);
  if (!/^(?:https?:\/\/|data:)/i.test(url) || /^https?:\/\/[^/]*@/i.test(url)) {
    throw new TypeError("Unsupported remote URL");
  }
  return {
    ...scope,
    url,
    ...(input.fileName !== undefined ? { fileName: basename(input.fileName, "fileName") } : {}),
    ...(input.claimedMediaType !== undefined
      ? { claimedMediaType: parseClaimedMediaType(input.claimedMediaType) }
      : {}),
    classification: parseClassification(input.classification),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
  };
}
export function parseAssetResolveRequest(value: unknown): AssetResolveRequest {
  const input = jsonRecord(value, "asset resolve request");
  exactKeys(input, ["organizationId", "projectId", "assetId", "versionId", "purpose"], "resolve request");
  if (input.purpose !== "display" && input.purpose !== "download" && input.purpose !== "provider-input") {
    throw new TypeError("Invalid resolution purpose");
  }
  return {
    ...parseScope({ organizationId: input.organizationId, projectId: input.projectId }),
    assetId: parseAssetId(input.assetId),
    versionId: parseAssetVersionId(input.versionId),
    purpose: input.purpose,
  };
}
export function createElectronAssetResolution(input: { bundle: unknown; request: unknown; url: string }): AssetResolution {
  const bundle = parseAssetRecordBundle(input.bundle);
  const request = parseAssetResolveRequest(input.request);
  if (
    bundle.asset.id !== request.assetId ||
    bundle.version.id !== request.versionId ||
    !sameScope(bundle.asset.scope, request) ||
    bundle.version.validation.state !== "validated"
  ) {
    throw new TypeError("Asset version is not resolvable");
  }
  if (!/^nomi-local:\/\/asset\//.test(input.url) || hasControlCharacter(input.url)) {
    throw new TypeError("Invalid Electron runtime locator");
  }
  return {
    schemaVersion: "asset-resolution.v1",
    assetId: bundle.asset.id,
    versionId: bundle.version.id,
    scope: { ...bundle.asset.scope },
    purpose: request.purpose,
    integrity: { ...bundle.version.integrity },
    locator: { kind: "runtime-url", runtime: "electron", url: input.url, expiresAt: null },
  };
}
export function generateAssetId(): AssetId {
  return `ast_${crypto.randomUUID()}` as AssetId;
}
export function generateAssetVersionId(): AssetVersionId {
  return `av_${crypto.randomUUID()}` as AssetVersionId;
}
function inspectMediaType(bytes: Uint8Array): string {
  const at = (index: number): number => bytes[index] ?? -1;
  if (
    bytes.byteLength >= 8 &&
    at(0) === 0x89 &&
    at(1) === 0x50 &&
    at(2) === 0x4e &&
    at(3) === 0x47 &&
    at(4) === 0x0d &&
    at(5) === 0x0a &&
    at(6) === 0x1a &&
    at(7) === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.byteLength >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  if (bytes.byteLength >= 6) {
    const signature = Buffer.from(bytes.subarray(0, 6)).toString("ascii");
    if (signature === "GIF87a" || signature === "GIF89a") return "image/gif";
  }
  if (
    bytes.byteLength >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.byteLength >= 5 && Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  if (bytes.byteLength >= 16 && Buffer.from(bytes.subarray(4, 8)).toString("ascii") === "ftyp") {
    const declaredSize = Buffer.from(bytes.subarray(0, 4)).readUInt32BE(0);
    const boxEnd = declaredSize === 0 ? bytes.byteLength : declaredSize;
    if (boxEnd >= 16 && boxEnd <= bytes.byteLength) {
      const brands = [Buffer.from(bytes.subarray(8, 12)).toString("ascii")];
      for (let offset = 16; offset + 4 <= boxEnd; offset += 4) {
        brands.push(Buffer.from(bytes.subarray(offset, offset + 4)).toString("ascii"));
      }
      if (brands.some((brand) => VIDEO_MP4_BRANDS.has(brand))) return "video/mp4";
    }
  }
  return "application/octet-stream";
}
export async function computeAssetIntegrity(bytes: Uint8Array): Promise<AssetIntegrity> {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Asset bytes must be a Uint8Array");
  return {
    algorithm: "sha256",
    digest: crypto.createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
    mediaType: inspectMediaType(bytes),
  };
}
export function hashAssetIdempotencyKey(key: string): string {
  if (typeof key !== "string" || key.length === 0 || key.length > 256) throw new TypeError("Invalid idempotency key");
  return crypto.createHash("sha256").update("everville.asset-record.idempotency.v1\0").update(key).digest("hex");
}
export function fingerprintAssetRecordRequest(value: unknown): string {
  assertSafeJson(value);
  return crypto
    .createHash("sha256")
    .update("everville.asset-record.request.v1\0")
    .update(JSON.stringify(value))
    .digest("hex");
}
export function createImportedAssetBundle(input: {
  scope: AssetScope; principalId: string; integrity: AssetIntegrity; classification: AssetClassification;
  method: ImportedProvenance["method"]; originalName: string | null; createdAt: string;
  assetId?: AssetId; versionId?: AssetVersionId;
}): AssetRecordBundle {
  const assetId = input.assetId ?? generateAssetId();
  const versionId = input.versionId ?? generateAssetVersionId();
  return parseAssetRecordBundle({
    asset: {
      schemaVersion: "asset.v1",
      id: assetId,
      scope: input.scope,
      createdAt: input.createdAt,
      createdByPrincipalId: input.principalId,
    },
    version: {
      schemaVersion: "asset-version.v1",
      id: versionId,
      assetId,
      scope: input.scope,
      predecessorVersionId: null,
      derivedFromVersionIds: [],
      integrity: input.integrity,
      classification: input.classification,
      validation: {
        state: "validated",
        validatedAt: input.createdAt,
        validator: "electron-local-v1",
        reasonCodes: [],
      },
      provenance: {
        kind: "imported",
        method: input.method,
        recordedAt: input.createdAt,
        actorPrincipalId: input.principalId,
        originalName: input.originalName,
      },
      createdAt: input.createdAt,
      createdByPrincipalId: input.principalId,
    },
  });
}
export function createAssetIdentityEnvelope(input: {
  bundle: unknown; idempotencyHash: string; requestFingerprint: string;
  operation: "import-file" | "import-remote-url";
}): AssetIdentityEnvelope {
  return serializeAssetIdentityEnvelope({
    schemaVersion: "asset-identity-envelope.v1",
    bundle: input.bundle,
    idempotencyHash: input.idempotencyHash,
    requestFingerprint: input.requestFingerprint,
    operation: input.operation,
  });
}
export function serializeAssetIdentityEnvelope(value: unknown): AssetIdentityEnvelope {
  assertSafeJson(value);
  const input = jsonRecord(value, "identity envelope");
  const keys = ["schemaVersion", "bundle", "idempotencyHash", "requestFingerprint", "operation"] as const;
  exactKeys(input, keys, "identity envelope");
  if (input.schemaVersion !== "asset-identity-envelope.v1") throw new TypeError("Invalid identity schema");
  if (typeof input.idempotencyHash !== "string" || !HASH_PATTERN.test(input.idempotencyHash)) {
    throw new TypeError("Invalid idempotency hash");
  }
  if (typeof input.requestFingerprint !== "string" || !HASH_PATTERN.test(input.requestFingerprint)) {
    throw new TypeError("Invalid request fingerprint");
  }
  if (input.operation !== "import-file" && input.operation !== "import-remote-url") {
    throw new TypeError("Invalid identity operation");
  }
  return {
    schemaVersion: "asset-identity-envelope.v1",
    bundle: serializeAssetRecordBundle(input.bundle),
    idempotencyHash: input.idempotencyHash,
    requestFingerprint: input.requestFingerprint,
    operation: input.operation,
  };
}
export function parseAssetIdentityEnvelope(value: unknown,
  context: { scope?: AssetScope; expectedIntegrity?: unknown } = {}): AssetIdentityEnvelope {
  const envelope = serializeAssetIdentityEnvelope(value);
  if (context.scope && !sameScope(envelope.bundle.asset.scope, context.scope)) throw new TypeError("SCOPE_MISMATCH");
  if (context.expectedIntegrity) {
    const expectedIntegrity = parseAssetIntegrity(context.expectedIntegrity);
    if (!sameIntegrity(envelope.bundle.version.integrity, expectedIntegrity)) {
      throw new TypeError("INTEGRITY_MISMATCH");
    }
  }
  return envelope;
}
