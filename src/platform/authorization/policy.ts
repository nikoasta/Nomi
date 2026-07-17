import {
  AUTHORIZATION_PERMISSIONS,
  type AuthenticatedPrincipal,
  type AuthorizationDecision,
  type AuthorizationPermission,
  type AuthorizationPolicyRequest,
  type AuthorizationResource,
  type OrganizationMembership,
  type OrganizationPermission,
  type PlatformSession,
  type ProjectAuthorization,
  type ProjectPermission,
} from './contracts'

type RecordValue = Record<PropertyKey, unknown>

const PROJECT_PERMISSIONS = AUTHORIZATION_PERMISSIONS.filter(
  (permission): permission is ProjectPermission => permission !== 'organization.admin',
)

const APPLICABLE_PERMISSIONS: Readonly<Record<AuthorizationResource['family'], readonly AuthorizationPermission[]>> = {
  organization: ['organization.admin'],
  project: ['project.read', 'project.write'],
  asset: ['asset.read', 'asset.write'],
  'generation-job': ['generation-job.read', 'generation-job.create', 'generation-job.cancel'],
  review: ['review.read', 'review.write'],
  approval: ['approval.read', 'approval.decide'],
}

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function own(value: RecordValue, key: PropertyKey): unknown {
  if (!Object.prototype.hasOwnProperty.call(value, key)) throw new TypeError('Missing required field')
  return value[key]
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256 && value === value.trim()
}

function hasNoDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length
}

function isAuthorizationPermission(value: unknown): value is AuthorizationPermission {
  return typeof value === 'string' && (AUTHORIZATION_PERMISSIONS as readonly string[]).includes(value)
}

function isOrganizationPermission(value: unknown): value is OrganizationPermission {
  return value === 'organization.admin'
}

function isProjectPermission(value: unknown): value is ProjectPermission {
  return typeof value === 'string' && (PROJECT_PERMISSIONS as readonly string[]).includes(value)
}

function parsePermissionArray<T extends string>(
  value: unknown,
  predicate: (candidate: unknown) => candidate is T,
): readonly T[] | null {
  if (!Array.isArray(value)) return null

  const permissions: T[] = []
  for (const candidate of value) {
    if (!predicate(candidate)) return null
    permissions.push(candidate)
  }

  return hasNoDuplicates(permissions) ? permissions : null
}

function parsePrincipal(value: unknown): AuthenticatedPrincipal | null {
  if (!isRecord(value)) return null

  const id = own(value, 'id')
  const kind = own(value, 'kind')
  if (!isIdentifier(id) || (kind !== 'human' && kind !== 'local-runtime')) return null

  const principal: AuthenticatedPrincipal = { id, kind }
  if (Object.prototype.hasOwnProperty.call(value, 'displayName')) {
    const displayName = value.displayName
    if (typeof displayName !== 'string') return null
    principal.displayName = displayName
  }
  return principal
}

function parseProjectAuthorization(value: unknown): ProjectAuthorization | null {
  if (!isRecord(value)) return null

  const projectId = own(value, 'projectId')
  const permissions = parsePermissionArray(own(value, 'permissions'), isProjectPermission)
  if (!isIdentifier(projectId) || permissions === null) return null

  return { projectId, permissions }
}

function parseMembership(value: unknown): OrganizationMembership | null | undefined {
  if (value === null) return null
  if (!isRecord(value)) return undefined

  const principalId = own(value, 'principalId')
  const organizationId = own(value, 'organizationId')
  const status = own(value, 'status')
  const organizationPermissions = parsePermissionArray(own(value, 'organizationPermissions'), isOrganizationPermission)
  const projectValues = own(value, 'projects')

  if (
    !isIdentifier(principalId) ||
    !isIdentifier(organizationId) ||
    (status !== 'active' && status !== 'inactive') ||
    organizationPermissions === null ||
    !Array.isArray(projectValues)
  ) {
    return undefined
  }

  const projects: ProjectAuthorization[] = []
  for (const projectValue of projectValues) {
    const project = parseProjectAuthorization(projectValue)
    if (project === null) return undefined
    projects.push(project)
  }
  if (!hasNoDuplicates(projects.map((project) => project.projectId))) return undefined

  return {
    principalId,
    organizationId,
    status,
    organizationPermissions,
    projects,
  }
}

function parseSession(value: unknown): PlatformSession | null {
  if (!isRecord(value)) return null

  const state = own(value, 'state')
  if (state === 'unauthenticated') return { state }
  if (state !== 'authenticated') return null

  const principal = parsePrincipal(own(value, 'principal'))
  const activeMembership = parseMembership(own(value, 'activeMembership'))
  if (principal === null || activeMembership === undefined) return null

  return { state, principal, activeMembership }
}

function parseProjectScope(value: unknown) {
  if (!isRecord(value)) return null

  const kind = own(value, 'kind')
  const organizationId = own(value, 'organizationId')
  const projectId = own(value, 'projectId')
  if (kind !== 'project' || !isIdentifier(organizationId) || !isIdentifier(projectId)) return null

  return { kind, organizationId, projectId } as const
}

function parseOrganizationScope(value: unknown) {
  if (!isRecord(value)) return null

  const kind = own(value, 'kind')
  const organizationId = own(value, 'organizationId')
  if (kind !== 'organization' || !isIdentifier(organizationId)) return null

  return { kind, organizationId } as const
}

function parseResource(value: unknown): AuthorizationResource | null {
  if (!isRecord(value)) return null

  const family = own(value, 'family')
  const scopeValue = own(value, 'scope')
  if (family === 'organization') {
    const scope = parseOrganizationScope(scopeValue)
    return scope === null ? null : { family, scope }
  }

  if (!['project', 'asset', 'generation-job', 'review', 'approval'].includes(String(family))) return null
  const scope = parseProjectScope(scopeValue)
  if (scope === null) return null
  if (family === 'project') return { family, scope }

  const resourceId = own(value, 'resourceId')
  if (!isIdentifier(resourceId)) return null

  if (family === 'asset' || family === 'generation-job' || family === 'review' || family === 'approval') {
    return { family, resourceId, scope }
  }
  return null
}

function parseRequest(value: unknown): AuthorizationPolicyRequest | null {
  if (!isRecord(value)) return null

  const session = parseSession(own(value, 'session'))
  const resource = parseResource(own(value, 'resource'))
  const permission = own(value, 'permission')
  if (session === null || resource === null || !isAuthorizationPermission(permission)) return null

  return { session, resource, permission }
}

export function evaluateAuthorization(request: AuthorizationPolicyRequest): AuthorizationDecision {
  try {
    const parsed = parseRequest(request)
    if (parsed === null) return { allowed: false, reason: 'DENY_MALFORMED_REQUEST' }
    if (parsed.session.state === 'unauthenticated') {
      return { allowed: false, reason: 'DENY_UNAUTHENTICATED' }
    }

    const membership = parsed.session.activeMembership
    if (membership === null) return { allowed: false, reason: 'DENY_NO_ACTIVE_MEMBERSHIP' }
    if (membership.status !== 'active') return { allowed: false, reason: 'DENY_INACTIVE_MEMBERSHIP' }
    if (membership.principalId !== parsed.session.principal.id) {
      return { allowed: false, reason: 'DENY_PRINCIPAL_MISMATCH' }
    }
    if (membership.organizationId !== parsed.resource.scope.organizationId) {
      return { allowed: false, reason: 'DENY_ORGANIZATION_SCOPE_MISMATCH' }
    }
    if (!APPLICABLE_PERMISSIONS[parsed.resource.family].includes(parsed.permission)) {
      return { allowed: false, reason: 'DENY_PERMISSION_NOT_APPLICABLE' }
    }

    if (parsed.resource.family === 'organization') {
      return membership.organizationPermissions.includes(parsed.permission as OrganizationPermission)
        ? { allowed: true, reason: 'ALLOW_EXPLICIT_PERMISSION' }
        : { allowed: false, reason: 'DENY_PERMISSION_NOT_GRANTED' }
    }

    const requestedProjectId = parsed.resource.scope.projectId
    const project = membership.projects.find(({ projectId }) => projectId === requestedProjectId)
    if (!project) return { allowed: false, reason: 'DENY_PROJECT_SCOPE_MISMATCH' }

    return project.permissions.includes(parsed.permission as ProjectPermission)
      ? { allowed: true, reason: 'ALLOW_EXPLICIT_PERMISSION' }
      : { allowed: false, reason: 'DENY_PERMISSION_NOT_GRANTED' }
  } catch {
    return { allowed: false, reason: 'DENY_MALFORMED_REQUEST' }
  }
}
