import { describe, expect, it, vi } from 'vitest'

import { HIGGSFIELD_PROVIDER_MANIFEST } from '../../../electron/catalog/higgsfieldProviderManifest'
import { createBrowserGenerationProvider } from './browserGenerationProvider'
import {
  assertProviderResultEnvelope,
  defineGenerationProviderContract,
  providerRequest,
} from './provider.contract.test'

defineGenerationProviderContract(
  'browser adapter',
  () => createBrowserGenerationProvider(HIGGSFIELD_PROVIDER_MANIFEST),
  'unsupported',
)

describe('browser generation provider', () => {
  it('describes the reviewed manifest without changing provider identity', async () => {
    const provider = createBrowserGenerationProvider(HIGGSFIELD_PROVIDER_MANIFEST)

    const result = await provider.describe()

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toBe(HIGGSFIELD_PROVIDER_MANIFEST)
    expect(result.value).toMatchObject({
      schemaVersion: 'provider-capabilities.v1',
      providerId: 'higgsfield-cli',
      source: {
        product: 'higgsfield',
        cliVersion: '1.1.13',
        evidenceRevision: '11bfed2733870848f3489335c1bf3d91961ccd4a',
      },
    })
  })

  it.each([
    'higgsfield.system.version',
    'higgsfield.generate.create',
    'higgsfield.auth.token',
    'higgsfield.website.publish',
    'higgsfield.future.unreviewed',
  ])('returns typed unsupported for %s without network fallback', async (operationId) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const provider = createBrowserGenerationProvider(HIGGSFIELD_PROVIDER_MANIFEST)
    const request = providerRequest(operationId, {
      idempotencyKey: 'browser-idempotency-secret',
      policyContext: {
        claimIds: ['generation.submit'],
        spendGrantId: 'grant-browser-001',
      },
    })

    const result = await provider.invoke(request)

    assertProviderResultEnvelope(result, request)
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'unsupported',
        message: expect.any(String),
        retryable: false,
      },
      meta: {
        providerId: 'higgsfield-cli',
        manifestVersion: request.manifestVersion,
        operationId: request.operationId,
        requestId: request.requestId,
        remoteState: 'not_started',
        cancellation: 'not_requested',
        ...(result.meta.idempotencyKeyHash ? { idempotencyKeyHash: result.meta.idempotencyKeyHash } : {}),
      },
    })
    expect(JSON.stringify(result)).not.toContain('browser-idempotency-secret')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('does not inspect hostile inputs, credentials, environment, or throwing values', async () => {
    const throwingInput = Object.create(null, {
      credential: {
        enumerable: true,
        get() {
          throw new Error('Bearer browser-raw-secret')
        },
      },
    })
    const provider = createBrowserGenerationProvider(HIGGSFIELD_PROVIDER_MANIFEST)
    const request = providerRequest('higgsfield.generate.create', {
      input: throwingInput,
      idempotencyKey: 'browser-key-must-not-leak',
    })

    await expect(provider.invoke(request)).resolves.toMatchObject({
      ok: false,
      error: { code: 'unsupported', retryable: false },
      meta: { remoteState: 'not_started' },
    })
  })

  it('reports pre-aborted calls as unsupported, not as a successful permission check', async () => {
    const controller = new AbortController()
    controller.abort()
    const request = providerRequest('higgsfield.generate.wait')

    const result = await createBrowserGenerationProvider(HIGGSFIELD_PROVIDER_MANIFEST).invoke(request, {
      signal: controller.signal,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('unsupported')
    expect(result.error.retryable).toBe(false)
    expect(result.meta.remoteState).toBe('not_started')
  })
})
