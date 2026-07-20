import { getPlatformClient } from '../../platform/client'
import type { PortalProjectRecord, PortalProjectRevisionRecord } from '../../platform/collaboration/contracts'
import {
  createLocalProject,
  saveLocalProject,
  updateLocalProjectPortalBinding,
  type LocalProjectSummary,
  type PortalProjectBinding,
} from '../library/localProjectStore'
import type { WorkbenchProjectRecordV1 } from './projectRecordSchema'

type PortalProjectSnapshotV1 = {
  schemaVersion: 'nomi-workbench-project-snapshot.v1'
  project: {
    id: string
    name: string
    localRevision: number
    updatedAt: number
  }
  payload: WorkbenchProjectRecordV1['payload']
}

const revisionHeads = new Map<string, string | null>()
const syncQueues = new Map<string, Promise<void>>()

function portalKey(record: WorkbenchProjectRecordV1): string | null {
  if (!record.portalOrganizationId || !record.portalWorkspaceId || !record.portalProjectId) return null
  return `${record.portalOrganizationId}:${record.portalWorkspaceId}:${record.portalProjectId}`
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`
}

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('crypto.subtle is required for portal project revision sync')
  const bytes = new TextEncoder().encode(value)
  const digest = await subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function createPortalProjectSnapshot(record: WorkbenchProjectRecordV1): PortalProjectSnapshotV1 {
  return {
    schemaVersion: 'nomi-workbench-project-snapshot.v1',
    project: {
      id: record.id,
      name: record.name,
      localRevision: record.revision ?? 0,
      updatedAt: record.updatedAt,
    },
    payload: record.payload,
  }
}

function parsePortalProjectSnapshot(value: unknown): PortalProjectSnapshotV1 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Partial<PortalProjectSnapshotV1>
  if (raw.schemaVersion !== 'nomi-workbench-project-snapshot.v1') return null
  if (!raw.project || typeof raw.project !== 'object') return null
  if (!raw.payload || typeof raw.payload !== 'object') return null
  const project = raw.project as Partial<PortalProjectSnapshotV1['project']>
  if (typeof project.id !== 'string' || typeof project.name !== 'string') return null
  if (typeof project.localRevision !== 'number' || typeof project.updatedAt !== 'number') return null
  return raw as PortalProjectSnapshotV1
}

export async function readCurrentPortalProjectSnapshot(input: {
  organizationId: string
  workspaceId: string
  projectId: string
}): Promise<{ revision: PortalProjectRevisionRecord; snapshot: PortalProjectSnapshotV1 } | null> {
  const client = getPlatformClient()
  if (!client.supports('portal.project-revisions.read-current')) return null
  const result = await client.collaboration.readCurrentProjectRevision(input)
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  if (!result.value) return null
  const snapshot = parsePortalProjectSnapshot(result.value.snapshot)
  if (!snapshot) throw new Error('INTEGRITY_ERROR: Portal project snapshot is invalid')
  return { revision: result.value, snapshot }
}

export async function openLocalPortalProject(input: {
  project: PortalProjectRecord
  projects: LocalProjectSummary[]
}): Promise<LocalProjectSummary> {
  const { project, projects } = input
  const portal: PortalProjectBinding = {
    organizationId: project.organizationId,
    workspaceId: project.workspaceId,
    projectId: project.id,
    currentRevisionId: project.currentRevisionId,
  }
  const remote = await readCurrentPortalProjectSnapshot({
    organizationId: project.organizationId,
    workspaceId: project.workspaceId,
    projectId: project.id,
  }).catch((error: unknown) => {
    console.warn('portal project revision read failed', error)
    return null
  })
  const binding = remote ? { ...portal, currentRevisionId: remote.revision.id } : portal
  const existing = projects.find((item) => item.portalProjectId === project.id)
  if (existing) {
    if (remote) saveLocalProject(existing.id, remote.snapshot.payload, project.title)
    updateLocalProjectPortalBinding(existing.id, binding)
    return existing
  }
  const created = createLocalProject(project.title, undefined, { portal: binding })
  if (remote) saveLocalProject(created.id, remote.snapshot.payload, project.title)
  return created
}

export async function savePortalProjectRevision(record: WorkbenchProjectRecordV1): Promise<PortalProjectRevisionRecord | null> {
  const key = portalKey(record)
  if (!key) return null
  const client = getPlatformClient()
  if (!client.supports('portal.project-revisions.save')) return null

  const snapshot = createPortalProjectSnapshot(record)
  const snapshotDigest = await sha256Hex(stableJson(snapshot))
  const expectedCurrentRevisionId = revisionHeads.has(key)
    ? revisionHeads.get(key) ?? null
    : record.portalCurrentRevisionId ?? null

  const result = await client.collaboration.saveProjectRevision({
    organizationId: record.portalOrganizationId!,
    workspaceId: record.portalWorkspaceId!,
    projectId: record.portalProjectId!,
    expectedCurrentRevisionId,
    snapshotDigest,
    snapshot,
    idempotencyKey: `portal-revision-${record.id}-${record.revision ?? 0}-${snapshotDigest.slice(0, 16)}`,
  })
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  revisionHeads.set(key, result.value.id)
  updateLocalProjectPortalBinding(record.id, {
    organizationId: record.portalOrganizationId!,
    workspaceId: record.portalWorkspaceId!,
    projectId: record.portalProjectId!,
    currentRevisionId: result.value.id,
  })
  return result.value
}

export function schedulePortalProjectRevisionSync(record: WorkbenchProjectRecordV1): void {
  const key = portalKey(record)
  if (!key) return
  const previous = syncQueues.get(key) ?? Promise.resolve()
  const next = previous
    .catch(() => undefined)
    .then(() => savePortalProjectRevision(record))
    .then(() => undefined)
    .catch((error: unknown) => {
      console.warn('portal project revision sync failed', error)
    })
    .finally(() => {
      if (syncQueues.get(key) === next) syncQueues.delete(key)
    })
  syncQueues.set(key, next)
}

export function __resetPortalProjectSyncForTests(): void {
  revisionHeads.clear()
  syncQueues.clear()
}
