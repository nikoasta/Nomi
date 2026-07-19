import type { WebPortalClientConfig } from './webPortalClient'

export const WEB_PORTAL_SESSION_STORAGE_KEY = 'nomi.portal.session.v1'
export const WEB_PORTAL_SESSION_EXPIRY_SKEW_MS = 30_000

type WebPortalEnv = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

type LocationLike = {
  href: string
  origin: string
  pathname: string
  search: string
  hash: string
}

type HistoryLike = {
  replaceState(data: unknown, unused: string, url?: string | URL | null): void
}

export type WebPortalStoredSession = {
  schemaVersion: 'web-portal-session.v1'
  accessToken: string
  refreshToken: string | null
  tokenType: string
  expiresAt: number
}

export type WebPortalRuntimeEnv = {
  endpoint: string
  publishableKey: string
}

function readImportMetaEnv(): WebPortalEnv {
  const meta = import.meta as unknown as { env?: WebPortalEnv }
  return meta.env ?? {}
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function publicPortalEnv(env: WebPortalEnv): WebPortalRuntimeEnv | null {
  const endpoint = cleanString(env.VITE_SUPABASE_URL)
  const publishableKey = cleanString(env.VITE_SUPABASE_PUBLISHABLE_KEY)
  if (!endpoint || !publishableKey) return null
  return { endpoint, publishableKey }
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function parseStoredSession(value: string | null): WebPortalStoredSession | null {
  if (!value) return null
  try {
    const raw = JSON.parse(value) as Partial<WebPortalStoredSession>
    if (raw.schemaVersion !== 'web-portal-session.v1') return null
    const accessToken = cleanString(raw.accessToken)
    if (!accessToken || typeof raw.expiresAt !== 'number' || !Number.isFinite(raw.expiresAt)) return null
    return {
      schemaVersion: 'web-portal-session.v1',
      accessToken,
      refreshToken: cleanString(raw.refreshToken) ?? null,
      tokenType: cleanString(raw.tokenType) ?? 'bearer',
      expiresAt: raw.expiresAt,
    }
  } catch {
    return null
  }
}

function sessionIsCurrent(session: WebPortalStoredSession, now: number): boolean {
  return session.expiresAt - WEB_PORTAL_SESSION_EXPIRY_SKEW_MS > now
}

function paramsFromHash(hash: string): URLSearchParams {
  const body = hash.startsWith('#') ? hash.slice(1) : hash
  if (!body) return new URLSearchParams()
  if (body.startsWith('/')) {
    const queryStart = body.indexOf('?')
    return queryStart >= 0 ? new URLSearchParams(body.slice(queryStart + 1)) : new URLSearchParams()
  }
  return new URLSearchParams(body)
}

function sessionFromParams(params: URLSearchParams, now: number): WebPortalStoredSession | null {
  const accessToken = cleanString(params.get('access_token'))
  if (!accessToken) return null
  const expiresInSeconds = Number(params.get('expires_in') ?? 3600)
  const expiresAt = Number.isFinite(expiresInSeconds) ? now + Math.max(0, expiresInSeconds) * 1000 : now + 3600_000
  return {
    schemaVersion: 'web-portal-session.v1',
    accessToken,
    refreshToken: cleanString(params.get('refresh_token')) ?? null,
    tokenType: cleanString(params.get('token_type')) ?? 'bearer',
    expiresAt,
  }
}

export function readWebPortalRuntimeEnv(env: WebPortalEnv = readImportMetaEnv()): WebPortalRuntimeEnv | null {
  return publicPortalEnv(env)
}

export function parseWebPortalSessionFromUrl(href: string, now = Date.now()): WebPortalStoredSession | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  return sessionFromParams(paramsFromHash(url.hash), now) ?? sessionFromParams(url.searchParams, now)
}

export function readWebPortalSession(storage: StorageLike | null = browserStorage()): WebPortalStoredSession | null {
  if (!storage) return null
  return parseStoredSession(storage.getItem(WEB_PORTAL_SESSION_STORAGE_KEY))
}

export function storeWebPortalSession(
  session: WebPortalStoredSession,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(WEB_PORTAL_SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    /* local session persistence is best effort */
  }
}

export function clearWebPortalSession(storage: StorageLike | null = browserStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(WEB_PORTAL_SESSION_STORAGE_KEY)
  } catch {
    /* local session persistence is best effort */
  }
}

function sanitizedCallbackUrl(location: LocationLike): string {
  const url = new URL(location.href)
  if (sessionFromParams(paramsFromHash(url.hash), Date.now())) url.hash = '#/studio'
  if (sessionFromParams(url.searchParams, Date.now())) {
    url.searchParams.delete('access_token')
    url.searchParams.delete('refresh_token')
    url.searchParams.delete('expires_in')
    url.searchParams.delete('token_type')
    url.searchParams.delete('type')
  }
  return `${url.pathname}${url.search}${url.hash}`
}

export function initializeWebPortalSessionFromLocation(
  location: LocationLike | null = typeof window === 'undefined' ? null : window.location,
  history: HistoryLike | null = typeof window === 'undefined' ? null : window.history,
  storage: StorageLike | null = browserStorage(),
  now = Date.now(),
): WebPortalStoredSession | null {
  if (!location) return null
  const session = parseWebPortalSessionFromUrl(location.href, now)
  if (!session) return readWebPortalSession(storage)
  storeWebPortalSession(session, storage)
  try {
    history?.replaceState(null, '', sanitizedCallbackUrl(location))
  } catch {
    /* URL cleanup is best effort */
  }
  return session
}

export function getBrowserWebPortalClientConfig(
  env: WebPortalEnv = readImportMetaEnv(),
  storage: StorageLike | null = browserStorage(),
  now = Date.now(),
): Pick<WebPortalClientConfig, 'endpoint' | 'publishableKey' | 'bearer'> | null {
  const portalEnv = readWebPortalRuntimeEnv(env)
  if (!portalEnv) return null
  const session = readWebPortalSession(storage)
  if (!session) return null
  if (!sessionIsCurrent(session, now)) {
    clearWebPortalSession(storage)
    return null
  }
  return {
    endpoint: portalEnv.endpoint,
    publishableKey: portalEnv.publishableKey,
    bearer: session.accessToken,
  }
}
