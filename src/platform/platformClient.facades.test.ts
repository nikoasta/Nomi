import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  PersistedConversationsV2,
  PlatformClient,
  PlatformError,
  PlatformResult,
  WorkbenchAssetDto,
} from './client'

const harness = vi.hoisted(() => ({
  client: null as unknown,
  activeProjectId: '',
  creationMessages: [] as Array<{ id: string; role: 'user' | 'assistant'; content: string }>,
  generationMessages: [] as Array<{ id: string; role: 'user' | 'assistant'; content: string }>,
  committedProposal: null as unknown,
  setCreationMessages: vi.fn(),
  setGenerationMessages: vi.fn(),
  seedSession: vi.fn(async () => undefined),
}))

vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./client')>()
  return { ...actual, getPlatformClient: () => harness.client }
})

vi.mock('../desktop/activeProject', () => ({
  getDesktopActiveProjectId: () => harness.activeProjectId,
}))

vi.mock('../api/desktopClient', () => ({
  seedWorkbenchAgentSession: harness.seedSession,
}))

vi.mock('../workbench/ai/workbenchAgentRunner', () => ({
  workbenchSessionKey: (area: string) => `session:${area}`,
}))

vi.mock('../workbench/workbenchStore', () => ({
  useWorkbenchStore: {
    getState: () => ({
      creationAiMessages: harness.creationMessages,
      setCreationAiMessages: (messages: typeof harness.creationMessages) => {
        harness.creationMessages = messages
        harness.setCreationMessages(messages)
      },
    }),
    subscribe: vi.fn(() => () => undefined),
  },
}))

vi.mock('../workbench/generationCanvas/store/generationCanvasStore', () => ({
  useGenerationCanvasStore: {
    getState: () => ({
      generationAiMessages: harness.generationMessages,
      setGenerationAiMessages: (messages: typeof harness.generationMessages) => {
        harness.generationMessages = messages
        harness.setGenerationMessages(messages)
      },
    }),
    subscribe: vi.fn(() => () => undefined),
  },
}))

vi.mock('../workbench/generationCanvas/agent/proposalUndo', () => ({
  getCommittedProposal: () => harness.committedProposal,
  parseCommittedProposalRecord: (value: unknown) => value,
  setCommittedProposal: vi.fn(),
  clearCommittedProposal: vi.fn(),
  subscribeCommittedProposal: vi.fn(() => () => undefined),
}))

import {
  flushConversationsNow,
  loadProjectConversations,
  scheduleConversationsWrite,
} from '../workbench/ai/conversationPersistence'
import { subscribePlatformDiagnostics, type PlatformDiagnosticEvent } from './platformDiagnostics'
import { __resetConversationThreadsForTests } from '../workbench/ai/conversationThreads'
import {
  importWorkbenchLocalAssetFile,
  importWorkbenchRemoteAssetUrl,
  listWorkbenchLocalAssets,
  PlatformOperationError,
} from '../workbench/api/assetUploadApi'

const PROJECT_ID = 'project-facade'

const asset: WorkbenchAssetDto = {
  id: 'asset-facade',
  name: 'frame.png',
  data: { url: 'nomi-local://frame.png' },
  createdAt: '2026-07-17T00:00:00.000Z',
  updatedAt: '2026-07-17T00:00:00.000Z',
  userId: 'local',
  projectId: PROJECT_ID,
}

function failure(capability: PlatformError['capability'], code: PlatformError['code']): PlatformResult<never> {
  return {
    ok: false,
    error: {
      code,
      capability,
      message: `${capability} failed`,
      retryable: code === 'NETWORK_ERROR',
      details: { source: 'test' },
    },
  }
}

function makeClient(
  overrides: {
    read?: PlatformClient['conversations']['read']
    write?: PlatformClient['conversations']['write']
    list?: PlatformClient['assets']['list']
    importFile?: PlatformClient['assets']['importFile']
    importRemoteUrl?: PlatformClient['assets']['importRemoteUrl']
  } = {},
): PlatformClient {
  const capabilities = new Set<PlatformError['capability']>([
    'conversations.read',
    'conversations.write',
    'assets.list',
    'assets.import-file',
    'assets.import-remote-url',
  ])
  return {
    capabilities,
    supports: (capability) => capabilities.has(capability),
    conversations: {
      read: overrides.read ?? vi.fn(async () => ({ ok: true, value: null })),
      write: overrides.write ?? vi.fn(async () => ({ ok: true, value: undefined })),
    },
    assets: {
      list: overrides.list ?? vi.fn(async () => ({ ok: true, value: { items: [], cursor: null } })),
      importFile: overrides.importFile ?? vi.fn(async () => ({ ok: true, value: asset })),
      importRemoteUrl: overrides.importRemoteUrl ?? vi.fn(async () => ({ ok: true, value: asset })),
    },
  }
}

describe('conversation persistence PlatformClient facade', () => {
  let diagnostics: PlatformDiagnosticEvent[]
  let unsubscribeDiagnostics: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T12:00:00.000Z'))
    flushConversationsNow(null)
    __resetConversationThreadsForTests()
    harness.creationMessages = []
    harness.generationMessages = []
    harness.committedProposal = null
    harness.setCreationMessages.mockClear()
    harness.setGenerationMessages.mockClear()
    harness.seedSession.mockClear()
    diagnostics = []
    unsubscribeDiagnostics = subscribePlatformDiagnostics((event) => diagnostics.push(event))
  })

  afterEach(() => {
    flushConversationsNow(null)
    unsubscribeDiagnostics()
    vi.useRealTimers()
  })

  it('debounces writes and flushes both store projections with the committed proposal', async () => {
    const write = vi.fn(async () => ({ ok: true as const, value: undefined }))
    harness.client = makeClient({ write })
    harness.creationMessages = [{ id: 'c1', role: 'user', content: 'Create a launch image' }]
    harness.generationMessages = [{ id: 'g1', role: 'assistant', content: 'Draft ready' }]
    harness.committedProposal = { proposalId: 'proposal-1' }

    flushConversationsNow(PROJECT_ID)
    expect(write).toHaveBeenCalledWith(
      PROJECT_ID,
      expect.objectContaining({
        creation: expect.objectContaining({
          threads: [
            expect.objectContaining({ messages: [{ id: 'c1', role: 'user', content: 'Create a launch image' }] }),
          ],
        }),
        generation: expect.objectContaining({
          threads: [expect.objectContaining({ messages: [{ id: 'g1', role: 'assistant', content: 'Draft ready' }] })],
        }),
        committedProposal: { proposalId: 'proposal-1' },
      }),
    )
    write.mockClear()

    scheduleConversationsWrite(() => PROJECT_ID)
    scheduleConversationsWrite(() => PROJECT_ID)
    await vi.advanceTimersByTimeAsync(999)
    expect(write).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)

    expect(write).toHaveBeenCalledTimes(1)
    expect(write).toHaveBeenCalledWith(
      PROJECT_ID,
      expect.objectContaining({ committedProposal: { proposalId: 'proposal-1' } }),
    )
  })

  it('hydrates successful data and model-memory projections', async () => {
    const persisted: PersistedConversationsV2 = {
      v: 2,
      creation: {
        activeId: 'creation-thread',
        threads: [
          {
            id: 'creation-thread',
            title: 'Brief',
            createdAt: 1,
            updatedAt: 2,
            messages: [{ id: 'c1', role: 'user', content: 'Campaign brief' }],
          },
        ],
      },
      generation: {
        activeId: 'generation-thread',
        threads: [
          {
            id: 'generation-thread',
            title: 'Output',
            createdAt: 3,
            updatedAt: 4,
            messages: [{ id: 'g1', role: 'assistant', content: 'Campaign output' }],
          },
        ],
      },
    }
    harness.client = makeClient({ read: vi.fn(async () => ({ ok: true, value: persisted })) })

    await loadProjectConversations(PROJECT_ID)

    expect(harness.setCreationMessages).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'c1', role: 'user', content: 'Campaign brief' }),
    ])
    expect(harness.setGenerationMessages).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'g1', role: 'assistant', content: 'Campaign output' }),
    ])
    expect(harness.seedSession).toHaveBeenCalledWith('session:creation', [{ role: 'user', content: 'Campaign brief' }])
    expect(harness.seedSession).toHaveBeenCalledWith('session:generation', [
      { role: 'assistant', content: 'Campaign output' },
    ])
  })

  it('hydrates an empty model for missing data and bridge-response failures', async () => {
    for (const result of [
      { ok: true as const, value: null },
      {
        ok: false as const,
        error: {
          code: 'INTERNAL' as const,
          capability: 'conversations.read' as const,
          message: 'invalid persisted data',
          retryable: false,
          details: { source: 'bridge-response' },
        },
      },
    ]) {
      harness.setCreationMessages.mockClear()
      harness.setGenerationMessages.mockClear()
      harness.client = makeClient({ read: vi.fn(async () => result) })

      await loadProjectConversations(`${PROJECT_ID}-${String(result.ok)}`)

      expect(harness.setCreationMessages).toHaveBeenCalledWith([])
      expect(harness.setGenerationMessages).toHaveBeenCalledWith([])
    }
  })

  it('keeps failures non-blocking while reporting only safe structured diagnostics', async () => {
    for (const result of [
      failure('conversations.read', 'UNSUPPORTED_CAPABILITY'),
      failure('conversations.read', 'IO_ERROR'),
    ]) {
      harness.setCreationMessages.mockClear()
      harness.setGenerationMessages.mockClear()
      harness.client = makeClient({ read: vi.fn(async () => result) })

      await expect(loadProjectConversations(PROJECT_ID)).resolves.toBeUndefined()
      expect(harness.setCreationMessages).not.toHaveBeenCalled()
      expect(harness.setGenerationMessages).not.toHaveBeenCalled()
    }

    expect(diagnostics).toEqual([
      {
        kind: 'platform-operation-failure',
        capability: 'conversations.read',
        code: 'IO_ERROR',
        source: 'platform-result',
        context: 'conversation-load',
      },
    ])

    const write = vi.fn(async () => failure('conversations.write', 'IO_ERROR'))
    harness.client = makeClient({ write })
    expect(() => flushConversationsNow(PROJECT_ID)).not.toThrow()
    expect(write).toHaveBeenCalledTimes(1)
    await vi.runAllTimersAsync()
    expect(diagnostics.at(-1)).toEqual({
      kind: 'platform-operation-failure',
      capability: 'conversations.write',
      code: 'IO_ERROR',
      source: 'platform-result',
      context: 'conversation-write',
    })
    expect(JSON.stringify(diagnostics)).not.toContain('failed')
  })

  it('reports unexpected rejected contract bugs without exposing rejected values', async () => {
    harness.client = makeClient({
      read: vi.fn().mockRejectedValue(new Error('client_secret=read-secret')),
      write: vi.fn().mockRejectedValue({ unknownCredential: 'write-secret' }),
    })

    await expect(loadProjectConversations(PROJECT_ID)).resolves.toBeUndefined()
    expect(() => flushConversationsNow(PROJECT_ID)).not.toThrow()
    await vi.runAllTimersAsync()

    expect(diagnostics).toEqual([
      {
        kind: 'platform-operation-failure',
        capability: 'conversations.read',
        code: 'INTERNAL',
        source: 'contract-rejection',
        context: 'conversation-load',
      },
      {
        kind: 'platform-operation-failure',
        capability: 'conversations.write',
        code: 'INTERNAL',
        source: 'contract-rejection',
        context: 'conversation-write',
      },
    ])
    expect(JSON.stringify(diagnostics)).not.toContain('read-secret')
    expect(JSON.stringify(diagnostics)).not.toContain('write-secret')
  })
})

describe('asset upload PlatformClient facade', () => {
  beforeEach(() => {
    harness.activeProjectId = PROJECT_ID
  })

  it('lists the active project and preserves pagination from the platform result', async () => {
    const list = vi.fn(async () => ({ ok: true as const, value: { items: [asset], cursor: 'cursor-2' } }))
    harness.client = makeClient({ list })

    await expect(listWorkbenchLocalAssets()).resolves.toEqual({ items: [asset], cursor: 'cursor-2' })
    expect(list).toHaveBeenCalledWith({ projectId: PROJECT_ID, limit: 200 })

    harness.activeProjectId = ''
    await expect(listWorkbenchLocalAssets()).resolves.toEqual({ items: [], cursor: null })
    expect(list).toHaveBeenCalledTimes(1)
  })

  it('converts File bytes and applies explicit project, default name, content type, and upload metadata', async () => {
    const importFile = vi.fn(async () => ({ ok: true as const, value: asset }))
    harness.client = makeClient({ importFile })
    const bytes = new Uint8Array([13, 21, 34]).buffer
    const arrayBuffer = vi.fn(async () => bytes)
    const file = { name: '', type: '', size: 3, lastModified: 1, arrayBuffer } as unknown as File

    await expect(importWorkbenchLocalAssetFile(file, undefined, { projectId: 'project-explicit' })).resolves.toBe(asset)
    expect(arrayBuffer).toHaveBeenCalledTimes(1)
    expect(importFile).toHaveBeenCalledWith({
      projectId: 'project-explicit',
      fileName: 'asset',
      contentType: 'application/octet-stream',
      bytes,
      kind: 'upload',
    })
  })

  it('passes remote owner-node metadata and uses the active project by default', async () => {
    const importRemoteUrl = vi.fn(async () => ({ ok: true as const, value: asset }))
    harness.client = makeClient({ importRemoteUrl })

    await expect(
      importWorkbenchRemoteAssetUrl('https://assets.example.test/remote.png', 'remote.png', {
        ownerNodeId: 'node-42',
      }),
    ).resolves.toBe(asset)
    expect(importRemoteUrl).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      url: 'https://assets.example.test/remote.png',
      kind: 'upload',
      fileName: 'remote.png',
      ownerNodeId: 'node-42',
    })
  })

  it('converts unsupported and operational results into stable PlatformOperationError instances', async () => {
    const unsupported = failure('assets.list', 'UNSUPPORTED_CAPABILITY')
    const network = failure('assets.import-remote-url', 'NETWORK_ERROR')
    const client = makeClient({
      list: vi.fn(async () => unsupported),
      importRemoteUrl: vi.fn(async () => network),
    })
    client.supports = () => false
    harness.client = client

    const listError = await listWorkbenchLocalAssets().catch((error: unknown) => error)
    expect(listError).toBeInstanceOf(PlatformOperationError)
    expect(listError).toMatchObject({
      code: 'UNSUPPORTED_CAPABILITY',
      capability: 'assets.list',
      retryable: false,
      message: 'local asset list requires the Electron desktop runtime',
    })

    const remoteError = await importWorkbenchRemoteAssetUrl('https://assets.example.test/remote.png').catch(
      (error: unknown) => error,
    )
    expect(remoteError).toBeInstanceOf(PlatformOperationError)
    expect(remoteError).toMatchObject({
      code: 'NETWORK_ERROR',
      capability: 'assets.import-remote-url',
      retryable: true,
      details: { source: 'test' },
    })
  })
})
