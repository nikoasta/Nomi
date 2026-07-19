import type { PlatformCapability, PlatformClient, PlatformResult } from './client'

type FilterableCapabilitySet = ReadonlySet<PlatformCapability> & {
  filter(predicate: (capability: PlatformCapability) => boolean): PlatformCapability[]
}

function filterableCapabilities(values: readonly PlatformCapability[]): FilterableCapabilitySet {
  const capabilities = new Set<PlatformCapability>(values)
  return Object.assign(capabilities, {
    filter: (predicate: (capability: PlatformCapability) => boolean) => [...capabilities].filter(predicate),
  })
}

const BROWSER_CAPABILITIES = filterableCapabilities(['identity.session.read'])

function unsupported<T>(capability: PlatformCapability): Promise<PlatformResult<T>> {
  return Promise.resolve({
    ok: false,
    error: {
      code: 'UNSUPPORTED_CAPABILITY',
      capability,
      message: `${capability} is not supported by this runtime`,
      retryable: false,
    },
  })
}

export function createBrowserPlatformClient(_options: Record<string, unknown> = {}): PlatformClient {
  return {
    capabilities: BROWSER_CAPABILITIES,
    supports: (capability) => BROWSER_CAPABILITIES.has(capability),
    identity: {
      getSession: () => Promise.resolve({ ok: true, value: { state: 'unauthenticated' } }),
    },
    authorization: {
      check: () => unsupported('authorization.check'),
    },
    conversations: {
      read: () => unsupported('conversations.read'),
      write: () => unsupported('conversations.write'),
    },
    assets: {
      list: () => unsupported('assets.list'),
      importFile: () => unsupported('assets.import-file'),
      importRemoteUrl: () => unsupported('assets.import-remote-url'),
    },
    assetRecords: {
      list: () => unsupported('asset-records.list'),
      importFile: () => unsupported('asset-records.import-file'),
      importRemoteUrl: () => unsupported('asset-records.import-remote-url'),
      resolve: () => unsupported('asset-records.resolve'),
    },
  }
}
