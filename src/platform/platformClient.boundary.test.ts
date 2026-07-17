import { readFileSync } from 'node:fs'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PersistedConversationArea, PlatformCapability, PlatformClient } from './client'

const CAPABILITIES = [
  'conversations.read',
  'conversations.write',
  'assets.list',
  'assets.import-file',
  'assets.import-remote-url',
] as const satisfies readonly PlatformCapability[]

const PROJECT_ID = 'project-browser-boundary'
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
  }
}

afterEach(() => {
  vi.doUnmock('../desktop/bridge')
  vi.resetModules()
})

describe('PlatformClient runtime boundary', () => {
  it('imports the browser adapter with no window or desktop bridge load and returns five typed unsupported results', async () => {
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
