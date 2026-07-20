import type { PlatformCapability, PlatformIdentity, PlatformResult } from './client'
import {
  type PlatformCollaboration,
  type PortalAuditEventRecord,
  type PortalProjectCreateRequest,
  type PortalProjectListRequest,
  type PortalProjectRecord,
  parsePortalAuditEventRecord,
  parsePortalProjectRecord,
} from './collaboration/contracts'
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

type SupabaseProjectRow = {
  id: string
  organization_id: string
  workspace_id: string
  slug: string
  title: string
  classification: string
  status: string
  current_revision_id: string | null
  created_by_user_id: string
  created_at: string
  updated_at: string
}

type SupabaseAuditEventRow = {
  id: string
  organization_id: string
  workspace_id: string
  project_id: string | null
  actor_user_id: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, unknown>
  created_at: string
}

type RequestOptions = {
  table: string
  query: Record<string, string | number | null | undefined>
}

type WebPortalCapability =
  | 'identity.session.read'
  | 'org.organizations.list'
  | 'org.workspaces.list'
  | 'org.memberships.list'
  | 'portal.projects.list'
  | 'portal.projects.create'
  | 'portal.project-revisions.save'
  | 'portal.review-queue.list'
  | 'portal.approvals.decide'
  | 'portal.audit-events.append'

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

function mapFetchError(capability: WebPortalCapability) {
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

function mapResponseError(capability: WebPortalCapability, status: number) {
  return {
    ok: false,
    error: {
      code:
        status === 401 || status === 403
          ? 'PERMISSION_DENIED'
          : status === 404
            ? 'NOT_FOUND'
            : status === 409
              ? 'CONFLICT'
              : 'NETWORK_ERROR',
      capability,
      message: `${capability} returned HTTP ${status}`,
      retryable: status >= 500,
    },
  } as const
}

export function createWebPortalServices(config: WebPortalClientConfig): {
  identity: PlatformIdentity
  organizations: PlatformOrganizations
  collaboration: PlatformCollaboration
} {
  const endpoint = normalizeEndpoint(config.endpoint)
  const publishableKey = assertPublishableKey(config.publishableKey)
  const bearer = assertBearer(config.bearer)
  const request = configuredFetch(config)

  async function getUser(): Promise<PlatformResult<{ id: string; email?: string }>> {
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
        id: user.id,
        ...(typeof user.email === 'string' ? { email: user.email } : {}),
      },
    }
  }

  async function selectRows<T>(
    capability: WebPortalCapability,
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

  async function insertRow<T>(
    capability: WebPortalCapability,
    options: {
      table: string
      select: string
      body: Readonly<Record<string, unknown>>
    },
  ): Promise<PlatformResult<T>> {
    const qs = queryString({ select: options.select })
    const url = `${endpoint}/rest/v1/${options.table}?${qs}`
    let response: Response
    try {
      response = await request(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          apikey: publishableKey,
          authorization: `Bearer ${bearer}`,
          'accept-profile': 'app',
          'content-profile': 'app',
          'content-type': 'application/json',
          prefer: 'return=representation',
        },
        body: JSON.stringify(options.body),
      })
    } catch {
      return mapFetchError(capability)
    }
    if (!response.ok) return mapResponseError(capability, response.status)
    try {
      const rows = (await response.json()) as T[]
      const row = rows[0]
      if (!row) {
        return {
          ok: false,
          error: {
            code: 'INTEGRITY_ERROR',
            capability,
            message: `${capability} returned no inserted row`,
            retryable: false,
          },
        }
      }
      return { ok: true, value: row }
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

  function mapProject(row: SupabaseProjectRow): PortalProjectRecord {
    return parsePortalProjectRecord({
      schemaVersion: 'portal-project.v1',
      id: row.id,
      organizationId: row.organization_id,
      workspaceId: row.workspace_id,
      title: row.title,
      slug: row.slug,
      classification: row.classification,
      status: row.status,
      brandKitId: null,
      knowledgePackId: null,
      currentRevisionId: row.current_revision_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdByPrincipalId: row.created_by_user_id,
    })
  }

  function mapAuditEvent(row: SupabaseAuditEventRow): PortalAuditEventRecord {
    return parsePortalAuditEventRecord({
      schemaVersion: 'portal-audit-event.v1',
      id: row.id,
      organizationId: row.organization_id,
      workspaceId: row.workspace_id,
      projectId: row.project_id,
      actorPrincipalId: row.actor_user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      createdAt: row.created_at,
      metadata: row.metadata,
    })
  }

  return {
    identity: {
      getSession: async () => {
        const user = await getUser()
        if (!user.ok) return user
        return {
          ok: true,
          value: {
            state: 'authenticated',
            principal: {
              id: user.value.id,
              kind: 'human',
              ...(user.value.email ? { displayName: user.value.email } : {}),
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
    collaboration: {
      listProjects: async (input: PortalProjectListRequest) => {
        const result = await selectRows<SupabaseProjectRow>('portal.projects.list', {
          table: 'projects',
          query: {
            select:
              'id,organization_id,workspace_id,slug,title,classification,status,current_revision_id,created_by_user_id,created_at,updated_at',
            organization_id: `eq.${input.organizationId}`,
            workspace_id: `eq.${input.workspaceId}`,
            ...(input.status ? { status: `eq.${input.status}` } : {}),
            order: 'updated_at.desc',
            limit: input.limit,
          },
        })
        if (!result.ok) return result
        const items: PortalProjectRecord[] = []
        try {
          for (const row of result.value) items.push(mapProject(row))
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.projects.list',
              message: 'Portal project rows are invalid',
              retryable: false,
            },
          }
        }
        return { ok: true, value: { items, cursor: null } }
      },
      createProject: async (input: PortalProjectCreateRequest) => {
        const user = await getUser()
        if (!user.ok) {
          return {
            ok: false,
            error: { ...user.error, capability: 'portal.projects.create' },
          }
        }
        const result = await insertRow<SupabaseProjectRow>('portal.projects.create', {
          table: 'projects',
          select:
            'id,organization_id,workspace_id,slug,title,classification,status,current_revision_id,created_by_user_id,created_at,updated_at',
          body: {
            organization_id: input.organizationId,
            workspace_id: input.workspaceId,
            slug: input.slug,
            title: input.title,
            classification: input.classification,
            status: 'draft',
            created_by_user_id: user.value.id,
          },
        })
        if (!result.ok) return result
        try {
          return { ok: true, value: mapProject(result.value) }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.projects.create',
              message: 'Created portal project row is invalid',
              retryable: false,
            },
          }
        }
      },
      saveProjectRevision: () => Promise.resolve(unsupported('portal.project-revisions.save')),
      listReviewQueue: () => Promise.resolve(unsupported('portal.review-queue.list')),
      decideApproval: () => Promise.resolve(unsupported('portal.approvals.decide')),
      appendAuditEvent: async (input) => {
        const user = await getUser()
        if (!user.ok) {
          return {
            ok: false,
            error: { ...user.error, capability: 'portal.audit-events.append' },
          }
        }
        const result = await insertRow<SupabaseAuditEventRow>('portal.audit-events.append', {
          table: 'audit_events',
          select:
            'id,organization_id,workspace_id,project_id,actor_user_id,action,target_type,target_id,metadata,created_at',
          body: {
            organization_id: input.organizationId,
            workspace_id: input.workspaceId,
            project_id: input.projectId,
            actor_user_id: user.value.id,
            action: input.action,
            target_type: input.targetType,
            target_id: input.targetId,
            metadata: input.metadata,
          },
        })
        if (!result.ok) return result
        try {
          return { ok: true, value: mapAuditEvent(result.value) }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.audit-events.append',
              message: 'Created portal audit event row is invalid',
              retryable: false,
            },
          }
        }
      },
    },
  }
}

export function createUnsupportedWebPortalServices(): {
  identity: PlatformIdentity
  organizations: PlatformOrganizations
  collaboration: PlatformCollaboration
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
    collaboration: {
      listProjects: () => Promise.resolve(unsupported('portal.projects.list')),
      createProject: () => Promise.resolve(unsupported('portal.projects.create')),
      saveProjectRevision: () => Promise.resolve(unsupported('portal.project-revisions.save')),
      listReviewQueue: () => Promise.resolve(unsupported('portal.review-queue.list')),
      decideApproval: () => Promise.resolve(unsupported('portal.approvals.decide')),
      appendAuditEvent: () => Promise.resolve(unsupported('portal.audit-events.append')),
    },
  }
}
