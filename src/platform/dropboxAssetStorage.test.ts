import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __resetDropboxTokenForTests,
  assetStoragePath,
  deterministicAssetIds,
  downloadAsset,
  temporaryAssetLink,
  uploadAssetStream,
} from '../../server/dropboxAssetStorage.js'

const ENV = {
  appKey: 'dropbox-app',
  appSecret: 'dropbox-secret',
  refreshToken: 'dropbox-refresh',
  rootNamespaceId: '13993415235',
  storageRoot: '/Content/NOMI',
}

describe('Dropbox durable asset storage', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    __resetDropboxTokenForTests()
    vi.restoreAllMocks()
  })

  it('derives stable opaque identities and deterministic project paths', () => {
    const first = deterministicAssetIds('a'.repeat(64))
    const second = deterministicAssetIds('a'.repeat(64))

    expect(first).toEqual(second)
    expect(first.assetId).toMatch(/^ast_[0-9a-f-]{36}$/)
    expect(first.versionId).toMatch(/^av_[0-9a-f-]{36}$/)
    expect(assetStoragePath(ENV, {
      projectId: 'project / unsafe',
      assetId: first.assetId,
      mediaType: 'video/mp4',
      fileName: 'clip.mp4',
    })).toBe(`/Content/NOMI/projects/project-unsafe/generated/videos/${first.assetId}.mp4`)
  })

  it('creates the private folder chain and uploads bytes with both integrity digests', async () => {
    const bytes = Buffer.from('durable nomi asset')
    const dropboxContentHash = crypto
      .createHash('sha256')
      .update(crypto.createHash('sha256').update(bytes).digest())
      .digest('hex')
    const calls: string[] = []
    globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      calls.push(url)
      if (url.endsWith('/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'access', expires_in: 3600 }), { status: 200 })
      }
      if (url.endsWith('/2/files/create_folder_v2')) {
        const body = JSON.parse(String(init?.body)) as { path: string }
        return new Response(JSON.stringify({ metadata: { '.tag': 'folder', path_display: body.path } }), { status: 200 })
      }
      if (url.endsWith('/2/files/upload_session/start')) {
        return new Response(JSON.stringify({ session_id: 'session-1' }), { status: 200 })
      }
      if (url.endsWith('/2/files/upload_session/finish')) {
        expect(Buffer.from(init?.body as ArrayBuffer)).toEqual(bytes)
        return new Response(JSON.stringify({
          '.tag': 'file',
          id: 'id:stored-file',
          path_display: '/Content/NOMI/projects/project-1/generated/images/asset.png',
          rev: 'rev-1',
          size: bytes.length,
          content_hash: dropboxContentHash,
        }), { status: 200 })
      }
      throw new Error(`Unexpected Dropbox request: ${url}`)
    }) as typeof fetch

    const stored = await uploadAssetStream(ENV, {
      source: Readable.from([bytes]),
      path: '/Content/NOMI/projects/project-1/generated/images/asset.png',
    })

    expect(stored).toEqual(expect.objectContaining({
      sha256Digest: crypto.createHash('sha256').update(bytes).digest('hex'),
      dropboxContentHash,
      sizeBytes: bytes.length,
      metadata: expect.objectContaining({ id: 'id:stored-file', rev: 'rev-1' }),
    }))
    expect(calls.filter((url) => url.endsWith('/2/files/create_folder_v2'))).toHaveLength(6)
    expect(JSON.stringify(stored)).not.toContain('dropbox-secret')
    expect(JSON.stringify(stored)).not.toContain('dropbox-refresh')
  })

  it('downloads by file ID and verifies the stored revision and content hash', async () => {
    const bytes = Buffer.from('range-safe asset')
    globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'access', expires_in: 3600 }), { status: 200 })
      }
      if (url.endsWith('/2/files/download')) {
        expect(JSON.parse(new Headers(init?.headers).get('dropbox-api-arg') || '{}')).toEqual({
          path: 'id:stored-file',
        })
        expect(new Headers(init?.headers).get('range')).toBe('bytes=0-4')
        return new Response(bytes.subarray(0, 5), {
          status: 206,
          headers: {
            'content-range': `bytes 0-4/${bytes.length}`,
            'dropbox-api-result': JSON.stringify({
              id: 'id:stored-file',
              rev: 'rev-1',
              content_hash: 'a'.repeat(64),
            }),
          },
        })
      }
      throw new Error(`Unexpected Dropbox request: ${url}`)
    }) as typeof fetch

    const response = await downloadAsset(ENV, {
      fileId: 'id:stored-file',
      revision: 'rev-1',
      contentHash: 'a'.repeat(64),
      range: 'bytes=0-4',
    })

    expect(response.status).toBe(206)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes.subarray(0, 5))
  })

  it('fails closed when Dropbox metadata no longer matches the registry', async () => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'access', expires_in: 3600 }), { status: 200 })
      }
      if (url.endsWith('/2/files/download')) {
        return new Response('changed', {
          status: 200,
          headers: {
            'dropbox-api-result': JSON.stringify({
              id: 'id:stored-file',
              rev: 'rev-changed',
              content_hash: 'b'.repeat(64),
            }),
          },
        })
      }
      throw new Error(`Unexpected Dropbox request: ${url}`)
    }) as typeof fetch

    await expect(downloadAsset(ENV, {
      fileId: 'id:stored-file',
      revision: 'rev-1',
      contentHash: 'a'.repeat(64),
    })).rejects.toThrow('DROPBOX_DOWNLOAD_INTEGRITY_MISMATCH')
  })

  it('verifies Dropbox metadata before issuing a provider temporary link', async () => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'access', expires_in: 3600 }), { status: 200 })
      }
      if (url.endsWith('/2/files/get_metadata')) {
        return new Response(JSON.stringify({
          '.tag': 'file',
          id: 'id:stored-file',
          rev: 'rev-1',
          content_hash: 'a'.repeat(64),
        }), { status: 200 })
      }
      if (url.endsWith('/2/files/get_temporary_link')) {
        return new Response(JSON.stringify({ link: 'https://dl.dropboxusercontent.test/temporary' }), { status: 200 })
      }
      throw new Error(`Unexpected Dropbox request: ${url}`)
    }) as typeof fetch

    await expect(temporaryAssetLink(ENV, {
      fileId: 'id:stored-file',
      revision: 'rev-1',
      contentHash: 'a'.repeat(64),
    })).resolves.toBe('https://dl.dropboxusercontent.test/temporary')
  })
})
