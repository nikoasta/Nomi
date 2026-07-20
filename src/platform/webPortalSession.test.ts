import { describe, expect, it, vi } from 'vitest'

import {
  clearWebPortalSession,
  createWebPortalDesktopSyncToken,
  getBrowserWebPortalClientConfig,
  initializeWebPortalSessionFromLocation,
  parseWebPortalSessionFromUrl,
  readWebPortalRuntimeEnv,
  readWebPortalSession,
  requestWebPortalMagicLink,
  requestWebPortalTelegramLogin,
  storeWebPortalSession,
  storeWebPortalDesktopSyncToken,
  WEB_PORTAL_SESSION_STORAGE_KEY,
  type WebPortalStoredSession,
} from './webPortalSession'

function storageStub() {
  const values = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
  }
}

const NOW = Date.UTC(2026, 6, 19, 15, 30, 0)

function session(overrides: Partial<WebPortalStoredSession> = {}): WebPortalStoredSession {
  return {
    schemaVersion: 'web-portal-session.v1',
    accessToken: 'user-access-token',
    refreshToken: 'refresh-token',
    tokenType: 'bearer',
    expiresAt: NOW + 3600_000,
    ...overrides,
  }
}

describe('web portal browser session wiring', () => {
  it('reads the server-side portal API base without exposing Supabase browser keys', () => {
    expect(
      readWebPortalRuntimeEnv({
        VITE_PORTAL_API_BASE: 'https://cut.eva.mba/api/portal',
        VITE_TELEGRAM_BOT_USERNAME: '@everville_portal_bot',
      }),
    ).toEqual({
      apiBase: 'https://cut.eva.mba/api/portal',
      telegramBotUsername: 'everville_portal_bot',
    })
    expect(readWebPortalRuntimeEnv({})).toEqual({ apiBase: '/api/portal', telegramBotUsername: null })
    expect(readWebPortalRuntimeEnv({ VITE_PORTAL_AUTH_ENABLED: 'false' })).toBeNull()
  })

  it('parses Supabase magic-link hash sessions with an absolute expiry', () => {
    const parsed = parseWebPortalSessionFromUrl(
      'https://cut.eva.mba/#access_token=token-1&refresh_token=refresh-1&expires_in=60&token_type=bearer&type=magiclink',
      NOW,
    )

    expect(parsed).toEqual({
      schemaVersion: 'web-portal-session.v1',
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      tokenType: 'bearer',
      expiresAt: NOW + 60_000,
    })
  })

  it('stores callback sessions and removes tokens from the visible URL', () => {
    const storage = storageStub()
    const replaceState = vi.fn()
    const location = {
      href: 'https://cut.eva.mba/#access_token=token-2&refresh_token=refresh-2&expires_in=120&type=magiclink',
      origin: 'https://cut.eva.mba',
      pathname: '/',
      search: '',
      hash: '#access_token=token-2&refresh_token=refresh-2&expires_in=120&type=magiclink',
    }

    expect(initializeWebPortalSessionFromLocation(location, { replaceState }, storage, NOW)).toEqual(
      expect.objectContaining({ accessToken: 'token-2' }),
    )
    expect(readWebPortalSession(storage)).toEqual(expect.objectContaining({ accessToken: 'token-2' }))
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#/studio')
  })

  it('removes failed auth callback details from the visible URL without storing a session', () => {
    const storage = storageStub()
    const replaceState = vi.fn()
    const location = {
      href: 'https://cut.eva.mba/#/studio?error=access_denied&error_description=Link%20expired&type=magiclink',
      origin: 'https://cut.eva.mba',
      pathname: '/',
      search: '',
      hash: '#/studio?error=access_denied&error_description=Link%20expired&type=magiclink',
    }

    expect(initializeWebPortalSessionFromLocation(location, { replaceState }, storage, NOW)).toBeNull()
    expect(readWebPortalSession(storage)).toBeNull()
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#/studio')
  })

  it('requests invite-only magic links through the same-origin portal API', async () => {
    const request = vi.fn(async () => new Response('{"delivery":"sent_by_everville_mailer"}', { status: 200 }))

    await expect(
      requestWebPortalMagicLink({
        email: ' User@Everville.test ',
        redirectTo: 'https://cut.eva.mba/',
        env: {
          VITE_PORTAL_API_BASE: 'https://cut.eva.mba/api/portal',
        },
        fetch: request as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        email: 'user@everville.test',
        redirectTo: 'https://cut.eva.mba/',
        delivery: 'sent_by_everville_mailer',
      },
    })

    expect(request).toHaveBeenCalledWith('https://cut.eva.mba/api/portal/auth/magic-link', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@everville.test',
        redirectTo: 'https://cut.eva.mba/',
      }),
    })
    expect(JSON.stringify(request.mock.calls)).not.toMatch(/service|secret|refresh-token|user-access-token/i)
  })

  it('fails closed when magic-link auth is disabled or misconfigured', async () => {
    const request = vi.fn()

    await expect(
      requestWebPortalMagicLink({
        email: 'user@everville.test',
        env: { VITE_PORTAL_AUTH_ENABLED: 'false' },
        fetch: request,
      }),
    ).resolves.toEqual(expect.objectContaining({ ok: false, error: expect.objectContaining({ code: 'UNCONFIGURED' }) }))
    await expect(
      requestWebPortalMagicLink({
        email: 'user@everville.test',
        env: {
          VITE_PORTAL_API_BASE: 'file:///tmp/portal',
        },
        fetch: request,
      }),
    ).resolves.toEqual(expect.objectContaining({ ok: false, error: expect.objectContaining({ code: 'UNCONFIGURED' }) }))
    expect(request).not.toHaveBeenCalled()
  })

  it('maps magic-link auth rate limits without leaking provider payloads', async () => {
    const request = vi.fn(async () => new Response('{"message":"service_role secret"}', { status: 429 }))

    await expect(
      requestWebPortalMagicLink({
        email: 'user@everville.test',
        redirectTo: 'https://cut.eva.mba/',
        env: {
          VITE_PORTAL_API_BASE: 'https://cut.eva.mba/api/portal',
        },
        fetch: request as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Please wait before requesting another link',
        retryable: true,
      },
    })
  })

  it('exchanges Telegram auth data for a stored portal session', async () => {
    const storage = storageStub()
    const request = vi.fn(async () =>
      new Response(
        JSON.stringify({
          email: 'tg_12345678@eva.mba',
          delivery: 'telegram_verified',
          session: {
            accessToken: 'telegram-access-token',
            refreshToken: 'telegram-refresh-token',
            expiresIn: 600,
            tokenType: 'bearer',
          },
        }),
        { status: 200 },
      ),
    )

    await expect(
      requestWebPortalTelegramLogin({
        authData: {
          id: 12345678,
          first_name: 'Niko',
          username: 'niko_asta',
          auth_date: 1784550000,
          hash: 'a'.repeat(64),
        },
        env: {
          VITE_PORTAL_API_BASE: 'https://cut.eva.mba/api/portal',
          VITE_TELEGRAM_BOT_USERNAME: 'everville_portal_bot',
        },
        fetch: request as unknown as typeof fetch,
        storage,
        now: NOW,
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        email: 'tg_12345678@eva.mba',
        delivery: 'telegram_verified',
      },
    })

    expect(request).toHaveBeenCalledWith('https://cut.eva.mba/api/portal/auth/telegram', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        authData: {
          id: 12345678,
          first_name: 'Niko',
          username: 'niko_asta',
          auth_date: 1784550000,
          hash: 'a'.repeat(64),
        },
      }),
    })
    expect(readWebPortalSession(storage)).toEqual(
      expect.objectContaining({
        accessToken: 'telegram-access-token',
        refreshToken: 'telegram-refresh-token',
        expiresAt: NOW + 600_000,
      }),
    )
  })

  it('returns a portal client config only for current sessions', () => {
    const storage = storageStub()
    storeWebPortalSession(session(), storage)

    expect(
      getBrowserWebPortalClientConfig(
        {
          VITE_PORTAL_API_BASE: 'https://cut.eva.mba/api/portal',
        },
        storage,
        NOW,
      ),
    ).toEqual({
      endpoint: 'https://cut.eva.mba/api/portal',
      apiBase: 'https://cut.eva.mba/api/portal',
      bearer: 'user-access-token',
    })
  })

  it('exports and imports a current desktop sync token', () => {
    const webStorage = storageStub()
    const desktopStorage = storageStub()
    storeWebPortalSession(session(), webStorage)

    const token = createWebPortalDesktopSyncToken(webStorage, NOW)

    expect(token).toContain('nomi-desktop-portal-sync-token.v1')
    expect(storeWebPortalDesktopSyncToken(token || '', desktopStorage, NOW)).toBe(true)
    expect(readWebPortalSession(desktopStorage)).toEqual(expect.objectContaining({ accessToken: 'user-access-token' }))
    expect(
      getBrowserWebPortalClientConfig(
        {
          VITE_PORTAL_API_BASE: 'https://cut.eva.mba/api/portal',
        },
        desktopStorage,
        NOW,
      ),
    ).toEqual(expect.objectContaining({ bearer: 'user-access-token' }))
  })

  it('rejects expired desktop sync tokens', () => {
    const storage = storageStub()
    const expired = JSON.stringify({
      schemaVersion: 'nomi-desktop-portal-sync-token.v1',
      session: session({ expiresAt: NOW - 1 }),
    })

    expect(storeWebPortalDesktopSyncToken(expired, storage, NOW)).toBe(false)
    expect(readWebPortalSession(storage)).toBeNull()
  })

  it('clears expired sessions and fails closed', () => {
    const storage = storageStub()
    storeWebPortalSession(session({ expiresAt: NOW - 1 }), storage)

    expect(
      getBrowserWebPortalClientConfig(
        {
          VITE_PORTAL_API_BASE: 'https://cut.eva.mba/api/portal',
        },
        storage,
        NOW,
      ),
    ).toBeNull()
    expect(storage.removeItem).toHaveBeenCalledWith(WEB_PORTAL_SESSION_STORAGE_KEY)
  })

  it('keeps clear session best-effort and idempotent', () => {
    const storage = storageStub()
    storeWebPortalSession(session(), storage)
    clearWebPortalSession(storage)

    expect(readWebPortalSession(storage)).toBeNull()
  })
})
