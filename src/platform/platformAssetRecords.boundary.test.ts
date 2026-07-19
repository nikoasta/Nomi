import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CONTRACTS_URL = new URL('./assets/contracts.ts', import.meta.url)

type ContractsModule = {
  parseAssetRecordBundle(value: unknown): unknown
  serializeAssetRecordBundle(value: unknown): unknown
}

async function loadContracts(): Promise<ContractsModule> {
  const contractsPath = fileURLToPath(CONTRACTS_URL)
  expect(
    existsSync(contractsPath),
    'RED_CONTRACT: boundary serialization scan requires the planned asset contracts module',
  ).toBe(true)
  const source = readFileSync(contractsPath, 'utf8')
  for (const exportName of ['parseAssetRecordBundle', 'serializeAssetRecordBundle']) {
    expect(source, `RED_CONTRACT: boundary serialization requires ${exportName} before module import`).toMatch(
      new RegExp(`\\b${exportName}\\b`),
    )
  }
  return import(/* @vite-ignore */ CONTRACTS_URL.href) as Promise<ContractsModule>
}

const FROZEN_RFC_HASHES = {
  'docs/architecture/everville-media-platform-acceptance-matrix.md':
    '6e2798d63392443f0a6421cbc6e04b236d9338ed900f2707a40db0b611a52d36',
  'docs/architecture/everville-media-platform-cloud-options.md':
    'f8f1196f010a47505b5ccea0368fea12e83fe2ef02e863dbe9d9d94a748c4b95',
  'docs/architecture/everville-media-platform-decision-brief.md':
    'cf25c90aa2310cb885141910cb7a6ec67af2b33b85d57782ce25e0b1cd8752d0',
  'docs/architecture/everville-media-platform-rfc.md':
    '8a3be9f1a3285ac94ba6b21e220684ee71841797c1b0a1b990559c66998816e2',
  'docs/architecture/everville-media-platform-runtime-audit.md':
    '84b06c1cbf50e3e15494e3261da51c214a2cd2d06748a575dd089904ce74cd77',
  'docs/architecture/everville-media-platform-security-data.md':
    '61c8c195b1a6064fb84b1bdd16b249c18694d8838d676493fc42f6ffdb273c35',
} as const

const PLANNED_DOMAIN_MODULES = ['src/platform/assets/contracts.ts', 'src/platform/assets/runtime.ts'] as const

const WORKBENCH_LEGACY_CONSUMERS = [
  'src/workbench/api/assetUploadApi.ts',
  'src/workbench/assets/useAllProjectAssets.ts',
  'src/workbench/assets/assetTypes.ts',
  'src/workbench/assets/AssetLibraryPanel.tsx',
  'src/workbench/assets/AssetTile.tsx',
] as const

function read(relativePath: string): string {
  const absolutePath = join(REPO_ROOT, relativePath)
  expect(
    existsSync(absolutePath),
    `RED_CONTRACT: static asset boundary requires ${relativePath} before it can be scanned`,
  ).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

function sha256(relativePath: string): string {
  return createHash('sha256')
    .update(readFileSync(join(REPO_ROOT, relativePath)))
    .digest('hex')
}

function filesBelow(relativeDirectory: string): string[] {
  const absoluteDirectory = join(REPO_ROOT, relativeDirectory)
  if (!existsSync(absoluteDirectory)) return []

  return readdirSync(absoluteDirectory).flatMap((entry) => {
    const absolute = join(absoluteDirectory, entry)
    const projectRelative = relative(REPO_ROOT, absolute)
    return statSync(absolute).isDirectory() ? filesBelow(projectRelative) : [projectRelative]
  })
}

function canonicalFixture() {
  const createdAt = '2026-07-18T01:02:03.000Z'
  const scope = { organizationId: 'org-everville', projectId: 'project-alpha' }
  const assetId = 'ast_123e4567-e89b-42d3-a456-426614174000'
  return {
    asset: {
      schemaVersion: 'asset.v1',
      id: assetId,
      scope,
      createdAt,
      createdByPrincipalId: 'principal-niko',
    },
    version: {
      schemaVersion: 'asset-version.v1',
      id: 'av_123e4567-e89b-42d3-a456-426614174000',
      assetId,
      scope,
      predecessorVersionId: null,
      derivedFromVersionIds: [],
      integrity: {
        algorithm: 'sha256',
        digest: 'a'.repeat(64),
        sizeBytes: 4,
        mediaType: 'image/png',
      },
      classification: 'internal',
      validation: {
        state: 'validated',
        validatedAt: createdAt,
        validator: 'electron-local-v1',
        reasonCodes: [],
      },
      provenance: {
        kind: 'imported',
        method: 'file',
        recordedAt: createdAt,
        actorPrincipalId: 'principal-niko',
        originalName: 'frame.png',
      },
      createdAt,
      createdByPrincipalId: 'principal-niko',
    },
  }
}

function walkJson(value: unknown, visit: (key: string | null, value: unknown) => void) {
  const queue: Array<{ key: string | null; value: unknown }> = [{ key: null, value }]
  while (queue.length > 0) {
    const current = queue.shift()!
    visit(current.key, current.value)
    if (Array.isArray(current.value)) {
      current.value.forEach((item) => queue.push({ key: null, value: item }))
    } else if (current.value && typeof current.value === 'object') {
      Object.entries(current.value).forEach(([key, child]) => queue.push({ key, value: child }))
    }
  }
}

describe('platform asset-record static boundary', () => {
  it('has every planned runtime-neutral domain module before scanning it', () => {
    expect(
      PLANNED_DOMAIN_MODULES.filter((path) => !existsSync(join(REPO_ROOT, path))),
      'RED_CONTRACT: all planned asset domain modules must exist before static dependency scans',
    ).toEqual([])
  })

  it('keeps domain contracts free of Electron, Node, cloud, storage, and auth vendor imports', () => {
    const forbiddenImports = [
      /from\s+['"](?:node:)?(?:fs|path|crypto|os|stream|net|child_process)['"]/,
      /from\s+['"]electron['"]/,
      /from\s+['"](?:@supabase|@aws-sdk|firebase|firebase-admin|@google-cloud|@azure|vercel|cloudflare)/,
      /require\(\s*['"](?:electron|node:|fs|path|@supabase|@aws-sdk|firebase|@google-cloud|@azure)/,
    ]

    for (const relativePath of PLANNED_DOMAIN_MODULES) {
      const source = read(relativePath)
      for (const pattern of forbiddenImports) {
        expect(source, `${relativePath} crossed the runtime-neutral import boundary: ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it('introduces no cloud SDK, migration, RLS, or selected storage topology in the asset slice', () => {
    const sourceFiles = [
      ...filesBelow('src/platform/assets'),
      'src/platform/client.ts',
      'src/platform/browserPlatformClient.ts',
      'src/platform/electronPlatformClient.ts',
      'electron/assets/assetIdentity.ts',
      'electron/assets/projectAssetStore.ts',
    ].filter((path) => existsSync(join(REPO_ROOT, path)) && ['.ts', '.tsx'].includes(extname(path)))
    const forbidden = [
      /@supabase|createClient\s*\(/i,
      /@aws-sdk|S3Client|PutObjectCommand/i,
      /firebase-admin|@google-cloud\/storage/i,
      /@azure\/storage|BlobServiceClient/i,
      /CREATE\s+(?:TABLE|POLICY)|ALTER\s+TABLE|ENABLE\s+ROW\s+LEVEL\s+SECURITY/i,
      /\b(?:bucketName|cloudRegion|signedUrlTtl|cdnHost)\s*[:=]/i,
    ]

    for (const relativePath of sourceFiles) {
      const source = read(relativePath)
      for (const pattern of forbidden) {
        expect(source, `${relativePath} selected forbidden parent-scope infrastructure`).not.toMatch(pattern)
      }
    }
  })

  it('serializes canonical fixtures without locators, storage coordinates, or secrets', async () => {
    const contracts = await loadContracts()
    const serialized = contracts.serializeAssetRecordBundle(contracts.parseAssetRecordBundle(canonicalFixture()))
    const forbiddenKey =
      /^(?:url|uri|locator|path|absolutePath|relativePath|bucket|bucketKey|objectKey|credential|authorization|headers|cookie|token|secret|rawPrompt|prompt|rawResponse|rawPayload|providerResponse|stack)$/i
    const forbiddenValue =
      /(?:nomi-local:|file:|blob:|https?:\/\/|[?&](?:signature|token|credential)=|(?:^|\/)\.\.(?:\/|$)|^\/(?:Users|home|tmp)\/)/i

    walkJson(serialized, (key, value) => {
      if (key !== null) expect(key).not.toMatch(forbiddenKey)
      if (typeof value === 'string') expect(value).not.toMatch(forbiddenValue)
    })
  })

  it('keeps workbench import, list, and display consumers on the legacy asset surface', () => {
    for (const relativePath of WORKBENCH_LEGACY_CONSUMERS) {
      const source = read(relativePath)
      expect(source, `${relativePath} must not migrate in evmedia-r20.8.1`).not.toMatch(/assetRecords/)
    }

    expect(read('src/workbench/api/assetUploadApi.ts')).toMatch(/\.assets\.(?:importFile|importRemoteUrl)/)
    expect(read('src/workbench/assets/useAllProjectAssets.ts')).toMatch(/\.assets\.list/)
    expect(read('src/workbench/assets/assetTypes.ts')).toMatch(/renderUrl/)
    expect(read('src/workbench/assets/AssetTile.tsx')).toMatch(/renderUrl/)
  })

  it('does not add generic IPC, arbitrary filesystem methods, or new asset channels', () => {
    const preload = read('electron/preload.ts')
    const main = read('electron/main.ts')
    const bridge = read('src/desktop/bridge.ts')
    const combined = `${preload}\n${main}\n${bridge}`

    expect(combined).not.toMatch(/asset-records|assetRecords|nomi:asset-records:/)
    expect(combined).not.toMatch(/(?:read|write|list)Arbitrary(?:File|Path)|genericIpc|invokeAny/)
  })

  it('keeps all six unapproved RFC drafts byte-for-byte frozen', () => {
    for (const [relativePath, expectedHash] of Object.entries(FROZEN_RFC_HASHES)) {
      expect(existsSync(join(REPO_ROOT, relativePath)), `${relativePath} must exist`).toBe(true)
      expect(sha256(relativePath), `${relativePath} is frozen and unapproved`).toBe(expectedHash)
    }
  })

  it('keeps forbidden persisted field names out of domain type declarations', () => {
    const contracts = read('src/platform/assets/contracts.ts')
    const recordDeclarations = contracts.slice(contracts.indexOf('AssetRecord'), contracts.indexOf('AssetResolution'))

    expect(recordDeclarations).not.toMatch(
      /\b(?:url|uri|locator|absolutePath|relativePath|bucket|objectKey|credential|authorization|headers|cookie|token|rawPrompt|rawResponse|rawPayload|providerResponse)\s*[?:]/i,
    )
  })
})
