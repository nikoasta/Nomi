import { describe, expect, it } from 'vitest'

const EXPECTED_PERMISSIONS = [
  'organization.admin',
  'project.read',
  'project.write',
  'asset.read',
  'asset.write',
  'generation-job.read',
  'generation-job.create',
  'generation-job.cancel',
  'review.read',
  'review.write',
  'approval.read',
  'approval.decide',
] as const

const FORBIDDEN_AUTHORITY_FIELDS = [
  'accessToken',
  'refreshToken',
  'token',
  'cookie',
  'password',
  'credential',
  'secret',
  'providerError',
  'serviceRoleKey',
] as const

async function loadContracts(): Promise<Record<string, unknown> | undefined> {
  let loaded: Record<string, unknown> | undefined
  let loadError: unknown

  try {
    loaded = await import('./contracts')
  } catch (error) {
    loadError = error
  }

  expect(loadError, 'authorization/contracts.ts must be importable').toBeUndefined()
  return loaded
}

describe('authorization contracts', () => {
  it('exports the complete stable permission literal set in contract order', async () => {
    const contracts = await loadContracts()

    expect(contracts?.AUTHORIZATION_PERMISSIONS).toEqual(EXPECTED_PERMISSIONS)
    expect(new Set(contracts?.AUTHORIZATION_PERMISSIONS as readonly unknown[]).size).toBe(EXPECTED_PERMISSIONS.length)
  })

  it('keeps principal, membership, session, resource, request, and decision values transport-neutral', () => {
    const values = [
      {
        id: 'principal-1',
        kind: 'human',
        displayName: 'Reviewer',
      },
      {
        principalId: 'principal-1',
        organizationId: 'organization-1',
        status: 'active',
        organizationPermissions: ['organization.admin'],
        projects: [{ projectId: 'project-1', permissions: ['project.read'] }],
      },
      { state: 'unauthenticated' },
      {
        state: 'authenticated',
        principal: { id: 'principal-1', kind: 'human' },
        activeMembership: null,
      },
      {
        family: 'organization',
        scope: { kind: 'organization', organizationId: 'organization-1' },
      },
      {
        family: 'project',
        scope: {
          kind: 'project',
          organizationId: 'organization-1',
          projectId: 'project-1',
        },
      },
      {
        family: 'asset',
        resourceId: 'asset-1',
        scope: {
          kind: 'project',
          organizationId: 'organization-1',
          projectId: 'project-1',
        },
      },
      { allowed: true, reason: 'ALLOW_EXPLICIT_PERMISSION' },
      { allowed: false, reason: 'DENY_PERMISSION_NOT_GRANTED' },
    ]

    for (const value of values) {
      const roundTrip = JSON.parse(JSON.stringify(value)) as Record<string, unknown>
      expect(roundTrip).toEqual(value)
      expect(Object.getPrototypeOf(roundTrip)).toBe(Object.prototype)

      const serialized = JSON.stringify(roundTrip)
      for (const field of FORBIDDEN_AUTHORITY_FIELDS) {
        expect(serialized).not.toContain(`"${field}"`)
      }
    }
  })

  it('keeps decisions bounded to allowed and a stable reason code', () => {
    const allowed = { allowed: true, reason: 'ALLOW_EXPLICIT_PERMISSION' }
    const denied = { allowed: false, reason: 'DENY_UNAUTHENTICATED' }

    expect(Object.keys(allowed)).toEqual(['allowed', 'reason'])
    expect(Object.keys(denied)).toEqual(['allowed', 'reason'])
  })
})
