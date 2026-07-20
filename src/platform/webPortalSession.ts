import type { WebPortalClientConfig } from './webPortalClient'

export const WEB_PORTAL_SESSION_STORAGE_KEY = 'nomi.portal.session.v1'
export const WEB_PORTAL_SESSION_EXPIRY_SKEW_MS = 30_000
export const WEB_PORTAL_AUTH_CHANGE_EVENT = 'nomi-web-portal-auth-change'

type WebPortalEnv = {
  VITE_PORTAL_API_BASE?: string
  VITE_PORTAL_AUTH_ENABLED?: string
  VITE_TELEGRAM_BOT_USERNAME?: string
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

const AUTH_CALLBACK_PARAM_NAMES = ['access_token', 'refresh_token', 'expires_in', 'token_type', 'type', 'error', 'error_code', 'error_description']

export type WebPortalStoredSession = {
  schemaVersion: 'web-portal-session.v1'
  accessToken: string
  refreshToken: string | null
  tokenType: string
  expiresAt: number
}

export type WebPortalRuntimeEnv = {
  apiBase: string
  telegramBotUsername: string | null
}

export type WebPortalAuthRequestOptions = {
  email: string
  redirectTo?: string
  env?: WebPortalEnv
  fetch?: typeof fetch
}

export type WebPortalAuthDelivery = 'accepted_by_auth_provider' | 'sent_by_everville_mailer' | 'not_sent_non_member'
export type WebPortalTelegramAuthDelivery = 'telegram_verified'

export type WebPortalAuthRequestResult =
  | {
      ok: true
      value: {
        email: string
        redirectTo: string
        delivery: WebPortalAuthDelivery
      }
    }
  | {
      ok: false
      error: {
        code: 'UNCONFIGURED' | 'INVALID_EMAIL' | 'RATE_LIMITED' | 'PERMISSION_DENIED' | 'NETWORK_ERROR'
        message: string
        retryable: boolean
      }
    }

type WebPortalAuthErrorCode = Extract<WebPortalAuthRequestResult, { ok: false }>['error']['code']

export type WebPortalTelegramAuthPayload = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export type WebPortalTelegramAuthRequestOptions = {
  authData: WebPortalTelegramAuthPayload
  env?: WebPortalEnv
  fetch?: typeof fetch
  storage?: StorageLike | null
  now?: number
}

export type WebPortalTelegramAuthRequestResult =
  | {
      ok: true
      value: {
        email: string
        delivery: WebPortalTelegramAuthDelivery
      }
    }
  | {
      ok: false
      error: {
        code:
          | 'UNCONFIGURED'
          | 'INVALID_TELEGRAM_AUTH'
          | 'TELEGRAM_AUTH_EXPIRED'
          | 'RATE_LIMITED'
          | 'PERMISSION_DENIED'
          | 'NETWORK_ERROR'
        message: string
        retryable: boolean
      }
    }

function readImportMetaEnv(): WebPortalEnv {
  return {
    VITE_PORTAL_API_BASE: import.meta.env.VITE_PORTAL_API_BASE,
    VITE_PORTAL_AUTH_ENABLED: import.meta.env.VITE_PORTAL_AUTH_ENABLED,
    VITE_TELEGRAM_BOT_USERNAME: import.meta.env.VITE_TELEGRAM_BOT_USERNAME,
  }
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function publicPortalEnv(env: WebPortalEnv): WebPortalRuntimeEnv | null {
  if (env.VITE_PORTAL_AUTH_ENABLED === 'false') return null
  const apiBase = cleanString(env.VITE_PORTAL_API_BASE) ?? '/api/portal'
  const normalizedApiBase = normalizeApiBase(apiBase)
  if (normalizedApiBase) {
    return {
      apiBase: normalizedApiBase,
      telegramBotUsername: normalizeTelegramBotUsername(env.VITE_TELEGRAM_BOT_USERNAME),
    }
  }
  return null
}

function normalizeEndpoint(endpoint: string): string | null {
  try {
    const url = new URL(endpoint.trim().replace(/\/+$/, ''))
    if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return null
    return url.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

function normalizeApiBase(apiBase: string): string | null {
  const trimmed = apiBase.trim().replace(/\/+$/, '')
  if (!trimmed) return null
  if (trimmed.startsWith('/')) return trimmed
  return normalizeEndpoint(trimmed)
}

function normalizeTelegramBotUsername(value: unknown): string | null {
  const username = cleanString(value)
  if (!username) return null
  const normalized = username.replace(/^@+/, '')
  return /^[A-Za-z0-9_]{5,32}$/.test(normalized) ? normalized : null
}

function browserRedirectTo(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return `${window.location.origin}/`
  } catch {
    return null
  }
}

function normalizeRedirectTo(value?: string): string | null {
  const candidate = cleanString(value) ?? browserRedirectTo()
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizePortalEmail(email: string): string | null {
  const trimmed = cleanString(email)
  if (!trimmed || trimmed.length > 254) return null
  for (let index = 0; index < trimmed.length; index += 1) {
    const code = trimmed.charCodeAt(index)
    if (code <= 31 || code === 127) return null
  }
  const parts = trimmed.split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) return null
  return trimmed.toLowerCase()
}

function authError(code: WebPortalAuthErrorCode, message: string, retryable: boolean): WebPortalAuthRequestResult {
  return { ok: false, error: { code, message, retryable } }
}

function authDelivery(value: unknown): WebPortalAuthDelivery {
  if (
    value === 'sent_by_everville_mailer' ||
    value === 'not_sent_non_member' ||
    value === 'accepted_by_auth_provider'
  ) {
    return value
  }
  return 'accepted_by_auth_provider'
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function notifyWebPortalAuthChange(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(WEB_PORTAL_AUTH_CHANGE_EVENT))
  } catch {
    /* same-tab auth notifications are best effort */
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

function hasAuthCallbackParams(params: URLSearchParams): boolean {
  return AUTH_CALLBACK_PARAM_NAMES.some((name) => params.has(name))
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

function sessionFromApiPayload(payload: unknown, now: number): WebPortalStoredSession | null {
  const raw = payload && typeof payload === 'object' ? (payload as { session?: unknown }) : {}
  const session = raw.session && typeof raw.session === 'object' ? (raw.session as Record<string, unknown>) : null
  const accessToken = cleanString(session?.accessToken)
  if (!session || !accessToken) return null
  const expiresInSeconds = Number(session.expiresIn ?? 3600)
  return {
    schemaVersion: 'web-portal-session.v1',
    accessToken,
    refreshToken: cleanString(session.refreshToken) ?? null,
    tokenType: cleanString(session.tokenType) ?? 'bearer',
    expiresAt: Number.isFinite(expiresInSeconds) ? now + Math.max(0, expiresInSeconds) * 1000 : now + 3600_000,
  }
}

export function readWebPortalRuntimeEnv(env: WebPortalEnv = readImportMetaEnv()): WebPortalRuntimeEnv | null {
  return publicPortalEnv(env)
}

export async function requestWebPortalMagicLink({
  email,
  redirectTo,
  env = readImportMetaEnv(),
  fetch: fetchOverride,
}: WebPortalAuthRequestOptions): Promise<WebPortalAuthRequestResult> {
  const portalEnv = readWebPortalRuntimeEnv(env)
  if (!portalEnv) return authError('UNCONFIGURED', 'Portal auth is not configured', false)
  const endpoint = normalizeApiBase(portalEnv.apiBase)
  const safeEmail = normalizePortalEmail(email)
  const safeRedirectTo = normalizeRedirectTo(redirectTo)
  const request = fetchOverride ?? globalThis.fetch
  if (!endpoint || !safeRedirectTo || typeof request !== 'function') {
    return authError('UNCONFIGURED', 'Portal auth is not configured', false)
  }
  if (!safeEmail) return authError('INVALID_EMAIL', 'Enter a valid email address', false)

  let response: Response
  try {
    response = await request(`${endpoint}/auth/magic-link`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: safeEmail,
        redirectTo: safeRedirectTo,
      }),
    })
  } catch {
    return authError('NETWORK_ERROR', 'Could not contact portal auth', true)
  }

  if (!response.ok) {
    if (response.status === 429) return authError('RATE_LIMITED', 'Please wait before requesting another link', true)
    if (response.status === 401 || response.status === 403) return authError('PERMISSION_DENIED', 'Portal auth rejected this request', false)
    return authError('NETWORK_ERROR', `Portal auth returned HTTP ${response.status}`, response.status >= 500)
  }
  let delivery: unknown
  try {
    delivery = ((await response.json()) as { delivery?: unknown }).delivery
  } catch {
    delivery = undefined
  }
  return { ok: true, value: { email: safeEmail, redirectTo: safeRedirectTo, delivery: authDelivery(delivery) } }
}

export async function requestWebPortalTelegramLogin({
  authData,
  env = readImportMetaEnv(),
  fetch: fetchOverride,
  storage = browserStorage(),
  now = Date.now(),
}: WebPortalTelegramAuthRequestOptions): Promise<WebPortalTelegramAuthRequestResult> {
  const portalEnv = readWebPortalRuntimeEnv(env)
  if (!portalEnv) return { ok: false, error: { code: 'UNCONFIGURED', message: 'Portal auth is not configured', retryable: false } }
  const endpoint = normalizeApiBase(portalEnv.apiBase)
  const request = fetchOverride ?? globalThis.fetch
  if (!endpoint || typeof request !== 'function') {
    return { ok: false, error: { code: 'UNCONFIGURED', message: 'Portal auth is not configured', retryable: false } }
  }

  let response: Response
  try {
    response = await request(`${endpoint}/auth/telegram`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ authData }),
    })
  } catch {
    return { ok: false, error: { code: 'NETWORK_ERROR', message: 'Could not contact Telegram auth', retryable: true } }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const rawCode =
      payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object'
        ? (payload.error as { code?: unknown }).code
        : null
    if (rawCode === 'INVALID_TELEGRAM_AUTH' || rawCode === 'TELEGRAM_AUTH_EXPIRED') {
      return {
        ok: false,
        error: {
          code: rawCode,
          message: rawCode === 'TELEGRAM_AUTH_EXPIRED' ? 'Telegram login expired' : 'Telegram login was rejected',
          retryable: true,
        },
      }
    }
    if (response.status === 429) {
      return { ok: false, error: { code: 'RATE_LIMITED', message: 'Please wait before trying again', retryable: true } }
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Portal auth rejected this Telegram user', retryable: false } }
    }
    return { ok: false, error: { code: 'NETWORK_ERROR', message: `Telegram auth returned HTTP ${response.status}`, retryable: response.status >= 500 } }
  }

  const session = sessionFromApiPayload(payload, now)
  const email = payload && typeof payload === 'object' ? cleanString((payload as { email?: unknown }).email) : null
  if (!session || !email) {
    return { ok: false, error: { code: 'NETWORK_ERROR', message: 'Telegram auth returned an invalid session', retryable: true } }
  }
  storeWebPortalSession(session, storage)
  return { ok: true, value: { email, delivery: 'telegram_verified' } }
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
    notifyWebPortalAuthChange()
  } catch {
    /* local session persistence is best effort */
  }
}

export function clearWebPortalSession(storage: StorageLike | null = browserStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(WEB_PORTAL_SESSION_STORAGE_KEY)
    notifyWebPortalAuthChange()
  } catch {
    /* local session persistence is best effort */
  }
}

function sanitizedCallbackUrl(location: LocationLike): string {
  const url = new URL(location.href)
  const hashParams = paramsFromHash(url.hash)
  if (hasAuthCallbackParams(hashParams)) {
    const body = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
    if (body.startsWith('/')) {
      const queryStart = body.indexOf('?')
      url.hash = queryStart >= 0 ? body.slice(0, queryStart) : body
    } else {
      url.hash = '#/studio'
    }
  }
  if (hasAuthCallbackParams(url.searchParams)) {
    for (const name of AUTH_CALLBACK_PARAM_NAMES) {
      url.searchParams.delete(name)
    }
  }
  return `${url.pathname}${url.search}${url.hash}`
}

function hasAuthCallback(location: LocationLike): boolean {
  try {
    const url = new URL(location.href)
    return hasAuthCallbackParams(paramsFromHash(url.hash)) || hasAuthCallbackParams(url.searchParams)
  } catch {
    return false
  }
}

export function initializeWebPortalSessionFromLocation(
  location: LocationLike | null = typeof window === 'undefined' ? null : window.location,
  history: HistoryLike | null = typeof window === 'undefined' ? null : window.history,
  storage: StorageLike | null = browserStorage(),
  now = Date.now(),
): WebPortalStoredSession | null {
  if (!location) return null
  const session = parseWebPortalSessionFromUrl(location.href, now)
  if (!session) {
    if (hasAuthCallback(location)) {
      try {
        history?.replaceState(null, '', sanitizedCallbackUrl(location))
      } catch {
        /* URL cleanup is best effort */
      }
    }
    return readWebPortalSession(storage)
  }
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
): Pick<WebPortalClientConfig, 'endpoint' | 'apiBase' | 'bearer'> | null {
  const portalEnv = readWebPortalRuntimeEnv(env)
  if (!portalEnv) return null
  const session = readWebPortalSession(storage)
  if (!session) return null
  if (!sessionIsCurrent(session, now)) {
    clearWebPortalSession(storage)
    return null
  }
  return {
    endpoint: portalEnv.apiBase,
    apiBase: portalEnv.apiBase,
    bearer: session.accessToken,
  }
}
