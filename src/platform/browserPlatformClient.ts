import type { PlatformCapability, PlatformClient, PlatformResult } from './client'

const NO_CAPABILITIES: ReadonlySet<PlatformCapability> = new Set()

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

export function createBrowserPlatformClient(): PlatformClient {
  return {
    capabilities: NO_CAPABILITIES,
    supports: () => false,
    conversations: {
      read: () => unsupported('conversations.read'),
      write: () => unsupported('conversations.write'),
    },
    assets: {
      list: () => unsupported('assets.list'),
      importFile: () => unsupported('assets.import-file'),
      importRemoteUrl: () => unsupported('assets.import-remote-url'),
    },
  }
}
