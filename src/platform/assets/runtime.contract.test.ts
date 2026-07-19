import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const RUNTIME_URL = new URL('./runtime.ts', import.meta.url)
const CONTRACTS_URL = new URL('./contracts.ts', import.meta.url)

type RuntimeModule = {
  assertResolvableAssetVersion(bundle: unknown, request: unknown): unknown
  createElectronAssetResolution(input: { bundle: unknown; request: unknown; url: string }): Record<string, unknown>
  assertNoPersistedRuntimeLocator(value: unknown): void
}

type ContractsModule = {
  serializeAssetRecordBundle(value: unknown): unknown
}

async function loadRuntime(): Promise<RuntimeModule> {
  const runtimePath = fileURLToPath(RUNTIME_URL)
  expect(
    existsSync(runtimePath),
    'RED_CONTRACT: ephemeral asset runtime resolution module must exist before import',
  ).toBe(true)
  const source = readFileSync(runtimePath, 'utf8')
  for (const exportName of [
    'assertResolvableAssetVersion',
    'createElectronAssetResolution',
    'assertNoPersistedRuntimeLocator',
  ]) {
    expect(source, `RED_CONTRACT: runtime resolution contract must declare ${exportName} before module import`).toMatch(
      new RegExp(`\\b${exportName}\\b`),
    )
  }
  return import(/* @vite-ignore */ RUNTIME_URL.href) as Promise<RuntimeModule>
}

async function loadContracts(): Promise<ContractsModule> {
  const contractsPath = fileURLToPath(CONTRACTS_URL)
  expect(
    existsSync(contractsPath),
    'RED_CONTRACT: asset serializer must exist before runtime persistence is tested',
  ).toBe(true)
  expect(
    readFileSync(contractsPath, 'utf8'),
    'RED_CONTRACT: asset serializer must declare serializeAssetRecordBundle before module import',
  ).toMatch(/\bserializeAssetRecordBundle\b/)
  return import(/* @vite-ignore */ CONTRACTS_URL.href) as Promise<ContractsModule>
}

const ASSET_ID = 'ast_123e4567-e89b-42d3-a456-426614174000'
const VERSION_ID = 'av_123e4567-e89b-42d3-a456-426614174000'
const SCOPE = { organizationId: 'org-everville', projectId: 'project-alpha' } as const
const CREATED_AT = '2026-07-18T01:02:03.000Z'
const INTEGRITY = {
  algorithm: 'sha256',
  digest: 'a'.repeat(64),
  sizeBytes: 4,
  mediaType: 'image/png',
} as const

function bundleForValidation(validation: unknown) {
  return {
    asset: {
      schemaVersion: 'asset.v1',
      id: ASSET_ID,
      scope: { ...SCOPE },
      createdAt: CREATED_AT,
      createdByPrincipalId: 'principal-niko',
    },
    version: {
      schemaVersion: 'asset-version.v1',
      id: VERSION_ID,
      assetId: ASSET_ID,
      scope: { ...SCOPE },
      predecessorVersionId: null,
      derivedFromVersionIds: [],
      integrity: { ...INTEGRITY },
      classification: 'internal',
      validation,
      provenance: {
        kind: 'imported',
        method: 'file',
        recordedAt: CREATED_AT,
        actorPrincipalId: 'principal-niko',
        originalName: 'frame.png',
      },
      createdAt: CREATED_AT,
      createdByPrincipalId: 'principal-niko',
    },
  }
}

function request(overrides: Record<string, unknown> = {}) {
  return {
    ...SCOPE,
    assetId: ASSET_ID,
    versionId: VERSION_ID,
    purpose: 'display',
    ...overrides,
  }
}

const validatedBundle = () =>
  bundleForValidation({
    state: 'validated',
    validatedAt: CREATED_AT,
    validator: 'electron-local-v1',
    reasonCodes: [],
  })

describe('asset runtime resolution contract', () => {
  it('resolves a validated local version to an ephemeral Electron locator', async () => {
    const runtime = await loadRuntime()
    const resolution = runtime.createElectronAssetResolution({
      bundle: validatedBundle(),
      request: request(),
      url: 'nomi-local://asset/project-alpha/imported/frame.png',
    })

    expect(
      resolution,
      'RED_CONTRACT: validated Electron resolution must bind identity, scope, purpose, and integrity',
    ).toEqual({
      schemaVersion: 'asset-resolution.v1',
      assetId: ASSET_ID,
      versionId: VERSION_ID,
      scope: SCOPE,
      purpose: 'display',
      integrity: INTEGRITY,
      locator: {
        kind: 'runtime-url',
        runtime: 'electron',
        url: 'nomi-local://asset/project-alpha/imported/frame.png',
        expiresAt: null,
      },
    })
  })

  it.each([['display'], ['download'], ['provider-input']] as const)(
    'binds the locator to purpose %s',
    async (purpose) => {
      const runtime = await loadRuntime()
      const resolution = runtime.createElectronAssetResolution({
        bundle: validatedBundle(),
        request: request({ purpose }),
        url: 'nomi-local://asset/project-alpha/imported/frame.png',
      })

      expect(resolution.purpose).toBe(purpose)
      expect((resolution.locator as { runtime: string }).runtime).toBe('electron')
    },
  )

  it.each([
    ['pending', { state: 'pending', reasonCodes: ['VALIDATION_PENDING'] }],
    [
      'quarantined',
      {
        state: 'quarantined',
        validatedAt: CREATED_AT,
        validator: 'electron-local-v1',
        reasonCodes: ['DIGEST_MISMATCH'],
      },
    ],
    [
      'rejected',
      {
        state: 'rejected',
        validatedAt: CREATED_AT,
        validator: 'electron-local-v1',
        reasonCodes: ['MIME_MISMATCH'],
      },
    ],
    ['legacy-unverified', { state: 'legacy-unverified', reasonCodes: ['LEGACY_FACTS_UNKNOWN'] }],
  ] as const)('does not resolve %s records', async (_state, validation) => {
    const runtime = await loadRuntime()
    expect(() => runtime.assertResolvableAssetVersion(bundleForValidation(validation), request())).toThrow()
    expect(() =>
      runtime.createElectronAssetResolution({
        bundle: bundleForValidation(validation),
        request: request(),
        url: 'nomi-local://asset/project-alpha/imported/frame.png',
      }),
    ).toThrow()
  })

  it.each([
    { organizationId: 'org-other' },
    { projectId: 'project-other' },
    { assetId: 'ast_223e4567-e89b-42d3-a456-426614174000' },
    { versionId: 'av_223e4567-e89b-42d3-a456-426614174000' },
  ])('rejects mismatched resolution binding %#', async (mismatch) => {
    const runtime = await loadRuntime()
    expect(() => runtime.assertResolvableAssetVersion(validatedBundle(), request(mismatch))).toThrow()
  })

  it.each([
    'file:///Users/niko.dev/project/frame.png',
    'blob:https://example.test/uuid',
    'https://provider.example.test/output.png?signature=secret',
    '/Users/niko.dev/project/frame.png',
    '../assets/imported/frame.png',
  ])('rejects non-Electron or persistent locator %s', async (url) => {
    const runtime = await loadRuntime()
    expect(() =>
      runtime.createElectronAssetResolution({
        bundle: validatedBundle(),
        request: request(),
        url,
      }),
    ).toThrow()
  })

  it('does not let a runtime resolution enter a domain bundle', async () => {
    const runtime = await loadRuntime()
    const contracts = await loadContracts()
    const bundle = validatedBundle()
    const resolution = runtime.createElectronAssetResolution({
      bundle,
      request: request(),
      url: 'nomi-local://asset/project-alpha/imported/frame.png',
    })

    expect(() => runtime.assertNoPersistedRuntimeLocator({ ...bundle, resolution })).toThrow()
    expect(() => contracts.serializeAssetRecordBundle({ ...bundle, resolution })).toThrow()
    expect(JSON.stringify(contracts.serializeAssetRecordBundle(bundle))).not.toMatch(
      /nomi-local:|file:|blob:|(?:absolute|relative)Path|locator|url/i,
    )
  })

  it('returns a fresh purpose-bound result without mutating the domain record', async () => {
    const runtime = await loadRuntime()
    const bundle = validatedBundle()
    const before = JSON.stringify(bundle)

    const display = runtime.createElectronAssetResolution({
      bundle,
      request: request({ purpose: 'display' }),
      url: 'nomi-local://asset/project-alpha/imported/frame.png',
    })
    const download = runtime.createElectronAssetResolution({
      bundle,
      request: request({ purpose: 'download' }),
      url: 'nomi-local://asset/project-alpha/imported/frame.png',
    })

    expect(display).not.toBe(download)
    expect(display.purpose).toBe('display')
    expect(download.purpose).toBe('download')
    expect(JSON.stringify(bundle)).toBe(before)
  })

  it('rejects changed integrity instead of issuing a locator', async () => {
    const runtime = await loadRuntime()
    const bundle = validatedBundle()
    bundle.version.integrity.digest = 'b'.repeat(64)

    expect(() =>
      runtime.createElectronAssetResolution({
        bundle,
        request: request({ expectedIntegrity: INTEGRITY }),
        url: 'nomi-local://asset/project-alpha/imported/frame.png',
      }),
    ).toThrow()
  })
})
