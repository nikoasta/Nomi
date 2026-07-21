import type { PlatformCapability, PlatformIdentity, PlatformResult } from './client'
import type { PlatformAssetRecords } from './assets/contracts'
import {
  type ApprovalGateRecord,
  type PlatformCollaboration,
  type PortalProjectCreateRequest,
  type PortalProjectListRequest,
  type PortalProjectRecord,
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
import {
  mapApprovalGate,
  mapAuditEvent,
  mapProject,
  mapProjectRevision,
  mapProjectRevisionSnapshot,
  normalizeSupabaseTimestamp,
  readRowField,
  type SupabaseApprovalGateRow,
  type SupabaseAuditEventRow,
  type SupabaseMembershipRow,
  type SupabaseOrganizationRow,
  type SupabaseProjectRevisionSnapshotRow,
  type SupabaseProjectRevisionRow,
  type SupabaseProjectRow,
  type SupabaseWorkspaceRow,
} from './webPortalRows'
import {
  assertWebPortalBearer,
  assertWebPortalPublishableKey,
  configuredWebPortalFetch,
  mapWebPortalFetchError,
  mapWebPortalResponseError,
  normalizeWebPortalApiBase,
  normalizeWebPortalEndpoint,
  type WebPortalCapability,
  type WebPortalClientConfig,
  type WebPortalRequestOptions,
  webPortalQueryString,
} from './webPortalTransport'
import { createUnsupportedWebPortalAssetRecords, createWebPortalAssetRecords } from './webPortalAssets'

export { isWebPortalPublishableKey, type WebPortalClientConfig } from './webPortalTransport'

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

export function createWebPortalServices(config: WebPortalClientConfig): {
  identity: PlatformIdentity
  organizations: PlatformOrganizations
  collaboration: PlatformCollaboration
  assetRecords: PlatformAssetRecords
} {
  const apiBase = config.apiBase ? normalizeWebPortalApiBase(config.apiBase) : null
  const endpoint = apiBase ?? normalizeWebPortalEndpoint(config.endpoint)
  const publishableKey = apiBase ? null : assertWebPortalPublishableKey(config.publishableKey ?? '')
  const bearer = assertWebPortalBearer(config.bearer)
  const request = configuredWebPortalFetch(config)

  async function getUser(): Promise<PlatformResult<{ id: string; email?: string }>> {
    if (apiBase) {
      let response: Response
      try {
        response = await request(`${endpoint}/identity/session`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${bearer}`,
          },
        })
      } catch {
        return mapWebPortalFetchError('identity.session.read')
      }
      if (!response.ok) return mapWebPortalResponseError('identity.session.read', response.status)
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

    let response: Response
    try {
      response = await request(`${endpoint}/auth/v1/user`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          apikey: publishableKey ?? '',
          authorization: `Bearer ${bearer}`,
        },
      })
    } catch {
      return mapWebPortalFetchError('identity.session.read')
    }
    if (!response.ok) return mapWebPortalResponseError('identity.session.read', response.status)
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
    options: WebPortalRequestOptions,
  ): Promise<PlatformResult<T[]>> {
    if (apiBase) {
      return portalApi<T[]>(capability, 'query', {
        table: options.table,
        query: options.query,
      })
    }

    const qs = webPortalQueryString(options.query)
    const url = `${endpoint}/rest/v1/${options.table}${qs ? `?${qs}` : ''}`
    let response: Response
    try {
      response = await request(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          apikey: publishableKey ?? '',
          authorization: `Bearer ${bearer}`,
          'accept-profile': 'app',
          'content-profile': 'app',
        },
      })
    } catch {
      return mapWebPortalFetchError(capability)
    }
    if (!response.ok) return mapWebPortalResponseError(capability, response.status)
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
    if (apiBase) {
      const result = await portalApi<T[]>(capability, 'insert', {
        table: options.table,
        select: options.select,
        body: options.body,
      })
      if (!result.ok) return result
      const row = result.value[0]
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
    }

    const qs = webPortalQueryString({ select: options.select })
    const url = `${endpoint}/rest/v1/${options.table}?${qs}`
    let response: Response
    try {
      response = await request(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          apikey: publishableKey ?? '',
          authorization: `Bearer ${bearer}`,
          'accept-profile': 'app',
          'content-profile': 'app',
          'content-type': 'application/json',
          prefer: 'return=representation',
        },
        body: JSON.stringify(options.body),
      })
    } catch {
      return mapWebPortalFetchError(capability)
    }
    if (!response.ok) return mapWebPortalResponseError(capability, response.status)
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

  async function callRpc<T>(
    capability: WebPortalCapability,
    options: {
      functionName: string
      body: Readonly<Record<string, unknown>>
    },
  ): Promise<PlatformResult<T[]>> {
    if (apiBase) return portalApi<T[]>(capability, `rpc/${options.functionName}`, options.body)

    const url = `${endpoint}/rest/v1/rpc/${options.functionName}`
    let response: Response
    try {
      response = await request(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          apikey: publishableKey ?? '',
          authorization: `Bearer ${bearer}`,
          'accept-profile': 'app',
          'content-profile': 'app',
          'content-type': 'application/json',
        },
        body: JSON.stringify(options.body),
      })
    } catch {
      return mapWebPortalFetchError(capability)
    }
    if (!response.ok) return mapWebPortalResponseError(capability, response.status)
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

  async function portalApi<T>(
    capability: WebPortalCapability,
    path: string,
    body?: Readonly<Record<string, unknown>>,
  ): Promise<PlatformResult<T>> {
    let response: Response
    try {
      response = await request(`${endpoint}/${path.replace(/^\/+/, '')}`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${bearer}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body ?? {}),
      })
    } catch {
      return mapWebPortalFetchError(capability)
    }
    if (!response.ok) return mapWebPortalResponseError(capability, response.status)
    try {
      return { ok: true, value: (await response.json()) as T }
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
    assetRecords: createWebPortalAssetRecords({ apiBase, bearer, request }),
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
                id: readRowField(row, 'id'),
                slug: readRowField(row, 'slug'),
                name: readRowField(row, 'name'),
                status: readRowField(row, 'status'),
                createdAt: normalizeSupabaseTimestamp(readRowField(row, 'created_at', 'createdAt')),
                updatedAt: normalizeSupabaseTimestamp(readRowField(row, 'updated_at', 'updatedAt')),
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
                id: readRowField(row, 'id'),
                organizationId: readRowField(row, 'organization_id', 'organizationId'),
                slug: readRowField(row, 'slug'),
                name: readRowField(row, 'name'),
                status: readRowField(row, 'status'),
                createdAt: normalizeSupabaseTimestamp(readRowField(row, 'created_at', 'createdAt')),
                updatedAt: normalizeSupabaseTimestamp(readRowField(row, 'updated_at', 'updatedAt')),
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
            const projectMemberships = readRowField(row, 'project_memberships', 'projectMemberships')
            items.push(
              parseWorkspaceMembershipRecord({
                schemaVersion: 'workspace-membership.v1',
                id: readRowField(row, 'id'),
                organizationId: readRowField(row, 'organization_id', 'organizationId'),
                workspaceId: readRowField(row, 'workspace_id', 'workspaceId'),
                principalId: readRowField(row, 'user_id', 'userId'),
                status: readRowField(row, 'status'),
                roles: readRowField(row, 'roles'),
                organizationPermissions: readRowField(row, 'organization_permissions', 'organizationPermissions'),
                workspacePermissions: readRowField(row, 'workspace_permissions', 'workspacePermissions'),
                projects: (Array.isArray(projectMemberships) ? projectMemberships : []).map((project) => ({
                  projectId: readRowField(project, 'project_id', 'projectId'),
                  permissions: readRowField(project, 'permissions'),
                })),
                createdAt: normalizeSupabaseTimestamp(readRowField(row, 'created_at', 'createdAt')),
                updatedAt: normalizeSupabaseTimestamp(readRowField(row, 'updated_at', 'updatedAt')),
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
      saveProjectRevision: async (input) => {
        const result = await callRpc<SupabaseProjectRevisionRow>('portal.project-revisions.save', {
          functionName: 'save_project_revision',
          body: {
            request_organization_id: input.organizationId,
            request_workspace_id: input.workspaceId,
            request_project_id: input.projectId,
            request_expected_current_revision_id: input.expectedCurrentRevisionId,
            request_snapshot_digest: input.snapshotDigest,
            request_snapshot: input.snapshot,
          },
        })
        if (!result.ok) return result
        const row = result.value[0]
        if (!row) {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.project-revisions.save',
              message: 'Portal revision RPC returned no revision row',
              retryable: false,
            },
          }
        }
        try {
          return { ok: true, value: mapProjectRevision(row) }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.project-revisions.save',
              message: 'Portal revision RPC returned invalid rows',
              retryable: false,
            },
          }
        }
      },
      readCurrentProjectRevision: async (input) => {
        let row: SupabaseProjectRevisionSnapshotRow | null
        if (apiBase) {
          const result = await portalApi<SupabaseProjectRevisionSnapshotRow | null>(
            'portal.project-revisions.read-current',
            'project-revisions/current',
            {
              organizationId: input.organizationId,
              workspaceId: input.workspaceId,
              projectId: input.projectId,
            },
          )
          if (!result.ok) return result
          row = result.value
        } else {
          const result = await selectRows<SupabaseProjectRevisionSnapshotRow>('portal.project-revisions.read-current', {
            table: 'project_revisions',
            query: {
              select:
                'id,organization_id,workspace_id,project_id,revision_number,snapshot_digest,parent_revision_id,created_by_user_id,created_at,snapshot',
              organization_id: `eq.${input.organizationId}`,
              workspace_id: `eq.${input.workspaceId}`,
              project_id: `eq.${input.projectId}`,
              order: 'revision_number.desc',
              limit: 1,
            },
          })
          if (!result.ok) return result
          row = result.value[0] ?? null
        }
        if (!row) return { ok: true, value: null }
        try {
          return { ok: true, value: mapProjectRevisionSnapshot(row) }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.project-revisions.read-current',
              message: 'Portal revision response is invalid',
              retryable: false,
            },
          }
        }
      },
      listReviewQueue: async (input) => {
        const result = await selectRows<SupabaseApprovalGateRow>('portal.review-queue.list', {
          table: 'approval_gates',
          query: {
            select:
              'id,organization_id,workspace_id,project_id,kind,required_role,required,policy_snapshot_digest,asset_version_id,decision,decided_by_user_id,decided_at,created_at,updated_at',
            organization_id: `eq.${input.organizationId}`,
            workspace_id: `eq.${input.workspaceId}`,
            ...(input.projectId ? { project_id: `eq.${input.projectId}` } : {}),
            order: 'updated_at.desc',
            limit: input.limit,
          },
        })
        if (!result.ok) return result
        const items: ApprovalGateRecord[] = []
        try {
          for (const row of result.value) items.push(mapApprovalGate(row))
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.review-queue.list',
              message: 'Portal review queue rows are invalid',
              retryable: false,
            },
          }
        }
        return { ok: true, value: { items, cursor: null } }
      },
      decideApproval: async (input) => {
        const result = await callRpc<SupabaseApprovalGateRow>('portal.approvals.decide', {
          functionName: 'decide_approval_gate',
          body: {
            request_organization_id: input.organizationId,
            request_workspace_id: input.workspaceId,
            request_project_id: input.projectId,
            request_approval_gate_id: input.approvalGateId,
            request_decision: input.decision,
            request_expected_policy_snapshot_digest: input.expectedPolicySnapshotDigest,
            request_comment: input.comment,
          },
        })
        if (!result.ok) return result
        const row = result.value[0]
        if (!row) {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.approvals.decide',
              message: 'Portal approval RPC returned no approval row',
              retryable: false,
            },
          }
        }
        try {
          return { ok: true, value: mapApprovalGate(row) }
        } catch {
          return {
            ok: false,
            error: {
              code: 'INTEGRITY_ERROR',
              capability: 'portal.approvals.decide',
              message: 'Portal approval RPC returned invalid rows',
              retryable: false,
            },
          }
        }
      },
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
  assetRecords: PlatformAssetRecords
} {
  return {
    identity: {
      getSession: async () => ({ ok: true, value: { state: 'unauthenticated' } }),
    },
    assetRecords: createUnsupportedWebPortalAssetRecords(),
    organizations: {
      listOrganizations: () => Promise.resolve(unsupported('org.organizations.list')),
      listWorkspaces: () => Promise.resolve(unsupported('org.workspaces.list')),
      listMemberships: () => Promise.resolve(unsupported('org.memberships.list')),
    },
    collaboration: {
      listProjects: () => Promise.resolve(unsupported('portal.projects.list')),
      createProject: () => Promise.resolve(unsupported('portal.projects.create')),
      saveProjectRevision: () => Promise.resolve(unsupported('portal.project-revisions.save')),
      readCurrentProjectRevision: () => Promise.resolve(unsupported('portal.project-revisions.read-current')),
      listReviewQueue: () => Promise.resolve(unsupported('portal.review-queue.list')),
      decideApproval: () => Promise.resolve(unsupported('portal.approvals.decide')),
      appendAuditEvent: () => Promise.resolve(unsupported('portal.audit-events.append')),
    },
  }
}
