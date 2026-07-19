import { describe, expect, it } from 'vitest'

import {
  defaultPermissionsForRole,
  ORGANIZATION_CAPABILITIES,
  parseOrganizationRecord,
  parseWorkspaceMembershipRecord,
  parseWorkspaceRecord,
  type OrganizationRecord,
  type WorkspaceMembershipRecord,
  type WorkspaceRecord,
} from './contracts'

const CREATED_AT = '2026-07-19T00:00:00.000Z'
const UPDATED_AT = '2026-07-19T01:00:00.000Z'

function organization(overrides: Partial<OrganizationRecord> = {}): OrganizationRecord {
  return {
    schemaVersion: 'organization.v1',
    id: 'org-everville',
    slug: 'everville',
    name: 'Everville',
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  }
}

function workspace(overrides: Partial<WorkspaceRecord> = {}): WorkspaceRecord {
  return {
    schemaVersion: 'workspace.v1',
    id: 'workspace-content',
    organizationId: 'org-everville',
    slug: 'content-team',
    name: 'Content Team',
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  }
}

function membership(overrides: Partial<WorkspaceMembershipRecord> = {}): WorkspaceMembershipRecord {
  return {
    schemaVersion: 'workspace-membership.v1',
    id: 'membership-producer',
    organizationId: 'org-everville',
    workspaceId: 'workspace-content',
    principalId: 'principal-niko',
    status: 'active',
    roles: ['producer'],
    organizationPermissions: [],
    workspacePermissions: ['project.read', 'project.write', 'asset.read', 'asset.write', 'review.read'],
    projects: [
      {
        projectId: 'project-cash-on-rails',
        permissions: ['project.read', 'project.write', 'asset.read', 'asset.write'],
      },
    ],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  }
}

describe('organization platform contracts', () => {
  it('declares stable organization capabilities', () => {
    expect(ORGANIZATION_CAPABILITIES).toEqual(['org.organizations.list', 'org.workspaces.list', 'org.memberships.list'])
    expect(new Set(ORGANIZATION_CAPABILITIES).size).toBe(ORGANIZATION_CAPABILITIES.length)
  })

  it('accepts canonical organization, workspace, and membership records', () => {
    expect(parseOrganizationRecord(organization())).toEqual(organization())
    expect(parseWorkspaceRecord(workspace())).toEqual(workspace())
    expect(parseWorkspaceMembershipRecord(membership())).toEqual(membership())
  })

  it('rejects unsafe authority, locator, and secret shaped fields', () => {
    expect(() => parseOrganizationRecord(organization({ id: 'https://example.test/org' }))).toThrow()
    expect(() => parseWorkspaceRecord({ ...workspace(), slug: 'Content Team' })).toThrow()
    expect(() => parseWorkspaceRecord({ ...workspace(), path: '/Users/niko.dev/private' })).toThrow()
    expect(() =>
      parseWorkspaceMembershipRecord({
        ...membership(),
        serviceRoleKey: 'placeholder',
      }),
    ).toThrow()
    expect(() =>
      parseWorkspaceMembershipRecord({
        ...membership(),
        projects: [{ projectId: 'file:/private/project', permissions: ['project.read'] }],
      }),
    ).toThrow()
  })

  it('rejects duplicate roles, permissions, and project grants', () => {
    expect(() => parseWorkspaceMembershipRecord(membership({ roles: ['producer', 'producer'] }))).toThrow()
    expect(() =>
      parseWorkspaceMembershipRecord(membership({ workspacePermissions: ['project.read', 'project.read'] })),
    ).toThrow()
    expect(() =>
      parseWorkspaceMembershipRecord(
        membership({
          projects: [
            { projectId: 'project-cash-on-rails', permissions: ['project.read'] },
            { projectId: 'project-cash-on-rails', permissions: ['project.write'] },
          ],
        }),
      ),
    ).toThrow()
  })

  it('keeps role defaults separate from membership enforcement grants', () => {
    expect(defaultPermissionsForRole('admin')).toContain('organization.admin')
    expect(defaultPermissionsForRole('viewer')).toEqual([
      'project.read',
      'asset.read',
      'generation-job.read',
      'review.read',
      'approval.read',
    ])
    expect(parseWorkspaceMembershipRecord(membership({ roles: ['admin'], organizationPermissions: [] }))).toEqual(
      expect.objectContaining({
        roles: ['admin'],
        organizationPermissions: [],
      }),
    )
  })
})
