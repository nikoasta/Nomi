import { readWebPortalRuntimeEnv, readWebPortalSession } from '../../platform/webPortalSession'

function normalizeEndpoint(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

export function hasPortalRuntimeSession(): boolean {
  return Boolean(readWebPortalRuntimeEnv() && readWebPortalSession())
}

export async function portalRuntimeRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST'
    body?: unknown
  } = {},
): Promise<T> {
  const env = readWebPortalRuntimeEnv()
  const session = readWebPortalSession()
  const request = globalThis.fetch
  if (!env || !session || typeof request !== 'function') {
    throw new Error('Portal runtime requires an authenticated web session')
  }
  const method = options.method ?? 'POST'
  const response = await request(`${normalizeEndpoint(env.apiBase)}/${path.replace(/^\/+/, '')}`, {
    method,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${session.accessToken}`,
      ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
    },
    ...(method === 'POST' ? { body: JSON.stringify(options.body ?? {}) } : {}),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object'
        ? String((payload.error as { message?: unknown }).message || '')
        : ''
    throw new Error(message || `Portal runtime returned HTTP ${response.status}`)
  }
  return payload as T
}
