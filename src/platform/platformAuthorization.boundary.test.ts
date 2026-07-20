import { describe, expect, it } from 'vitest'

async function readRequiredSource(path: string): Promise<string> {
  let source = ''
  let readError: unknown

  try {
    const { readFile } = await import('node:fs/promises')
    source = await readFile(new URL(path, import.meta.url), 'utf8')
  } catch (error) {
    readError = error
  }

  expect(readError, `${path} must exist and be readable`).toBeUndefined()
  return source
}

function importSpecifiers(source: string): string[] {
  return [...source.matchAll(/(?:from\s*|import\s*)[(']\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

describe('authorization public-module boundary', () => {
  it.each(['./authorization/contracts.ts', './authorization/policy.ts', './organizations/contracts.ts'])(
    '%s has no Node, Electron, DOM, provider, transport, or persistence dependency',
    async (path) => {
      const source = await readRequiredSource(path)
      const imports = importSpecifiers(source)

      expect(imports).toEqual(
        imports.filter(
          (specifier) => !/^(?:node:|electron$)|(?:^|\/)(?:electron|desktop|preload|main)(?:\/|$)/i.test(specifier),
        ),
      )
      expect(imports.join('\n')).not.toMatch(
        /supabase|firebase|auth0|clerk|cognito|okta|workos|keycloak|passport|next-auth|better-auth|vercel|aws|gcp|azure/i,
      )
      expect(source).not.toMatch(
        /\b(?:window|document|localStorage|sessionStorage|indexedDB|process|Buffer|Deno|Bun)\b/,
      )
      expect(source).not.toMatch(
        /\b(?:fetch|XMLHttpRequest|WebSocket|database|migration|repository|transport|ipcRenderer|ipcMain)\b/i,
      )
    },
  )

  it('keeps contracts and decisions free of token, cookie, credential, provider, and privileged-service fields', async () => {
    const contracts = await readRequiredSource('./authorization/contracts.ts')
    const policy = await readRequiredSource('./authorization/policy.ts')
    const publicAuthorizationSource = `${contracts}\n${policy}`

    expect(publicAuthorizationSource).not.toMatch(
      /\b(?:accessToken|refreshToken|idToken|sessionId|expiresAt|refreshAt|cookie|password|credential|clientSecret|apiKey|privateKey|serviceRoleKey|providerError|providerIdentity|servicePrincipal)\b/,
    )
    expect(publicAuthorizationSource).not.toMatch(
      /\b(?:adminClient|privilegedClient|serviceRole|superuser|rootKey|masterKey)\b/,
    )
    expect(publicAuthorizationSource).not.toMatch(
      /\b(?:SUPABASE|FIREBASE|AUTH0|CLERK|COGNITO|OKTA|WORKOS|DATABASE_URL|SERVICE_ROLE)_[A-Z0-9_]+\b/,
    )
  })

  it('keeps the browser adapter free of desktop, Electron, Node, storage, cookie, and provider imports', async () => {
    const browserSource = await readRequiredSource('./browserPlatformClient.ts')
    const imports = importSpecifiers(browserSource)

    expect(imports.join('\n')).not.toMatch(/electron|desktop|node:|preload|ipc|supabase|auth0|clerk/i)
    expect(browserSource).not.toMatch(
      /\b(?:window|document|localStorage|sessionStorage|indexedDB|cookie|accessToken|refreshToken|credential)\b/,
    )
  })
})

describe('authorization repository boundary', () => {
  it('does not modify tracked frozen RFC drafts or introduce untracked production migrations', async () => {
    const allowedMigrationPaths = new Set([
      'supabase/migrations/20260719141528_everville_portal_auth_rls.sql',
      'supabase/migrations/20260720014246_app_fk_indexes.sql',
      'supabase/migrations/20260720030000_portal_revision_rpc.sql',
      'supabase/migrations/20260720034022_portal_approval_rpc.sql',
    ])
    let changedEntries: Array<{ status: string; path: string }> = []
    let gitError: unknown

    try {
      const { execFileSync } = await import('node:child_process')
      const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
        cwd: process.cwd(),
        encoding: 'utf8',
      })
      changedEntries = status
        .split('\n')
        .filter(Boolean)
        .map((line) => ({ status: line.slice(0, 2), path: line.slice(3) }))
    } catch (error) {
      gitError = error
    }

    expect(gitError, 'git boundary inventory must be available').toBeUndefined()
    expect(
      changedEntries.filter(({ status, path }) => status !== '??' && /everville-media-platform-.*\.md$/i.test(path)),
    ).toEqual([])
    expect(
      changedEntries.filter(
        ({ path }) =>
          /(?:^|\/)(?:migrations?|schema\/migrations?)(?:\/|$)|\.sql$/i.test(path) && !allowedMigrationPaths.has(path),
      ),
    ).toEqual([])
  })
})
