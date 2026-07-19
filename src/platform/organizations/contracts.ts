import type {
  AuthorizationPermission,
  OrganizationPermission,
  ProjectAuthorization,
  ProjectPermission,
} from '../authorization/contracts'
import type { PlatformResult } from '../client'
import type { PortalRole } from '../collaboration/contracts'

export const ORGANIZATION_CAPABILITIES = [
  'org.organizations.list',
  'org.workspaces.list',
  'org.memberships.list',
] as const

export type OrganizationCapability = (typeof ORGANIZATION_CAPABILITIES)[number]
export type OrganizationStatus = 'active' | 'archived'
export type WorkspaceStatus = 'active' | 'archived'
export type WorkspaceMembershipStatus = 'active' | 'inactive' | 'invited'

export type OrganizationRecord = {
  schemaVersion: 'organization.v1'
  id: string
  slug: string
  name: string
  status: OrganizationStatus
  createdAt: string
  updatedAt: string
}

export type WorkspaceRecord = {
  schemaVersion: 'workspace.v1'
  id: string
  organizationId: string
  slug: string
  name: string
  status: WorkspaceStatus
  createdAt: string
  updatedAt: string
}

export type WorkspaceMembershipRecord = {
  schemaVersion: 'workspace-membership.v1'
  id: string
  organizationId: string
  workspaceId: string
  principalId: string
  status: WorkspaceMembershipStatus
  roles: readonly PortalRole[]
  organizationPermissions: readonly OrganizationPermission[]
  workspacePermissions: readonly ProjectPermission[]
  projects: readonly ProjectAuthorization[]
  createdAt: string
  updatedAt: string
}

export type OrganizationListRequest = {
  cursor?: string | null
  limit?: number
}

export type WorkspaceListRequest = {
  organizationId: string
  cursor?: string | null
  limit?: number
  status?: WorkspaceStatus
}

export type WorkspaceMembershipListRequest = {
  organizationId: string
  workspaceId: string
  cursor?: string | null
  limit?: number
  status?: WorkspaceMembershipStatus
}

export type PlatformOrganizations = {
  listOrganizations(request?: OrganizationListRequest): Promise<
    PlatformResult<{
      items: OrganizationRecord[]
      cursor: string | null
    }>
  >
  listWorkspaces(request: WorkspaceListRequest): Promise<
    PlatformResult<{
      items: WorkspaceRecord[]
      cursor: string | null
    }>
  >
  listMemberships(request: WorkspaceMembershipListRequest): Promise<
    PlatformResult<{
      items: WorkspaceMembershipRecord[]
      cursor: string | null
    }>
  >
}

export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<PortalRole, readonly AuthorizationPermission[]>> = {
  admin: [
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
  ],
  'standards-owner': ['project.read', 'asset.read', 'review.read', 'review.write', 'approval.read'],
  producer: [
    'project.read',
    'project.write',
    'asset.read',
    'asset.write',
    'generation-job.read',
    'generation-job.create',
    'review.read',
    'review.write',
    'approval.read',
  ],
  creator: [
    'project.read',
    'project.write',
    'asset.read',
    'asset.write',
    'generation-job.read',
    'generation-job.create',
    'review.read',
  ],
  reviewer: ['project.read', 'asset.read', 'generation-job.read', 'review.read', 'review.write', 'approval.read'],
  viewer: ['project.read', 'asset.read', 'generation-job.read', 'review.read', 'approval.read'],
}

const ID_PATTERN = /^[A-Za-z0-9]+(?:[._:-][A-Za-z0-9]+)*$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ORGANIZATION_STATUSES: readonly OrganizationStatus[] = ['active', 'archived']
const WORKSPACE_STATUSES: readonly WorkspaceStatus[] = ['active', 'archived']
const MEMBERSHIP_STATUSES: readonly WorkspaceMembershipStatus[] = ['active', 'inactive', 'invited']
const PORTAL_ROLES: readonly PortalRole[] = ['admin', 'standards-owner', 'producer', 'creator', 'reviewer', 'viewer']
const ORGANIZATION_PERMISSIONS: readonly OrganizationPermission[] = ['organization.admin']
const PROJECT_PERMISSIONS: readonly ProjectPermission[] = [
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
]
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
  if (FORBIDDEN_VALUE.test(value)) throw new TypeError(`${label} must not contain runtime locators or secrets`)
  return value
}

function opaqueId(value: unknown, label: string): string {
  const id = boundedString(value, label)
  if (!ID_PATTERN.test(id)) throw new TypeError(`${label} must be an opaque identifier`)
  return id
}

function slug(value: unknown): string {
  const text = boundedString(value, 'slug', 96)
  if (!SLUG_PATTERN.test(text)) throw new TypeError('slug must be canonical')
  return text
}

function isoDate(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  const date = new Date(text)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== text) {
    throw new TypeError(`${label} must be canonical ISO`)
  }
  return text
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new TypeError(`${label} is invalid`)
  return value as T
}

function exactKeys(value: JsonObject, allowed: readonly string[], required: readonly string[], label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`${label} has an unknown field`)
    if (FORBIDDEN_KEY.test(key)) throw new TypeError(`${label} has an unsafe field`)
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) throw new TypeError(`${label} is missing a field`)
  }
}

function uniqueArray<T extends string>(value: unknown, allowed: readonly T[], label: string, max = 32): readonly T[] {
  if (!Array.isArray(value) || value.length > max) throw new TypeError(`${label} must be an array`)
  const parsed = value.map((candidate) => enumValue(candidate, allowed, label))
  if (new Set(parsed).size !== parsed.length) throw new TypeError(`${label} must not contain duplicates`)
  return Object.freeze([...parsed])
}

function parseProjectAuthorization(value: unknown): ProjectAuthorization {
  const raw = record(value, 'ProjectAuthorization')
  exactKeys(raw, ['projectId', 'permissions'], ['projectId', 'permissions'], 'ProjectAuthorization')
  return {
    projectId: opaqueId(raw.projectId, 'projectId'),
    permissions: uniqueArray(raw.permissions, PROJECT_PERMISSIONS, 'project permissions'),
  }
}

function projectAuthorizations(value: unknown): readonly ProjectAuthorization[] {
  if (!Array.isArray(value)) throw new TypeError('projects must be an array')
  const projects = value.map(parseProjectAuthorization)
  if (new Set(projects.map(({ projectId }) => projectId)).size !== projects.length) {
    throw new TypeError('projects must not contain duplicates')
  }
  return Object.freeze(projects)
}

export function parseOrganizationRecord(value: unknown): OrganizationRecord {
  const raw = record(value, 'OrganizationRecord')
  exactKeys(
    raw,
    ['schemaVersion', 'id', 'slug', 'name', 'status', 'createdAt', 'updatedAt'],
    ['schemaVersion', 'id', 'slug', 'name', 'status', 'createdAt', 'updatedAt'],
    'OrganizationRecord',
  )
  if (raw.schemaVersion !== 'organization.v1') throw new TypeError('schemaVersion is invalid')
  return {
    schemaVersion: 'organization.v1',
    id: opaqueId(raw.id, 'id'),
    slug: slug(raw.slug),
    name: boundedString(raw.name, 'name', 160),
    status: enumValue(raw.status, ORGANIZATION_STATUSES, 'status'),
    createdAt: isoDate(raw.createdAt, 'createdAt'),
    updatedAt: isoDate(raw.updatedAt, 'updatedAt'),
  }
}

export function parseWorkspaceRecord(value: unknown): WorkspaceRecord {
  const raw = record(value, 'WorkspaceRecord')
  exactKeys(
    raw,
    ['schemaVersion', 'id', 'organizationId', 'slug', 'name', 'status', 'createdAt', 'updatedAt'],
    ['schemaVersion', 'id', 'organizationId', 'slug', 'name', 'status', 'createdAt', 'updatedAt'],
    'WorkspaceRecord',
  )
  if (raw.schemaVersion !== 'workspace.v1') throw new TypeError('schemaVersion is invalid')
  return {
    schemaVersion: 'workspace.v1',
    id: opaqueId(raw.id, 'id'),
    organizationId: opaqueId(raw.organizationId, 'organizationId'),
    slug: slug(raw.slug),
    name: boundedString(raw.name, 'name', 160),
    status: enumValue(raw.status, WORKSPACE_STATUSES, 'status'),
    createdAt: isoDate(raw.createdAt, 'createdAt'),
    updatedAt: isoDate(raw.updatedAt, 'updatedAt'),
  }
}

export function parseWorkspaceMembershipRecord(value: unknown): WorkspaceMembershipRecord {
  const raw = record(value, 'WorkspaceMembershipRecord')
  exactKeys(
    raw,
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'principalId',
      'status',
      'roles',
      'organizationPermissions',
      'workspacePermissions',
      'projects',
      'createdAt',
      'updatedAt',
    ],
    [
      'schemaVersion',
      'id',
      'organizationId',
      'workspaceId',
      'principalId',
      'status',
      'roles',
      'organizationPermissions',
      'workspacePermissions',
      'projects',
      'createdAt',
      'updatedAt',
    ],
    'WorkspaceMembershipRecord',
  )
  if (raw.schemaVersion !== 'workspace-membership.v1') throw new TypeError('schemaVersion is invalid')
  return {
    schemaVersion: 'workspace-membership.v1',
    id: opaqueId(raw.id, 'id'),
    organizationId: opaqueId(raw.organizationId, 'organizationId'),
    workspaceId: opaqueId(raw.workspaceId, 'workspaceId'),
    principalId: opaqueId(raw.principalId, 'principalId'),
    status: enumValue(raw.status, MEMBERSHIP_STATUSES, 'status'),
    roles: uniqueArray(raw.roles, PORTAL_ROLES, 'roles'),
    organizationPermissions: uniqueArray(
      raw.organizationPermissions,
      ORGANIZATION_PERMISSIONS,
      'organization permissions',
    ),
    workspacePermissions: uniqueArray(raw.workspacePermissions, PROJECT_PERMISSIONS, 'workspace permissions'),
    projects: projectAuthorizations(raw.projects),
    createdAt: isoDate(raw.createdAt, 'createdAt'),
    updatedAt: isoDate(raw.updatedAt, 'updatedAt'),
  }
}

export function defaultPermissionsForRole(role: PortalRole): readonly AuthorizationPermission[] {
  return DEFAULT_ROLE_PERMISSIONS[role]
}
