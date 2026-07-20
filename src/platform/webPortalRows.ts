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

type RowRecord = Record<string, unknown>

export function readRowField(row: unknown, snakeKey: string, camelKey = snakeKey): unknown {
  if (!row || typeof row !== 'object') return undefined
  const record = row as RowRecord
  if (Object.prototype.hasOwnProperty.call(record, snakeKey)) return record[snakeKey]
  return record[camelKey]
}

export function normalizeSupabaseTimestamp(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return date.toISOString()
}

function rowTimestamp(row: unknown, snakeKey: string, camelKey = snakeKey): unknown {
  return normalizeSupabaseTimestamp(readRowField(row, snakeKey, camelKey))
}

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
    id: readRowField(row, 'id'),
    organizationId: readRowField(row, 'organization_id', 'organizationId'),
    workspaceId: readRowField(row, 'workspace_id', 'workspaceId'),
    title: readRowField(row, 'title'),
    slug: readRowField(row, 'slug'),
    classification: readRowField(row, 'classification'),
    status: readRowField(row, 'status'),
    brandKitId: null,
    knowledgePackId: null,
    currentRevisionId: readRowField(row, 'current_revision_id', 'currentRevisionId'),
    createdAt: rowTimestamp(row, 'created_at', 'createdAt'),
    updatedAt: rowTimestamp(row, 'updated_at', 'updatedAt'),
    createdByPrincipalId: readRowField(row, 'created_by_user_id', 'createdByUserId'),
  })
}

export function mapAuditEvent(row: SupabaseAuditEventRow): PortalAuditEventRecord {
  return parsePortalAuditEventRecord({
    schemaVersion: 'portal-audit-event.v1',
    id: readRowField(row, 'id'),
    organizationId: readRowField(row, 'organization_id', 'organizationId'),
    workspaceId: readRowField(row, 'workspace_id', 'workspaceId'),
    projectId: readRowField(row, 'project_id', 'projectId'),
    actorPrincipalId: readRowField(row, 'actor_user_id', 'actorUserId'),
    action: readRowField(row, 'action'),
    targetType: readRowField(row, 'target_type', 'targetType'),
    targetId: readRowField(row, 'target_id', 'targetId'),
    createdAt: rowTimestamp(row, 'created_at', 'createdAt'),
    metadata: readRowField(row, 'metadata'),
  })
}

export function mapProjectRevision(row: SupabaseProjectRevisionRow): PortalProjectRevisionRecord {
  return parsePortalProjectRevisionRecord({
    schemaVersion: 'portal-project-revision.v1',
    id: readRowField(row, 'id'),
    organizationId: readRowField(row, 'organization_id', 'organizationId'),
    workspaceId: readRowField(row, 'workspace_id', 'workspaceId'),
    projectId: readRowField(row, 'project_id', 'projectId'),
    revisionNumber: readRowField(row, 'revision_number', 'revisionNumber'),
    snapshotDigest: readRowField(row, 'snapshot_digest', 'snapshotDigest'),
    parentRevisionId: readRowField(row, 'parent_revision_id', 'parentRevisionId'),
    createdAt: rowTimestamp(row, 'created_at', 'createdAt'),
    createdByPrincipalId: readRowField(row, 'created_by_user_id', 'createdByUserId'),
  })
}

export function mapApprovalGate(row: SupabaseApprovalGateRow): ApprovalGateRecord {
  return parseApprovalGateRecord({
    schemaVersion: 'approval-gate.v1',
    id: readRowField(row, 'id'),
    organizationId: readRowField(row, 'organization_id', 'organizationId'),
    workspaceId: readRowField(row, 'workspace_id', 'workspaceId'),
    projectId: readRowField(row, 'project_id', 'projectId'),
    kind: readRowField(row, 'kind'),
    requiredRole: readRowField(row, 'required_role', 'requiredRole'),
    required: readRowField(row, 'required'),
    decidedByPrincipalId: readRowField(row, 'decided_by_user_id', 'decidedByUserId'),
    decision: readRowField(row, 'decision'),
    decidedAt: rowTimestamp(row, 'decided_at', 'decidedAt'),
    assetVersionId: readRowField(row, 'asset_version_id', 'assetVersionId'),
    policySnapshotDigest: readRowField(row, 'policy_snapshot_digest', 'policySnapshotDigest'),
  })
}
