import type { PlatformCapability, PlatformResult } from './client'
import {
  parseAssetRecordBundle,
  type AssetRecordBundle,
  type PlatformAssetRecords,
} from './assets/contracts'
import { createWebAssetResolution } from './assets/runtime'
import {
  mapWebPortalFetchError,
  mapWebPortalResponseError,
  type WebPortalCapability,
} from './webPortalTransport'

type WebPortalAssetConfig = {
  apiBase: string | null
  bearer: string
  request: typeof fetch
}

function unsupported<T>(capability: PlatformCapability): PlatformResult<T> {
  return {
    ok: false,
    error: {
      code: 'UNSUPPORTED_CAPABILITY',
      capability,
      message: 'Portal web client is not configured',
      retryable: false,
    },
  }
}

function integrityError<T>(capability: WebPortalCapability, message: string): PlatformResult<T> {
  return {
    ok: false,
    error: { code: 'INTEGRITY_ERROR', capability, message, retryable: false },
  }
}

async function postJson<T>(
  config: WebPortalAssetConfig,
  capability: WebPortalCapability,
  path: string,
  body: Readonly<Record<string, unknown>>,
): Promise<PlatformResult<T>> {
  if (!config.apiBase) return unsupported(capability)
  let response: Response
  try {
    response = await config.request(`${config.apiBase}/${path}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${config.bearer}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    return mapWebPortalFetchError(capability)
  }
  if (!response.ok) return mapWebPortalResponseError(capability, response.status)
  try {
    return { ok: true, value: (await response.json()) as T }
  } catch {
    return integrityError(capability, `${capability} returned invalid JSON`)
  }
}

function base64UrlJson(value: Readonly<Record<string, unknown>>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function createWebPortalAssetRecords(config: WebPortalAssetConfig): PlatformAssetRecords {
  return {
    async list(input) {
      const result = await postJson<{ items: unknown[]; cursor: string | null }>(config, 'asset-records.list', 'assets/list', input)
      if (!result.ok) return result
      try {
        if (!Array.isArray(result.value.items) ||
            (result.value.cursor !== null && typeof result.value.cursor !== 'string')) {
          throw new TypeError('Invalid asset list')
        }
        return {
          ok: true,
          value: { items: result.value.items.map(parseAssetRecordBundle), cursor: result.value.cursor },
        }
      } catch {
        return integrityError('asset-records.list', 'Portal asset list is invalid')
      }
    },
    async importFile(input) {
      if (!config.apiBase) return unsupported('asset-records.import-file')
      const metadata = base64UrlJson({
        organizationId: input.organizationId,
        projectId: input.projectId,
        fileName: input.fileName,
        claimedMediaType: input.claimedMediaType,
        classification: input.classification,
        idempotencyKey: input.idempotencyKey,
      })
      let response: Response
      try {
        response = await config.request(`${config.apiBase}/assets/import-file`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${config.bearer}`,
            'content-type': input.claimedMediaType || 'application/octet-stream',
            'x-nomi-asset-metadata': metadata,
          },
          body: input.bytes,
        })
      } catch {
        return mapWebPortalFetchError('asset-records.import-file')
      }
      if (!response.ok) return mapWebPortalResponseError('asset-records.import-file', response.status)
      try {
        return { ok: true, value: parseAssetRecordBundle(await response.json()) }
      } catch {
        return integrityError('asset-records.import-file', 'Portal asset import is invalid')
      }
    },
    async importRemoteUrl(input) {
      const result = await postJson<unknown>(config, 'asset-records.import-remote-url', 'assets/import-remote', input)
      if (!result.ok) return result
      try {
        return { ok: true, value: parseAssetRecordBundle(result.value) }
      } catch {
        return integrityError('asset-records.import-remote-url', 'Portal asset import is invalid')
      }
    },
    async resolve(input) {
      const result = await postJson<{ bundle: unknown; url: string }>(config, 'asset-records.resolve', 'assets/resolve', input)
      if (!result.ok) return result
      try {
        const bundle: AssetRecordBundle = parseAssetRecordBundle(result.value.bundle)
        return {
          ok: true,
          value: createWebAssetResolution({ bundle, request: input, url: result.value.url }),
        }
      } catch {
        return integrityError('asset-records.resolve', 'Portal asset resolution is invalid')
      }
    },
  }
}

export function createUnsupportedWebPortalAssetRecords(): PlatformAssetRecords {
  return {
    list: () => Promise.resolve(unsupported('asset-records.list')),
    importFile: () => Promise.resolve(unsupported('asset-records.import-file')),
    importRemoteUrl: () => Promise.resolve(unsupported('asset-records.import-remote-url')),
    resolve: () => Promise.resolve(unsupported('asset-records.resolve')),
  }
}
