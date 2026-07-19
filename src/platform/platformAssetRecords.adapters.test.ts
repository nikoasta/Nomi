/* eslint-disable @typescript-eslint/no-explicit-any -- Planned adapter exports do not have implementation types yet. */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it, vi } from 'vitest'

const CLIENT_URL = new URL('./client.ts', import.meta.url)
const BROWSER_URL = new URL('./browserPlatformClient.ts', import.meta.url)
const ELECTRON_URL = new URL('./electronPlatformClient.ts', import.meta.url)

type PlatformResult =
  | { ok: true; value: unknown }
  | {
      ok: false
      error: { code: string; capability?: string; retryable: boolean; details?: unknown; message?: string }
    }

type PlatformClientLike = {
  capabilities: readonly string[]
  assets: Record<string, (...args: any[]) => Promise<PlatformResult>>
  assetRecords: Record<string, (request: any) => Promise<PlatformResult>>
}

type BrowserModule = {
  createBrowserPlatformClient(options?: Record<string, unknown>): PlatformClientLike
}

type ElectronModule = {
  createElectronPlatformClient(options: Record<string, unknown>): PlatformClientLike
}

type ClientModule = {
  adaptDesktopBridge(bridge: unknown): unknown
}

async function guardedImport<T>(url: URL, contract: string, requiredNames: readonly string[]): Promise<T> {
  const modulePath = fileURLToPath(url)
  expect(existsSync(modulePath), `RED_CONTRACT: ${contract} must exist before its adapter exports are loaded`).toBe(
    true,
  )
  const source = readFileSync(modulePath, 'utf8')
  for (const name of requiredNames) {
    expect(source, `RED_CONTRACT: ${contract} must declare ${name} before module import`).toMatch(
      new RegExp(`\\b${name}\\b`),
    )
  }
  return import(/* @vite-ignore */ url.href) as Promise<T>
}

const SCOPE = { organizationId: 'org-everville', projectId: 'project-alpha' } as const
const ASSET_ID = 'ast_123e4567-e89b-42d3-a456-426614174000'
const VERSION_ID = 'av_123e4567-e89b-42d3-a456-426614174000'
const HIDDEN_ASSET_ID = 'ast_223e4567-e89b-42d3-a456-426614174000'
const HIDDEN_VERSION_ID = 'av_223e4567-e89b-42d3-a456-426614174000'
const CREATED_AT = '2026-07-18T01:02:03.000Z'
const INTEGRITY = {
  algorithm: 'sha256',
  digest: 'a'.repeat(64),
  sizeBytes: 4,
  mediaType: 'image/png',
} as const

type AssetRecordImportOperationLike = {
  authorizeAssetWrite(assetId: string): Promise<boolean>
}

function canonicalAssetRecordBundle({
  assetId = ASSET_ID,
  versionId = VERSION_ID,
  method = 'file',
}: {
  assetId?: string
  versionId?: string
  method?: 'file' | 'remote'
} = {}) {
  return {
    asset: {
      schemaVersion: 'asset.v1',
      id: assetId,
      scope: { ...SCOPE },
      createdAt: CREATED_AT,
      createdByPrincipalId: 'principal-niko',
    },
    version: {
      schemaVersion: 'asset-version.v1',
      id: versionId,
      assetId,
      scope: { ...SCOPE },
      predecessorVersionId: null,
      derivedFromVersionIds: [],
      integrity: { ...INTEGRITY },
      classification: 'internal',
      validation: {
        state: 'validated',
        validatedAt: CREATED_AT,
        validator: 'electron-local-v1',
        reasonCodes: [],
      },
      provenance: {
        kind: 'imported',
        method,
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        originalName: 'frame.png',
      },
      createdAt: CREATED_AT,
      createdByPrincipalId: 'principal-niko',
    },
  }
}

const requests = {
  list: { ...SCOPE, limit: 25, cursor: null },
  importFile: {
    ...SCOPE,
    fileName: 'frame.png',
    claimedMediaType: 'image/png',
    bytes: new Uint8Array([1, 2, 3, 4]).buffer,
    classification: 'internal',
    idempotencyKey: 'file-import-1',
  },
  importRemoteUrl: {
    ...SCOPE,
    url: 'https://media.example.test/frame.png',
    fileName: 'frame.png',
    claimedMediaType: 'image/png',
    classification: 'internal',
    idempotencyKey: 'remote-import-1',
  },
  resolve: {
    ...SCOPE,
    assetId: ASSET_ID,
    versionId: VERSION_ID,
    purpose: 'display',
  },
} as const

const operationTable = [
  ['list', 'asset-records.list'],
  ['importFile', 'asset-records.import-file'],
  ['importRemoteUrl', 'asset-records.import-remote-url'],
  ['resolve', 'asset-records.resolve'],
] as const

function success(value: unknown): PlatformResult {
  return { ok: true, value }
}

function createLegacyBridge() {
  return {
    assets: {
      list: vi.fn(async (request: unknown) => success([{ id: 'asset-path-derived', request }])),
      importFile: vi.fn(async (request: unknown) => success({ id: 'asset-random', request })),
      importRemoteUrl: vi.fn(async (request: unknown) => success({ id: 'asset-remote', request })),
    },
  }
}

function createAssetRecordAdapter() {
  return {
    list: vi.fn(async () => success({ items: [], cursor: null })),
    importFile: vi.fn(async (_request: unknown, operation: AssetRecordImportOperationLike) => {
      await operation.authorizeAssetWrite(ASSET_ID)
      return success(canonicalAssetRecordBundle())
    }),
    importRemoteUrl: vi.fn(async (_request: unknown, operation: AssetRecordImportOperationLike) => {
      await operation.authorizeAssetWrite(ASSET_ID)
      return success(canonicalAssetRecordBundle({ method: 'remote' }))
    }),
    resolve: vi.fn(async () =>
      success({
        schemaVersion: 'asset-resolution.v1',
        assetId: ASSET_ID,
        versionId: VERSION_ID,
        scope: SCOPE,
        purpose: 'display',
        integrity: { ...INTEGRITY },
        locator: {
          kind: 'runtime-url',
          runtime: 'electron',
          url: 'nomi-local://asset/project-alpha/imported/frame.png',
          expiresAt: null,
        },
      }),
    ),
  }
}

function createAuthorization() {
  return {
    authorize: vi.fn(async () => ({ ok: true, value: { decision: 'allow' } })),
  }
}

async function createElectronHarness(overrides: Record<string, unknown> = {}) {
  const clientModule = await guardedImport<ClientModule>(CLIENT_URL, 'PlatformClient asset-record surface', [
    'adaptDesktopBridge',
    'assetRecords',
  ])
  const electronModule = await guardedImport<ElectronModule>(ELECTRON_URL, 'Electron asset-record adapter', [
    'createElectronPlatformClient',
    'assetRecords',
  ])
  const bridge = (overrides.bridge as ReturnType<typeof createLegacyBridge> | undefined) ?? createLegacyBridge()
  const assetRecordAdapter =
    (overrides.assetRecordAdapter as ReturnType<typeof createAssetRecordAdapter> | undefined) ??
    createAssetRecordAdapter()
  const authorization =
    (overrides.authorization as ReturnType<typeof createAuthorization> | undefined) ?? createAuthorization()
  const session =
    overrides.session ??
    ({
      principalId: 'principal-niko',
      activeOrganizationId: SCOPE.organizationId,
      memberships: [{ organizationId: SCOPE.organizationId, role: 'owner' }],
    } as const)
  const adaptedBridge = clientModule.adaptDesktopBridge(bridge)
  const client = electronModule.createElectronPlatformClient({
    ...overrides,
    bridge: adaptedBridge,
    assetRecordAdapter,
    authorization,
    session,
  })

  return { client, bridge, assetRecordAdapter, authorization }
}

function expectUnsupported(result: PlatformResult, capability: string) {
  expect(result).toEqual({
    ok: false,
    error: expect.objectContaining({
      code: 'UNSUPPORTED_CAPABILITY',
      capability,
      retryable: false,
    }),
  })
}

describe('PlatformClient assetRecords adapters', () => {
  it('advertises Electron capabilities in stable order and browser advertises none', async () => {
    const browserModule = await guardedImport<BrowserModule>(BROWSER_URL, 'browser unsupported asset-record adapter', [
      'createBrowserPlatformClient',
      'assetRecords',
    ])
    const { client: electron } = await createElectronHarness()
    const browser = browserModule.createBrowserPlatformClient()
    const newCapabilities = operationTable.map(([, capability]) => capability)

    expect(
      electron.capabilities.filter((capability) => capability.startsWith('asset-records.')),
      'RED_CONTRACT: Electron must advertise all asset-record capabilities in normative order',
    ).toEqual(newCapabilities)
    expect(browser.capabilities).not.toEqual(expect.arrayContaining(newCapabilities))
    expect(browser.capabilities.filter((capability) => capability.startsWith('asset-records.'))).toEqual([])
  })

  it.each(operationTable)(
    'runs Electron %s through the distinct adapter and returns a typed result',
    async (operation) => {
      const { client, assetRecordAdapter } = await createElectronHarness()
      const result = await client.assetRecords[operation](requests[operation])

      expect(result.ok).toBe(true)
      expect(assetRecordAdapter[operation]).toHaveBeenCalledTimes(1)
      if (operation === 'importFile' || operation === 'importRemoteUrl') {
        expect(assetRecordAdapter[operation]).toHaveBeenCalledWith(
          requests[operation],
          expect.objectContaining({ authorizeAssetWrite: expect.any(Function) }),
        )
      } else {
        expect(assetRecordAdapter[operation]).toHaveBeenCalledWith(requests[operation])
      }
    },
  )

  it.each(operationTable)(
    'returns typed browser unsupported for %s without fallback',
    async (operation, capability) => {
      const browserModule = await guardedImport<BrowserModule>(
        BROWSER_URL,
        'browser unsupported asset-record adapter',
        ['createBrowserPlatformClient', 'assetRecords'],
      )
      const network = vi.fn(() => {
        throw new Error('network fallback must not run')
      })
      const storage = vi.fn(() => {
        throw new Error('storage fallback must not run')
      })
      const electron = vi.fn(() => {
        throw new Error('Electron fallback must not run')
      })
      const legacyAssets = {
        list: vi.fn(),
        importFile: vi.fn(),
        importRemoteUrl: vi.fn(),
      }
      const browser = browserModule.createBrowserPlatformClient({
        fetch: network,
        storage,
        electron,
        legacyAssets,
      })

      const result = await browser.assetRecords[operation](requests[operation])
      expectUnsupported(result, capability)
      expect(network).not.toHaveBeenCalled()
      expect(storage).not.toHaveBeenCalled()
      expect(electron).not.toHaveBeenCalled()
      expect(legacyAssets.list).not.toHaveBeenCalled()
      expect(legacyAssets.importFile).not.toHaveBeenCalled()
      expect(legacyAssets.importRemoteUrl).not.toHaveBeenCalled()
    },
  )

  it('authorizes list records without leaking unauthorized item existence', async () => {
    const firstBundle = canonicalAssetRecordBundle()
    const hiddenBundle = canonicalAssetRecordBundle({
      assetId: HIDDEN_ASSET_ID,
      versionId: HIDDEN_VERSION_ID,
    })
    const assetRecordAdapter = createAssetRecordAdapter()
    assetRecordAdapter.list.mockResolvedValueOnce(
      success({
        items: [firstBundle, hiddenBundle],
        cursor: null,
      }),
    )
    const authorization = {
      authorize: vi.fn(async (request: { capability: string; assetId?: string }) => {
        if (request.capability === 'asset.read' && request.assetId === HIDDEN_ASSET_ID) {
          return {
            ok: false,
            error: { code: 'PERMISSION_DENIED', retryable: false, details: { reason: 'DENIED' } },
          }
        }
        return success({ decision: 'allow' })
      }),
    }
    const { client } = await createElectronHarness({ assetRecordAdapter, authorization })

    const result = await client.assetRecords.list(requests.list)
    expect(result).toEqual({
      ok: true,
      value: { items: [firstBundle], cursor: null },
    })
    expect(JSON.stringify(result)).not.toContain(HIDDEN_ASSET_ID)
  })

  it.each([
    ['list', 'project.read'],
    ['importFile', 'project.write'],
    ['importRemoteUrl', 'project.write'],
    ['resolve', 'asset.read'],
  ] as const)('authorizes %s before adapter IO using %s', async (operation, capability) => {
    const events: string[] = []
    const authorization = {
      authorize: vi.fn(async (request: { capability: string }) => {
        events.push(`authorize:${request.capability}`)
        return success({ decision: 'allow' })
      }),
    }
    const assetRecordAdapter = createAssetRecordAdapter()
    assetRecordAdapter[operation].mockImplementationOnce(async () => {
      events.push(`adapter:${operation}`)
      return success(operation === 'list' ? { items: [], cursor: null } : {})
    })
    const { client } = await createElectronHarness({ authorization, assetRecordAdapter })

    await client.assetRecords[operation](requests[operation])
    expect(events[0]).toBe(`authorize:${capability}`)
    expect(events).toContain(`adapter:${operation}`)
  })

  it.each(operationTable)(
    'denies organization mismatch for %s before existence or IO is disclosed',
    async (operation) => {
      const { client, assetRecordAdapter } = await createElectronHarness()
      const result = await client.assetRecords[operation]({
        ...requests[operation],
        organizationId: 'org-other',
      })

      expect(result).toEqual({
        ok: false,
        error: expect.objectContaining({ code: 'PERMISSION_DENIED', retryable: false }),
      })
      expect(JSON.stringify(result)).not.toMatch(/not.?found|quarantin|path|exist/i)
      expect(assetRecordAdapter[operation]).not.toHaveBeenCalled()
    },
  )

  it('checks generated asset.write authorization before persisting imports', async () => {
    const authorization = createAuthorization()
    const { client, assetRecordAdapter } = await createElectronHarness({ authorization })

    await client.assetRecords.importFile(requests.importFile)

    const capabilities = authorization.authorize.mock.calls.map(([request]) => request.capability)
    expect(capabilities).toEqual(expect.arrayContaining(['project.write', 'asset.write']))
    const assetWrite = authorization.authorize.mock.calls.find(([request]) => request.capability === 'asset.write')?.[0]
    expect(assetWrite).toEqual(
      expect.objectContaining({
        organizationId: SCOPE.organizationId,
        projectId: SCOPE.projectId,
        assetId: expect.stringMatching(/^ast_[0-9a-f-]{36}$/),
      }),
    )
    expect(assetRecordAdapter.importFile).toHaveBeenCalledTimes(1)
  })

  it('maps thrown adapter errors to non-sensitive PlatformResult failures', async () => {
    const assetRecordAdapter = createAssetRecordAdapter()
    assetRecordAdapter.resolve.mockRejectedValueOnce(
      new Error('ENOENT /Users/niko.dev/private token=secret Authorization: Bearer abc'),
    )
    const { client } = await createElectronHarness({ assetRecordAdapter })

    const result = await client.assetRecords.resolve(requests.resolve)
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ retryable: false }),
    })
    expect(JSON.stringify(result)).not.toMatch(/Users|ENOENT|secret|Bearer|Authorization|stack/i)
  })

  it('keeps the legacy assets facade payloads and calls unchanged', async () => {
    const { client, bridge, assetRecordAdapter } = await createElectronHarness()
    const legacyRequest = {
      projectId: SCOPE.projectId,
      fileName: 'legacy.png',
      bytes: new Uint8Array([9, 8, 7]).buffer,
      kind: 'imported',
    }

    const result = await client.assets.importFile(legacyRequest)
    expect(result.ok).toBe(true)
    expect(bridge.assets.importFile).toHaveBeenCalledTimes(1)
    expect(bridge.assets.importFile).toHaveBeenCalledWith(legacyRequest)
    expect(assetRecordAdapter.importFile).not.toHaveBeenCalled()
  })
})
