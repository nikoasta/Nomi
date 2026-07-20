import { describe, expect, it, vi } from 'vitest'

import { createBrowserPlatformClient } from './browserPlatformClient'
import { createWebPortalServices } from './webPortalClient'

const ENDPOINT = 'https://project.supabase.co'
const PUBLISHABLE = 'sb_publishable_test'
const BEARER = 'user-session-jwt'
const NOW = '2026-07-19T00:00:00.000Z'
const SUPABASE_NOW = '2026-07-19T00:00:00+00:00'

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('web portal PlatformClient adapter', () => {
  it('fails closed in the browser client until a user portal session is configured', async () => {
    const client = createBrowserPlatformClient()

    expect([...client.capabilities]).toEqual(['identity.session.read'])
    expect(client.supports('org.organizations.list')).toBe(false)
    await expect(client.organizations.listOrganizations()).resolves.toEqual({
      ok: false,
      error: expect.objectContaining({
        code: 'UNSUPPORTED_CAPABILITY',
        capability: 'org.organizations.list',
      }),
    })
  })

  it('advertises portal capabilities only with a valid publishable user session config', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/auth/v1/user')) return response({ id: 'principal-1', email: 'team@example.test' })
      return response([])
    })
    const client = createBrowserPlatformClient({
      portal: {
        endpoint: ENDPOINT,
        publishableKey: PUBLISHABLE,
        bearer: BEARER,
        fetch: fetchMock as unknown as typeof fetch,
      },
    })

    expect([...client.capabilities]).toEqual([
      'identity.session.read',
      'org.organizations.list',
      'org.workspaces.list',
      'org.memberships.list',
      'portal.projects.list',
      'portal.projects.create',
      'portal.project-revisions.save',
      'portal.review-queue.list',
      'portal.approvals.decide',
      'portal.audit-events.append',
    ])
    expect(client.supports('org.memberships.list')).toBe(true)
    expect(client.supports('portal.projects.create')).toBe(true)
    expect(client.supports('portal.project-revisions.save')).toBe(true)
    expect(client.supports('portal.review-queue.list')).toBe(true)
    expect(client.supports('portal.approvals.decide')).toBe(true)
    await expect(client.identity.getSession()).resolves.toEqual({
      ok: true,
      value: {
        state: 'authenticated',
        principal: { id: 'principal-1', kind: 'human', displayName: 'team@example.test' },
        activeMembership: null,
      },
    })
  })

  it('uses the server-side portal API without exposing Supabase keys in browser data calls', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/identity/session')) return response({ id: 'principal-1', email: 'team@example.test' })
      if (url.endsWith('/query') && init?.method === 'POST') {
        return response([
          {
            id: 'org-everville',
            slug: 'everville',
            name: 'Everville',
            status: 'active',
            created_at: SUPABASE_NOW,
            updated_at: SUPABASE_NOW,
          },
        ])
      }
      if (url.endsWith('/rpc/save_project_revision') && init?.method === 'POST') {
        return response([
          {
            id: 'revision-001',
            organization_id: 'org-everville',
            workspace_id: 'workspace-content',
            project_id: 'project-cash-on-rails',
            revision_number: 1,
            snapshot_digest: 'a'.repeat(64),
            parent_revision_id: null,
            created_by_user_id: 'principal-niko',
            created_at: SUPABASE_NOW,
          },
        ])
      }
      return response([], { status: 404 })
    })
    const services = createWebPortalServices({
      endpoint: 'https://cut.eva.mba/api/portal',
      apiBase: 'https://cut.eva.mba/api/portal',
      bearer: BEARER,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(services.identity.getSession()).resolves.toEqual({
      ok: true,
      value: {
        state: 'authenticated',
        principal: { id: 'principal-1', kind: 'human', displayName: 'team@example.test' },
        activeMembership: null,
      },
    })
    await expect(services.organizations.listOrganizations({ limit: 10 })).resolves.toEqual({
      ok: true,
      value: {
        items: [
          expect.objectContaining({
            schemaVersion: 'organization.v1',
            id: 'org-everville',
          }),
        ],
        cursor: null,
      },
    })
    await expect(
      services.collaboration.saveProjectRevision({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        expectedCurrentRevisionId: null,
        snapshotDigest: 'a'.repeat(64),
        snapshot: { schemaVersion: 'nomi-project.v1', title: 'Cash on Rails' },
        idempotencyKey: 'revision-cash-on-rails-1',
      }),
    ).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({
        schemaVersion: 'portal-project-revision.v1',
        id: 'revision-001',
      }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cut.eva.mba/api/portal/query',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: `Bearer ${BEARER}`,
        }),
        body: JSON.stringify({
          table: 'organizations',
          query: {
            select: 'id,slug,name,status,created_at,updated_at',
            order: 'name.asc',
            limit: 10,
          },
        }),
      }),
    )
    const serializedCalls = JSON.stringify(fetchMock.mock.calls)
    expect(serializedCalls).not.toContain('apikey')
    expect(serializedCalls).not.toContain('sb_publishable')
  })

  it('reads organizations through the app schema with publishable and user bearer headers', async () => {
    const fetchMock = vi.fn(async () =>
      response([
        {
          id: 'org-everville',
          slug: 'everville',
          name: 'Everville',
          status: 'active',
          created_at: SUPABASE_NOW,
          updated_at: SUPABASE_NOW,
        },
      ]),
    )
    const services = createWebPortalServices({
      endpoint: `${ENDPOINT}/`,
      publishableKey: PUBLISHABLE,
      bearer: BEARER,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(services.organizations.listOrganizations({ limit: 10 })).resolves.toEqual({
      ok: true,
      value: {
        items: [
          {
            schemaVersion: 'organization.v1',
            id: 'org-everville',
            slug: 'everville',
            name: 'Everville',
            status: 'active',
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
        cursor: null,
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/rest/v1/organizations?select=id%2Cslug%2Cname%2Cstatus%2Ccreated_at%2Cupdated_at&order=name.asc&limit=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          apikey: PUBLISHABLE,
          authorization: `Bearer ${BEARER}`,
          'accept-profile': 'app',
          'content-profile': 'app',
        }),
      }),
    )
  })

  it('maps workspace and membership rows without treating roles as authority', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response([
          {
            id: 'workspace-content',
            organization_id: 'org-everville',
            slug: 'content-team',
            name: 'Content Team',
            status: 'active',
            created_at: NOW,
            updated_at: NOW,
          },
        ]),
      )
      .mockResolvedValueOnce(
        response([
          {
            id: 'member-producer',
            organization_id: 'org-everville',
            workspace_id: 'workspace-content',
            user_id: 'principal-niko',
            status: 'active',
            roles: ['admin'],
            organization_permissions: [],
            workspace_permissions: ['project.read'],
            project_memberships: [{ project_id: 'project-cash-on-rails', permissions: ['project.read'] }],
            created_at: SUPABASE_NOW,
            updated_at: SUPABASE_NOW,
          },
        ]),
      )
    const services = createWebPortalServices({
      endpoint: ENDPOINT,
      publishableKey: PUBLISHABLE,
      bearer: BEARER,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(services.organizations.listWorkspaces({ organizationId: 'org-everville' })).resolves.toEqual({
      ok: true,
      value: {
        items: [
          {
            schemaVersion: 'workspace.v1',
            id: 'workspace-content',
            organizationId: 'org-everville',
            slug: 'content-team',
            name: 'Content Team',
            status: 'active',
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
        cursor: null,
      },
    })

    await expect(
      services.organizations.listMemberships({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        items: [
          expect.objectContaining({
            schemaVersion: 'workspace-membership.v1',
            roles: ['admin'],
            organizationPermissions: [],
            workspacePermissions: ['project.read'],
            projects: [{ projectId: 'project-cash-on-rails', permissions: ['project.read'] }],
          }),
        ],
        cursor: null,
      },
    })
  })

  it('lists and creates shared portal projects through the app schema', async () => {
    const projectRow = {
      id: 'project-cash-on-rails',
      organization_id: 'org-everville',
      workspace_id: 'workspace-content',
      slug: 'cash-on-rails',
      title: 'Cash on Rails',
      classification: 'internal',
      status: 'draft',
      current_revision_id: null,
      created_by_user_id: 'principal-niko',
      created_at: SUPABASE_NOW,
      updated_at: SUPABASE_NOW,
    }
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/v1/user')) return response({ id: 'principal-niko', email: 'niko@example.test' })
      if (url.includes('/rest/v1/projects') && init?.method === 'POST') return response([projectRow])
      if (url.includes('/rest/v1/projects')) return response([projectRow])
      return response([], { status: 404 })
    })
    const services = createWebPortalServices({
      endpoint: ENDPOINT,
      publishableKey: PUBLISHABLE,
      bearer: BEARER,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(
      services.collaboration.listProjects({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        limit: 12,
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        items: [
          {
            schemaVersion: 'portal-project.v1',
            id: 'project-cash-on-rails',
            organizationId: 'org-everville',
            workspaceId: 'workspace-content',
            title: 'Cash on Rails',
            slug: 'cash-on-rails',
            classification: 'internal',
            status: 'draft',
            brandKitId: null,
            knowledgePackId: null,
            currentRevisionId: null,
            createdAt: NOW,
            updatedAt: NOW,
            createdByPrincipalId: 'principal-niko',
          },
        ],
        cursor: null,
      },
    })

    await expect(
      services.collaboration.createProject({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        title: 'Cash on Rails',
        slug: 'cash-on-rails',
        classification: 'internal',
        idempotencyKey: 'create-cash-on-rails',
      }),
    ).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({
        schemaVersion: 'portal-project.v1',
        id: 'project-cash-on-rails',
        title: 'Cash on Rails',
      }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/rest/v1/projects?select=id%2Corganization_id%2Cworkspace_id%2Cslug%2Ctitle%2Cclassification%2Cstatus%2Ccurrent_revision_id%2Ccreated_by_user_id%2Ccreated_at%2Cupdated_at&organization_id=eq.org-everville&workspace_id=eq.workspace-content&order=updated_at.desc&limit=12',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          apikey: PUBLISHABLE,
          authorization: `Bearer ${BEARER}`,
          'accept-profile': 'app',
          'content-profile': 'app',
        }),
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/rest/v1/projects?select=id%2Corganization_id%2Cworkspace_id%2Cslug%2Ctitle%2Cclassification%2Cstatus%2Ccurrent_revision_id%2Ccreated_by_user_id%2Ccreated_at%2Cupdated_at',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: PUBLISHABLE,
          authorization: `Bearer ${BEARER}`,
          'content-profile': 'app',
          prefer: 'return=representation',
        }),
        body: JSON.stringify({
          organization_id: 'org-everville',
          workspace_id: 'workspace-content',
          slug: 'cash-on-rails',
          title: 'Cash on Rails',
          classification: 'internal',
          status: 'draft',
          created_by_user_id: 'principal-niko',
        }),
      }),
    )
  })

  it('appends portal audit events with the authenticated principal', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/auth/v1/user')) return response({ id: 'principal-niko', email: 'niko@example.test' })
      if (url.includes('/rest/v1/audit_events')) {
        return response([
          {
            id: 'audit-001',
            organization_id: 'org-everville',
            workspace_id: 'workspace-content',
            project_id: 'project-cash-on-rails',
            actor_user_id: 'principal-niko',
            action: 'project.create',
            target_type: 'project',
            target_id: 'project-cash-on-rails',
            metadata: { source: 'web-portal' },
            created_at: SUPABASE_NOW,
          },
        ])
      }
      return response([], { status: 404 })
    })
    const services = createWebPortalServices({
      endpoint: ENDPOINT,
      publishableKey: PUBLISHABLE,
      bearer: BEARER,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(
      services.collaboration.appendAuditEvent({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        action: 'project.create',
        targetType: 'project',
        targetId: 'project-cash-on-rails',
        metadata: { source: 'web-portal' },
        idempotencyKey: 'audit-create-cash-on-rails',
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        schemaVersion: 'portal-audit-event.v1',
        id: 'audit-001',
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        actorPrincipalId: 'principal-niko',
        action: 'project.create',
        targetType: 'project',
        targetId: 'project-cash-on-rails',
        createdAt: NOW,
        metadata: { source: 'web-portal' },
      },
    })
  })

  it('saves project revisions through the transactional portal RPC', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/rest/v1/rpc/save_project_revision') && init?.method === 'POST') {
        return response([
          {
            id: 'revision-001',
            organization_id: 'org-everville',
            workspace_id: 'workspace-content',
            project_id: 'project-cash-on-rails',
            revision_number: 1,
            snapshot_digest: 'a'.repeat(64),
            parent_revision_id: null,
            created_by_user_id: 'principal-niko',
            created_at: SUPABASE_NOW,
          },
        ])
      }
      return response([], { status: 404 })
    })
    const services = createWebPortalServices({
      endpoint: ENDPOINT,
      publishableKey: PUBLISHABLE,
      bearer: BEARER,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(
      services.collaboration.saveProjectRevision({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        expectedCurrentRevisionId: null,
        snapshotDigest: 'a'.repeat(64),
        snapshot: { schemaVersion: 'nomi-project.v1', title: 'Cash on Rails' },
        idempotencyKey: 'revision-cash-on-rails-1',
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        schemaVersion: 'portal-project-revision.v1',
        id: 'revision-001',
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        revisionNumber: 1,
        snapshotDigest: 'a'.repeat(64),
        parentRevisionId: null,
        createdAt: NOW,
        createdByPrincipalId: 'principal-niko',
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/rest/v1/rpc/save_project_revision',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: PUBLISHABLE,
          authorization: `Bearer ${BEARER}`,
          'accept-profile': 'app',
          'content-profile': 'app',
        }),
        body: JSON.stringify({
          request_organization_id: 'org-everville',
          request_workspace_id: 'workspace-content',
          request_project_id: 'project-cash-on-rails',
          request_expected_current_revision_id: null,
          request_snapshot_digest: 'a'.repeat(64),
          request_snapshot: { schemaVersion: 'nomi-project.v1', title: 'Cash on Rails' },
        }),
      }),
    )
  })

  it('lists approval gates and decides them through the approval RPC', async () => {
    const gateRow = {
      id: 'approval-brand-001',
      organization_id: 'org-everville',
      workspace_id: 'workspace-content',
      project_id: 'project-cash-on-rails',
      kind: 'brand-approval',
      required_role: 'admin',
      required: true,
      policy_snapshot_digest: 'b'.repeat(64),
      asset_version_id: null,
      decision: null,
      decided_by_user_id: null,
      decided_at: null,
      created_at: SUPABASE_NOW,
      updated_at: SUPABASE_NOW,
    }
    const decidedRow = {
      ...gateRow,
      decision: 'approved',
      decided_by_user_id: 'principal-niko',
      decided_at: NOW,
    }
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/rest/v1/rpc/decide_approval_gate') && init?.method === 'POST') {
        return response([decidedRow])
      }
      if (url.includes('/rest/v1/approval_gates') && init?.method === 'GET') return response([gateRow])
      return response([], { status: 404 })
    })
    const services = createWebPortalServices({
      endpoint: ENDPOINT,
      publishableKey: PUBLISHABLE,
      bearer: BEARER,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(
      services.collaboration.listReviewQueue({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        limit: 20,
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        items: [
          {
            schemaVersion: 'approval-gate.v1',
            id: 'approval-brand-001',
            organizationId: 'org-everville',
            workspaceId: 'workspace-content',
            projectId: 'project-cash-on-rails',
            kind: 'brand-approval',
            requiredRole: 'admin',
            required: true,
            decidedByPrincipalId: null,
            decision: null,
            decidedAt: null,
            assetVersionId: null,
            policySnapshotDigest: 'b'.repeat(64),
          },
        ],
        cursor: null,
      },
    })

    await expect(
      services.collaboration.decideApproval({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        approvalGateId: 'approval-brand-001',
        decision: 'approved',
        comment: 'Ready for publishing',
        expectedPolicySnapshotDigest: 'b'.repeat(64),
        idempotencyKey: 'approval-brand-001-approved',
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        schemaVersion: 'approval-gate.v1',
        id: 'approval-brand-001',
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        kind: 'brand-approval',
        requiredRole: 'admin',
        required: true,
        decidedByPrincipalId: 'principal-niko',
        decision: 'approved',
        decidedAt: NOW,
        assetVersionId: null,
        policySnapshotDigest: 'b'.repeat(64),
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/rest/v1/approval_gates?select=id%2Corganization_id%2Cworkspace_id%2Cproject_id%2Ckind%2Crequired_role%2Crequired%2Cpolicy_snapshot_digest%2Casset_version_id%2Cdecision%2Cdecided_by_user_id%2Cdecided_at%2Ccreated_at%2Cupdated_at&organization_id=eq.org-everville&workspace_id=eq.workspace-content&project_id=eq.project-cash-on-rails&order=updated_at.desc&limit=20',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          apikey: PUBLISHABLE,
          authorization: `Bearer ${BEARER}`,
          'accept-profile': 'app',
          'content-profile': 'app',
        }),
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/rest/v1/rpc/decide_approval_gate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: PUBLISHABLE,
          authorization: `Bearer ${BEARER}`,
          'accept-profile': 'app',
          'content-profile': 'app',
        }),
        body: JSON.stringify({
          request_organization_id: 'org-everville',
          request_workspace_id: 'workspace-content',
          request_project_id: 'project-cash-on-rails',
          request_approval_gate_id: 'approval-brand-001',
          request_decision: 'approved',
          request_expected_policy_snapshot_digest: 'b'.repeat(64),
          request_comment: 'Ready for publishing',
        }),
      }),
    )
  })

  it('rejects service-role shaped browser configuration before any network call', () => {
    const fetchMock = vi.fn()

    expect(() =>
      createWebPortalServices({
        endpoint: ENDPOINT,
        publishableKey: 'service_role_placeholder',
        bearer: BEARER,
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).toThrow(/publishable/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects legacy JWT-shaped API keys in browser publishable config', () => {
    const fetchMock = vi.fn()

    expect(() =>
      createWebPortalServices({
        endpoint: ENDPOINT,
        publishableKey: 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature',
        bearer: BEARER,
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).toThrow(/publishable/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
