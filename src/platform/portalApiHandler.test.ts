import { Readable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handlePortalRequest } from '../../server/portalApiHandler.js'

function request(method: string, path: string[], body?: unknown, headers: Record<string, string> = {}) {
  const stream = Readable.from(body === undefined ? [] : [JSON.stringify(body)]) as Readable & {
    method: string
    query: { path: string[] }
    headers: Record<string, string>
  }
  stream.method = method
  stream.query = { path }
  stream.headers = { host: 'cut.eva.mba', ...headers }
  return stream
}

function response() {
  const headers: Record<string, string> = {}
  return {
    statusCode: 200,
    body: '',
    setHeader: vi.fn((key: string, value: string) => {
      headers[key.toLowerCase()] = value
    }),
    end: vi.fn(function end(this: { body: string }, value: string) {
      this.body = value
    }),
    headers,
  }
}

describe('Vercel portal API handler', () => {
  const originalEnv = { ...process.env }
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_live'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('requests magic links without returning or requiring Supabase browser keys', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(
      request('POST', ['auth', 'magic-link'], {
        email: 'User@Everville.test',
        redirectTo: 'https://cut.eva.mba/',
      }),
      res,
    )

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ email: 'user@everville.test', redirectTo: 'https://cut.eva.mba/' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/otp',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: 'sb_publishable_live',
          authorization: 'Bearer sb_publishable_live',
        }),
        body: JSON.stringify({
          email: 'user@everville.test',
          create_user: false,
          options: { email_redirect_to: 'https://cut.eva.mba/' },
        }),
      }),
    )
    expect(JSON.stringify(res.body)).not.toMatch(/sb_publishable|service|secret/i)
  })

  it('rejects non-allowlisted RPC names before contacting Supabase', async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(request('POST', ['rpc', 'not_allowed'], {}, { authorization: 'Bearer user-jwt' }), res)

    expect(res.statusCode).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
