import type { PlatformResult } from '../client'

export const ASSET_RECORD_CAPABILITIES = [
  'asset-records.list',
  'asset-records.import-file',
  'asset-records.import-remote-url',
  'asset-records.resolve',
] as const

export type AssetRecordCapability = (typeof ASSET_RECORD_CAPABILITIES)[number]
export type AssetId = string & { readonly __brand: 'AssetId' }
export type AssetVersionId = string & { readonly __brand: 'AssetVersionId' }

export type AssetScope = {
  organizationId: string
  projectId: string
}

export type AssetClassification = 'unknown' | 'public' | 'internal' | 'confidential' | 'restricted'

export type AssetRecord = {
  schemaVersion: 'asset.v1'
  id: AssetId
  scope: AssetScope
  createdAt: string
  createdByPrincipalId: string
}

export type AssetIntegrity = {
  algorithm: 'sha256'
  digest: string
  sizeBytes: number
  mediaType: string
}

export type AssetValidation =
  | { state: 'pending'; reasonCodes: readonly string[] }
  | { state: 'validated'; validatedAt: string; validator: 'electron-local-v1' | 'portal-dropbox-v1'; reasonCodes: readonly [] }
  | { state: 'quarantined'; validatedAt: string; validator: 'electron-local-v1' | 'portal-dropbox-v1'; reasonCodes: readonly string[] }
  | { state: 'rejected'; validatedAt: string; validator: 'electron-local-v1' | 'portal-dropbox-v1'; reasonCodes: readonly string[] }
  | { state: 'legacy-unverified'; reasonCodes: readonly ['LEGACY_FACTS_UNKNOWN'] }

export type ImportedProvenance = {
  kind: 'imported'
  method: 'file' | 'remote' | 'data' | 'capture'
  recordedAt: string
  actorPrincipalId: string
  originalName: string | null
}

export type GeneratedProvenance = {
  kind: 'generated'
  recordedAt: string
  actorPrincipalId: string
  providerId: string
  modelId: string
  operationId: string | null
  providerRequestId: string | null
  promptRef: string | null
  promptDigest: string | null
}

export type DerivedProvenance = {
  kind: 'derived'
  recordedAt: string
  actorPrincipalId: string
  operation: string
  sourceVersionIds: readonly AssetVersionId[]
}

export type LegacyUnverifiedProvenance = {
  kind: 'legacy-unverified'
  recordedAt: string
  actorPrincipalId: null
  unknownFacts: readonly string[]
}

export type AssetProvenance =
  | ImportedProvenance
  | GeneratedProvenance
  | DerivedProvenance
  | LegacyUnverifiedProvenance

export type AssetVersionRecord = {
  schemaVersion: 'asset-version.v1'
  id: AssetVersionId
  assetId: AssetId
  scope: AssetScope
  predecessorVersionId: AssetVersionId | null
  derivedFromVersionIds: readonly AssetVersionId[]
  integrity: AssetIntegrity
  classification: AssetClassification
  validation: AssetValidation
  provenance: AssetProvenance
  createdAt: string
  createdByPrincipalId: string | null
}

export type AssetRecordBundle = {
  asset: AssetRecord
  version: AssetVersionRecord
}

export type AssetResolutionPurpose = 'display' | 'download' | 'provider-input'

export type AssetResolveRequest = AssetScope & {
  assetId: AssetId
  versionId: AssetVersionId
  purpose: AssetResolutionPurpose
}

export type AssetRuntimeLocator = {
  kind: 'runtime-url'
  runtime: 'electron' | 'web'
  url: string
  expiresAt: string | null
}

export type AssetResolution = {
  schemaVersion: 'asset-resolution.v1'
  assetId: AssetId
  versionId: AssetVersionId
  scope: AssetScope
  purpose: AssetResolutionPurpose
  integrity: AssetIntegrity
  locator: AssetRuntimeLocator
}

export type AssetRecordListRequest = AssetScope & {
  cursor?: string | null
  limit?: number
}

export type AssetRecordImportFileRequest = AssetScope & {
  fileName: string
  claimedMediaType?: string
  bytes: ArrayBuffer
  classification: AssetClassification
  idempotencyKey: string
}

export type AssetRecordImportRemoteUrlRequest = AssetScope & {
  url: string
  fileName?: string
  claimedMediaType?: string
  classification: AssetClassification
  idempotencyKey: string
}

export type PlatformAssetRecords = {
  list(request: AssetRecordListRequest): Promise<PlatformResult<{ items: AssetRecordBundle[]; cursor: string | null }>>
  importFile(request: AssetRecordImportFileRequest): Promise<PlatformResult<AssetRecordBundle>>
  importRemoteUrl(request: AssetRecordImportRemoteUrlRequest): Promise<PlatformResult<AssetRecordBundle>>
  resolve(request: AssetResolveRequest): Promise<PlatformResult<AssetResolution>>
}

type JsonObject = Record<string, unknown>

const ASSET_ID_PATTERN = /^ast_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const VERSION_ID_PATTERN = /^av_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const DIGEST_PATTERN = /^[0-9a-f]{64}$/
const MEDIA_TYPE_PATTERN = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/
const REASON_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,63}$/
const OPAQUE_PROVENANCE_ID_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)*$/
const OPAQUE_PROMPT_REF_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)+$/
const SECRET_BEARING_REF_PATTERN = /(?:api[_-]?key|authorization|bearer|credential|password|secret|token)/i
const SECRET_VALUE_PATTERN =
  /(?:\bbearer\s+[A-Za-z0-9._~+/=-]+|\b(?:api[_-]?key|authorization|credential|password|secret|token|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key)\b["']?\s*[:=]\s*["']?[^\s"',;}\]]+)/i
const FORBIDDEN_KEY =
  /^(?:url|uri|locator|path|absolutePath|relativePath|storagePath|bucket|bucketKey|objectKey|credential|credentials|authorization|headers|cookie|token|secret|rawPrompt|prompt|rawResponse|rawPayload|providerResponse|stack|runtimeLocator|sidecarPath)$/i
const FORBIDDEN_VALUE =
  /(?:nomi-local:|file:|blob:|https?:\/\/|(?:^|[\\/])\.\.(?:[\\/]|$)|^\/|^[a-z]:[\\/]|^\\\\[^\\/]+[\\/][^\\/]+(?:[\\/]|$))/i
const QUERY_PARAMETER_VALUE = /[?&][a-z0-9_-]{1,64}=/i

const CLASSIFICATIONS: readonly AssetClassification[] = [
  'unknown',
  'public',
  'internal',
  'confidential',
  'restricted',
]
const IMPORT_METHODS = ['file', 'remote', 'data', 'capture'] as const
const PURPOSES: readonly AssetResolutionPurpose[] = ['display', 'download', 'provider-input']
const MAX_LOCAL_ASSET_BYTES = 200 * 1024 * 1024
const SCOPE_ID_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)*$/
const URL_SCHEME_PATTERN = /^(?:https?|file|data|blob|nomi-local):/i

function record(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as JsonObject
}

function exactKeys(value: JsonObject, allowed: readonly string[], required: readonly string[], label: string): void {
  const keys = Object.keys(value)
  for (const key of keys) {
    if (!allowed.includes(key)) throw new TypeError(`${label} has an unknown field`)
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) throw new TypeError(`${label} is missing a field`)
  }
}
function hasControlCharacter(value: string): boolean { return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f || character.charCodeAt(0) === 0x7f) }
function boundedString(value: unknown, label: string, max = 256): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max || hasControlCharacter(value)) {
    throw new TypeError(`${label} must be a bounded string`)
  }
  if (value !== value.trim()) throw new TypeError(`${label} must be canonical`)
  return value
}

function scopeId(value: unknown, label: string): string {
  const id = boundedString(value, label)
  if (!SCOPE_ID_PATTERN.test(id) || URL_SCHEME_PATTERN.test(id)) {
    throw new TypeError(`${label} must be an opaque identifier`)
  }
  return id
}

function basename(value: unknown, label: string): string {
  const name = boundedString(value, label, 512)
  if (
    name === '.' ||
    name === '..' ||
    /[\\/]/.test(name) ||
    /^[A-Za-z]:/.test(name) ||
    URL_SCHEME_PATTERN.test(name)
  ) {
    throw new TypeError(`${label} must be a basename`)
  }
  return name
}

function nullableOriginalName(value: unknown): string | null { return value === null ? null : basename(value, 'originalName') }

function opaqueProvenanceId(value: unknown, label: string, max = 256): string {
  const id = boundedString(value, label, max)
  if (!OPAQUE_PROVENANCE_ID_PATTERN.test(id) || SECRET_BEARING_REF_PATTERN.test(id)) {
    throw new TypeError(`${label} must be an opaque identifier`)
  }
  return id
}

function nullableOpaqueProvenanceId(value: unknown, label: string): string | null {
  return value === null ? null : opaqueProvenanceId(value, label, 512)
}

function nullablePromptRef(value: unknown): string | null {
  if (value === null) return null
  const ref = boundedString(value, 'promptRef', 256)
  if (!OPAQUE_PROMPT_REF_PATTERN.test(ref) || SECRET_BEARING_REF_PATTERN.test(ref)) {
    throw new TypeError('promptRef must be an opaque reference')
  }
  return ref
}

function isoDate(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  const date = new Date(text)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== text) throw new TypeError(`${label} must be canonical ISO`)
  return text
}

function parseScope(value: unknown): AssetScope {
  const input = record(value, 'scope')
  exactKeys(input, ['organizationId', 'projectId'], ['organizationId', 'projectId'], 'scope')
  return {
    organizationId: scopeId(input.organizationId, 'organizationId'),
    projectId: scopeId(input.projectId, 'projectId'),
  }
}

function sameScope(left: AssetScope, right: AssetScope): boolean {
  return left.organizationId === right.organizationId && left.projectId === right.projectId
}

export function parseAssetId(value: unknown): AssetId {
  if (typeof value !== 'string' || value.length > 64 || !ASSET_ID_PATTERN.test(value)) {
    throw new TypeError('Invalid asset ID')
  }
  return value as AssetId
}

export function parseAssetVersionId(value: unknown): AssetVersionId {
  if (typeof value !== 'string' || value.length > 64 || !VERSION_ID_PATTERN.test(value)) {
    throw new TypeError('Invalid asset version ID')
  }
  return value as AssetVersionId
}

export function parseAssetIntegrity(value: unknown): AssetIntegrity {
  const input = record(value, 'integrity')
  exactKeys(input, ['algorithm', 'digest', 'sizeBytes', 'mediaType'], ['algorithm', 'digest', 'sizeBytes', 'mediaType'], 'integrity')
  if (input.algorithm !== 'sha256' || typeof input.digest !== 'string' || !DIGEST_PATTERN.test(input.digest)) {
    throw new TypeError('Invalid integrity digest')
  }
  if (!Number.isSafeInteger(input.sizeBytes) || (input.sizeBytes as number) < 0) {
    throw new TypeError('Invalid integrity size')
  }
  if (typeof input.mediaType !== 'string' || !MEDIA_TYPE_PATTERN.test(input.mediaType)) {
    throw new TypeError('Invalid canonical media type')
  }
  return {
    algorithm: 'sha256',
    digest: input.digest,
    sizeBytes: input.sizeBytes as number,
    mediaType: input.mediaType,
  }
}

function reasonCodes(value: unknown, label: string, allowEmpty: boolean): readonly string[] {
  if (!Array.isArray(value) || value.length > 32 || (!allowEmpty && value.length === 0)) {
    throw new TypeError(`${label} must be a bounded array`)
  }
  const parsed = value.map((item) => {
    if (typeof item !== 'string' || !REASON_CODE_PATTERN.test(item)) throw new TypeError(`${label} is invalid`)
    return item
  })
  if (new Set(parsed).size !== parsed.length) throw new TypeError(`${label} contains duplicates`)
  return parsed
}

function parseValidation(value: unknown): AssetValidation {
  const input = record(value, 'validation')
  const state = input.state
  if (state === 'pending') {
    exactKeys(input, ['state', 'reasonCodes'], ['state', 'reasonCodes'], 'pending validation')
    return { state, reasonCodes: reasonCodes(input.reasonCodes, 'reasonCodes', true) }
  }
  if (state === 'legacy-unverified') {
    exactKeys(input, ['state', 'reasonCodes'], ['state', 'reasonCodes'], 'legacy validation')
    if (!Array.isArray(input.reasonCodes) || input.reasonCodes.length !== 1 || input.reasonCodes[0] !== 'LEGACY_FACTS_UNKNOWN') {
      throw new TypeError('Invalid legacy validation')
    }
    return { state, reasonCodes: ['LEGACY_FACTS_UNKNOWN'] }
  }
  if (state === 'validated' || state === 'quarantined' || state === 'rejected') {
    exactKeys(
      input,
      ['state', 'validatedAt', 'validator', 'reasonCodes'],
      ['state', 'validatedAt', 'validator', 'reasonCodes'],
      'completed validation',
    )
    if (input.validator !== 'electron-local-v1' && input.validator !== 'portal-dropbox-v1') {
      throw new TypeError('Invalid validator')
    }
    const parsedReasons = reasonCodes(input.reasonCodes, 'reasonCodes', state === 'validated')
    if (state === 'validated' && parsedReasons.length !== 0) throw new TypeError('Validated records have no reasons')
    return {
      state,
      validatedAt: isoDate(input.validatedAt, 'validatedAt'),
      validator: input.validator,
      reasonCodes: parsedReasons,
    } as AssetValidation
  }
  throw new TypeError('Invalid validation state')
}

function parseVersionIds(value: unknown, label: string): readonly AssetVersionId[] {
  if (!Array.isArray(value) || value.length > 128) throw new TypeError(`${label} must be a bounded array`)
  const parsed = value.map(parseAssetVersionId)
  if (new Set(parsed).size !== parsed.length) throw new TypeError(`${label} contains duplicates`)
  const sorted = [...parsed].sort()
  if (parsed.some((item, index) => item !== sorted[index])) throw new TypeError(`${label} must be canonical`)
  return parsed
}

function parseProvenance(value: unknown, derivedFromVersionIds: readonly AssetVersionId[]): AssetProvenance {
  const input = record(value, 'provenance')
  const kind = input.kind
  if (kind === 'imported') {
    exactKeys(
      input,
      ['kind', 'method', 'recordedAt', 'actorPrincipalId', 'originalName'],
      ['kind', 'method', 'recordedAt', 'actorPrincipalId', 'originalName'],
      'imported provenance',
    )
    if (!IMPORT_METHODS.includes(input.method as (typeof IMPORT_METHODS)[number])) throw new TypeError('Invalid import method')
    if (derivedFromVersionIds.length !== 0) throw new TypeError('Imported provenance cannot claim derivation')
    return {
      kind,
      method: input.method as ImportedProvenance['method'],
      recordedAt: isoDate(input.recordedAt, 'recordedAt'),
      actorPrincipalId: opaqueProvenanceId(input.actorPrincipalId, 'actorPrincipalId'),
      originalName: nullableOriginalName(input.originalName),
    }
  }
  if (kind === 'generated') {
    const keys = [
      'kind',
      'recordedAt',
      'actorPrincipalId',
      'providerId',
      'modelId',
      'operationId',
      'providerRequestId',
      'promptRef',
      'promptDigest',
    ] as const
    exactKeys(input, keys, keys, 'generated provenance')
    if (derivedFromVersionIds.length !== 0) throw new TypeError('Generated provenance cannot claim derivation')
    const promptDigest = input.promptDigest
    if (promptDigest !== null && (typeof promptDigest !== 'string' || !DIGEST_PATTERN.test(promptDigest))) {
      throw new TypeError('Invalid prompt digest')
    }
    return {
      kind,
      recordedAt: isoDate(input.recordedAt, 'recordedAt'),
      actorPrincipalId: opaqueProvenanceId(input.actorPrincipalId, 'actorPrincipalId'),
      providerId: opaqueProvenanceId(input.providerId, 'providerId'),
      modelId: opaqueProvenanceId(input.modelId, 'modelId'),
      operationId: nullableOpaqueProvenanceId(input.operationId, 'operationId'),
      providerRequestId: nullableOpaqueProvenanceId(input.providerRequestId, 'providerRequestId'),
      promptRef: nullablePromptRef(input.promptRef),
      promptDigest,
    }
  }
  if (kind === 'derived') {
    exactKeys(
      input,
      ['kind', 'recordedAt', 'actorPrincipalId', 'operation', 'sourceVersionIds'],
      ['kind', 'recordedAt', 'actorPrincipalId', 'operation', 'sourceVersionIds'],
      'derived provenance',
    )
    const sourceVersionIds = parseVersionIds(input.sourceVersionIds, 'sourceVersionIds')
    if (
      sourceVersionIds.length !== derivedFromVersionIds.length ||
      sourceVersionIds.some((item, index) => item !== derivedFromVersionIds[index])
    ) {
      throw new TypeError('Derived provenance does not match lineage')
    }
    return {
      kind,
      recordedAt: isoDate(input.recordedAt, 'recordedAt'),
      actorPrincipalId: opaqueProvenanceId(input.actorPrincipalId, 'actorPrincipalId'),
      operation: opaqueProvenanceId(input.operation, 'operation'),
      sourceVersionIds,
    }
  }
  if (kind === 'legacy-unverified') {
    exactKeys(
      input,
      ['kind', 'recordedAt', 'actorPrincipalId', 'unknownFacts'],
      ['kind', 'recordedAt', 'actorPrincipalId', 'unknownFacts'],
      'legacy provenance',
    )
    if (input.actorPrincipalId !== null || !Array.isArray(input.unknownFacts) || input.unknownFacts.length === 0 || input.unknownFacts.length > 32) {
      throw new TypeError('Invalid legacy provenance')
    }
    const unknownFacts = input.unknownFacts.map((fact) => boundedString(fact, 'unknownFact', 64))
    if (new Set(unknownFacts).size !== unknownFacts.length) throw new TypeError('Duplicate unknown fact')
    return {
      kind,
      recordedAt: isoDate(input.recordedAt, 'recordedAt'),
      actorPrincipalId: null,
      unknownFacts,
    }
  }
  throw new TypeError('Invalid provenance kind')
}

function parseAssetRecord(value: unknown): AssetRecord {
  const input = record(value, 'asset')
  exactKeys(
    input,
    ['schemaVersion', 'id', 'scope', 'createdAt', 'createdByPrincipalId'],
    ['schemaVersion', 'id', 'scope', 'createdAt', 'createdByPrincipalId'],
    'asset',
  )
  if (input.schemaVersion !== 'asset.v1') throw new TypeError('Invalid asset schema')
  return {
    schemaVersion: 'asset.v1',
    id: parseAssetId(input.id),
    scope: parseScope(input.scope),
    createdAt: isoDate(input.createdAt, 'createdAt'),
    createdByPrincipalId: boundedString(input.createdByPrincipalId, 'createdByPrincipalId'),
  }
}

function parseAssetVersionRecord(value: unknown): AssetVersionRecord {
  const input = record(value, 'version')
  const keys = [
    'schemaVersion',
    'id',
    'assetId',
    'scope',
    'predecessorVersionId',
    'derivedFromVersionIds',
    'integrity',
    'classification',
    'validation',
    'provenance',
    'createdAt',
    'createdByPrincipalId',
  ] as const
  exactKeys(input, keys, keys, 'version')
  if (input.schemaVersion !== 'asset-version.v1') throw new TypeError('Invalid version schema')
  if (!CLASSIFICATIONS.includes(input.classification as AssetClassification)) throw new TypeError('Invalid classification')
  const id = parseAssetVersionId(input.id)
  const derivedFromVersionIds = parseVersionIds(input.derivedFromVersionIds, 'derivedFromVersionIds')
  if (derivedFromVersionIds.includes(id)) throw new TypeError('Version cannot derive from itself')
  const predecessorVersionId = input.predecessorVersionId === null ? null : parseAssetVersionId(input.predecessorVersionId)
  if (predecessorVersionId === id) throw new TypeError('Version cannot precede itself')
  const createdByPrincipalId =
    input.createdByPrincipalId === null
      ? null
      : boundedString(input.createdByPrincipalId, 'createdByPrincipalId')
  return {
    schemaVersion: 'asset-version.v1',
    id,
    assetId: parseAssetId(input.assetId),
    scope: parseScope(input.scope),
    predecessorVersionId,
    derivedFromVersionIds,
    integrity: parseAssetIntegrity(input.integrity),
    classification: input.classification as AssetClassification,
    validation: parseValidation(input.validation),
    provenance: parseProvenance(input.provenance, derivedFromVersionIds),
    createdAt: isoDate(input.createdAt, 'createdAt'),
    createdByPrincipalId,
  }
}

function assertJsonAndNoForbiddenData(value: unknown): void {
  const seen = new Set<object>()
  const visit = (current: unknown, key: string | null): void => {
    if (key !== null && FORBIDDEN_KEY.test(key)) throw new TypeError('Forbidden persisted field')
    if (
      typeof current === 'string' &&
      (FORBIDDEN_VALUE.test(current) || QUERY_PARAMETER_VALUE.test(current) || SECRET_VALUE_PATTERN.test(current))
    ) {
      throw new TypeError('Forbidden persisted value')
    }
    if (current === null || typeof current === 'string' || typeof current === 'boolean') return
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) throw new TypeError('Persisted values must be JSON')
      return
    }
    if (typeof current !== 'object') throw new TypeError('Persisted values must be JSON')
    if (seen.has(current)) throw new TypeError('Persisted values must not be cyclic')
    seen.add(current)
    if (Array.isArray(current)) {
      current.forEach((child) => visit(child, null))
    } else {
      Object.entries(current as JsonObject).forEach(([childKey, child]) => visit(child, childKey))
    }
    seen.delete(current)
  }
  visit(value, null)
}

export function parseAssetRecordBundle(value: unknown): AssetRecordBundle {
  assertJsonAndNoForbiddenData(value)
  const input = record(value, 'bundle')
  exactKeys(input, ['asset', 'version'], ['asset', 'version'], 'bundle')
  const asset = parseAssetRecord(input.asset)
  const version = parseAssetVersionRecord(input.version)
  if (version.assetId !== asset.id || !sameScope(version.scope, asset.scope)) {
    throw new TypeError('Asset and version ownership mismatch')
  }
  if (version.validation.state === 'legacy-unverified') {
    if (version.provenance.kind !== 'legacy-unverified' || version.createdByPrincipalId !== null) {
      throw new TypeError('Legacy facts must remain unknown')
    }
  } else if (version.provenance.kind === 'legacy-unverified') {
    throw new TypeError('Legacy provenance requires legacy validation')
  }
  return { asset, version }
}

export function serializeAssetRecordBundle(value: unknown): AssetRecordBundle {
  assertJsonAndNoForbiddenData(value)
  return parseAssetRecordBundle(value)
}

export function validateAssetRecordGraph(values: readonly unknown[]): readonly AssetRecordBundle[] {
  if (!Array.isArray(values) || values.length > 10_000) throw new TypeError('Invalid asset graph')
  const bundles = values.map(parseAssetRecordBundle)
  const byAsset = new Map<AssetId, AssetRecord>()
  const byVersion = new Map<AssetVersionId, AssetRecordBundle>()
  for (const bundle of bundles) {
    const priorAsset = byAsset.get(bundle.asset.id)
    if (priorAsset) {
      if (JSON.stringify(priorAsset) !== JSON.stringify(bundle.asset)) {
        throw new TypeError('Immutable asset was changed')
      }
    } else {
      byAsset.set(bundle.asset.id, bundle.asset)
    }

    const prior = byVersion.get(bundle.version.id)
    if (prior) {
      if (JSON.stringify(prior) !== JSON.stringify(bundle)) throw new TypeError('Immutable version was changed')
      throw new TypeError('Duplicate asset version')
    }
    byVersion.set(bundle.version.id, bundle)
  }

  for (const bundle of byVersion.values()) {
    const predecessor = bundle.version.predecessorVersionId
    if (predecessor) {
      const source = byVersion.get(predecessor)
      if (!source || source.asset.id !== bundle.asset.id || !sameScope(source.asset.scope, bundle.asset.scope) ||
        source.version.createdAt > bundle.version.createdAt) {
        throw new TypeError('Invalid predecessor')
      }
    }
    for (const sourceId of bundle.version.derivedFromVersionIds) {
      const source = byVersion.get(sourceId)
      if (!source || !sameScope(source.asset.scope, bundle.asset.scope)) throw new TypeError('Invalid derivation source')
    }
  }

  const visiting = new Set<AssetVersionId>()
  const visited = new Set<AssetVersionId>()
  const visit = (versionId: AssetVersionId): void => {
    if (visiting.has(versionId)) throw new TypeError('Lineage cycle')
    if (visited.has(versionId)) return
    visiting.add(versionId)
    const bundle = byVersion.get(versionId)
    if (bundle) {
      const edges = [
        ...(bundle.version.predecessorVersionId ? [bundle.version.predecessorVersionId] : []),
        ...bundle.version.derivedFromVersionIds,
      ]
      edges.forEach(visit)
    }
    visiting.delete(versionId)
    visited.add(versionId)
  }
  for (const versionId of byVersion.keys()) visit(versionId)
  return bundles
}

function parseClassification(value: unknown): AssetClassification {
  if (!CLASSIFICATIONS.includes(value as AssetClassification)) throw new TypeError('Invalid classification')
  return value as AssetClassification
}

function parseClaimedMediaType(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !MEDIA_TYPE_PATTERN.test(value)) throw new TypeError('Invalid claimed media type')
  return value
}

function parseIdempotencyKey(value: unknown): string {
  const key = boundedString(value, 'idempotencyKey', 256)
  if (!/^[A-Za-z0-9._:-]+$/.test(key)) throw new TypeError('Invalid idempotency key')
  return key
}

export function parseAssetRecordListRequest(value: unknown): AssetRecordListRequest {
  const input = record(value, 'asset record list request')
  exactKeys(input, ['organizationId', 'projectId', 'cursor', 'limit'], ['organizationId', 'projectId'], 'list request')
  const scope = parseScope({ organizationId: input.organizationId, projectId: input.projectId })
  const cursor = input.cursor === undefined || input.cursor === null ? input.cursor : boundedString(input.cursor, 'cursor', 128)
  if (input.limit !== undefined && (!Number.isSafeInteger(input.limit) || (input.limit as number) < 1 || (input.limit as number) > 500)) {
    throw new TypeError('Invalid list limit')
  }
  return {
    ...scope,
    ...(cursor !== undefined ? { cursor } : {}),
    ...(input.limit !== undefined ? { limit: input.limit as number } : {}),
  }
}

export function parseAssetRecordImportFileRequest(value: unknown): AssetRecordImportFileRequest {
  const input = record(value, 'asset record file import request')
  const allowed = [
    'organizationId',
    'projectId',
    'fileName',
    'claimedMediaType',
    'bytes',
    'classification',
    'idempotencyKey',
  ] as const
  exactKeys(
    input,
    allowed,
    ['organizationId', 'projectId', 'fileName', 'bytes', 'classification', 'idempotencyKey'],
    'file import request',
  )
  const scope = parseScope({ organizationId: input.organizationId, projectId: input.projectId })
  if (!(input.bytes instanceof ArrayBuffer)) throw new TypeError('bytes must be an ArrayBuffer')
  if (input.bytes.byteLength > MAX_LOCAL_ASSET_BYTES) throw new TypeError('Asset payload is too large')
  return {
    ...scope,
    fileName: basename(input.fileName, 'fileName'),
    ...(input.claimedMediaType !== undefined
      ? { claimedMediaType: parseClaimedMediaType(input.claimedMediaType) }
      : {}),
    bytes: input.bytes.slice(0),
    classification: parseClassification(input.classification),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
  }
}

export function parseAssetRecordImportRemoteUrlRequest(value: unknown): AssetRecordImportRemoteUrlRequest {
  const input = record(value, 'asset record remote import request')
  const allowed = [
    'organizationId',
    'projectId',
    'url',
    'fileName',
    'claimedMediaType',
    'classification',
    'idempotencyKey',
  ] as const
  exactKeys(
    input,
    allowed,
    ['organizationId', 'projectId', 'url', 'classification', 'idempotencyKey'],
    'remote import request',
  )
  const scope = parseScope({ organizationId: input.organizationId, projectId: input.projectId })
  const url = boundedString(input.url, 'url', 4096)
  if (!/^(?:https?:\/\/|data:)/i.test(url) || /^https?:\/\/[^/]*@/i.test(url)) {
    throw new TypeError('Unsupported remote URL')
  }
  return {
    ...scope,
    url,
    ...(input.fileName !== undefined ? { fileName: basename(input.fileName, 'fileName') } : {}),
    ...(input.claimedMediaType !== undefined
      ? { claimedMediaType: parseClaimedMediaType(input.claimedMediaType) }
      : {}),
    classification: parseClassification(input.classification),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
  }
}

export function parseAssetResolveRequest(value: unknown): AssetResolveRequest {
  const input = record(value, 'asset resolve request')
  exactKeys(
    input,
    ['organizationId', 'projectId', 'assetId', 'versionId', 'purpose'],
    ['organizationId', 'projectId', 'assetId', 'versionId', 'purpose'],
    'resolve request',
  )
  if (!PURPOSES.includes(input.purpose as AssetResolutionPurpose)) throw new TypeError('Invalid resolution purpose')
  return {
    ...parseScope({ organizationId: input.organizationId, projectId: input.projectId }),
    assetId: parseAssetId(input.assetId),
    versionId: parseAssetVersionId(input.versionId),
    purpose: input.purpose as AssetResolutionPurpose,
  }
}

export function parseAssetResolution(value: unknown): AssetResolution {
  const input = record(value, 'asset resolution')
  exactKeys(
    input,
    ['schemaVersion', 'assetId', 'versionId', 'scope', 'purpose', 'integrity', 'locator'],
    ['schemaVersion', 'assetId', 'versionId', 'scope', 'purpose', 'integrity', 'locator'],
    'asset resolution',
  )
  if (input.schemaVersion !== 'asset-resolution.v1') throw new TypeError('Invalid asset resolution schema')
  if (!PURPOSES.includes(input.purpose as AssetResolutionPurpose)) throw new TypeError('Invalid resolution purpose')

  const locator = record(input.locator, 'asset runtime locator')
  exactKeys(locator, ['kind', 'runtime', 'url', 'expiresAt'], ['kind', 'runtime', 'url', 'expiresAt'], 'asset runtime locator')
  const url = boundedString(locator.url, 'asset runtime locator URL', 8192)
  if (locator.kind !== 'runtime-url' || (locator.runtime !== 'electron' && locator.runtime !== 'web')) {
    throw new TypeError('Invalid asset runtime locator')
  }
  if (locator.runtime === 'electron') {
    if (!/^nomi-local:\/\/asset\//.test(url)) throw new TypeError('Invalid asset runtime locator')
    const encodedSegments = url.slice('nomi-local://asset/'.length).split('/')
    if (encodedSegments.length < 2 || encodedSegments.some((segment) => {
      try {
        const decoded = decodeURIComponent(segment)
        return segment.length === 0 || segment !== encodeURIComponent(decoded) || decoded === '.' || decoded === '..' ||
          decoded.includes('/') || decoded.includes('\\') || hasControlCharacter(decoded)
      } catch { return true }
    })) throw new TypeError('Invalid asset runtime locator')
  } else {
    let parsed: URL
    try { parsed = new URL(url) } catch { throw new TypeError('Invalid asset runtime locator') }
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (hasControlCharacter(url) || parsed.pathname !== '/api/portal/assets/content' ||
        (!local && parsed.protocol !== 'https:') || parsed.username || parsed.password) {
      throw new TypeError('Invalid asset runtime locator')
    }
  }
  const expiresAt = locator.expiresAt === null ? null : isoDate(locator.expiresAt, 'locator expiresAt')
  return {
    schemaVersion: 'asset-resolution.v1',
    assetId: parseAssetId(input.assetId),
    versionId: parseAssetVersionId(input.versionId),
    scope: parseScope(input.scope),
    purpose: input.purpose as AssetResolutionPurpose,
    integrity: parseAssetIntegrity(input.integrity),
    locator: {
      kind: 'runtime-url',
      runtime: locator.runtime,
      url,
      expiresAt,
    },
  }
}
