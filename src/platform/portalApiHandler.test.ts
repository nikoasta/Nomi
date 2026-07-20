import crypto from 'node:crypto'
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

const TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'

function signedTelegramAuthData(overrides: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = {
    id: 12345678,
    first_name: 'Niko',
    username: 'niko_asta',
    auth_date: Math.floor(Date.now() / 1000),
    ...overrides,
  }
  const checkString = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest()
  const hash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  return { ...data, hash }
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
    vi.useRealTimers()
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

  it('creates portal sessions for signed approved Telegram members', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T08:00:00Z'))
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret'
    process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/rest/v1/rpc/nomi_portal_find_or_create_member_by_telegram')) {
        expect(init?.headers).toEqual(
          expect.objectContaining({
            apikey: 'service-role-secret',
            authorization: 'Bearer service-role-secret',
          }),
        )
        expect(JSON.parse(String(init?.body))).toEqual({
          request_telegram_id: '12345678',
          request_telegram_username: 'niko_asta',
        })
        return new Response(
          JSON.stringify([
            {
              user_id: 'user-1',
              email: 'tg_12345678@eva.mba',
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
          email: 'tg_12345678@eva.mba',
        })
        return new Response(JSON.stringify({ properties: { hashed_token: 'token-hash-1' } }), { status: 200 })
      }
      if (url.endsWith('/auth/v1/verify')) {
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
      }
      throw new Error(`Unexpected URL ${url}`)
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(request('POST', ['auth', 'telegram'], { authData: signedTelegramAuthData() }), res)

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      email: 'tg_12345678@eva.mba',
      delivery: 'telegram_verified',
      session: {
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresIn: 900,
        tokenType: 'bearer',
      },
    })
    expect(JSON.stringify(res.body)).not.toMatch(/service-role-secret|token-hash|telegram_bot_token/i)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rejects tampered Telegram auth before contacting Supabase', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret'
    process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(
      request('POST', ['auth', 'telegram'], {
        authData: { ...signedTelegramAuthData(), username: 'attacker' },
      }),
      res,
    )

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({
      error: { code: 'INVALID_TELEGRAM_AUTH', message: 'Telegram auth was rejected' },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects expired Telegram auth before contacting Supabase', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T08:10:00Z'))
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret'
    process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(
      request('POST', ['auth', 'telegram'], {
        authData: signedTelegramAuthData({ auth_date: Math.floor(new Date('2026-07-20T08:00:00Z').getTime() / 1000) }),
      }),
      res,
    )

    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body)).toEqual({
      error: { code: 'TELEGRAM_AUTH_EXPIRED', message: 'Telegram auth was rejected' },
    })
    expect(fetchMock).not.toHaveBeenCalled()
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

  it('returns the current project revision snapshot through the authenticated portal RPC', async () => {
    const snapshot = {
      schemaVersion: 'nomi-workbench-project-snapshot.v1',
      project: {
        id: 'local-project-1',
        name: 'Cash on Rails',
        localRevision: 2,
        updatedAt: 1784550000000,
      },
      payload: { generationCanvas: { nodes: [], edges: [] } },
    }
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://project.supabase.co/rest/v1/rpc/nomi_portal_get_current_project_revision')
      expect(init?.headers).toEqual(
        expect.objectContaining({
          apikey: 'sb_publishable_live',
          authorization: 'Bearer user-access-token',
        }),
      )
      expect(JSON.parse(String(init?.body))).toEqual({
        request_organization_id: 'org-everville',
        request_workspace_id: 'workspace-content',
        request_project_id: 'project-cash-on-rails',
      })
      return new Response(
        JSON.stringify([
          {
            id: 'revision-current',
            organization_id: 'org-everville',
            workspace_id: 'workspace-content',
            project_id: 'project-cash-on-rails',
            revision_number: 2,
            snapshot_digest: 'c'.repeat(64),
            parent_revision_id: null,
            created_by_user_id: 'principal-niko',
            created_at: '2026-07-20T08:00:00.000Z',
            snapshot,
          },
        ]),
        { status: 200 },
      )
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(
      request(
        'POST',
        ['project-revisions', 'current'],
        {
          organizationId: 'org-everville',
          workspaceId: 'workspace-content',
          projectId: 'project-cash-on-rails',
        },
        { authorization: 'Bearer user-access-token' },
      ),
      res,
    )

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      id: 'revision-current',
      organization_id: 'org-everville',
      workspace_id: 'workspace-content',
      project_id: 'project-cash-on-rails',
      revision_number: 2,
      snapshot_digest: 'c'.repeat(64),
      parent_revision_id: null,
      created_by_user_id: 'principal-niko',
      created_at: '2026-07-20T08:00:00.000Z',
      snapshot,
    })
  })

  it('serves portal model catalog status from server-side provider env without exposing keys', async () => {
    process.env.KIE_API_KEY = 'kie-secret'
    process.env.DEEPSEEK_API_KEY = 'deepseek-secret'
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://project.supabase.co/auth/v1/user')
      expect(init?.headers).toEqual(expect.objectContaining({ authorization: 'Bearer user-jwt' }))
      return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 })
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(request('GET', ['model-catalog', 'health'], undefined, { authorization: 'Bearer user-jwt' }), res)

    expect(res.statusCode).toBe(200)
    const payload = JSON.parse(res.body)
    expect(payload.counts.enabledApiKeys).toBe(2)
    expect(payload.byKind).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'image', executableModels: expect.any(Number) }),
        expect.objectContaining({ kind: 'text', executableModels: expect.any(Number) }),
      ]),
    )
    expect(JSON.stringify(payload)).not.toMatch(/kie-secret|deepseek-secret/i)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('runs portal text tasks through server-side DeepSeek credentials', async () => {
    process.env.DEEPSEEK_API_KEY = 'deepseek-secret'
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === 'https://project.supabase.co/auth/v1/user') {
        expect(init?.headers).toEqual(expect.objectContaining({ authorization: 'Bearer user-jwt' }))
        return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 })
      }
      if (url === 'https://api.deepseek.com/v1/chat/completions') {
        expect(init?.headers).toEqual(expect.objectContaining({ authorization: 'Bearer deepseek-secret' }))
        expect(JSON.parse(String(init?.body))).toEqual({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Improve this prompt' }],
          stream: false,
        })
        return new Response(JSON.stringify({ id: 'chat-1', choices: [{ message: { content: 'Improved prompt' } }] }), { status: 200 })
      }
      throw new Error(`Unexpected URL ${url}`)
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const res = response()

    await handlePortalRequest(
      request(
        'POST',
        ['tasks', 'run'],
        {
          vendor: 'deepseek',
          request: {
            kind: 'prompt_refine',
            prompt: 'Improve this prompt',
            extras: { modelKey: 'deepseek-chat' },
          },
        },
        { authorization: 'Bearer user-jwt' },
      ),
      res,
    )

    expect(res.statusCode).toBe(200)
    const payload = JSON.parse(res.body)
    expect(payload).toEqual(expect.objectContaining({
      kind: 'prompt_refine',
      status: 'succeeded',
      assets: [],
      raw: expect.objectContaining({ choices: [{ message: { content: 'Improved prompt' } }] }),
    }))
    expect(JSON.stringify(payload)).not.toMatch(/deepseek-secret/i)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
