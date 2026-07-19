import { readFileSync } from 'node:fs'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AssetId, AssetVersionId } from './assets/contracts'
import type { PersistedConversationArea, PlatformCapability, PlatformClient } from './client'
import { PORTAL_CAPABILITIES } from './collaboration/contracts'
import { ORGANIZATION_CAPABILITIES } from './organizations/contracts'

const CAPABILITIES = [
  'conversations.read',
  'conversations.write',
  'assets.list',
  'assets.import-file',
  'assets.import-remote-url',
  'asset-records.list',
  'asset-records.import-file',
  'asset-records.import-remote-url',
  'asset-records.resolve',
  ...PORTAL_CAPABILITIES,
  ...ORGANIZATION_CAPABILITIES,
] as const satisfies readonly PlatformCapability[]

const PROJECT_ID = 'project-browser-boundary'
const ORGANIZATION_ID = 'organization-browser-boundary'
const ASSET_ID = 'ast_123e4567-e89b-42d3-a456-426614174000' as AssetId
const VERSION_ID = 'av_123e4567-e89b-42d3-a456-426614174000' as AssetVersionId
const EMPTY_CONVERSATION_AREA = Object.freeze({}) as PersistedConversationArea

async function invokeCapability(client: PlatformClient, capability: PlatformCapability) {
  switch (capability) {
    case 'conversations.read':
      return client.conversations.read(PROJECT_ID)
    case 'conversations.write':
      return client.conversations.write(PROJECT_ID, {
        creation: EMPTY_CONVERSATION_AREA,
        generation: EMPTY_CONVERSATION_AREA,
      })
    case 'assets.list':
      return client.assets.list({ projectId: PROJECT_ID })
    case 'assets.import-file':
      return client.assets.importFile({
        projectId: PROJECT_ID,
        fileName: 'browser-frame.png',
        contentType: 'image/png',
        bytes: new Uint8Array([1, 2, 3]).buffer,
      })
    case 'assets.import-remote-url':
      return client.assets.importRemoteUrl({
        projectId: PROJECT_ID,
        url: 'https://assets.example.test/browser-frame.png',
      })
    case 'asset-records.list':
      return client.assetRecords.list({
        organizationId: ORGANIZATION_ID,
        projectId: PROJECT_ID,
      })
    case 'asset-records.import-file':
      return client.assetRecords.importFile({
        organizationId: ORGANIZATION_ID,
        projectId: PROJECT_ID,
        fileName: 'browser-frame.png',
        claimedMediaType: 'image/png',
        bytes: new Uint8Array([1, 2, 3]).buffer,
        classification: 'internal',
        idempotencyKey: 'browser-file-import-1',
      })
    case 'asset-records.import-remote-url':
      return client.assetRecords.importRemoteUrl({
        organizationId: ORGANIZATION_ID,
        projectId: PROJECT_ID,
        url: 'https://assets.example.test/browser-frame.png',
        fileName: 'browser-frame.png',
        claimedMediaType: 'image/png',
        classification: 'internal',
        idempotencyKey: 'browser-remote-import-1',
      })
    case 'asset-records.resolve':
      return client.assetRecords.resolve({
        organizationId: ORGANIZATION_ID,
        projectId: PROJECT_ID,
        assetId: ASSET_ID,
        versionId: VERSION_ID,
        purpose: 'display',
      })
    case 'portal.projects.list':
      return client.collaboration.listProjects({
        organizationId: ORGANIZATION_ID,
        workspaceId: 'workspace-browser-boundary',
      })
    case 'portal.projects.create':
      return client.collaboration.createProject({
        organizationId: ORGANIZATION_ID,
        workspaceId: 'workspace-browser-boundary',
        title: 'Browser Project',
        slug: 'browser-project',
        classification: 'internal',
        idempotencyKey: 'browser-project-create-1',
      })
    case 'portal.project-revisions.save':
      return client.collaboration.saveProjectRevision({
        organizationId: ORGANIZATION_ID,
        workspaceId: 'workspace-browser-boundary',
        projectId: PROJECT_ID,
        expectedCurrentRevisionId: null,
        snapshotDigest: 'a'.repeat(64),
        snapshot: { schemaVersion: 'nomi-project.v1' },
        idempotencyKey: 'browser-revision-save-1',
      })
    case 'portal.review-queue.list':
      return client.collaboration.listReviewQueue({
        organizationId: ORGANIZATION_ID,
        workspaceId: 'workspace-browser-boundary',
      })
    case 'portal.approvals.decide':
      return client.collaboration.decideApproval({
        organizationId: ORGANIZATION_ID,
        workspaceId: 'workspace-browser-boundary',
        approvalGateId: 'approval-browser-boundary',
        projectId: PROJECT_ID,
        decision: 'approved',
        comment: null,
        expectedPolicySnapshotDigest: 'b'.repeat(64),
        idempotencyKey: 'browser-approval-1',
      })
    case 'portal.audit-events.append':
      return client.collaboration.appendAuditEvent({
        organizationId: ORGANIZATION_ID,
        workspaceId: 'workspace-browser-boundary',
        projectId: PROJECT_ID,
        action: 'project.view',
        targetType: 'project',
        targetId: PROJECT_ID,
        metadata: {},
        idempotencyKey: 'browser-audit-1',
      })
    case 'org.organizations.list':
      return client.organizations.listOrganizations({ limit: 25 })
    case 'org.workspaces.list':
      return client.organizations.listWorkspaces({
        organizationId: ORGANIZATION_ID,
        limit: 25,
      })
    case 'org.memberships.list':
      return client.organizations.listMemberships({
        organizationId: ORGANIZATION_ID,
        workspaceId: 'workspace-browser-boundary',
        limit: 25,
      })
  }
}

afterEach(() => {
  vi.doUnmock('../desktop/bridge')
  vi.resetModules()
})

describe('PlatformClient runtime boundary', () => {
  it('imports the browser adapter with no window or desktop bridge load and returns nine typed unsupported results', async () => {
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    const desktopBridgeLoaded = vi.fn()

    expect(Reflect.deleteProperty(globalThis, 'window')).toBe(true)
    expect('window' in globalThis).toBe(false)

    vi.resetModules()
    vi.doMock('../desktop/bridge', () => {
      desktopBridgeLoaded()
      throw new Error('The browser adapter loaded the Electron bridge')
    })

    try {
      const { createBrowserPlatformClient } = await import('./browserPlatformClient')
      const client = createBrowserPlatformClient()

      expect(desktopBridgeLoaded).not.toHaveBeenCalled()
      expect([...client.capabilities]).toEqual(['identity.session.read'])
      expect(client.supports('identity.session.read')).toBe(true)
      expect(client.supports('authorization.check')).toBe(false)
      await expect(client.identity.getSession()).resolves.toEqual({
        ok: true,
        value: { state: 'unauthenticated' },
      })
      await expect(
        client.authorization.check({
          resource: {
            family: 'project',
            scope: {
              kind: 'project',
              organizationId: 'browser-organization',
              projectId: PROJECT_ID,
            },
          },
          permission: 'project.read',
        }),
      ).resolves.toEqual({
        ok: false,
        error: expect.objectContaining({
          code: 'UNSUPPORTED_CAPABILITY',
          capability: 'authorization.check',
          retryable: false,
          message: expect.any(String),
        }),
      })

      for (const capability of CAPABILITIES) {
        expect(client.supports(capability)).toBe(false)
        await expect(invokeCapability(client, capability)).resolves.toEqual({
          ok: false,
          error: expect.objectContaining({
            code: 'UNSUPPORTED_CAPABILITY',
            capability,
            retryable: false,
            message: expect.any(String),
          }),
        })
      }
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, 'window', previousWindow)
      } else {
        Reflect.deleteProperty(globalThis, 'window')
      }
    }
  })

  it('routes both selected renderer modules through getPlatformClient without direct DesktopBridge access', () => {
    const selectedModules = [
      new URL('../workbench/ai/conversationPersistence.ts', import.meta.url),
      new URL('../workbench/api/assetUploadApi.ts', import.meta.url),
    ]

    for (const moduleUrl of selectedModules) {
      const source = readFileSync(moduleUrl, 'utf8')
      const label = moduleUrl.pathname

      expect(source, `${label} imports the PlatformClient accessor`).toMatch(
        /import\s*\{[^}]*\bgetPlatformClient\b[^}]*\}\s*from\s*['"][^'"]*platform\/client(?:\.ts)?['"]/,
      )
      expect(source, `${label} imports the desktop bridge`).not.toMatch(/desktop\/bridge/)
      expect(source, `${label} calls getDesktopBridge`).not.toMatch(/\bgetDesktopBridge\b/)
      expect(source, `${label} reads window.nomiDesktop`).not.toMatch(
        /\bwindow\s*(?:\.\s*nomiDesktop|\[\s*['"]nomiDesktop['"]\s*\])/,
      )
    }
  })
})
