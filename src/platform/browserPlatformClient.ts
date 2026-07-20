import type { PlatformCapability, PlatformClient, PlatformResult } from './client'
import {
  createUnsupportedWebPortalServices,
  createWebPortalServices,
  type WebPortalClientConfig,
} from './webPortalClient'

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
const AUTHENTICATED_PORTAL_CAPABILITIES = filterableCapabilities([
  'identity.session.read',
  'org.organizations.list',
  'org.workspaces.list',
  'org.memberships.list',
  'portal.projects.list',
  'portal.projects.create',
  'portal.project-revisions.save',
  'portal.review-queue.list',
  'portal.approvals.decide',
  'portal.audit-events.append',
])

type BrowserPlatformClientOptions = {
  portal?: WebPortalClientConfig | null
}

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

function browserPortalServices(options: BrowserPlatformClientOptions) {
  if (!options.portal) return null
  try {
    return createWebPortalServices(options.portal)
  } catch {
    return null
  }
}

export function createBrowserPlatformClient(options: BrowserPlatformClientOptions = {}): PlatformClient {
  const portal = browserPortalServices(options)
  const portalFallback = portal ?? createUnsupportedWebPortalServices()
  const capabilities = portal ? AUTHENTICATED_PORTAL_CAPABILITIES : BROWSER_CAPABILITIES

  return {
    capabilities,
    supports: (capability) => capabilities.has(capability),
    identity: portalFallback.identity,
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
    collaboration: portalFallback.collaboration,
    organizations: portalFallback.organizations,
  }
}
