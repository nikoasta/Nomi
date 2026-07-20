import type { PlatformResult } from './client'

export type WebPortalClientConfig = {
  endpoint: string
  publishableKey?: string
  bearer: string
  apiBase?: string
  fetch?: typeof fetch
}

export type WebPortalRequestOptions = {
  table: string
  query: Record<string, string | number | null | undefined>
}

export type WebPortalCapability =
  | 'identity.session.read'
  | 'org.organizations.list'
  | 'org.workspaces.list'
  | 'org.memberships.list'
  | 'portal.projects.list'
  | 'portal.projects.create'
  | 'portal.project-revisions.save'
  | 'portal.project-revisions.read-current'
  | 'portal.review-queue.list'
  | 'portal.approvals.decide'
  | 'portal.audit-events.append'

export function normalizeWebPortalEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, '')
  const parsed = new URL(trimmed)
  if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
    throw new TypeError('Portal endpoint must use https outside local development')
  }
  return parsed.toString().replace(/\/+$/, '')
}

export function normalizeWebPortalApiBase(apiBase: string): string {
  const trimmed = apiBase.trim().replace(/\/+$/, '')
  if (!trimmed) throw new TypeError('Portal API base is required')
  if (trimmed.startsWith('/')) return trimmed
  return normalizeWebPortalEndpoint(trimmed)
}

export function isWebPortalPublishableKey(value: string): boolean {
  const key = value.trim()
  return Boolean(
    key &&
      key.startsWith('sb_publishable_') &&
      !/(?:^|[^a-z0-9])(?:service[_-]?role|secret)(?=$|[^a-z0-9])/i.test(key) &&
      !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key),
  )
}

export function assertWebPortalPublishableKey(value: string): string {
  const key = value.trim()
  if (!isWebPortalPublishableKey(key)) {
    throw new TypeError('Portal browser config requires a publishable key')
  }
  return key
}

export function assertWebPortalBearer(value: string): string {
  const bearer = value.trim()
  if (!bearer || /(?:^|[^a-z0-9])(?:service[_-]?role|secret)(?=$|[^a-z0-9])/i.test(bearer)) {
    throw new TypeError('Portal browser config requires a user bearer token')
  }
  return bearer
}

export function configuredWebPortalFetch(config: WebPortalClientConfig): typeof fetch {
  const candidate = config.fetch ?? globalThis.fetch
  if (typeof candidate !== 'function') throw new TypeError('Portal browser config requires fetch')
  return candidate.bind(globalThis) as typeof fetch
}

export function webPortalQueryString(query: WebPortalRequestOptions['query']): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, String(value))
  }
  return params.toString()
}

export function mapWebPortalFetchError(capability: WebPortalCapability): PlatformResult<never> {
  return {
    ok: false,
    error: {
      code: 'NETWORK_ERROR',
      capability,
      message: `${capability} failed while contacting the portal backend`,
      retryable: true,
    },
  }
}

export function mapWebPortalResponseError(
  capability: WebPortalCapability,
  status: number,
): PlatformResult<never> {
  return {
    ok: false,
    error: {
      code:
        status === 401 || status === 403
          ? 'PERMISSION_DENIED'
          : status === 404
            ? 'NOT_FOUND'
            : status === 409
              ? 'CONFLICT'
              : 'NETWORK_ERROR',
      capability,
      message: `${capability} returned HTTP ${status}`,
      retryable: status >= 500,
    },
  }
}
