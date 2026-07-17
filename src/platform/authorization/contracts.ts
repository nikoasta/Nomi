export const AUTHORIZATION_PERMISSIONS = [
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

export type AuthorizationPermission = (typeof AUTHORIZATION_PERMISSIONS)[number]
export type OrganizationPermission = 'organization.admin'
export type ProjectPermission = Exclude<AuthorizationPermission, OrganizationPermission>

export type AuthenticatedPrincipal = {
  id: string
  kind: 'human' | 'local-runtime'
  displayName?: string
}

export type ProjectAuthorization = {
  projectId: string
  permissions: readonly ProjectPermission[]
}

export type OrganizationMembership = {
  principalId: string
  organizationId: string
  status: 'active' | 'inactive'
  organizationPermissions: readonly OrganizationPermission[]
  projects: readonly ProjectAuthorization[]
}

export type PlatformSession =
  | { state: 'unauthenticated' }
  | {
      state: 'authenticated'
      principal: AuthenticatedPrincipal
      activeMembership: OrganizationMembership | null
    }

export type OrganizationResourceScope = {
  kind: 'organization'
  organizationId: string
}

export type ProjectResourceScope = {
  kind: 'project'
  organizationId: string
  projectId: string
}

export type AuthorizationResource =
  | { family: 'organization'; scope: OrganizationResourceScope }
  | { family: 'project'; scope: ProjectResourceScope }
  | {
      family: 'asset' | 'generation-job' | 'review' | 'approval'
      resourceId: string
      scope: ProjectResourceScope
    }

export type AuthorizationCheckRequest = {
  resource: AuthorizationResource
  permission: AuthorizationPermission
}

export type AuthorizationPolicyRequest = AuthorizationCheckRequest & {
  session: PlatformSession
}

export type AuthorizationAllowReason = 'ALLOW_EXPLICIT_PERMISSION'

export type AuthorizationDenyReason =
  | 'DENY_MALFORMED_REQUEST'
  | 'DENY_UNAUTHENTICATED'
  | 'DENY_NO_ACTIVE_MEMBERSHIP'
  | 'DENY_INACTIVE_MEMBERSHIP'
  | 'DENY_PRINCIPAL_MISMATCH'
  | 'DENY_ORGANIZATION_SCOPE_MISMATCH'
  | 'DENY_PROJECT_SCOPE_MISMATCH'
  | 'DENY_PERMISSION_NOT_APPLICABLE'
  | 'DENY_PERMISSION_NOT_GRANTED'

export type AuthorizationDecision =
  | { allowed: true; reason: AuthorizationAllowReason }
  | { allowed: false; reason: AuthorizationDenyReason }
