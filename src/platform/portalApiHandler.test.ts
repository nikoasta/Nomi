import { Readable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handlePortalRequest } from '../../server/portalApiHandler.js'

function request(
  method: string,
  path: string[],
  body?: unknown,
  headers: Record<string, string> = {},
  query: Record<string, string> = {},
) {
  const stream = Readable.from(body === undefined ? [] : [JSON.stringify(body)]) as Readable & {
    method: string
    query: { path: string[] } & Record<string, string>
    headers: Record<string, string>
  }
  stream.method = method
  stream.query = { path, ...query }
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
    expect(JSON.parse(res.body)).toEqual({
      email: 'user@everville.test',
      redirectTo: 'https://cut.eva.mba/',
      delivery: 'accepted_by_auth_provider',
    })
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

  it('sends corporate magic links only after a service-role membership lookup', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret'
    process.env.RESEND_API_KEY = 'resend-secret'
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/rest/v1/rpc/nomi_portal_find_member_by_email')) {
        expect(init?.headers).toEqual(
          expect.objectContaining({
            apikey: 'service-role-secret',
            authorization: 'Bearer service-role-secret',
          }),
        )
        return new Response(
          JSON.stringify([
            {
              user_id: 'user-1',
              email: 'user@everville.test',
              organization_id: 'organization-1',
              workspace_id: 'workspace-1',
            },
          ]),
          { status: 200 },
        )
      }
      if (url.endsWith('/auth/v1/admin/generate_link')) {
        expect(JSON.parse(String(init?.body))).toEqual({
          type: 'magiclink',
          email: 'user@everville.test',
        })
        return new Response(JSON.stringify({ properties: { hashed_token: 'token-hash-1' } }), { status: 200 })
      }
      if (url === 'https://api.resend.com/emails') {
        const payload = JSON.parse(String(init?.body))
        expect(payload.to).toEqual(['user@everville.test'])
        expect(payload.text).toContain('https://cut.eva.mba/api/portal/auth/confirm?token_hash=token-hash-1')
        expect(init?.headers).toEqual(expect.objectContaining({ authorization: 'Bearer resend-secret' }))
        return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 })
      }
      throw new Error(`Unexpected URL ${url}`)
    })
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
    expect(JSON.parse(res.body)).toEqual({
      email: 'user@everville.test',
      redirectTo: 'https://cut.eva.mba/',
      delivery: 'sent_by_everville_mailer',
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(JSON.stringify(res.body)).not.toMatch(/service-role-secret|resend-secret|token-hash/i)
  })

  it('does not generate or send corporate links for non-members', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret'
    process.env.RESEND_API_KEY = 'resend-secret'
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe('https://project.supabase.co/rest/v1/rpc/nomi_portal_find_member_by_email')
      return new Response('[]', { status: 200 })
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(
      request('POST', ['auth', 'magic-link'], {
        email: 'outsider@example.test',
        redirectTo: 'https://cut.eva.mba/',
      }),
      res,
    )

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      email: 'outsider@example.test',
      redirectTo: 'https://cut.eva.mba/',
      delivery: 'not_sent_non_member',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('confirms own-domain magic links into browser hash sessions', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://project.supabase.co/auth/v1/verify')
      expect(JSON.parse(String(init?.body))).toEqual({
        token_hash: 'token-hash-1',
        type: 'magiclink',
      })
      return new Response(
        JSON.stringify({
          access_token: 'access-token-1',
          refresh_token: 'refresh-token-1',
          expires_in: 900,
          token_type: 'bearer',
        }),
        { status: 200 },
      )
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(
      request(
        'GET',
        ['auth', 'confirm'],
        undefined,
        {},
        {
          token_hash: 'token-hash-1',
          type: 'magiclink',
          redirectTo: 'https://cut.eva.mba/',
        },
      ),
      res,
    )

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe(
      'https://cut.eva.mba/#access_token=access-token-1&refresh_token=refresh-token-1&expires_in=900&token_type=bearer&type=magiclink',
    )
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
