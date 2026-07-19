import {
  parseAssetRecordBundle,
  parseAssetResolveRequest,
  type AssetRecordBundle,
  type AssetResolution,
  type AssetResolveRequest,
} from './contracts'

const FORBIDDEN_PERSISTED_KEY =
  /^(?:url|uri|locator|path|absolutePath|relativePath|storagePath|bucket|bucketKey|objectKey|runtimeLocator|resolution)$/i
const FORBIDDEN_PERSISTED_VALUE =
  /(?:nomi-local:|file:|blob:|https?:\/\/|(?:^|[\\/])\.\.(?:[\\/]|$)|^\/|^[a-z]:[\\/]|^\\\\[^\\/]+[\\/][^\\/]+(?:[\\/]|$))/i

function hasControlCharacter(value: string): boolean { return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f || character.charCodeAt(0) === 0x7f) }

function sameScope(left: { organizationId: string; projectId: string }, right: { organizationId: string; projectId: string }): boolean {
  return left.organizationId === right.organizationId && left.projectId === right.projectId
}

export function assertResolvableAssetVersion(bundleValue: unknown, requestValue: unknown): {
  bundle: AssetRecordBundle
  request: AssetResolveRequest
} {
  const bundle = parseAssetRecordBundle(bundleValue)
  const request = parseAssetResolveRequest(requestValue)
  if (
    bundle.asset.id !== request.assetId ||
    bundle.version.id !== request.versionId ||
    !sameScope(bundle.asset.scope, request) ||
    bundle.version.validation.state !== 'validated'
  ) {
    throw new TypeError('Asset version is not resolvable')
  }
  return { bundle, request }
}

export function createElectronAssetResolution(input: {
  bundle: unknown
  request: unknown
  url: string
}): AssetResolution {
  const { bundle, request } = assertResolvableAssetVersion(input.bundle, input.request)
  if (typeof input.url !== 'string' || !/^nomi-local:\/\/asset\//.test(input.url) || hasControlCharacter(input.url)) {
    throw new TypeError('Invalid Electron runtime locator')
  }
  return {
    schemaVersion: 'asset-resolution.v1',
    assetId: bundle.asset.id,
    versionId: bundle.version.id,
    scope: { ...bundle.asset.scope },
    purpose: request.purpose,
    integrity: { ...bundle.version.integrity },
    locator: {
      kind: 'runtime-url',
      runtime: 'electron',
      url: input.url,
      expiresAt: null,
    },
  }
}

export function assertNoPersistedRuntimeLocator(value: unknown): void {
  const seen = new Set<object>()
  const visit = (current: unknown, key: string | null): void => {
    if (key !== null && FORBIDDEN_PERSISTED_KEY.test(key)) throw new TypeError('Runtime locators are transient')
    if (typeof current === 'string' && FORBIDDEN_PERSISTED_VALUE.test(current)) {
      throw new TypeError('Runtime locators are transient')
    }
    if (!current || typeof current !== 'object') return
    if (seen.has(current)) throw new TypeError('Persisted values must not be cyclic')
    seen.add(current)
    if (Array.isArray(current)) current.forEach((child) => visit(child, null))
    else Object.entries(current as Record<string, unknown>).forEach(([childKey, child]) => visit(child, childKey))
    seen.delete(current)
  }
  visit(value, null)
}
