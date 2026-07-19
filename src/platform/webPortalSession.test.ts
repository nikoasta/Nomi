import { describe, expect, it, vi } from 'vitest'

import {
  clearWebPortalSession,
  getBrowserWebPortalClientConfig,
  initializeWebPortalSessionFromLocation,
  parseWebPortalSessionFromUrl,
  readWebPortalRuntimeEnv,
  readWebPortalSession,
  storeWebPortalSession,
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
  it('reads only public Vite Supabase portal environment', () => {
    expect(
      readWebPortalRuntimeEnv({
        VITE_SUPABASE_URL: 'https://project.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_live',
      }),
    ).toEqual({
      endpoint: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_live',
    })
    expect(readWebPortalRuntimeEnv({ VITE_SUPABASE_URL: 'https://project.supabase.co' })).toBeNull()
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

  it('returns a portal client config only for current sessions', () => {
    const storage = storageStub()
    storeWebPortalSession(session(), storage)

    expect(
      getBrowserWebPortalClientConfig(
        {
          VITE_SUPABASE_URL: 'https://project.supabase.co',
          VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_live',
        },
        storage,
        NOW,
      ),
    ).toEqual({
      endpoint: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_live',
      bearer: 'user-access-token',
    })
  })

  it('clears expired sessions and fails closed', () => {
    const storage = storageStub()
    storeWebPortalSession(session({ expiresAt: NOW - 1 }), storage)

    expect(
      getBrowserWebPortalClientConfig(
        {
          VITE_SUPABASE_URL: 'https://project.supabase.co',
          VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_live',
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
