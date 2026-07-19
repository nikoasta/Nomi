import type { PlatformCapability, PlatformIdentity, PlatformResult } from './client'
import {
  type OrganizationListRequest,
  parseOrganizationRecord,
  parseWorkspaceMembershipRecord,
  parseWorkspaceRecord,
  type OrganizationRecord,
  type PlatformOrganizations,
  type WorkspaceListRequest,
  type WorkspaceMembershipListRequest,
  type WorkspaceMembershipRecord,
  type WorkspaceRecord,
} from './organizations/contracts'

export type WebPortalClientConfig = {
  endpoint: string
  publishableKey: string
  bearer: string
  fetch?: typeof fetch
}

type SupabaseOrganizationRow = {
  id: string
  slug: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

type SupabaseWorkspaceRow = {
  id: string
  organization_id: string
  slug: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

type SupabaseMembershipRow = {
  id: string
  organization_id: string
  workspace_id: string
  user_id: string
  status: string
  roles: string[]
  organization_permissions: string[]
  workspace_permissions: string[]
  project_memberships?: Array<{
    project_id: string
    permissions: string[]
  }>
  created_at: string
  updated_at: string
}

type RequestOptions = {
  table: string
  query: Record<string, string | number | null | undefined>
}

function unsupported<T>(capability: PlatformCapability): PlatformResult<T> {
  return {
    ok: false,
    error: {
      code: 'UNSUPPORTED_CAPABILITY',
      capability,
      message: 'Portal web client is not configured',
      retryable: false,
    },
  }
}

function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, '')
  const parsed = new URL(trimmed)
  if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
    throw new TypeError('Portal endpoint must use https outside local development')
  }
  return parsed.toString().replace(/\/+$/, '')
}

export function isWebPortalPublishableKey(value: string): boolean {
  const key = value.trim()
  return Boolean(
    key &&
      key.startsWith('sb_publishable_') &&
      !/(?:^|[^a-z0-9])(?:service[_-]?role|secret)(?=$|[^a-z0-9])/i.test(key) &&
      !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key),
  )
}

function assertPublishableKey(value: string): string {
  const key = value.trim()
  if (!isWebPortalPublishableKey(key)) {
    throw new TypeError('Portal browser config requires a publishable key')
  }
  return key
}

function assertBearer(value: string): string {
  const bearer = value.trim()
  if (!bearer || /(?:^|[^a-z0-9])(?:service[_-]?role|secret)(?=$|[^a-z0-9])/i.test(bearer)) {
    throw new TypeError('Portal browser config requires a user bearer token')
  }
  return bearer
}

function configuredFetch(config: WebPortalClientConfig): typeof fetch {
  const candidate = config.fetch ?? globalThis.fetch
  if (typeof candidate !== 'function') throw new TypeError('Portal browser config requires fetch')
  return candidate.bind(globalThis) as typeof fetch
}

function queryString(query: RequestOptions['query']): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, String(value))
  }
  return params.toString()
}

function mapFetchError(
  capability: 'identity.session.read' | 'org.organizations.list' | 'org.workspaces.list' | 'org.memberships.list',
) {
  return {
    ok: false,
    error: {
      code: 'NETWORK_ERROR',
      capability,
      message: `${capability} failed while contacting the portal backend`,
      retryable: true,
    },
  } as const
}

function mapResponseError(
  capability: 'identity.session.read' | 'org.organizations.list' | 'org.workspaces.list' | 'org.memberships.list',
  status: number,
) {
  return {
    ok: false,
    error: {
      code: status === 401 ? 'PERMISSION_DENIED' : status === 404 ? 'NOT_FOUND' : 'NETWORK_ERROR',
      capability,
      message: `${capability} returned HTTP ${status}`,
      retryable: status >= 500,
    },
  } as const
}

export function createWebPortalServices(config: WebPortalClientConfig): {
  identity: PlatformIdentity
  organizations: PlatformOrganizations
} {
  const endpoint = normalizeEndpoint(config.endpoint)
  const publishableKey = assertPublishableKey(config.publishableKey)
  const bearer = assertBearer(config.bearer)
  const request = configuredFetch(config)

  async function selectRows<T>(
    capability: 'org.organizations.list' | 'org.workspaces.list' | 'org.memberships.list',
    options: RequestOptions,
  ): Promise<PlatformResult<T[]>> {
    const qs = queryString(options.query)
    const url = `${endpoint}/rest/v1/${options.table}${qs ? `?${qs}` : ''}`
    let response: Response
    try {
      response = await request(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          apikey: publishableKey,
          authorization: `Bearer ${bearer}`,
          'accept-profile': 'app',
          'content-profile': 'app',
        },
      })
    } catch {
      return mapFetchError(capability)
    }
    if (!response.ok) return mapResponseError(capability, response.status)
    try {
      const rows = (await response.json()) as T[]
      return { ok: true, value: rows }
    } catch {
      return {
        ok: false,
        error: {
          code: 'INTEGRITY_ERROR',
          capability,
          message: `${capability} returned invalid JSON`,
          retryable: false,
        },
      }
    }
  }

  return {
    identity: {
      getSession: async () => {
        let response: Response
        try {
          response = await request(`${endpoint}/auth/v1/user`, {
            method: 'GET',
            headers: {
              accept: 'application/json',
              apikey: publishableKey,
              authorization: `Bearer ${bearer}`,
            },
          })
        } catch {
          return mapFetchError('identity.session.read')
        }
        if (!response.ok) return mapResponseError('identity.session.read', response.status)
        const user = (await response.json().catch(() => null)) as { id?: unknown; email?: unknown } | null
        if (!user || typeof user.id !== 'string') {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'identity.session.read',
              message: 'Portal identity response is invalid',
              retryable: false,
            },
          }
        }
        return {
          ok: true,
          value: {
            state: 'authenticated',
            principal: {
              id: user.id,
              kind: 'human',
              ...(typeof user.email === 'string' ? { displayName: user.email } : {}),
            },
            activeMembership: null,
          },
        }
      },
    },
    organizations: {
      listOrganizations: async (input: OrganizationListRequest = {}) => {
        const result = await selectRows<SupabaseOrganizationRow>('org.organizations.list', {
          table: 'organizations',
          query: {
            select: 'id,slug,name,status,created_at,updated_at',
            order: 'name.asc',
            limit: input.limit,
          },
        })
        if (!result.ok) return result
        const items: OrganizationRecord[] = []
        try {
          for (const row of result.value) {
            items.push(
              parseOrganizationRecord({
                schemaVersion: 'organization.v1',
                id: row.id,
                slug: row.slug,
                name: row.name,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              }),
            )
          }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'org.organizations.list',
              message: 'Portal organization rows are invalid',
              retryable: false,
            },
          }
        }
        return { ok: true, value: { items, cursor: null } }
      },
      listWorkspaces: async (input: WorkspaceListRequest) => {
        const result = await selectRows<SupabaseWorkspaceRow>('org.workspaces.list', {
          table: 'workspaces',
          query: {
            select: 'id,organization_id,slug,name,status,created_at,updated_at',
            organization_id: `eq.${input.organizationId}`,
            ...(input.status ? { status: `eq.${input.status}` } : {}),
            order: 'name.asc',
            limit: input.limit,
          },
        })
        if (!result.ok) return result
        const items: WorkspaceRecord[] = []
        try {
          for (const row of result.value) {
            items.push(
              parseWorkspaceRecord({
                schemaVersion: 'workspace.v1',
                id: row.id,
                organizationId: row.organization_id,
                slug: row.slug,
                name: row.name,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              }),
            )
          }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'org.workspaces.list',
              message: 'Portal workspace rows are invalid',
              retryable: false,
            },
          }
        }
        return { ok: true, value: { items, cursor: null } }
      },
      listMemberships: async (input: WorkspaceMembershipListRequest) => {
        const result = await selectRows<SupabaseMembershipRow>('org.memberships.list', {
          table: 'workspace_memberships',
          query: {
            select:
              'id,organization_id,workspace_id,user_id,status,roles,organization_permissions,workspace_permissions,created_at,updated_at,project_memberships(project_id,permissions)',
            organization_id: `eq.${input.organizationId}`,
            workspace_id: `eq.${input.workspaceId}`,
            ...(input.status ? { status: `eq.${input.status}` } : {}),
            order: 'created_at.asc',
            limit: input.limit,
          },
        })
        if (!result.ok) return result
        const items: WorkspaceMembershipRecord[] = []
        try {
          for (const row of result.value) {
            items.push(
              parseWorkspaceMembershipRecord({
                schemaVersion: 'workspace-membership.v1',
                id: row.id,
                organizationId: row.organization_id,
                workspaceId: row.workspace_id,
                principalId: row.user_id,
                status: row.status,
                roles: row.roles,
                organizationPermissions: row.organization_permissions,
                workspacePermissions: row.workspace_permissions,
                projects: (row.project_memberships ?? []).map((project) => ({
                  projectId: project.project_id,
                  permissions: project.permissions,
                })),
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              }),
            )
          }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'org.memberships.list',
              message: 'Portal membership rows are invalid',
              retryable: false,
            },
          }
        }
        return { ok: true, value: { items, cursor: null } }
      },
    },
  }
}

export function createUnsupportedWebPortalServices(): {
  identity: PlatformIdentity
  organizations: PlatformOrganizations
} {
  return {
    identity: {
      getSession: async () => ({ ok: true, value: { state: 'unauthenticated' } }),
    },
    organizations: {
      listOrganizations: () => Promise.resolve(unsupported('org.organizations.list')),
      listWorkspaces: () => Promise.resolve(unsupported('org.workspaces.list')),
      listMemberships: () => Promise.resolve(unsupported('org.memberships.list')),
    },
  }
}
