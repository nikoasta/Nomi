import type {
  GenerationProviderExtension,
  HiggsfieldOperationId,
  ProviderCapabilityManifest,
  ProviderInvokeRequest,
  ProviderResultMeta,
} from './provider'

const DESCRIBE_OPERATION = 'higgsfield.system.version' as HiggsfieldOperationId

function metaFor(request: ProviderInvokeRequest): ProviderResultMeta {
  return {
    providerId: 'higgsfield-cli',
    manifestVersion: request.manifestVersion,
    operationId: request.operationId,
    requestId: request.requestId,
    remoteState: 'not_started',
    cancellation: 'not_requested',
  }
}

export function createBrowserGenerationProvider(
  manifest: ProviderCapabilityManifest,
): GenerationProviderExtension {
  return {
    async describe() {
      return {
        ok: true,
        value: manifest,
        meta: {
          providerId: 'higgsfield-cli',
          manifestVersion: manifest.manifestVersion,
          operationId: DESCRIBE_OPERATION,
          requestId: 'describe',
          remoteState: 'terminal',
          cancellation: 'not_requested',
        },
      }
    },

    async invoke(request) {
      return {
        ok: false,
        error: {
          code: 'unsupported',
          message: 'Higgsfield operations are not available in the browser runtime.',
          retryable: false,
        },
        meta: metaFor(request),
      }
    },
  }
}
