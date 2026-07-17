import { describe, expect, it } from 'vitest'

type PlatformClientLike = {
  capabilities: ReadonlySet<string>
  supports(capability: string): boolean
  identity?: { getSession(): Promise<unknown> }
  authorization?: { check(request: unknown): Promise<unknown> }
  conversations: unknown
  assets: unknown
}

type ClientFactory = (...args: unknown[]) => PlatformClientLike

const LOCAL_SESSION = {
  state: 'authenticated',
  principal: {
    id: 'local-runtime:principal',
    kind: 'local-runtime',
    displayName: 'Local runtime',
  },
  activeMembership: {
    principalId: 'local-runtime:principal',
    organizationId: 'local-runtime:organization',
    status: 'active',
    organizationPermissions: [],
    projects: [],
  },
}

const LOCAL_PROJECT_PERMISSION_CASES = [
  ['project', 'project.read'],
  ['project', 'project.write'],
  ['asset', 'asset.read'],
  ['asset', 'asset.write'],
  ['generation-job', 'generation-job.read'],
  ['generation-job', 'generation-job.create'],
  ['generation-job', 'generation-job.cancel'],
  ['review', 'review.read'],
  ['review', 'review.write'],
  ['approval', 'approval.read'],
  ['approval', 'approval.decide'],
] as const

async function loadElectronFactory(): Promise<ClientFactory | undefined> {
  let loaded: Record<string, unknown> | undefined
  let loadError: unknown

  try {
    loaded = await import('./electronPlatformClient')
  } catch (error) {
    loadError = error
  }

  expect(loadError, 'electronPlatformClient.ts must be importable').toBeUndefined()
  expect(loaded?.createElectronPlatformClient).toBeTypeOf('function')

  return typeof loaded?.createElectronPlatformClient === 'function'
    ? (loaded.createElectronPlatformClient as ClientFactory)
    : undefined
}

async function loadBrowserFactory(): Promise<ClientFactory | undefined> {
  let loaded: Record<string, unknown> | undefined
  let loadError: unknown

  try {
    loaded = await import('./browserPlatformClient')
  } catch (error) {
    loadError = error
  }

  expect(loadError, 'browserPlatformClient.ts must be importable').toBeUndefined()
  expect(loaded?.createBrowserPlatformClient).toBeTypeOf('function')

  return typeof loaded?.createBrowserPlatformClient === 'function'
    ? (loaded.createBrowserPlatformClient as ClientFactory)
    : undefined
}

function localResource(family: string) {
  return {
    family,
    ...(family === 'project' ? {} : { resourceId: `${family}-1` }),
    scope: {
      kind: 'project',
      organizationId: 'local-runtime:organization',
      projectId: 'explicit-project-1',
    },
  }
}

function hasAuthorizationSurfaces(client: PlatformClientLike): client is PlatformClientLike & {
  identity: NonNullable<PlatformClientLike['identity']>
  authorization: NonNullable<PlatformClientLike['authorization']>
} {
  expect(client.identity, 'PlatformClient.identity must exist').toBeDefined()
  expect(client.authorization, 'PlatformClient.authorization must exist').toBeDefined()
  return client.identity !== undefined && client.authorization !== undefined
}

describe('Electron platform authorization adapter', () => {
  it('advertises identity and authorization first while preserving existing service surfaces', async () => {
    const createClient = await loadElectronFactory()
    if (!createClient) return

    const client = createClient({})

    expect([...client.capabilities].slice(0, 2)).toEqual(['identity.session.read', 'authorization.check'])
    expect(client.supports('identity.session.read')).toBe(true)
    expect(client.supports('authorization.check')).toBe(true)
    if (!hasAuthorizationSurfaces(client)) return
    expect(client.identity.getSession).toBeTypeOf('function')
    expect(client.authorization.check).toBeTypeOf('function')
    expect(client.conversations).toBeDefined()
    expect(client.assets).toBeDefined()
  })

  it('returns the exact synthetic local-only session without persisted project grants', async () => {
    const createClient = await loadElectronFactory()
    if (!createClient) return

    const client = createClient({})
    if (!hasAuthorizationSurfaces(client)) return
    await expect(client.identity.getSession()).resolves.toEqual({ ok: true, value: LOCAL_SESSION })
  })

  it.each(LOCAL_PROJECT_PERMISSION_CASES)(
    'authorizes explicit local %s scope with %s through an ephemeral project grant',
    async (family, permission) => {
      const createClient = await loadElectronFactory()
      if (!createClient) return

      const client = createClient({})
      if (!hasAuthorizationSurfaces(client)) return
      await expect(client.authorization.check({ resource: localResource(family), permission })).resolves.toEqual({
        ok: true,
        value: { allowed: true, reason: 'ALLOW_EXPLICIT_PERMISSION' },
      })

      await expect(client.identity.getSession()).resolves.toEqual({ ok: true, value: LOCAL_SESSION })
    },
  )

  it('returns organization administration denial as a successful policy result', async () => {
    const createClient = await loadElectronFactory()
    if (!createClient) return

    const client = createClient({})
    if (!hasAuthorizationSurfaces(client)) return
    await expect(
      client.authorization.check({
        resource: {
          family: 'organization',
          scope: {
            kind: 'organization',
            organizationId: 'local-runtime:organization',
          },
        },
        permission: 'organization.admin',
      }),
    ).resolves.toEqual({
      ok: true,
      value: { allowed: false, reason: 'DENY_PERMISSION_NOT_GRANTED' },
    })
  })

  it('denies a foreign organization without replacing the caller scope', async () => {
    const createClient = await loadElectronFactory()
    if (!createClient) return

    const client = createClient({})
    if (!hasAuthorizationSurfaces(client)) return
    const request = {
      resource: {
        family: 'asset',
        resourceId: 'asset-1',
        scope: {
          kind: 'project',
          organizationId: 'foreign-organization',
          projectId: 'explicit-project-1',
        },
      },
      permission: 'asset.read',
    }

    await expect(client.authorization.check(request)).resolves.toEqual({
      ok: true,
      value: { allowed: false, reason: 'DENY_ORGANIZATION_SCOPE_MISMATCH' },
    })
    expect(request.resource.scope.organizationId).toBe('foreign-organization')
  })

  it('passes malformed and incompatible requests through the normal policy denial path', async () => {
    const createClient = await loadElectronFactory()
    if (!createClient) return

    const client = createClient({})
    if (!hasAuthorizationSurfaces(client)) return

    await expect(
      client.authorization.check({ resource: { family: 'project', scope: null }, permission: 'project.read' }),
    ).resolves.toEqual({
      ok: true,
      value: { allowed: false, reason: 'DENY_MALFORMED_REQUEST' },
    })

    await expect(
      client.authorization.check({
        resource: localResource('asset'),
        permission: 'project.read',
      }),
    ).resolves.toEqual({
      ok: true,
      value: { allowed: false, reason: 'DENY_PERMISSION_NOT_APPLICABLE' },
    })
  })
})

describe('browser-safe platform authorization adapter', () => {
  it('advertises only unauthenticated identity in stable capability order', async () => {
    const createClient = await loadBrowserFactory()
    if (!createClient) return

    const client = createClient()

    expect([...client.capabilities]).toEqual(['identity.session.read'])
    expect(client.supports('identity.session.read')).toBe(true)
    expect(client.supports('authorization.check')).toBe(false)
    if (!hasAuthorizationSurfaces(client)) return
    await expect(client.identity.getSession()).resolves.toEqual({
      ok: true,
      value: { state: 'unauthenticated' },
    })
  })

  it('returns typed unsupported authorization without inferring browser authority', async () => {
    const createClient = await loadBrowserFactory()
    if (!createClient) return

    const client = createClient()
    if (!hasAuthorizationSurfaces(client)) return
    const result = await client.authorization.check({
      resource: localResource('project'),
      permission: 'project.read',
      activeMembership: LOCAL_SESSION.activeMembership,
      accessToken: 'caller-controlled',
    })

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'UNSUPPORTED_CAPABILITY',
        capability: 'authorization.check',
        retryable: false,
      },
    })
    expect(JSON.stringify(result)).not.toContain('caller-controlled')
  })

  it('preserves the existing conversation and asset service surfaces', async () => {
    const createClient = await loadBrowserFactory()
    if (!createClient) return

    const client = createClient()
    expect(client.conversations).toBeDefined()
    expect(client.assets).toBeDefined()
  })
})
