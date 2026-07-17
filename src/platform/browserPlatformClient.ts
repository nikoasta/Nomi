import type { PlatformCapability, PlatformClient, PlatformResult } from './client'

const BROWSER_CAPABILITIES: ReadonlySet<PlatformCapability> = new Set(['identity.session.read'])

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
  }
}
