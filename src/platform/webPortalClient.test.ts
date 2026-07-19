import { describe, expect, it, vi } from 'vitest'

import { createBrowserPlatformClient } from './browserPlatformClient'
import { createWebPortalServices } from './webPortalClient'

const ENDPOINT = 'https://project.supabase.co'
const PUBLISHABLE = 'sb_publishable_test'
const BEARER = 'user-session-jwt'
const NOW = '2026-07-19T00:00:00.000Z'

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

  it('advertises organization capabilities only with a valid publishable user session config', async () => {
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
    ])
    expect(client.supports('org.memberships.list')).toBe(true)
    await expect(client.identity.getSession()).resolves.toEqual({
      ok: true,
      value: {
        state: 'authenticated',
        principal: { id: 'principal-1', kind: 'human', displayName: 'team@example.test' },
        activeMembership: null,
      },
    })
  })

  it('reads organizations through the app schema with publishable and user bearer headers', async () => {
    const fetchMock = vi.fn(async () =>
      response([
        {
          id: 'org-everville',
          slug: 'everville',
          name: 'Everville',
          status: 'active',
          created_at: NOW,
          updated_at: NOW,
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
            created_at: NOW,
            updated_at: NOW,
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
