export type JsonSchema = Readonly<Record<string, unknown>>

export type HiggsfieldOperationId = `higgsfield.${string}`
export type ProviderExecutionMode = 'immediate' | 'job' | 'stream'
export type ProviderExposure = 'allowed' | 'gated' | 'deferred' | 'prohibited'
export type ProviderSideEffect =
  | 'none'
  | 'local-auth'
  | 'account-state'
  | 'upload'
  | 'paid-job'
  | 'publish-admin'
export type ProviderIdempotency = 'none' | 'optional' | 'required'

export type ProviderOperationPolicy = {
  exposure: ProviderExposure
  defaultDecision: 'allow' | 'deny'
  requiredClaims: readonly string[]
  sideEffect: ProviderSideEffect
  reasonCode?: string
}

export type ProviderOperationManifest = {
  id: HiggsfieldOperationId
  cliPath: readonly string[]
  inputSchema: JsonSchema
  outputSchema: JsonSchema
  execution: ProviderExecutionMode
  idempotency: ProviderIdempotency
  policy: ProviderOperationPolicy
}

export type ProviderCapabilityManifest = {
  schemaVersion: 'provider-capabilities.v1'
  providerId: 'higgsfield-cli'
  manifestVersion: string
  source: {
    product: 'higgsfield'
    cliVersion: '1.1.13'
    evidenceRevision: string
  }
  operations: readonly ProviderOperationManifest[]
}

export type ProviderInvokeRequest = {
  requestId: string
  manifestVersion: string
  operationId: HiggsfieldOperationId
  input: unknown
  idempotencyKey?: string
  policyContext: {
    projectId?: string
    claimIds: readonly string[]
    spendGrantId?: string
  }
}

export type ProviderInvokeOptions = {
  signal?: AbortSignal
}

export type ProviderErrorCode =
  | 'unsupported'
  | 'policy_denied'
  | 'invalid_input'
  | 'not_installed'
  | 'not_authenticated'
  | 'cancelled'
  | 'timed_out'
  | 'output_limit_exceeded'
  | 'provider_rejected'
  | 'ambiguous_submission'
  | 'unavailable'
  | 'internal'

export type ProviderResultMeta = {
  providerId: 'higgsfield-cli'
  manifestVersion: string
  operationId: HiggsfieldOperationId
  requestId: string
  idempotencyKeyHash?: string
  remoteJobId?: string
  remoteState: 'not_started' | 'accepted' | 'terminal' | 'unknown'
  cancellation: 'not_requested' | 'before_start' | 'local_wait_stopped'
}

export type ProviderResult<T> =
  | {
      ok: true
      value: T
      meta: ProviderResultMeta
    }
  | {
      ok: false
      error: {
        code: ProviderErrorCode
        message: string
        retryable: boolean
      }
      meta: ProviderResultMeta
    }

export type GenerationProviderExtension = {
  describe(): Promise<ProviderResult<ProviderCapabilityManifest>>
  invoke(request: ProviderInvokeRequest, options?: ProviderInvokeOptions): Promise<ProviderResult<unknown>>
}
