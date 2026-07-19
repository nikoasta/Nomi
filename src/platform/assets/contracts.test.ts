import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const CONTRACTS_URL = new URL('./contracts.ts', import.meta.url)

type ContractsModule = {
  ASSET_RECORD_CAPABILITIES: readonly string[]
  parseAssetId(value: unknown): string
  parseAssetVersionId(value: unknown): string
  parseAssetRecordBundle(value: unknown): unknown
  serializeAssetRecordBundle(value: unknown): unknown
  parseAssetRecordImportFileRequest(value: unknown): unknown
  parseAssetRecordImportRemoteUrlRequest(value: unknown): unknown
  validateAssetRecordGraph(value: readonly unknown[]): unknown
}

async function loadContracts(): Promise<ContractsModule> {
  const contractsPath = fileURLToPath(CONTRACTS_URL)
  expect(
    existsSync(contractsPath),
    'RED_CONTRACT: asset domain contracts module must exist before its exports are loaded',
  ).toBe(true)
  const source = readFileSync(contractsPath, 'utf8')
  for (const exportName of [
    'ASSET_RECORD_CAPABILITIES',
    'parseAssetId',
    'parseAssetVersionId',
    'parseAssetRecordBundle',
    'serializeAssetRecordBundle',
    'parseAssetRecordImportFileRequest',
    'parseAssetRecordImportRemoteUrlRequest',
    'validateAssetRecordGraph',
  ]) {
    expect(source, `RED_CONTRACT: asset domain contracts must declare ${exportName} before module import`).toMatch(
      new RegExp(`\\b${exportName}\\b`),
    )
  }

  return import(/* @vite-ignore */ CONTRACTS_URL.href) as Promise<ContractsModule>
}

const IDS = {
  asset: 'ast_123e4567-e89b-42d3-a456-426614174000',
  assetTwo: 'ast_223e4567-e89b-42d3-a456-426614174000',
  version: 'av_123e4567-e89b-42d3-a456-426614174000',
  versionTwo: 'av_223e4567-e89b-42d3-a456-426614174000',
  versionThree: 'av_323e4567-e89b-42d3-a456-426614174000',
} as const

const SCOPE = { organizationId: 'org-everville', projectId: 'project-alpha' } as const
const CREATED_AT = '2026-07-18T01:02:03.000Z'
const DIGEST = 'a'.repeat(64)

function importedBundle(overrides: Record<string, unknown> = {}) {
  return {
    asset: {
      schemaVersion: 'asset.v1',
      id: IDS.asset,
      scope: { ...SCOPE },
      createdAt: CREATED_AT,
      createdByPrincipalId: 'principal-niko',
    },
    version: {
      schemaVersion: 'asset-version.v1',
      id: IDS.version,
      assetId: IDS.asset,
      scope: { ...SCOPE },
      predecessorVersionId: null,
      derivedFromVersionIds: [],
      integrity: {
        algorithm: 'sha256',
        digest: DIGEST,
        sizeBytes: 4,
        mediaType: 'image/png',
      },
      classification: 'internal',
      validation: {
        state: 'validated',
        validatedAt: CREATED_AT,
        validator: 'electron-local-v1',
        reasonCodes: [],
      },
      provenance: {
        kind: 'imported',
        method: 'file',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        originalName: 'frame.png',
      },
      createdAt: CREATED_AT,
      createdByPrincipalId: 'principal-niko',
      ...overrides,
    },
  }
}

function generatedBundle() {
  return importedBundle({
    provenance: {
      kind: 'generated',
      recordedAt: CREATED_AT,
      actorPrincipalId: 'principal-niko',
      providerId: 'higgsfield',
      modelId: 'model-v1',
      operationId: 'operation-7',
      providerRequestId: 'provider-request-9',
      promptRef: 'prompt-ref-4',
      promptDigest: 'b'.repeat(64),
    },
  })
}

describe('asset record contracts', () => {
  it('declares the distinct asset-record capabilities in stable order', async () => {
    const contracts = await loadContracts()

    expect(
      contracts.ASSET_RECORD_CAPABILITIES,
      'RED_CONTRACT: asset record capabilities must be separate from the legacy assets facade',
    ).toEqual([
      'asset-records.list',
      'asset-records.import-file',
      'asset-records.import-remote-url',
      'asset-records.resolve',
    ])
  })

  it('round-trips a canonical bundle through fresh allowlisted JSON', async () => {
    const contracts = await loadContracts()
    const source = importedBundle()
    const parsed = contracts.parseAssetRecordBundle(source)
    const serialized = contracts.serializeAssetRecordBundle(parsed)

    expect(serialized).toEqual(source)
    expect(serialized).not.toBe(source)
    expect((serialized as typeof source).asset).not.toBe(source.asset)
    expect((serialized as typeof source).version).not.toBe(source.version)

    source.version.integrity.digest = 'b'.repeat(64)
    expect((serialized as typeof source).version.integrity.digest).toBe(DIGEST)
  })

  it.each([IDS.asset, 'ast_00000000-0000-4000-8000-000000000000'])(
    'accepts canonical opaque asset ID %s',
    async (id) => {
      const contracts = await loadContracts()
      expect(contracts.parseAssetId(id)).toBe(id)
    },
  )

  it.each([IDS.version, 'av_00000000-0000-4000-8000-000000000000'])(
    'accepts canonical opaque version ID %s',
    async (id) => {
      const contracts = await loadContracts()
      expect(contracts.parseAssetVersionId(id)).toBe(id)
    },
  )

  it.each([
    '',
    'ast_',
    IDS.version,
    'ast_123E4567-E89B-42D3-A456-426614174000',
    'ast_123e4567-e89b-12d3-a456-426614174000',
    'ast_123e4567-e89b-42d3-c456-426614174000',
    'ast_../project/asset',
    'ast_%2e%2e%2fsecret',
    'ast_https://example.test/asset',
    'ast_file:///tmp/asset',
    'ast_123e4567-e89b-42d3-a456-426614174000/child',
    'ast_123e4567-e89b-42d3-a456-426614174000\\child',
    ' ast_123e4567-e89b-42d3-a456-426614174000',
    'ast_123e4567-e89b-42d3-a456-426614174000\u0000',
    `ast_${'a'.repeat(1024)}`,
  ])('rejects hostile or non-canonical asset ID %j', async (id) => {
    const contracts = await loadContracts()
    expect(() => contracts.parseAssetId(id)).toThrow()
  })

  it.each([
    '',
    IDS.asset,
    'av_../version',
    'av_%2fetc%2fpasswd',
    'av_blob:https://example.test/id',
    'av_123e4567-e89b-42d3-a456-426614174000\n',
    `av_${'f'.repeat(1024)}`,
  ])('rejects hostile or wrong-prefix version ID %j', async (id) => {
    const contracts = await loadContracts()
    expect(() => contracts.parseAssetVersionId(id)).toThrow()
  })

  it('accepts every truthful provenance variant', async () => {
    const contracts = await loadContracts()
    const imported = importedBundle()
    const generated = generatedBundle()
    const derived = importedBundle({
      id: IDS.versionTwo,
      derivedFromVersionIds: [IDS.version],
      provenance: {
        kind: 'derived',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        operation: 'crop',
        sourceVersionIds: [IDS.version],
      },
    })
    const legacy = importedBundle({
      validation: { state: 'legacy-unverified', reasonCodes: ['LEGACY_FACTS_UNKNOWN'] },
      provenance: {
        kind: 'legacy-unverified',
        recordedAt: CREATED_AT,
        actorPrincipalId: null,
        unknownFacts: ['actor', 'source', 'integrity-history'],
      },
      createdByPrincipalId: null,
    })

    for (const fixture of [imported, generated, derived, legacy]) {
      expect(contracts.serializeAssetRecordBundle(contracts.parseAssetRecordBundle(fixture))).toEqual(fixture)
    }
  })

  it.each([
    { integrity: { algorithm: 'sha256', digest: 'A'.repeat(64), sizeBytes: 4, mediaType: 'image/png' } },
    { integrity: { algorithm: 'sha256', digest: 'a'.repeat(63), sizeBytes: 4, mediaType: 'image/png' } },
    { integrity: { algorithm: 'sha1', digest: DIGEST, sizeBytes: 4, mediaType: 'image/png' } },
    { integrity: { algorithm: 'sha256', digest: DIGEST, sizeBytes: -1, mediaType: 'image/png' } },
    { integrity: { algorithm: 'sha256', digest: DIGEST, sizeBytes: 1.5, mediaType: 'image/png' } },
    { integrity: { algorithm: 'sha256', digest: DIGEST, sizeBytes: 4, mediaType: 'Image/PNG' } },
    { integrity: { algorithm: 'sha256', digest: DIGEST, sizeBytes: 4, mediaType: 'image/png; charset=utf-8' } },
  ])('rejects non-canonical integrity %#', async (override) => {
    const contracts = await loadContracts()
    expect(() => contracts.parseAssetRecordBundle(importedBundle(override))).toThrow()
  })

  it('requires exact asset/version scope and ownership', async () => {
    const contracts = await loadContracts()

    expect(() =>
      contracts.parseAssetRecordBundle(importedBundle({ scope: { ...SCOPE, projectId: 'project-other' } })),
    ).toThrow()
    expect(() => contracts.parseAssetRecordBundle(importedBundle({ assetId: IDS.assetTwo }))).toThrow()
  })

  it('keeps version identity immutable when bytes or metadata changes', async () => {
    const contracts = await loadContracts()
    const first = importedBundle()
    const reusedVersionChanges = [
      { integrity: { ...first.version.integrity, digest: 'b'.repeat(64) } },
      { integrity: { ...first.version.integrity, mediaType: 'application/octet-stream' } },
      { classification: 'restricted' },
      {
        provenance: {
          ...first.version.provenance,
          method: 'remote',
          originalName: 'remote-frame.png',
        },
      },
      { predecessorVersionId: IDS.versionTwo },
      { derivedFromVersionIds: [IDS.versionTwo] },
    ]

    for (const change of reusedVersionChanges) {
      expect(() => contracts.validateAssetRecordGraph([first, importedBundle(change)])).toThrow()
    }
  })

  it('validates predecessors and canonical derivation lineage', async () => {
    const contracts = await loadContracts()
    const first = importedBundle()
    const second = importedBundle({
      id: IDS.versionTwo,
      predecessorVersionId: IDS.version,
      integrity: { ...first.version.integrity, digest: 'b'.repeat(64) },
    })
    const derived = importedBundle({
      id: IDS.versionThree,
      predecessorVersionId: IDS.versionTwo,
      derivedFromVersionIds: [IDS.version, IDS.versionTwo],
      integrity: { ...first.version.integrity, digest: 'c'.repeat(64) },
      provenance: {
        kind: 'derived',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        operation: 'composite',
        sourceVersionIds: [IDS.version, IDS.versionTwo],
      },
    })

    expect(contracts.validateAssetRecordGraph([first, second, derived])).toBeDefined()
  })

  it.each([
    [IDS.version, IDS.version],
    [IDS.versionTwo, IDS.versionTwo],
  ])('rejects duplicate derivation IDs', async (firstSource, secondSource) => {
    const contracts = await loadContracts()
    const bundle = importedBundle({
      id: IDS.versionThree,
      derivedFromVersionIds: [firstSource, secondSource],
      provenance: {
        kind: 'derived',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        operation: 'composite',
        sourceVersionIds: [firstSource, secondSource],
      },
    })
    expect(() => contracts.validateAssetRecordGraph([importedBundle(), bundle])).toThrow()
  })

  it('rejects cross-asset predecessors, self-reference, and transitive cycles', async () => {
    const contracts = await loadContracts()
    const otherAsset = importedBundle({ id: IDS.versionTwo })
    otherAsset.asset.id = IDS.assetTwo
    otherAsset.version.assetId = IDS.assetTwo

    const crossAsset = importedBundle({
      id: IDS.versionThree,
      predecessorVersionId: IDS.versionTwo,
    })
    expect(() => contracts.validateAssetRecordGraph([otherAsset, crossAsset])).toThrow()

    const self = importedBundle({ predecessorVersionId: IDS.version })
    expect(() => contracts.validateAssetRecordGraph([self])).toThrow()

    const a = importedBundle({ id: IDS.version, predecessorVersionId: IDS.versionTwo })
    const b = importedBundle({ id: IDS.versionTwo, predecessorVersionId: IDS.version })
    expect(() => contracts.validateAssetRecordGraph([a, b])).toThrow()
  })

  it('rejects cross-scope derivations and direct or transitive derivation cycles', async () => {
    const contracts = await loadContracts()
    const crossScopeSource = importedBundle({ id: IDS.versionTwo })
    crossScopeSource.asset.scope.projectId = 'project-other'
    crossScopeSource.version.scope.projectId = 'project-other'
    const crossScopeDerived = importedBundle({
      id: IDS.versionThree,
      derivedFromVersionIds: [IDS.versionTwo],
      provenance: {
        kind: 'derived',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        operation: 'crop',
        sourceVersionIds: [IDS.versionTwo],
      },
    })
    expect(() => contracts.validateAssetRecordGraph([crossScopeSource, crossScopeDerived])).toThrow()

    const derivedA = importedBundle({
      id: IDS.version,
      derivedFromVersionIds: [IDS.versionTwo],
      provenance: {
        kind: 'derived',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        operation: 'cycle-a',
        sourceVersionIds: [IDS.versionTwo],
      },
    })
    const derivedB = importedBundle({
      id: IDS.versionTwo,
      derivedFromVersionIds: [IDS.version],
      provenance: {
        kind: 'derived',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        operation: 'cycle-b',
        sourceVersionIds: [IDS.version],
      },
    })
    expect(() => contracts.validateAssetRecordGraph([derivedA, derivedB])).toThrow()
  })

  it('requires derived provenance sources to exactly match canonical lineage', async () => {
    const contracts = await loadContracts()
    const bundle = importedBundle({
      id: IDS.versionThree,
      derivedFromVersionIds: [IDS.version, IDS.versionTwo],
      provenance: {
        kind: 'derived',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        operation: 'composite',
        sourceVersionIds: [IDS.versionTwo],
      },
    })

    expect(() => contracts.parseAssetRecordBundle(bundle)).toThrow()
  })

  it.each([
    ['asset', 'unexpected', true],
    ['version', 'url', 'nomi-local://asset/project/file.png'],
    ['version', 'absolutePath', '/Users/niko.dev/private.png'],
    ['version', 'bucketKey', 'tenant/project/file.png'],
    ['version', 'runtimeLocator', { url: 'file:///tmp/asset' }],
    ['version', 'rawProviderResponse', { authorization: 'Bearer secret' }],
  ])('rejects unknown or transient field %s.%s', async (owner, key, value) => {
    const contracts = await loadContracts()
    const bundle = importedBundle() as Record<string, Record<string, unknown>>
    bundle[owner][key] = value
    expect(() => contracts.parseAssetRecordBundle(bundle)).toThrow()
  })

  it.each([
    { id: IDS.asset },
    { digest: DIGEST },
    { sizeBytes: 4 },
    { mediaType: 'image/png' },
    { validation: { state: 'validated' } },
    { validator: 'electron-local-v1' },
    { createdAt: CREATED_AT },
    { actorPrincipalId: 'principal-forged' },
    { runtimeLocator: 'nomi-local://asset/project/file.png' },
    { sidecarPath: '../../asset.meta.json' },
  ])('rejects forged trusted file-import field %# before IO', async (forged) => {
    const contracts = await loadContracts()
    const request = {
      ...SCOPE,
      fileName: 'frame.png',
      claimedMediaType: 'image/png',
      bytes: new Uint8Array([1, 2, 3, 4]).buffer,
      classification: 'internal',
      idempotencyKey: 'import-frame-1',
      ...forged,
    }
    expect(() => contracts.parseAssetRecordImportFileRequest(request)).toThrow()
  })

  it('keeps a remote URL transient and rejects trusted or secret-bearing additions', async () => {
    const contracts = await loadContracts()
    const valid = {
      ...SCOPE,
      url: 'https://media.example.test/frame.png',
      fileName: 'frame.png',
      claimedMediaType: 'image/png',
      classification: 'confidential',
      idempotencyKey: 'remote-frame-1',
    }
    expect(contracts.parseAssetRecordImportRemoteUrlRequest(valid)).toBeDefined()

    for (const forged of [
      { authorization: 'Bearer secret' },
      { headers: { cookie: 'session=secret' } },
      { providerResponse: { token: 'secret' } },
      { prompt: 'use API_KEY=secret' },
    ]) {
      expect(() => contracts.parseAssetRecordImportRemoteUrlRequest({ ...valid, ...forged })).toThrow()
    }
  })

  it.each([
    { validation: { state: 'pending', reasonCodes: ['raw exception text with spaces'] } },
    { validation: { state: 'pending', reasonCodes: ['X'.repeat(1024)] } },
    { createdAt: 'not-a-date' },
    { schemaVersion: 'asset-version.v2' },
    { classification: 'top-secret' },
    { provenance: { kind: 'unknown' } },
  ])('rejects malformed, unbounded, or unknown record data %#', async (override) => {
    const contracts = await loadContracts()
    expect(() => contracts.parseAssetRecordBundle(importedBundle(override))).toThrow()
  })

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, 1n, () => 'not-json'])(
    'rejects non-JSON value %s anywhere in a persisted record',
    async (value) => {
      const contracts = await loadContracts()
      expect(() =>
        contracts.serializeAssetRecordBundle({
          ...importedBundle(),
          injected: { nested: [value] },
        }),
      ).toThrow()
    },
  )

  it('recursively bans locators, storage coordinates, and secret-bearing payloads', async () => {
    const contracts = await loadContracts()
    const forbiddenValues = [
      'nomi-local://asset/project/file.png',
      'file:///tmp/file.png',
      'blob:https://example.test/uuid',
      'https://provider.example.test/output?X-Amz-Signature=secret',
      '/Users/niko.dev/private/file.png',
      '../assets/imported/file.png',
    ]
    const forbiddenKeys = [
      'url',
      'absolutePath',
      'relativePath',
      'bucket',
      'objectKey',
      'credential',
      'authorization',
      'headers',
      'cookie',
      'token',
      'rawPrompt',
      'rawResponse',
      'rawPayload',
      'providerResponse',
      'stack',
    ]

    for (const value of forbiddenValues) {
      expect(() =>
        contracts.serializeAssetRecordBundle({
          ...generatedBundle(),
          injected: { nested: [{ value }] },
        }),
      ).toThrow()
    }
    for (const key of forbiddenKeys) {
      expect(() =>
        contracts.serializeAssetRecordBundle({
          ...generatedBundle(),
          injected: { nested: [{ [key]: 'secret' }] },
        }),
      ).toThrow()
    }
  })
})
