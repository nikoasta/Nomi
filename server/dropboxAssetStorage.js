/* global Buffer, fetch, process, URL, URLSearchParams, Headers, setTimeout */

import crypto from 'node:crypto'
import dns from 'node:dns/promises'
import net from 'node:net'

const API_ORIGIN = 'https://api.dropboxapi.com'
const CONTENT_ORIGIN = 'https://content.dropboxapi.com'
const TOKEN_ENDPOINT = `${API_ORIGIN}/oauth2/token`
const CHUNK_BYTES = 8 * 1024 * 1024
const MAX_ASSET_BYTES = 2 * 1024 * 1024 * 1024
const MAX_REDIRECTS = 3

let cachedToken = null
const ensuredFolders = new Set()

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function readDropboxAssetEnv() {
  const appKey = clean(process.env.DROPBOX_APP_KEY)
  const appSecret = clean(process.env.DROPBOX_APP_SECRET)
  const refreshToken = clean(process.env.DROPBOX_REFRESH_TOKEN)
  const rootNamespaceId = clean(process.env.DROPBOX_ROOT_NAMESPACE_ID)
  const storageRoot = clean(process.env.DROPBOX_STORAGE_ROOT) || '/Content/NOMI'
  if (!appKey || !appSecret || !refreshToken || !rootNamespaceId) return null
  if (!/^[0-9]+$/.test(rootNamespaceId) || !/^\/[A-Za-z0-9 _./-]+$/.test(storageRoot) || storageRoot.includes('..')) {
    return null
  }
  return { appKey, appSecret, refreshToken, rootNamespaceId, storageRoot: storageRoot.replace(/\/+$/, '') }
}

function tokenCacheKey(env) {
  return crypto.createHash('sha256').update(`${env.appKey}\0${env.refreshToken}`).digest('hex')
}

async function accessToken(env, force = false) {
  const key = tokenCacheKey(env)
  if (!force && cachedToken?.key === key && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: env.refreshToken,
  })
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Basic ${Buffer.from(`${env.appKey}:${env.appSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !clean(payload?.access_token)) throw new Error(`DROPBOX_TOKEN_${response.status}`)
  const expiresIn = Number(payload.expires_in)
  cachedToken = {
    key,
    value: payload.access_token,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 14_400) * 1000,
  }
  return cachedToken.value
}

function pathRootHeader(env) {
  return JSON.stringify({ '.tag': 'root', root: env.rootNamespaceId })
}

function retryDelayMs(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 30_000)
  return Math.min(250 * 2 ** attempt + Math.floor(Math.random() * 200), 5_000)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function dropboxFetch(env, url, init, attempt = 0) {
  const token = await accessToken(env, attempt > 0 && init.__refreshToken === true)
  const headers = new Headers(init.headers || {})
  headers.set('authorization', `Bearer ${token}`)
  headers.set('dropbox-api-path-root', pathRootHeader(env))
  const requestInit = { ...init }
  delete requestInit.__refreshToken
  const response = await fetch(url, { ...requestInit, headers })
  if (response.status === 401 && attempt === 0) {
    cachedToken = null
    return dropboxFetch(env, url, { ...init, __refreshToken: true }, 1)
  }
  if ((response.status === 429 || response.status >= 500) && attempt < 3) {
    await sleep(retryDelayMs(response, attempt))
    return dropboxFetch(env, url, init, attempt + 1)
  }
  return response
}

async function rpc(env, route, arg, body = undefined) {
  const response = await dropboxFetch(env, `${API_ORIGIN}/2/${route}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: body === undefined ? JSON.stringify(arg) : body,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(`DROPBOX_${route.replaceAll('/', '_').toUpperCase()}_${response.status}`)
    error.status = response.status
    error.payload = payload
    error.requestId = response.headers.get('x-dropbox-request-id') || null
    throw error
  }
  return payload
}

async function contentRpc(env, route, arg, body) {
  const response = await dropboxFetch(env, `${CONTENT_ORIGIN}/2/${route}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/octet-stream',
      'dropbox-api-arg': JSON.stringify(arg),
    },
    body,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const error = new Error(`DROPBOX_${route.replaceAll('/', '_').toUpperCase()}_${response.status}`)
    error.status = response.status
    error.payload = payload
    error.requestId = response.headers.get('x-dropbox-request-id') || null
    throw error
  }
  const text = await response.text()
  const metadata = text ? JSON.parse(text) : null
  return { response, metadata }
}

function privateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase()
    return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')
  }
  return true
}

async function assertPublicHttpsUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('UNSAFE_REMOTE_URL')
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some((entry) => privateAddress(entry.address))) throw new Error('UNSAFE_REMOTE_URL')
  return url
}

export async function fetchPublicAsset(urlValue, redirects = 0) {
  const url = await assertPublicHttpsUrl(urlValue)
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: { accept: 'image/*,video/*,audio/*,application/octet-stream' },
  })
  if (response.status >= 300 && response.status < 400) {
    if (redirects >= MAX_REDIRECTS) throw new Error('REMOTE_REDIRECT_LIMIT')
    const location = response.headers.get('location')
    if (!location) throw new Error('REMOTE_REDIRECT_MISSING')
    return fetchPublicAsset(new URL(location, url).toString(), redirects + 1)
  }
  if (!response.ok || !response.body) throw new Error(`REMOTE_FETCH_${response.status}`)
  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_ASSET_BYTES) throw new Error('ASSET_TOO_LARGE')
  return response
}

function safeSegment(value, fallback) {
  const normalized = String(value || '').trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized.slice(0, 120) || fallback
}

function extensionFor(mediaType, fileName) {
  const candidate = String(fileName || '').match(/\.([A-Za-z0-9]{1,10})$/)?.[1]
  if (candidate) return candidate.toLowerCase()
  const known = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
    'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
  }
  return known[mediaType] || 'bin'
}

export function assetStoragePath(env, input) {
  const project = safeSegment(input.projectId, 'project')
  const asset = safeSegment(input.assetId, 'asset')
  const category = input.mediaType?.startsWith('video/') ? 'videos' : input.mediaType?.startsWith('audio/') ? 'audio' : 'images'
  const ext = extensionFor(input.mediaType, input.fileName)
  return `${env.storageRoot}/projects/${project}/generated/${category}/${asset}.${ext}`
}

class DropboxContentHasher {
  constructor() {
    this.pending = Buffer.alloc(0)
    this.blocks = []
  }

  update(chunk) {
    this.pending = Buffer.concat([this.pending, chunk])
    while (this.pending.length >= 4 * 1024 * 1024) {
      const block = this.pending.subarray(0, 4 * 1024 * 1024)
      this.blocks.push(crypto.createHash('sha256').update(block).digest())
      this.pending = this.pending.subarray(4 * 1024 * 1024)
    }
  }

  digest() {
    if (this.pending.length || this.blocks.length === 0) this.blocks.push(crypto.createHash('sha256').update(this.pending).digest())
    return crypto.createHash('sha256').update(Buffer.concat(this.blocks)).digest('hex')
  }
}

async function* normalizedChunks(source) {
  let pending = Buffer.alloc(0)
  for await (const value of source) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    pending = pending.length ? Buffer.concat([pending, chunk]) : chunk
    while (pending.length >= CHUNK_BYTES) {
      yield pending.subarray(0, CHUNK_BYTES)
      pending = pending.subarray(CHUNK_BYTES)
    }
  }
  if (pending.length) yield pending
}

async function existingMetadata(env, path) {
  try {
    return await rpc(env, 'files/get_metadata', { path, include_deleted: false })
  } catch (error) {
    if (error?.status === 409) return null
    throw error
  }
}

async function ensureFolder(env, path) {
  const cacheKey = `${env.rootNamespaceId}:${path.toLowerCase()}`
  if (ensuredFolders.has(cacheKey)) return
  try {
    await rpc(env, 'files/create_folder_v2', { path, autorename: false })
  } catch (error) {
    if (error?.status !== 409) throw error
    const metadata = await existingMetadata(env, path)
    if (metadata?.['.tag'] !== 'folder') throw error
  }
  ensuredFolders.add(cacheKey)
}

async function ensureParentFolders(env, filePath) {
  const segments = filePath.split('/').filter(Boolean)
  let current = ''
  for (const segment of segments.slice(0, -1)) {
    current += `/${segment}`
    await ensureFolder(env, current)
  }
}

export async function uploadAssetStream(env, input) {
  await ensureParentFolders(env, input.path)
  const sha256 = crypto.createHash('sha256')
  const dropboxHash = new DropboxContentHasher()
  let sizeBytes = 0
  const start = await contentRpc(env, 'files/upload_session/start', { close: false }, Buffer.alloc(0))
  const sessionId = start.metadata.session_id
  if (!clean(sessionId)) throw new Error('DROPBOX_SESSION_INVALID')

  let offset = 0
  let pending = null
  for await (const chunk of normalizedChunks(input.source)) {
    sizeBytes += chunk.length
    if (sizeBytes > MAX_ASSET_BYTES) throw new Error('ASSET_TOO_LARGE')
    sha256.update(chunk)
    dropboxHash.update(chunk)
    if (pending) {
      await contentRpc(env, 'files/upload_session/append_v2', {
        cursor: { session_id: sessionId, offset }, close: false,
      }, pending)
      offset += pending.length
    }
    pending = chunk
  }

  const digest = sha256.digest('hex')
  const contentHash = dropboxHash.digest()
  const finalChunk = pending || Buffer.alloc(0)
  let metadata
  try {
    const finish = await contentRpc(env, 'files/upload_session/finish', {
      cursor: { session_id: sessionId, offset },
      commit: {
        path: input.path,
        mode: { '.tag': 'add' },
        autorename: false,
        mute: true,
        strict_conflict: true,
      },
    }, finalChunk)
    metadata = finish.metadata
  } catch (error) {
    if (error?.status !== 409) throw error
    metadata = await existingMetadata(env, input.path)
    if (!metadata || Number(metadata.size) !== sizeBytes || metadata.content_hash !== contentHash) throw error
  }

  return {
    sha256Digest: digest,
    sizeBytes,
    dropboxContentHash: contentHash,
    metadata,
  }
}

export async function downloadAsset(env, input) {
  // Dropbox rejects `file_id + rev` in DownloadArg. Resolve by the immutable
  // file ID, then verify the returned revision and content hash before callers
  // stream any bytes.
  const arg = { path: input.fileId }
  const headers = {
    accept: '*/*',
    'content-type': 'application/octet-stream',
    'dropbox-api-arg': JSON.stringify(arg),
    ...(input.range ? { range: input.range } : {}),
  }
  const response = await dropboxFetch(env, `${CONTENT_ORIGIN}/2/files/download`, { method: 'POST', headers })
  if (!response.ok) return response
  const resultHeader = response.headers.get('dropbox-api-result')
  let metadata
  try {
    metadata = resultHeader ? JSON.parse(resultHeader) : null
  } catch {
    throw new Error('DROPBOX_DOWNLOAD_METADATA_INVALID')
  }
  if (!metadata) throw new Error('DROPBOX_DOWNLOAD_METADATA_MISSING')
  if ((input.revision && metadata.rev !== input.revision) ||
      (input.contentHash && metadata.content_hash !== input.contentHash)) {
    throw new Error('DROPBOX_DOWNLOAD_INTEGRITY_MISMATCH')
  }
  return response
}

export async function temporaryAssetLink(env, input) {
  if (input.revision || input.contentHash) {
    const metadata = await existingMetadata(env, input.fileId)
    if (!metadata ||
        (input.revision && metadata.rev !== input.revision) ||
        (input.contentHash && metadata.content_hash !== input.contentHash)) {
      throw new Error('DROPBOX_TEMPORARY_LINK_INTEGRITY_MISMATCH')
    }
  }
  const payload = await rpc(env, 'files/get_temporary_link', { path: input.fileId })
  const link = clean(payload?.link)
  if (!link || !link.startsWith('https://')) throw new Error('DROPBOX_TEMPORARY_LINK_INVALID')
  return link
}

export function deterministicAssetIds(idempotencyHash) {
  function uuid(prefix, salt) {
    const hex = crypto.createHash('sha256').update(`${salt}\0${idempotencyHash}`).digest('hex').slice(0, 32).split('')
    hex[12] = '4'
    hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4]
    return `${prefix}_${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`
  }
  return { assetId: uuid('ast', 'asset'), versionId: uuid('av', 'version') }
}

export function sha256Text(value, namespace = 'everville.nomi.asset.v1') {
  return crypto.createHash('sha256').update(`${namespace}\0${value}`).digest('hex')
}

export function __resetDropboxTokenForTests() {
  cachedToken = null
  ensuredFolders.clear()
}
