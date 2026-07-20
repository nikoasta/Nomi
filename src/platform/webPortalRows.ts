import {
  type ApprovalGateRecord,
  type PortalAuditEventRecord,
  type PortalProjectRecord,
  type PortalProjectRevisionRecord,
  parseApprovalGateRecord,
  parsePortalAuditEventRecord,
  parsePortalProjectRecord,
  parsePortalProjectRevisionRecord,
} from './collaboration/contracts'

export type SupabaseOrganizationRow = {
  id: string
  slug: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

export type SupabaseWorkspaceRow = {
  id: string
  organization_id: string
  slug: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

export type SupabaseMembershipRow = {
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

export type SupabaseProjectRow = {
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

export type SupabaseAuditEventRow = {
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

export type SupabaseProjectRevisionRow = {
  id: string
  organization_id: string
  workspace_id: string
  project_id: string
  revision_number: number
  snapshot_digest: string
  parent_revision_id: string | null
  created_by_user_id: string
  created_at: string
}

export type SupabaseApprovalGateRow = {
  id: string
  organization_id: string
  workspace_id: string
  project_id: string
  kind: string
  required_role: string
  required: boolean
  policy_snapshot_digest: string
  asset_version_id: string | null
  decision: string | null
  decided_by_user_id: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export function mapProject(row: SupabaseProjectRow): PortalProjectRecord {
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

export function mapAuditEvent(row: SupabaseAuditEventRow): PortalAuditEventRecord {
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

export function mapProjectRevision(row: SupabaseProjectRevisionRow): PortalProjectRevisionRecord {
  return parsePortalProjectRevisionRecord({
    schemaVersion: 'portal-project-revision.v1',
    id: row.id,
    organizationId: row.organization_id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    revisionNumber: row.revision_number,
    snapshotDigest: row.snapshot_digest,
    parentRevisionId: row.parent_revision_id,
    createdAt: row.created_at,
    createdByPrincipalId: row.created_by_user_id,
  })
}

export function mapApprovalGate(row: SupabaseApprovalGateRow): ApprovalGateRecord {
  return parseApprovalGateRecord({
    schemaVersion: 'approval-gate.v1',
    id: row.id,
    organizationId: row.organization_id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    kind: row.kind,
    requiredRole: row.required_role,
    required: row.required,
    decidedByPrincipalId: row.decided_by_user_id,
    decision: row.decision,
    decidedAt: row.decided_at,
    assetVersionId: row.asset_version_id,
    policySnapshotDigest: row.policy_snapshot_digest,
  })
}
