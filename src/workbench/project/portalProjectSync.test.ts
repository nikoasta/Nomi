import { webcrypto } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlatformClient } from '../../platform/client'

const harness = vi.hoisted(() => ({
  client: null as unknown as PlatformClient,
}))

vi.mock('../../platform/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../platform/client')>()
  return { ...actual, getPlatformClient: () => harness.client }
})

vi.mock('../../desktop/bridge', () => ({
  getDesktopBridge: () => null,
}))

import { createLocalProject, readLocalProject } from '../library/localProjectStore'
import {
  __resetPortalProjectSyncForTests,
  createPortalProjectSnapshot,
  readCurrentPortalProjectSnapshot,
  savePortalProjectRevision,
} from './portalProjectSync'

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, String(value))
    },
  }
}

function makeClient(
  saveProjectRevision: PlatformClient['collaboration']['saveProjectRevision'],
  readCurrentProjectRevision: PlatformClient['collaboration']['readCurrentProjectRevision'] = vi.fn(),
): PlatformClient {
  const capabilities = new Set<PlatformClient['capabilities'] extends ReadonlySet<infer T> ? T : never>([
    'portal.project-revisions.save',
    'portal.project-revisions.read-current',
  ])
  return {
    capabilities,
    supports: (capability) => capabilities.has(capability),
    collaboration: {
      saveProjectRevision,
      listProjects: vi.fn(),
      createProject: vi.fn(),
      readCurrentProjectRevision,
      listReviewQueue: vi.fn(),
      decideApproval: vi.fn(),
      appendAuditEvent: vi.fn(),
    },
    identity: {} as PlatformClient['identity'],
    authorization: {} as PlatformClient['authorization'],
    conversations: {} as PlatformClient['conversations'],
    assets: {} as PlatformClient['assets'],
    assetRecords: {} as PlatformClient['assetRecords'],
    organizations: {} as PlatformClient['organizations'],
  }
}

describe('portal project sync', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto)
    vi.stubGlobal('window', { localStorage: createMemoryStorage() })
    __resetPortalProjectSyncForTests()
  })

  it('saves a bound workbench project as a portal revision and stores the returned revision head', async () => {
    const saveProjectRevision = vi.fn(async () => ({
      ok: true as const,
      value: {
        schemaVersion: 'portal-project-revision.v1' as const,
        id: 'revision-2',
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        revisionNumber: 2,
        snapshotDigest: 'a'.repeat(64),
        parentRevisionId: 'revision-1',
        createdAt: '2026-07-20T00:00:00.000Z',
        createdByPrincipalId: 'principal-niko',
      },
    }))
    harness.client = makeClient(saveProjectRevision)
    const record = createLocalProject('Cash on Rails', undefined, {
      portal: {
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        currentRevisionId: 'revision-1',
      },
    })

    const revision = await savePortalProjectRevision(record)

    expect(revision?.id).toBe('revision-2')
    expect(saveProjectRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        expectedCurrentRevisionId: 'revision-1',
        snapshotDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
        snapshot: createPortalProjectSnapshot(record),
      }),
    )
    expect(readLocalProject(record.id)?.portalCurrentRevisionId).toBe('revision-2')
  })

  it('skips unbound local-only projects', async () => {
    const saveProjectRevision = vi.fn()
    harness.client = makeClient(saveProjectRevision)
    const record = createLocalProject('Local only')

    await expect(savePortalProjectRevision(record)).resolves.toBeNull()

    expect(saveProjectRevision).not.toHaveBeenCalled()
  })

  it('reads the current portal project snapshot for local restoration', async () => {
    const record = createLocalProject('Cash on Rails', undefined, {
      portal: {
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        currentRevisionId: 'revision-1',
      },
    })
    const snapshot = createPortalProjectSnapshot(record)
    const readCurrentProjectRevision = vi.fn(async () => ({
      ok: true as const,
      value: {
        schemaVersion: 'portal-project-revision.v1' as const,
        id: 'revision-1',
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
        revisionNumber: 1,
        snapshotDigest: 'a'.repeat(64),
        parentRevisionId: null,
        createdAt: '2026-07-20T00:00:00.000Z',
        createdByPrincipalId: 'principal-niko',
        snapshot,
      },
    }))
    harness.client = makeClient(vi.fn(), readCurrentProjectRevision)

    await expect(
      readCurrentPortalProjectSnapshot({
        organizationId: 'org-everville',
        workspaceId: 'workspace-content',
        projectId: 'project-cash-on-rails',
      }),
    ).resolves.toEqual({
      revision: expect.objectContaining({ id: 'revision-1' }),
      snapshot,
    })
    expect(readCurrentProjectRevision).toHaveBeenCalledWith({
      organizationId: 'org-everville',
      workspaceId: 'workspace-content',
      projectId: 'project-cash-on-rails',
    })
  })
})
