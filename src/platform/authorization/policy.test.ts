import { describe, expect, it } from 'vitest'

type Decision = { allowed: boolean; reason: string }
type EvaluateAuthorization = (request: unknown) => Decision

const ORGANIZATION_ID = 'organization-1'
const PROJECT_ID = 'project-1'
const PRINCIPAL_ID = 'principal-1'

const PROJECT_PERMISSION_CASES = [
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

const ALL_PROJECT_PERMISSIONS = PROJECT_PERMISSION_CASES.map(([, permission]) => permission)

async function loadEvaluateAuthorization(): Promise<EvaluateAuthorization | undefined> {
  let loaded: Record<string, unknown> | undefined
  let loadError: unknown

  try {
    loaded = await import('./policy')
  } catch (error) {
    loadError = error
  }

  expect(loadError, 'authorization/policy.ts must be importable').toBeUndefined()
  expect(loaded?.evaluateAuthorization, 'evaluateAuthorization must be exported').toBeTypeOf('function')

  return typeof loaded?.evaluateAuthorization === 'function'
    ? (loaded.evaluateAuthorization as EvaluateAuthorization)
    : undefined
}

function projectResource(family: string, overrides: Record<string, unknown> = {}) {
  const resource: Record<string, unknown> = {
    family,
    scope: {
      kind: 'project',
      organizationId: ORGANIZATION_ID,
      projectId: PROJECT_ID,
    },
    ...overrides,
  }

  if (family !== 'project' && !Object.prototype.hasOwnProperty.call(overrides, 'resourceId')) {
    resource.resourceId = `${family}-1`
  }

  return resource
}

function authenticatedRequest(
  permission = 'project.read',
  resource: Record<string, unknown> = projectResource('project'),
  overrides: Record<string, unknown> = {},
) {
  return {
    session: {
      state: 'authenticated',
      principal: {
        id: PRINCIPAL_ID,
        kind: 'human',
        displayName: 'Test principal',
      },
      activeMembership: {
        principalId: PRINCIPAL_ID,
        organizationId: ORGANIZATION_ID,
        status: 'active',
        organizationPermissions: [],
        projects: [
          {
            projectId: PROJECT_ID,
            permissions: [...ALL_PROJECT_PERMISSIONS],
          },
        ],
      },
    },
    resource,
    permission,
    ...overrides,
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}

describe('evaluateAuthorization applicable permissions', () => {
  it.each(PROJECT_PERMISSION_CASES)(
    'allows explicit %s permission %s in the exact organization and project',
    async (family, permission) => {
      const evaluate = await loadEvaluateAuthorization()
      if (!evaluate) return

      expect(evaluate(authenticatedRequest(permission, projectResource(family)))).toEqual({
        allowed: true,
        reason: 'ALLOW_EXPLICIT_PERMISSION',
      })
    },
  )

  it('allows organization administration only from the organization permission list', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest('organization.admin', {
      family: 'organization',
      scope: { kind: 'organization', organizationId: ORGANIZATION_ID },
    })
    ;(request.session.activeMembership as Record<string, unknown>).organizationPermissions = ['organization.admin']

    expect(evaluate(request)).toEqual({
      allowed: true,
      reason: 'ALLOW_EXPLICIT_PERMISSION',
    })
  })

  it.each([
    ['organization', 'project.read'],
    ['project', 'asset.read'],
    ['asset', 'project.read'],
    ['generation-job', 'review.read'],
    ['review', 'approval.read'],
    ['approval', 'organization.admin'],
  ])('does not reinterpret %s resources with %s', async (family, permission) => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const resource =
      family === 'organization'
        ? {
            family,
            scope: { kind: 'organization', organizationId: ORGANIZATION_ID },
          }
        : projectResource(family)

    expect(evaluate(authenticatedRequest(permission, resource))).toEqual({
      allowed: false,
      reason: 'DENY_PERMISSION_NOT_APPLICABLE',
    })
  })
})

describe('evaluateAuthorization first-match deny order', () => {
  it('validates the complete request before checking authentication state', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    expect(
      evaluate({
        session: { state: 'unauthenticated' },
        resource: { family: 'project', scope: null },
        permission: 'project.read',
      }),
    ).toEqual({ allowed: false, reason: 'DENY_MALFORMED_REQUEST' })
  })

  it('denies an unauthenticated session', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest()
    request.session = { state: 'unauthenticated' } as typeof request.session

    expect(evaluate(request)).toEqual({ allowed: false, reason: 'DENY_UNAUTHENTICATED' })
  })

  it('denies an authenticated principal with no active membership', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest()
    request.session.activeMembership = null as never

    expect(evaluate(request)).toEqual({
      allowed: false,
      reason: 'DENY_NO_ACTIVE_MEMBERSHIP',
    })
  })

  it('denies an inactive membership before principal or scope mismatches', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest()
    request.session.activeMembership.status = 'inactive'
    request.session.activeMembership.principalId = 'another-principal'
    request.session.activeMembership.organizationId = 'another-organization'

    expect(evaluate(request)).toEqual({
      allowed: false,
      reason: 'DENY_INACTIVE_MEMBERSHIP',
    })
  })

  it('denies a principal mismatch before organization scope', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest()
    request.session.activeMembership.principalId = 'another-principal'
    request.session.activeMembership.organizationId = 'another-organization'

    expect(evaluate(request)).toEqual({
      allowed: false,
      reason: 'DENY_PRINCIPAL_MISMATCH',
    })
  })

  it('denies an organization mismatch before permission applicability or project matching', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest('organization.admin', projectResource('project'))
    request.session.activeMembership.organizationId = 'another-organization'
    request.session.activeMembership.projects = []

    expect(evaluate(request)).toEqual({
      allowed: false,
      reason: 'DENY_ORGANIZATION_SCOPE_MISMATCH',
    })
  })

  it('denies a missing exact project before checking its permission list', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest()
    request.session.activeMembership.projects = [{ projectId: 'project-10', permissions: ['project.read'] }]

    expect(evaluate(request)).toEqual({
      allowed: false,
      reason: 'DENY_PROJECT_SCOPE_MISMATCH',
    })
  })

  it('denies an applicable but ungranted project permission', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest('asset.write', projectResource('asset'))
    request.session.activeMembership.projects[0].permissions = ['asset.read']

    expect(evaluate(request)).toEqual({
      allowed: false,
      reason: 'DENY_PERMISSION_NOT_GRANTED',
    })
  })

  it('keeps organization administration separate from all project permissions', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const organizationRequest = authenticatedRequest('organization.admin', {
      family: 'organization',
      scope: { kind: 'organization', organizationId: ORGANIZATION_ID },
    })

    expect(evaluate(organizationRequest)).toEqual({
      allowed: false,
      reason: 'DENY_PERMISSION_NOT_GRANTED',
    })

    const projectRequest = authenticatedRequest('project.read')
    projectRequest.session.activeMembership.organizationPermissions = ['organization.admin']
    projectRequest.session.activeMembership.projects[0].permissions = []

    expect(evaluate(projectRequest)).toEqual({
      allowed: false,
      reason: 'DENY_PERMISSION_NOT_GRANTED',
    })
  })
})

describe('evaluateAuthorization validation and hostile inputs', () => {
  it.each([
    ['null request', null],
    ['array request', []],
    ['unknown permission', authenticatedRequest('project.*')],
    [
      'non-string identifier',
      (() => {
        const request = authenticatedRequest()
        request.session.principal.id = 42 as never
        return request
      })(),
    ],
    [
      'empty identifier',
      (() => {
        const request = authenticatedRequest()
        request.session.principal.id = ''
        return request
      })(),
    ],
    [
      'untrimmed identifier',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.organizationId = ` ${ORGANIZATION_ID}`
        return request
      })(),
    ],
    [
      'identifier longer than 256 code units',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.projects[0].projectId = 'p'.repeat(257)
        return request
      })(),
    ],
    [
      'non-string display name',
      (() => {
        const request = authenticatedRequest()
        request.session.principal.displayName = false as never
        return request
      })(),
    ],
    [
      'unknown principal kind',
      (() => {
        const request = authenticatedRequest()
        request.session.principal.kind = 'service' as never
        return request
      })(),
    ],
    [
      'unknown membership status',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.status = 'pending'
        return request
      })(),
    ],
    [
      'organization family with project scope',
      authenticatedRequest('organization.admin', {
        family: 'organization',
        scope: { kind: 'project', organizationId: ORGANIZATION_ID, projectId: PROJECT_ID },
      }),
    ],
    [
      'project family with organization scope',
      authenticatedRequest('project.read', {
        family: 'project',
        scope: { kind: 'organization', organizationId: ORGANIZATION_ID },
      }),
    ],
    [
      'asset without resource ID',
      authenticatedRequest(
        'asset.read',
        projectResource('asset', {
          resourceId: undefined,
        }),
      ),
    ],
    [
      'duplicate organization permissions',
      (() => {
        const request = authenticatedRequest('organization.admin', {
          family: 'organization',
          scope: { kind: 'organization', organizationId: ORGANIZATION_ID },
        })
        request.session.activeMembership.organizationPermissions = ['organization.admin', 'organization.admin']
        return request
      })(),
    ],
    [
      'project permission in organization permissions',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.organizationPermissions = ['project.read']
        return request
      })(),
    ],
    [
      'duplicate project IDs',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.projects.push({
          projectId: PROJECT_ID,
          permissions: ['project.read'],
        })
        return request
      })(),
    ],
    [
      'duplicate project permissions',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.projects[0].permissions = ['project.read', 'project.read']
        return request
      })(),
    ],
    [
      'organization permission in project permissions',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.projects[0].permissions = ['organization.admin']
        return request
      })(),
    ],
    [
      'array-like projects object',
      (() => {
        const request = authenticatedRequest()
        request.session.activeMembership.projects = {
          0: { projectId: PROJECT_ID, permissions: ['project.read'] },
          length: 1,
        } as never
        return request
      })(),
    ],
  ])('returns malformed without throwing for %s', async (_label, hostile) => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    expect(() => evaluate(hostile)).not.toThrow()
    expect(evaluate(hostile)).toEqual({
      allowed: false,
      reason: 'DENY_MALFORMED_REQUEST',
    })
  })

  it('does not accept inherited prototype authority', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const inherited = Object.create(authenticatedRequest())

    expect(evaluate(inherited)).toEqual({
      allowed: false,
      reason: 'DENY_MALFORMED_REQUEST',
    })
  })

  it('catches accessor and proxy failures without leaking attacker diagnostics', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const diagnostic = 'access-token=attacker-controlled-secret'
    const throwingGetter = authenticatedRequest()
    Object.defineProperty(throwingGetter, 'permission', {
      enumerable: true,
      get() {
        throw new Error(diagnostic)
      },
    })
    const throwingProxy = new Proxy(authenticatedRequest(), {
      get() {
        throw new Error(diagnostic)
      },
    })

    for (const hostile of [throwingGetter, throwingProxy]) {
      expect(() => evaluate(hostile)).not.toThrow()
      const decision = evaluate(hostile)
      expect(decision).toEqual({ allowed: false, reason: 'DENY_MALFORMED_REQUEST' })
      expect(JSON.stringify(decision)).not.toContain(diagnostic)
    }
  })

  it('ignores credential-like and role-like extras without turning them into authority', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = authenticatedRequest('approval.decide', projectResource('approval'))
    request.session.activeMembership.projects[0].permissions = []
    Object.assign(request, {
      accessToken: 'secret-token',
      role: 'owner',
      isAdmin: true,
      permission: 'approval.decide',
    })
    Object.assign(request.session, { cookie: 'session-cookie' })
    Object.assign(request.session.activeMembership, { providerError: 'diagnostic-secret' })

    const decision = evaluate(request)
    expect(decision).toEqual({ allowed: false, reason: 'DENY_PERMISSION_NOT_GRANTED' })
    expect(Object.keys(decision)).toEqual(['allowed', 'reason'])
    expect(JSON.stringify(decision)).not.toMatch(/secret|cookie|provider/i)
  })

  it('uses exact string comparison without case, prefix, wildcard, or Unicode normalization', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const projectCase = authenticatedRequest()
    projectCase.session.activeMembership.projects[0].projectId = 'Project-1'
    expect(evaluate(projectCase)).toEqual({
      allowed: false,
      reason: 'DENY_PROJECT_SCOPE_MISMATCH',
    })

    const organizationCase = authenticatedRequest()
    organizationCase.session.activeMembership.organizationId = 'Organization-1'
    expect(evaluate(organizationCase)).toEqual({
      allowed: false,
      reason: 'DENY_ORGANIZATION_SCOPE_MISMATCH',
    })

    const unicode = authenticatedRequest()
    ;(unicode.resource.scope as Record<string, unknown>).projectId = 'café'
    unicode.session.activeMembership.projects[0].projectId = 'cafe\u0301'
    expect(evaluate(unicode)).toEqual({
      allowed: false,
      reason: 'DENY_PROJECT_SCOPE_MISMATCH',
    })

    expect(evaluate(authenticatedRequest('project.*'))).toEqual({
      allowed: false,
      reason: 'DENY_MALFORMED_REQUEST',
    })
  })

  it('is deterministic, immutable, and safe for deeply frozen input', async () => {
    const evaluate = await loadEvaluateAuthorization()
    if (!evaluate) return

    const request = deepFreeze(authenticatedRequest('review.write', projectResource('review')))
    const before = JSON.stringify(request)
    const decisions = Array.from({ length: 10 }, () => evaluate(request))

    expect(decisions).toEqual(
      Array.from({ length: 10 }, () => ({
        allowed: true,
        reason: 'ALLOW_EXPLICIT_PERMISSION',
      })),
    )
    expect(JSON.stringify(request)).toBe(before)
  })
})
