import { describe, expect, it, vi } from 'vitest'

const { getDesktopBridgeMock } = vi.hoisted(() => ({
  getDesktopBridgeMock: vi.fn(),
}))

vi.mock('../desktop/bridge', () => ({
  getDesktopBridge: getDesktopBridgeMock,
}))

import { getPlatformClient, type PersistedConversationsV2, type WorkbenchAssetDto } from './client'
import { createElectronPlatformClient } from './electronPlatformClient'

const PROJECT_ID = 'project-composition'

const conversations: PersistedConversationsV2 = {
  v: 2,
  creation: { activeId: null, threads: [] },
  generation: { activeId: null, threads: [] },
}

const asset: WorkbenchAssetDto = {
  id: 'asset-1',
  name: 'frame.png',
  data: { url: 'nomi-local://frame.png' },
  createdAt: '2026-07-17T00:00:00.000Z',
  updatedAt: '2026-07-17T00:00:00.000Z',
  userId: 'local',
  projectId: PROJECT_ID,
}

describe('getPlatformClient Electron composition', () => {
  it('adapts the real positional DesktopBridge conversation API and passes asset payloads unchanged', async () => {
    const read = vi.fn(async () => ({ ok: true, conversations }))
    const write = vi.fn(async () => ({ ok: true }))
    const list = vi.fn(async () => ({ items: [asset], cursor: 'next-page' }))
    const importFile = vi.fn(async () => asset)
    const importRemoteUrl = vi.fn(async () => asset)
    const bridge = {
      conversations: { read, write },
      assets: { list, importFile, importRemoteUrl },
    }
    getDesktopBridgeMock.mockReturnValue(bridge)

    const client = getPlatformClient()
    const value = {
      creation: conversations.creation,
      generation: conversations.generation,
      committedProposal: { proposalId: 'proposal-1' },
    }
    const listRequest = { projectId: PROJECT_ID, cursor: 'cursor-1', limit: 25, kind: 'image' }
    const bytes = new Uint8Array([3, 5, 8]).buffer
    const fileRequest = {
      projectId: PROJECT_ID,
      fileName: 'frame.png',
      contentType: 'image/png',
      bytes,
      kind: 'upload',
    }
    const remoteRequest = {
      projectId: PROJECT_ID,
      url: 'https://assets.example.test/frame.png',
      kind: 'upload',
      fileName: 'remote.png',
      ownerNodeId: 'node-1',
    }

    await expect(client.conversations.read(PROJECT_ID)).resolves.toEqual({ ok: true, value: conversations })
    await expect(client.conversations.write(PROJECT_ID, value)).resolves.toEqual({ ok: true, value: undefined })
    await expect(client.assets.list(listRequest)).resolves.toEqual({
      ok: true,
      value: { items: [asset], cursor: 'next-page' },
    })
    await expect(client.assets.importFile(fileRequest)).resolves.toEqual({ ok: true, value: asset })
    await expect(client.assets.importRemoteUrl(remoteRequest)).resolves.toEqual({ ok: true, value: asset })

    expect(read).toHaveBeenCalledWith(PROJECT_ID)
    expect(write).toHaveBeenCalledWith(PROJECT_ID, value)
    expect(list).toHaveBeenCalledWith(listRequest)
    expect(importFile).toHaveBeenCalledWith(fileRequest)
    expect(importRemoteUrl).toHaveBeenCalledWith(remoteRequest)
  })
})

describe('PlatformClient diagnostic redaction', () => {
  it('fails closed for rejected calls and failed bridge responses', async () => {
    const secretFragments = [
      'bearer-secret',
      'header-secret',
      'login-secret',
      'oauth-secret',
      'session-secret',
      'cookie-secret',
      'unknown-secret',
      '/Users/niko.dev',
      'C:\\Users\\niko\\.config\\credentials.json',
      'url-user:url-password',
      'cause-secret',
    ]
    const rejection = new Error(
      'Authorization: Bearer bearer-secret client_secret=oauth-secret Cookie: sid=cookie-secret session=session-secret at /Users/niko.dev/.config/provider/credentials.json C:\\Users\\niko\\.config\\credentials.json https://url-user:url-password@example.test unknownCredential=unknown-secret',
    ) as Error & { cause?: unknown }
    rejection.cause = { privateValue: 'cause-secret' }
    const client = createElectronPlatformClient({
      conversations: {
        read: vi.fn().mockRejectedValue(rejection),
        write: vi.fn(async () => ({ ok: false, error: 'x-api-key=header-secret password: login-secret' })),
      },
    })

    const read = await client.conversations.read(PROJECT_ID)
    const write = await client.conversations.write(PROJECT_ID, {
      creation: conversations.creation,
      generation: conversations.generation,
    })
    const serialized = JSON.stringify({ read, write })

    for (const fragment of secretFragments) expect(serialized).not.toContain(fragment)
    expect(read).toEqual({
      ok: false,
      error: {
        code: 'INTERNAL',
        capability: 'conversations.read',
        message: 'The operation failed unexpectedly (conversations.read)',
        retryable: false,
        details: { source: 'bridge-rejection' },
      },
    })
    expect(write).toEqual({
      ok: false,
      error: {
        code: 'INTERNAL',
        capability: 'conversations.write',
        message: 'The operation failed unexpectedly (conversations.write)',
        retryable: false,
        details: { source: 'bridge-response', hasDiagnostic: true },
      },
    })
  })

  it('classifies explicit failed-response signals and keeps generic failures internal', async () => {
    const cases = [
      ['project not found', 'NOT_FOUND'],
      ['ENOENT: missing file', 'NOT_FOUND'],
      ['EIO: disk failure', 'IO_ERROR'],
      ['read failed', 'INTERNAL'],
    ] as const

    for (const [error, code] of cases) {
      const client = createElectronPlatformClient({
        conversations: { read: vi.fn(async () => ({ ok: false, error })) },
      })
      const result = await client.conversations.read(PROJECT_ID)
      expect(result).toMatchObject({ ok: false, error: { code, capability: 'conversations.read' } })
      expect(JSON.stringify(result)).not.toContain(error)
    }
  })

  it('normalizes hostile non-Error rejections without coercing or publishing them', async () => {
    const hostile = {
      unknownCredential: 'object-secret',
      toString: vi.fn(() => {
        throw new Error('coercion-secret')
      }),
    }
    const client = createElectronPlatformClient({
      conversations: { read: vi.fn().mockRejectedValue(hostile) },
    })

    const result = await client.conversations.read(PROJECT_ID)

    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL', capability: 'conversations.read' } })
    expect(hostile.toString).not.toHaveBeenCalled()
    expect(JSON.stringify(result)).not.toContain('object-secret')
    expect(JSON.stringify(result)).not.toContain('coercion-secret')
  })
})
