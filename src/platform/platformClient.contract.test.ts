import { describe, expect, it, vi } from 'vitest'

import type {
  PersistedConversationArea,
  PersistedConversationsV2,
  PlatformAssetImportFileRequest,
  PlatformAssetImportRemoteUrlRequest,
  PlatformAssetListRequest,
  PlatformCapability,
  PlatformClient,
  PlatformErrorCode,
  PlatformResult,
  WorkbenchAssetDto,
} from './client'
import { createElectronPlatformClient } from './electronPlatformClient'

const PROJECT_ID = 'project-alpha'

const LOCAL_RUNTIME_CAPABILITIES = [
  'identity.session.read',
  'authorization.check',
] as const satisfies readonly PlatformCapability[]

const CAPABILITIES = [
  ...LOCAL_RUNTIME_CAPABILITIES,
  'conversations.read',
  'conversations.write',
  'assets.list',
  'assets.import-file',
  'assets.import-remote-url',
] as const satisfies readonly PlatformCapability[]

const creation = Object.freeze({}) as PersistedConversationArea
const generation = Object.freeze({}) as PersistedConversationArea
const committedProposal = Object.freeze({ approved: false })
const conversations = Object.freeze({}) as PersistedConversationsV2
const asset = Object.freeze({}) as WorkbenchAssetDto
const bytes = new Uint8Array([7, 11, 17]).buffer

const conversationValue = {
  creation,
  generation,
  committedProposal,
}

const listRequest = {
  projectId: PROJECT_ID,
  cursor: 'cursor-1',
  limit: 25,
  kind: 'image',
} satisfies PlatformAssetListRequest

const fileRequest = {
  projectId: PROJECT_ID,
  fileName: 'frame.png',
  contentType: 'image/png',
  bytes,
  kind: 'image',
} satisfies PlatformAssetImportFileRequest

const remoteRequest = {
  projectId: PROJECT_ID,
  url: 'https://assets.example.test/frame.png',
  kind: 'image',
  fileName: 'remote-frame.png',
  ownerNodeId: 'node-1',
} satisfies PlatformAssetImportRemoteUrlRequest

type Operation = {
  capability: PlatformCapability
  invoke(client: PlatformClient): Promise<PlatformResult<unknown>>
}

const operations: readonly Operation[] = [
  {
    capability: 'conversations.read',
    invoke: (client) => client.conversations.read(PROJECT_ID),
  },
  {
    capability: 'conversations.write',
    invoke: (client) => client.conversations.write(PROJECT_ID, conversationValue),
  },
  {
    capability: 'assets.list',
    invoke: (client) => client.assets.list(listRequest),
  },
  {
    capability: 'assets.import-file',
    invoke: (client) => client.assets.importFile(fileRequest),
  },
  {
    capability: 'assets.import-remote-url',
    invoke: (client) => client.assets.importRemoteUrl(remoteRequest),
  },
]

function asElectronBridge(bridge: unknown): Parameters<typeof createElectronPlatformClient>[0] {
  return bridge as Parameters<typeof createElectronPlatformClient>[0]
}

async function expectUnsupportedConformance(client: PlatformClient) {
  for (const operation of operations) {
    expect(client.supports(operation.capability)).toBe(false)

    const result = await operation.invoke(client)
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: 'UNSUPPORTED_CAPABILITY',
        capability: operation.capability,
        retryable: false,
        message: expect.any(String),
      }),
    })
  }
}

function expectFailure(result: PlatformResult<unknown>, capability: PlatformCapability, code: PlatformErrorCode) {
  expect(result.ok).toBe(false)
  if (result.ok) {
    throw new Error(`Expected ${capability} to fail`)
  }

  expect(result.error).toEqual(
    expect.objectContaining({
      code,
      capability,
      message: expect.any(String),
      retryable: expect.any(Boolean),
    }),
  )
}

describe('PlatformClient contract', () => {
  it('delegates all five capabilities through Electron with exact DesktopBridge payloads', async () => {
    const read = vi.fn(async () => ({ ok: true, conversations }))
    const write = vi.fn(async () => ({ ok: true }))
    const list = vi.fn(async () => ({ items: [asset], cursor: 'cursor-2' }))
    const importFile = vi.fn(async () => asset)
    const importRemoteUrl = vi.fn(async () => asset)

    const client = createElectronPlatformClient(
      asElectronBridge({
        conversations: { read, write },
        assets: { list, importFile, importRemoteUrl },
      }),
    )

    expect([...client.capabilities]).toEqual(CAPABILITIES)
    for (const capability of CAPABILITIES) {
      expect(client.supports(capability)).toBe(true)
    }

    await expect(client.conversations.read(PROJECT_ID)).resolves.toEqual({
      ok: true,
      value: conversations,
    })
    expect(read).toHaveBeenCalledTimes(1)
    expect(read).toHaveBeenCalledWith({ projectId: PROJECT_ID })

    await expect(client.conversations.write(PROJECT_ID, conversationValue)).resolves.toEqual({
      ok: true,
      value: undefined,
    })
    expect(write).toHaveBeenCalledTimes(1)
    expect(write).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      creation,
      generation,
      committedProposal,
    })

    await expect(client.assets.list(listRequest)).resolves.toEqual({
      ok: true,
      value: { items: [asset], cursor: 'cursor-2' },
    })
    expect(list).toHaveBeenCalledTimes(1)
    expect(list).toHaveBeenCalledWith(listRequest)

    await expect(client.assets.importFile(fileRequest)).resolves.toEqual({
      ok: true,
      value: asset,
    })
    expect(importFile).toHaveBeenCalledTimes(1)
    expect(importFile).toHaveBeenCalledWith(fileRequest)

    await expect(client.assets.importRemoteUrl(remoteRequest)).resolves.toEqual({ ok: true, value: asset })
    expect(importRemoteUrl).toHaveBeenCalledTimes(1)
    expect(importRemoteUrl).toHaveBeenCalledWith(remoteRequest)
  })

  it('advertises local authorization plus only injected Electron methods and returns typed unsupported results for missing methods', async () => {
    const list = vi.fn(async () => ({ items: [asset], cursor: null }))
    const client = createElectronPlatformClient(asElectronBridge({ assets: { list } }))

    expect([...client.capabilities]).toEqual([...LOCAL_RUNTIME_CAPABILITIES, 'assets.list'])
    expect(client.supports('identity.session.read')).toBe(true)
    expect(client.supports('authorization.check')).toBe(true)
    expect(client.supports('assets.list')).toBe(true)
    await expect(client.assets.list(listRequest)).resolves.toEqual({
      ok: true,
      value: { items: [asset], cursor: null },
    })

    for (const operation of operations.filter(({ capability }) => capability !== 'assets.list')) {
      const result = await operation.invoke(client)
      expectFailure(result, operation.capability, 'UNSUPPORTED_CAPABILITY')
      if (!result.ok) {
        expect(result.error.retryable).toBe(false)
      }
    }
  })

  it('preserves unsupported service conformance while exposing runtime-specific identity and authorization', async () => {
    const electronClient = createElectronPlatformClient(asElectronBridge({}))
    const { createBrowserPlatformClient } = await import('./browserPlatformClient')
    const browserClient = createBrowserPlatformClient()

    expect([...electronClient.capabilities]).toEqual(LOCAL_RUNTIME_CAPABILITIES)
    expect(electronClient.supports('identity.session.read')).toBe(true)
    expect(electronClient.supports('authorization.check')).toBe(true)
    await expect(electronClient.identity.getSession()).resolves.toEqual({
      ok: true,
      value: {
        state: 'authenticated',
        principal: {
          id: 'local-runtime:principal',
          kind: 'local-runtime',
          displayName: 'Local runtime',
        },
        activeMembership: {
          principalId: 'local-runtime:principal',
          organizationId: 'local-runtime:organization',
          status: 'active',
          organizationPermissions: [],
          projects: [],
        },
      },
    })
    await expect(
      electronClient.authorization.check({
        resource: {
          family: 'project',
          scope: {
            kind: 'project',
            organizationId: 'local-runtime:organization',
            projectId: PROJECT_ID,
          },
        },
        permission: 'project.read',
      }),
    ).resolves.toEqual({
      ok: true,
      value: { allowed: true, reason: 'ALLOW_EXPLICIT_PERMISSION' },
    })

    expect([...browserClient.capabilities]).toEqual(['identity.session.read'])
    expect(browserClient.supports('identity.session.read')).toBe(true)
    expect(browserClient.supports('authorization.check')).toBe(false)
    await expect(browserClient.identity.getSession()).resolves.toEqual({
      ok: true,
      value: { state: 'unauthenticated' },
    })
    await expect(
      browserClient.authorization.check({
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

    await expectUnsupportedConformance(electronClient)
    await expectUnsupportedConformance(browserClient)
  })

  it('normalizes failed Electron conversation responses without throwing', async () => {
    const client = createElectronPlatformClient(
      asElectronBridge({
        conversations: {
          read: vi.fn(async () => ({ ok: false, error: 'read failed' })),
          write: vi.fn(async () => ({ ok: false, error: 'write failed' })),
        },
      }),
    )

    const readResult = await client.conversations.read(PROJECT_ID)
    const writeResult = await client.conversations.write(PROJECT_ID, conversationValue)

    expectFailure(readResult, 'conversations.read', 'INTERNAL')
    expectFailure(writeResult, 'conversations.write', 'INTERNAL')
  })

  it('normalizes rejected Electron calls to stable typed errors without leaking causes', async () => {
    const unknownError = new Error('unexpected failure') as Error & {
      cause?: unknown
    }
    unknownError.cause = {
      apiKey: 'super-secret',
      credentialPath: '/Users/private/.credentials/provider.json',
    }

    const client = createElectronPlatformClient(
      asElectronBridge({
        conversations: {
          read: vi.fn().mockRejectedValue(new Error('projectId is required')),
          write: vi.fn().mockRejectedValue(new Error('EIO: write failed')),
        },
        assets: {
          list: vi.fn().mockRejectedValue(new Error('asset not found')),
          importFile: vi.fn().mockRejectedValue(unknownError),
          importRemoteUrl: vi.fn().mockRejectedValue(new Error('network timeout while fetching asset')),
        },
      }),
    )

    const results = await Promise.all([
      client.conversations.read(PROJECT_ID),
      client.conversations.write(PROJECT_ID, conversationValue),
      client.assets.list(listRequest),
      client.assets.importFile(fileRequest),
      client.assets.importRemoteUrl(remoteRequest),
    ])

    expectFailure(results[0], 'conversations.read', 'INVALID_ARGUMENT')
    expectFailure(results[1], 'conversations.write', 'IO_ERROR')
    expectFailure(results[2], 'assets.list', 'NOT_FOUND')
    expectFailure(results[3], 'assets.import-file', 'INTERNAL')
    expectFailure(results[4], 'assets.import-remote-url', 'NETWORK_ERROR')

    expect(JSON.stringify(results[3])).not.toContain('super-secret')
    expect(JSON.stringify(results[3])).not.toContain('/Users/private')
  })
})
