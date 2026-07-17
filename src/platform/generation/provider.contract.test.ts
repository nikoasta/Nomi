import { describe, expect, it } from 'vitest'

import './provider'
import type {
  GenerationProviderExtension,
  ProviderCapabilityManifest,
  ProviderInvokeRequest,
  ProviderResult,
} from './provider'

export const CONTRACT_MANIFEST_VERSION = 'higgsfield-cli-1.1.13@1'

export function providerRequest(
  operationId: string,
  overrides: Partial<ProviderInvokeRequest> = {},
): ProviderInvokeRequest {
  return {
    requestId: 'request-contract-001',
    manifestVersion: CONTRACT_MANIFEST_VERSION,
    operationId,
    input: {},
    policyContext: { claimIds: [] },
    ...overrides,
  } as ProviderInvokeRequest
}

function assertMeta(result: ProviderResult<unknown>, request: ProviderInvokeRequest) {
  expect(result.meta).toMatchObject({
    providerId: 'higgsfield-cli',
    manifestVersion: request.manifestVersion,
    operationId: request.operationId,
    requestId: request.requestId,
  })
  expect(['not_started', 'accepted', 'terminal', 'unknown']).toContain(result.meta.remoteState)
  expect(['not_requested', 'before_start', 'local_wait_stopped']).toContain(result.meta.cancellation)
  expect(result.meta).not.toHaveProperty('idempotencyKey')
}

export function assertProviderResultEnvelope(result: ProviderResult<unknown>, request: ProviderInvokeRequest) {
  assertMeta(result, request)
  if (result.ok) {
    expect(result).toEqual({
      ok: true,
      value: result.value,
      meta: result.meta,
    })
    expect(result).not.toHaveProperty('error')
    return
  }

  expect([
    'unsupported',
    'policy_denied',
    'invalid_input',
    'not_installed',
    'not_authenticated',
    'cancelled',
    'timed_out',
    'output_limit_exceeded',
    'provider_rejected',
    'ambiguous_submission',
    'unavailable',
    'internal',
  ]).toContain(result.error.code)
  expect(result.error.message).toEqual(expect.any(String))
  expect(result.error.message.length).toBeGreaterThan(0)
  expect(result.error.retryable).toEqual(expect.any(Boolean))
  expect(result).not.toHaveProperty('value')
}

export function defineGenerationProviderContract(
  label: string,
  createProvider: () => GenerationProviderExtension,
  expectedInvokeCode: 'unsupported' | 'policy_denied',
) {
  describe(`${label} shared generation provider contract`, () => {
    it('returns the versioned manifest in the typed success envelope', async () => {
      const result = await createProvider().describe()

      expect(result.ok).toBe(true)
      if (!result.ok) return
      const manifest = result.value as ProviderCapabilityManifest
      expect(manifest.schemaVersion).toBe('provider-capabilities.v1')
      expect(manifest.providerId).toBe('higgsfield-cli')
      expect(manifest.manifestVersion).toEqual(expect.any(String))
      expect(manifest.operations.length).toBe(65)
      expect(result.meta).toMatchObject({
        providerId: 'higgsfield-cli',
        manifestVersion: manifest.manifestVersion,
        remoteState: 'terminal',
        cancellation: 'not_requested',
      })
    })

    it('returns expected unsupported or denied outcomes without throwing', async () => {
      const provider = createProvider()
      const description = await provider.describe()
      const request = providerRequest('higgsfield.auth.token', {
        manifestVersion: description.ok ? description.value.manifestVersion : CONTRACT_MANIFEST_VERSION,
      })
      const promise = provider.invoke(request)

      await expect(promise).resolves.toBeDefined()
      const result = await promise
      assertProviderResultEnvelope(result, request)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toMatchObject({ code: expectedInvokeCode, retryable: false })
    })
  })
}

describe('provider contract test fixtures', () => {
  it('accepts both normative result envelopes and rejects raw idempotency metadata', () => {
    const request = providerRequest('higgsfield.system.version')
    const success: ProviderResult<{ version: string }> = {
      ok: true,
      value: { version: '1.1.13' },
      meta: {
        providerId: 'higgsfield-cli',
        manifestVersion: request.manifestVersion,
        operationId: request.operationId,
        requestId: request.requestId,
        remoteState: 'terminal',
        cancellation: 'not_requested',
      },
    }
    const failure: ProviderResult<never> = {
      ok: false,
      error: { code: 'unsupported', message: 'Not available in this runtime.', retryable: false },
      meta: {
        providerId: 'higgsfield-cli',
        manifestVersion: request.manifestVersion,
        operationId: request.operationId,
        requestId: request.requestId,
        remoteState: 'not_started',
        cancellation: 'not_requested',
      },
    }

    assertProviderResultEnvelope(success, request)
    assertProviderResultEnvelope(failure, request)
  })
})
