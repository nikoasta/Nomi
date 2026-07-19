import type { PlatformResult } from '../client'

export const PORTAL_CAPABILITIES = [
  'portal.projects.list',
  'portal.projects.create',
  'portal.project-revisions.save',
  'portal.review-queue.list',
  'portal.approvals.decide',
  'portal.audit-events.append',
] as const

export type PortalCapability = (typeof PORTAL_CAPABILITIES)[number]
export type ContentClassification = 'public' | 'partner' | 'investor' | 'internal' | 'restricted'
export type PortalRole = 'admin' | 'standards-owner' | 'producer' | 'creator' | 'reviewer' | 'viewer'
export type PortalProjectStatus = 'draft' | 'in-production' | 'in-review' | 'approved' | 'archived'
export type ApprovalGateKind = 'producer-review' | 'brand-approval' | 'legal-approval' | 'executive-approval'
export type ApprovalDecisionValue = 'approved' | 'changes-requested' | 'rejected'

export type PortalScope = {
  organizationId: string
  workspaceId: string
}

export type PortalProjectRecord = PortalScope & {
  schemaVersion: 'portal-project.v1'
  id: string
  title: string
  slug: string
  classification: ContentClassification
  status: PortalProjectStatus
  brandKitId: string | null
  knowledgePackId: string | null
  currentRevisionId: string | null
  createdAt: string
  updatedAt: string
  createdByPrincipalId: string
}

export type PortalProjectRevisionRecord = PortalScope & {
  schemaVersion: 'portal-project-revision.v1'
  id: string
  projectId: string
  revisionNumber: number
  snapshotDigest: string
  parentRevisionId: string | null
  createdAt: string
  createdByPrincipalId: string
}

export type ApprovalGateRecord = PortalScope & {
  schemaVersion: 'approval-gate.v1'
  id: string
  projectId: string
  kind: ApprovalGateKind
  requiredRole: PortalRole
  required: boolean
  decidedByPrincipalId: string | null
  decision: ApprovalDecisionValue | null
  decidedAt: string | null
  assetVersionId: string | null
  policySnapshotDigest: string
}

export type PortalAuditEventRecord = PortalScope & {
  schemaVersion: 'portal-audit-event.v1'
  id: string
  projectId: string | null
  actorPrincipalId: string
  action: string
  targetType: string
  targetId: string
  createdAt: string
  metadata: Readonly<Record<string, unknown>>
}

export type PortalProjectListRequest = PortalScope & {
  cursor?: string | null
  limit?: number
  status?: PortalProjectStatus
}

export type PortalProjectCreateRequest = PortalScope & {
  title: string
  slug: string
  classification: ContentClassification
  brandKitId?: string | null
  knowledgePackId?: string | null
  idempotencyKey: string
}

export type PortalProjectRevisionSaveRequest = PortalScope & {
  projectId: string
  expectedCurrentRevisionId: string | null
  snapshotDigest: string
  snapshot: unknown
  idempotencyKey: string
}

export type PortalReviewQueueListRequest = PortalScope & {
  projectId?: string
  cursor?: string | null
  limit?: number
}

export type PortalApprovalDecisionRequest = PortalScope & {
  approvalGateId: string
  projectId: string
  decision: ApprovalDecisionValue
  comment: string | null
  expectedPolicySnapshotDigest: string
  idempotencyKey: string
}

export type PortalAuditEventAppendRequest = PortalScope & {
  projectId: string | null
  action: string
  targetType: string
  targetId: string
  metadata: Readonly<Record<string, unknown>>
  idempotencyKey: string
}

export type PlatformCollaboration = {
  listProjects(request: PortalProjectListRequest): Promise<
    PlatformResult<{
      items: PortalProjectRecord[]
      cursor: string | null
    }>
  >
  createProject(request: PortalProjectCreateRequest): Promise<PlatformResult<PortalProjectRecord>>
  saveProjectRevision(request: PortalProjectRevisionSaveRequest): Promise<PlatformResult<PortalProjectRevisionRecord>>
  listReviewQueue(request: PortalReviewQueueListRequest): Promise<
    PlatformResult<{
      items: ApprovalGateRecord[]
      cursor: string | null
    }>
  >
  decideApproval(request: PortalApprovalDecisionRequest): Promise<PlatformResult<ApprovalGateRecord>>
  appendAuditEvent(request: PortalAuditEventAppendRequest): Promise<PlatformResult<PortalAuditEventRecord>>
}

const ID_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)*$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DIGEST_PATTERN = /^[0-9a-f]{64}$/
const CLASSIFICATIONS: readonly ContentClassification[] = ['public', 'partner', 'investor', 'internal', 'restricted']
const PROJECT_STATUSES: readonly PortalProjectStatus[] = ['draft', 'in-production', 'in-review', 'approved', 'archived']
const ROLES: readonly PortalRole[] = ['admin', 'standards-owner', 'producer', 'creator', 'reviewer', 'viewer']
const GATE_KINDS: readonly ApprovalGateKind[] = [
  'producer-review',
  'brand-approval',
  'legal-approval',
  'executive-approval',
]
const DECISIONS: readonly ApprovalDecisionValue[] = ['approved', 'changes-requested', 'rejected']
const FORBIDDEN_KEY =
  /^(?:url|uri|locator|path|absolutePath|relativePath|storagePath|bucket|objectKey|credential|credentials|authorization|headers|cookie|token|secret|rawPrompt|rawResponse|providerResponse|runtimeLocator)$/i
const FORBIDDEN_VALUE =
  /(?:nomi-local:|file:|blob:|https?:\/\/|(?:^|[\\/])\.\.(?:[\\/]|$)|^\/|^[a-z]:[\\/]|^\\\\[^\\/]+[\\/][^\\/]+(?:[\\/]|$)|\bbearer\s+[A-Za-z0-9._~+/=-]+)/i

type JsonObject = Record<string, unknown>

function record(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as JsonObject
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f || character.charCodeAt(0) === 0x7f)
}

function boundedString(value: unknown, label: string, max = 256): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max || hasControlCharacter(value)) {
    throw new TypeError(`${label} must be a bounded string`)
  }
  if (value !== value.trim()) throw new TypeError(`${label} must be canonical`)
  return value
}

function optionalId(value: unknown, label: string): string | null {
  return value === null ? null : opaqueId(value, label)
}

function opaqueId(value: unknown, label: string): string {
  const id = boundedString(value, label)
  if (!ID_PATTERN.test(id) || FORBIDDEN_VALUE.test(id)) throw new TypeError(`${label} must be an opaque identifier`)
  return id
}

function slug(value: unknown): string {
  const text = boundedString(value, 'slug', 96)
  if (!SLUG_PATTERN.test(text)) throw new TypeError('slug must be canonical')
  return text
}

function digest(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!DIGEST_PATTERN.test(text)) throw new TypeError(`${label} must be a sha256 digest`)
  return text
}

function isoDate(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  const date = new Date(text)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== text)
    throw new TypeError(`${label} must be canonical ISO`)
  return text
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new TypeError(`${label} is invalid`)
  return value as T
}

function exactKeys(value: JsonObject, allowed: readonly string[], required: readonly string[], label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`${label} has an unknown field`)
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) throw new TypeError(`${label} is missing a field`)
  }
}

function scope(value: JsonObject): PortalScope {
  return {
    organizationId: opaqueId(value.organizationId, 'organizationId'),
    workspaceId: opaqueId(value.workspaceId, 'workspaceId'),
  }
}

export function assertNoPortalSecretOrLocator(value: unknown): void {
  const seen = new Set<object>()
  const visit = (current: unknown, key: string | null): void => {
    if (key !== null && FORBIDDEN_KEY.test(key))
      throw new TypeError('Portal records must not persist runtime locators or secrets')
    if (typeof current === 'string' && FORBIDDEN_VALUE.test(current)) {
      throw new TypeError('Portal records must not persist runtime locators or secrets')
    }
    if (!current || typeof current !== 'object') return
    if (seen.has(current)) throw new TypeError('Portal records must not be cyclic')
    seen.add(current)
    if (Array.isArray(current)) current.forEach((child) => visit(child, null))
    else Object.entries(current as JsonObject).forEach(([childKey, child]) => visit(child, childKey))
    seen.delete(current)
  }
  visit(value, null)
}

function metadata(value: unknown): Readonly<Record<string, unknown>> {
  const parsed = record(value, 'metadata')
  assertNoPortalSecretOrLocator(parsed)
  return Object.freeze({ ...parsed })
}

export function parsePortalProjectRecord(value: unknown): PortalProjectRecord {
  const raw = record(value, 'PortalProjectRecord')
  exactKeys(
    raw,
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'title',
      'slug',
      'classification',
      'status',
      'brandKitId',
      'knowledgePackId',
      'currentRevisionId',
      'createdAt',
      'updatedAt',
      'createdByPrincipalId',
    ],
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'title',
      'slug',
      'classification',
      'status',
      'brandKitId',
      'knowledgePackId',
      'currentRevisionId',
      'createdAt',
      'updatedAt',
      'createdByPrincipalId',
    ],
    'PortalProjectRecord',
  )
  if (raw.schemaVersion !== 'portal-project.v1') throw new TypeError('schemaVersion is invalid')
  const project: PortalProjectRecord = {
    schemaVersion: 'portal-project.v1',
    id: opaqueId(raw.id, 'id'),
    ...scope(raw),
    title: boundedString(raw.title, 'title', 160),
    slug: slug(raw.slug),
    classification: enumValue(raw.classification, CLASSIFICATIONS, 'classification'),
    status: enumValue(raw.status, PROJECT_STATUSES, 'status'),
    brandKitId: optionalId(raw.brandKitId, 'brandKitId'),
    knowledgePackId: optionalId(raw.knowledgePackId, 'knowledgePackId'),
    currentRevisionId: optionalId(raw.currentRevisionId, 'currentRevisionId'),
    createdAt: isoDate(raw.createdAt, 'createdAt'),
    updatedAt: isoDate(raw.updatedAt, 'updatedAt'),
    createdByPrincipalId: opaqueId(raw.createdByPrincipalId, 'createdByPrincipalId'),
  }
  assertNoPortalSecretOrLocator(project)
  return project
}

export function parsePortalProjectRevisionRecord(value: unknown): PortalProjectRevisionRecord {
  const raw = record(value, 'PortalProjectRevisionRecord')
  exactKeys(
    raw,
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'projectId',
      'revisionNumber',
      'snapshotDigest',
      'parentRevisionId',
      'createdAt',
      'createdByPrincipalId',
    ],
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'projectId',
      'revisionNumber',
      'snapshotDigest',
      'parentRevisionId',
      'createdAt',
      'createdByPrincipalId',
    ],
    'PortalProjectRevisionRecord',
  )
  if (raw.schemaVersion !== 'portal-project-revision.v1') throw new TypeError('schemaVersion is invalid')
  const revisionNumber = raw.revisionNumber
  if (typeof revisionNumber !== 'number' || !Number.isInteger(revisionNumber) || revisionNumber < 1) {
    throw new TypeError('revisionNumber is invalid')
  }
  const revision: PortalProjectRevisionRecord = {
    schemaVersion: 'portal-project-revision.v1',
    id: opaqueId(raw.id, 'id'),
    ...scope(raw),
    projectId: opaqueId(raw.projectId, 'projectId'),
    revisionNumber,
    snapshotDigest: digest(raw.snapshotDigest, 'snapshotDigest'),
    parentRevisionId: optionalId(raw.parentRevisionId, 'parentRevisionId'),
    createdAt: isoDate(raw.createdAt, 'createdAt'),
    createdByPrincipalId: opaqueId(raw.createdByPrincipalId, 'createdByPrincipalId'),
  }
  assertNoPortalSecretOrLocator(revision)
  return revision
}

export function parseApprovalGateRecord(value: unknown): ApprovalGateRecord {
  const raw = record(value, 'ApprovalGateRecord')
  exactKeys(
    raw,
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'projectId',
      'kind',
      'requiredRole',
      'required',
      'decidedByPrincipalId',
      'decision',
      'decidedAt',
      'assetVersionId',
      'policySnapshotDigest',
    ],
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'projectId',
      'kind',
      'requiredRole',
      'required',
      'decidedByPrincipalId',
      'decision',
      'decidedAt',
      'assetVersionId',
      'policySnapshotDigest',
    ],
    'ApprovalGateRecord',
  )
  if (raw.schemaVersion !== 'approval-gate.v1') throw new TypeError('schemaVersion is invalid')
  const gate: ApprovalGateRecord = {
    schemaVersion: 'approval-gate.v1',
    id: opaqueId(raw.id, 'id'),
    ...scope(raw),
    projectId: opaqueId(raw.projectId, 'projectId'),
    kind: enumValue(raw.kind, GATE_KINDS, 'kind'),
    requiredRole: enumValue(raw.requiredRole, ROLES, 'requiredRole'),
    required: booleanValue(raw.required, 'required'),
    decidedByPrincipalId: optionalId(raw.decidedByPrincipalId, 'decidedByPrincipalId'),
    decision: raw.decision === null ? null : enumValue(raw.decision, DECISIONS, 'decision'),
    decidedAt: raw.decidedAt === null ? null : isoDate(raw.decidedAt, 'decidedAt'),
    assetVersionId: optionalId(raw.assetVersionId, 'assetVersionId'),
    policySnapshotDigest: digest(raw.policySnapshotDigest, 'policySnapshotDigest'),
  }
  if (
    (gate.decision === null) !== (gate.decidedByPrincipalId === null) ||
    (gate.decision === null) !== (gate.decidedAt === null)
  ) {
    throw new TypeError('approval decision fields must be atomic')
  }
  assertNoPortalSecretOrLocator(gate)
  return gate
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be boolean`)
  return value
}

export function parsePortalAuditEventRecord(value: unknown): PortalAuditEventRecord {
  const raw = record(value, 'PortalAuditEventRecord')
  exactKeys(
    raw,
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'projectId',
      'actorPrincipalId',
      'action',
      'targetType',
      'targetId',
      'createdAt',
      'metadata',
    ],
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'projectId',
      'actorPrincipalId',
      'action',
      'targetType',
      'targetId',
      'createdAt',
      'metadata',
    ],
    'PortalAuditEventRecord',
  )
  if (raw.schemaVersion !== 'portal-audit-event.v1') throw new TypeError('schemaVersion is invalid')
  const event: PortalAuditEventRecord = {
    schemaVersion: 'portal-audit-event.v1',
    id: opaqueId(raw.id, 'id'),
    ...scope(raw),
    projectId: optionalId(raw.projectId, 'projectId'),
    actorPrincipalId: opaqueId(raw.actorPrincipalId, 'actorPrincipalId'),
    action: opaqueId(raw.action, 'action'),
    targetType: opaqueId(raw.targetType, 'targetType'),
    targetId: opaqueId(raw.targetId, 'targetId'),
    createdAt: isoDate(raw.createdAt, 'createdAt'),
    metadata: metadata(raw.metadata),
  }
  assertNoPortalSecretOrLocator(event)
  return event
}

export function requiredApprovalGateKinds(classification: ContentClassification): readonly ApprovalGateKind[] {
  switch (classification) {
    case 'public':
      return ['producer-review', 'brand-approval']
    case 'partner':
      return ['producer-review', 'brand-approval']
    case 'investor':
      return ['producer-review', 'brand-approval', 'legal-approval', 'executive-approval']
    case 'internal':
      return ['producer-review']
    case 'restricted':
      return ['producer-review', 'brand-approval', 'legal-approval']
  }
}
