/* global Buffer, fetch, process, URL, URLSearchParams */

import crypto from 'node:crypto'
import { Readable } from 'node:stream'

import {
  assetStoragePath,
  deterministicAssetIds,
  downloadAsset,
  fetchPublicAsset,
  readDropboxAssetEnv,
  sha256Text,
  temporaryAssetLink,
  uploadAssetStream,
} from './dropboxAssetStorage.js'

const RPC_ALLOWLIST = new Set([
  'nomi_portal_list_organizations',
  'nomi_portal_list_workspaces',
  'nomi_portal_list_memberships',
  'nomi_portal_list_projects',
  'nomi_portal_create_project',
  'nomi_portal_save_project_revision',
  'nomi_portal_get_current_project_revision',
  'nomi_portal_list_review_queue',
  'nomi_portal_decide_approval_gate',
  'nomi_portal_append_audit_event',
  'nomi_portal_authorize_asset_scope',
  'nomi_portal_list_asset_bundles',
  'nomi_portal_get_asset_bundle',
])

const TABLE_QUERY_RPC = {
  organizations: ({ query }) => ({
    functionName: 'nomi_portal_list_organizations',
    body: { request_limit: numberOrNull(query.limit) },
  }),
  workspaces: ({ query }) => ({
    functionName: 'nomi_portal_list_workspaces',
    body: {
      request_organization_id: eqValue(query.organization_id),
      request_status: eqValue(query.status),
      request_limit: numberOrNull(query.limit),
    },
  }),
  workspace_memberships: ({ query }) => ({
    functionName: 'nomi_portal_list_memberships',
    body: {
      request_organization_id: eqValue(query.organization_id),
      request_workspace_id: eqValue(query.workspace_id),
      request_status: eqValue(query.status),
      request_limit: numberOrNull(query.limit),
    },
  }),
  projects: ({ query }) => ({
    functionName: 'nomi_portal_list_projects',
    body: {
      request_organization_id: eqValue(query.organization_id),
      request_workspace_id: eqValue(query.workspace_id),
      request_status: eqValue(query.status),
      request_limit: numberOrNull(query.limit),
    },
  }),
  approval_gates: ({ query }) => ({
    functionName: 'nomi_portal_list_review_queue',
    body: {
      request_organization_id: eqValue(query.organization_id),
      request_workspace_id: eqValue(query.workspace_id),
      request_project_id: eqValue(query.project_id),
      request_limit: numberOrNull(query.limit),
    },
  }),
}

const TABLE_INSERT_RPC = {
  projects: ({ body }) => ({
    functionName: 'nomi_portal_create_project',
    body: {
      request_organization_id: body.organization_id,
      request_workspace_id: body.workspace_id,
      request_slug: body.slug,
      request_title: body.title,
      request_classification: body.classification,
    },
  }),
  audit_events: ({ body }) => ({
    functionName: 'nomi_portal_append_audit_event',
    body: {
      request_organization_id: body.organization_id,
      request_workspace_id: body.workspace_id,
      request_project_id: body.project_id,
      request_action: body.action,
      request_target_type: body.target_type,
      request_target_id: body.target_id,
      request_metadata: body.metadata,
    },
  }),
}

const LEGACY_RPC = {
  save_project_revision: 'nomi_portal_save_project_revision',
  get_current_project_revision: 'nomi_portal_get_current_project_revision',
  decide_approval_gate: 'nomi_portal_decide_approval_gate',
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function redirect(res, status, location) {
  res.statusCode = status
  res.setHeader('location', location)
  res.setHeader('cache-control', 'no-store')
  res.end('')
}

function readPortalEnv() {
  const endpoint = clean(process.env.SUPABASE_URL) || clean(process.env.VITE_SUPABASE_URL)
  const publishableKey =
    clean(process.env.SUPABASE_PUBLISHABLE_KEY) || clean(process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const resendApiKey = clean(process.env.RESEND_API_KEY)
  const telegramBotToken = clean(process.env.TELEGRAM_BOT_TOKEN)
  const portalAuthFrom = clean(process.env.PORTAL_AUTH_FROM_EMAIL) || 'Everville Team <notifications@everville.estate>'
  if (!endpoint || !publishableKey) return null
  try {
    const url = new URL(endpoint.replace(/\/+$/, ''))
    if (url.protocol !== 'https:') return null
    if (!publishableKey.startsWith('sb_publishable_')) return null
    return {
      endpoint: url.toString().replace(/\/+$/, ''),
      publishableKey,
      serviceRoleKey,
      resendApiKey,
      telegramBotToken,
      portalAuthFrom,
    }
  } catch {
    return null
  }
}

function readPortalGenerationEnv() {
  return {
    kieApiKey: clean(process.env.KIE_API_KEY) || clean(process.env.KIEAI_API_KEY) || clean(process.env.KIE_AI_API_KEY),
    deepseekApiKey: clean(process.env.DEEPSEEK_API_KEY),
    openaiApiKey: clean(process.env.OPENAI_API_KEY),
    anthropicApiKey: clean(process.env.ANTHROPIC_API_KEY),
  }
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function bearer(req) {
  const header = req.headers.authorization
  if (typeof header !== 'string') return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

function eqValue(value) {
  if (typeof value !== 'string') return null
  return value.startsWith('eq.') ? value.slice(3) : value
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8')
    size += buffer.length
    if (size > 128 * 1024) throw new Error('REQUEST_TOO_LARGE')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function safeRedirectTo(value, req) {
  const candidate = clean(value)
  const fallback = `https://${req.headers.host || 'cut.eva.mba'}/`
  try {
    const url = new URL(candidate || fallback)
    if (url.protocol === 'nomi:' && url.hostname === 'portal-auth') return url.toString()
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return null
    return url.toString()
  } catch {
    return null
  }
}

function portalRequestOrigin(req) {
  const host = clean(req.headers.host) || 'cut.eva.mba'
  if (host === 'localhost' || host.startsWith('localhost:') || host === '127.0.0.1' || host.startsWith('127.0.0.1:')) {
    return `http://${host}`
  }
  return `https://${host}`
}

function safeEmail(value) {
  const email = clean(value)
  if (!email || email.length > 254) return null
  for (let index = 0; index < email.length; index += 1) {
    const code = email.charCodeAt(index)
    if (code <= 31 || code === 127) return null
  }
  const parts = email.split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1].includes('.')) return null
  return email.toLowerCase()
}

function safeTelegramUsername(value) {
  const username = clean(value)
  if (!username) return null
  const normalized = username.replace(/^@+/, '')
  return /^[A-Za-z0-9_]{5,32}$/.test(normalized) ? normalized : null
}

function safeTelegramAuthData(value) {
  const input = value && typeof value === 'object' ? value : {}
  const id = Number(input.id)
  const authDate = Number(input.auth_date)
  const hash = clean(input.hash)
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(authDate) || !hash) return null
  return {
    id,
    first_name: clean(input.first_name),
    last_name: clean(input.last_name),
    username: safeTelegramUsername(input.username),
    photo_url: clean(input.photo_url),
    auth_date: authDate,
    hash,
  }
}

function queryValue(req, name) {
  const value = req.query && req.query[name]
  if (Array.isArray(value)) return clean(value[0])
  return clean(value)
}

function shouldUseCorporateMailer(env) {
  return Boolean(env.serviceRoleKey && env.resendApiKey)
}

async function supabaseRequest({ env, bearerToken, path, method = 'POST', body }) {
  const response = await fetch(`${env.endpoint}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      apikey: env.publishableKey,
      authorization: `Bearer ${bearerToken || env.publishableKey}`,
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text.slice(0, 1000) }
    }
  }
  return { status: response.status, ok: response.ok, payload }
}

async function supabaseServiceRequest({ env, path, method = 'POST', body }) {
  const response = await fetch(`${env.endpoint}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      apikey: env.serviceRoleKey,
      authorization: `Bearer ${env.serviceRoleKey}`,
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text.slice(0, 1000) }
    }
  }
  return { status: response.status, ok: response.ok, payload }
}

async function serviceRpc({ env, functionName, body }) {
  if (!env.serviceRoleKey) return { status: 503, ok: false, payload: { message: 'Portal service role is not configured' } }
  return supabaseServiceRequest({
    env,
    path: `/rest/v1/rpc/${functionName}`,
    body,
  })
}

async function callRpc({ env, bearerToken, functionName, body }) {
  if (!RPC_ALLOWLIST.has(functionName)) {
    return { status: 404, ok: false, payload: { message: 'Portal operation is not available' } }
  }
  return supabaseRequest({
    env,
    bearerToken,
    path: `/rest/v1/rpc/${functionName}`,
    body,
  })
}

async function requirePortalSession(env, bearerToken) {
  const result = await supabaseRequest({ env, bearerToken, path: '/auth/v1/user', method: 'GET' })
  if (result.ok) return { ok: true, payload: result.payload }

  // Telegram bridge sessions can be accepted by PostgREST even when the
  // project Auth endpoint rejects the publishable-key request. Confirm the
  // same bearer against the membership-scoped portal facade before denying it.
  const membership = await callRpc({
    env,
    bearerToken,
    functionName: 'nomi_portal_list_organizations',
    body: { request_limit: 1 },
  })
  const organizations = Array.isArray(membership.payload) ? membership.payload : []
  if (membership.ok && organizations.length > 0) {
    return { ok: true, payload: { organizationId: organizations[0].id } }
  }

  return {
    ok: false,
    status: membership.ok ? 403 : membership.status === 401 || membership.status === 403 ? membership.status : 401,
    payload: { error: { code: 'PERMISSION_DENIED', message: 'Authentication is required' } },
  }
}

const PORTAL_COOKIE = '__Host-nomi_portal'

function cookieBearer(req) {
  const header = typeof req.headers.cookie === 'string' ? req.headers.cookie : ''
  for (const part of header.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === PORTAL_COOKIE) return clean(decodeURIComponent(value.join('=')))
  }
  return null
}

function setPortalSessionCookie(res, token) {
  if (!clean(token)) return
  let maxAge = 3600
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64url').toString('utf8'))
    if (Number.isFinite(payload.exp)) maxAge = Math.max(60, Math.min(7 * 24 * 3600, payload.exp - Math.floor(Date.now() / 1000)))
  } catch {
    // Opaque bridge sessions still receive a bounded cookie.
  }
  res.setHeader('set-cookie', `${PORTAL_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None`)
}

function safeAssetId(value, prefix) {
  const candidate = clean(value)
  const pattern = prefix === 'ast'
    ? /^ast_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    : /^av_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  return candidate && pattern.test(candidate) ? candidate : null
}

function safeUuid(value) {
  const candidate = clean(value)
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : null
}

function safeMediaType(value) {
  const candidate = clean(value)?.toLowerCase().split(';', 1)[0]
  return candidate && /^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/.test(candidate)
    ? candidate
    : 'application/octet-stream'
}

function assetType(mediaType, fallback = 'image') {
  if (mediaType.startsWith('video/')) return 'video'
  if (mediaType.startsWith('audio/')) return 'audio'
  if (mediaType.startsWith('image/')) return 'image'
  return fallback === 'video' || fallback === 'audio' ? fallback : 'image'
}

async function authorizeAssetScope({ env, bearerToken, organizationId, projectId, permission }) {
  const result = await callRpc({
    env,
    bearerToken,
    functionName: 'nomi_portal_authorize_asset_scope',
    body: {
      request_organization_id: organizationId,
      request_project_id: projectId,
      request_permission: permission,
    },
  })
  const row = Array.isArray(result.payload) ? result.payload[0] : null
  if (!result.ok || !row?.workspace_id || !row?.actor_user_id) return { ok: false, status: result.status, payload: result.payload }
  return {
    ok: true,
    value: {
      organizationId: row.organization_id,
      workspaceId: row.workspace_id,
      projectId: row.project_id,
      actorUserId: row.actor_user_id,
    },
  }
}

function publicAssetUrl(req, scope, assetId, versionId) {
  const origin = portalRequestOrigin(req)
  const params = new URLSearchParams({
    organizationId: scope.organizationId,
    projectId: scope.projectId,
    assetId,
    versionId,
  })
  return `${origin}/api/portal/assets/content?${params.toString()}`
}

async function serviceResolveAsset(env, scope, assetId, versionId) {
  const result = await serviceRpc({
    env,
    functionName: 'nomi_portal_service_resolve_asset',
    body: {
      request_organization_id: scope.organizationId,
      request_project_id: scope.projectId,
      request_asset_id: assetId,
      request_version_id: versionId,
    },
  })
  return result.ok && Array.isArray(result.payload) ? result.payload[0] || null : null
}

async function registerStoredAsset({ env, scope, descriptor, stored }) {
  const now = nowIso()
  const validation = {
    state: 'validated',
    validatedAt: now,
    validator: 'portal-dropbox-v1',
    reasonCodes: [],
  }
  const provenance = descriptor.generated
    ? {
        kind: 'generated',
        recordedAt: now,
        actorPrincipalId: scope.actorUserId,
        providerId: descriptor.provider,
        modelId: descriptor.modelId || 'unknown',
        operationId: descriptor.operationId || null,
        providerRequestId: descriptor.providerTaskId,
        promptRef: descriptor.promptRef || null,
        promptDigest: descriptor.promptDigest || null,
      }
    : {
        kind: 'imported',
        method: descriptor.method || 'remote',
        recordedAt: now,
        actorPrincipalId: scope.actorUserId,
        originalName: descriptor.fileName || null,
      }
  return serviceRpc({
    env,
    functionName: 'nomi_portal_service_register_asset',
    body: {
      request_organization_id: scope.organizationId,
      request_workspace_id: scope.workspaceId,
      request_project_id: scope.projectId,
      request_actor_user_id: scope.actorUserId,
      request_asset_id: descriptor.assetId,
      request_version_id: descriptor.versionId,
      request_provider: descriptor.provider,
      request_provider_task_id: descriptor.providerTaskId,
      request_output_index: descriptor.outputIndex,
      request_idempotency_hash: descriptor.idempotencyHash,
      request_fingerprint: descriptor.requestFingerprint,
      request_sha256_digest: stored.sha256Digest,
      request_size_bytes: stored.sizeBytes,
      request_media_type: descriptor.mediaType,
      request_classification: descriptor.classification,
      request_validation: validation,
      request_provenance: provenance,
      request_namespace_id: descriptor.namespaceId,
      request_file_id: stored.metadata.id,
      request_path_display: stored.metadata.path_display,
      request_revision: stored.metadata.rev,
      request_content_hash: stored.metadata.content_hash,
    },
  })
}

async function persistAssetSource({ req, env, dropboxEnv, bearerToken, scopeInput, source, descriptor }) {
  const authorized = await authorizeAssetScope({
    env,
    bearerToken,
    organizationId: scopeInput.organizationId,
    projectId: scopeInput.projectId,
    permission: 'asset.write',
  })
  if (!authorized.ok) return authorized
  const scope = authorized.value
  const existing = await serviceResolveAsset(env, scope, descriptor.assetId, descriptor.versionId)
  if (existing?.bundle) {
    return {
      ok: true,
      value: {
        bundle: existing.bundle,
        url: publicAssetUrl(req, scope, descriptor.assetId, descriptor.versionId),
        scope,
      },
    }
  }

  const path = assetStoragePath(dropboxEnv, {
    projectId: scope.projectId,
    assetId: descriptor.assetId,
    mediaType: descriptor.mediaType,
    fileName: descriptor.fileName,
  })
  let stored
  try {
    stored = await uploadAssetStream(dropboxEnv, { source, path })
  } catch (error) {
    return { status: error?.status === 403 ? 503 : 502, ok: false, payload: { error: { code: 'ASSET_STORAGE_FAILED', message: 'Asset storage failed' } } }
  }
  const registered = await registerStoredAsset({
    env,
    scope,
    descriptor: { ...descriptor, namespaceId: dropboxEnv.rootNamespaceId },
    stored,
  })
  const row = registered.ok && Array.isArray(registered.payload) ? registered.payload[0] : null
  if (!registered.ok || !row?.bundle) return { status: registered.status, ok: false, payload: registered.payload }
  return {
    ok: true,
    value: {
      bundle: row.bundle,
      url: publicAssetUrl(req, scope, descriptor.assetId, descriptor.versionId),
      scope,
    },
  }
}

async function persistRemoteAsset({ req, env, dropboxEnv, bearerToken, scope, remoteUrl, descriptor }) {
  let response
  try {
    response = await fetchPublicAsset(remoteUrl)
  } catch {
    return { status: 502, ok: false, payload: { error: { code: 'REMOTE_ASSET_FAILED', message: 'Provider asset could not be downloaded' } } }
  }
  const mediaType = safeMediaType(response.headers.get('content-type') || descriptor.mediaType)
  return persistAssetSource({
    req,
    env,
    dropboxEnv,
    bearerToken,
    scopeInput: scope,
    source: response.body,
    descriptor: { ...descriptor, mediaType },
  })
}

function nowIso() {
  return new Date().toISOString()
}

function portalCatalogRows(generationEnv) {
  const createdAt = nowIso()
  const vendor = (key, name, hasApiKey, extra = {}) => ({
    key,
    name,
    enabled: true,
    hasApiKey: Boolean(hasApiKey),
    authType: 'bearer',
    baseUrlHint: extra.baseUrlHint || null,
    createdAt,
    updatedAt: createdAt,
    ...(extra.meta ? { meta: extra.meta } : {}),
  })
  const model = (vendorKey, modelKey, labelZh, kind, meta = {}) => ({
    vendorKey,
    modelKey,
    labelZh,
    kind,
    enabled: true,
    meta,
    createdAt,
    updatedAt: createdAt,
  })
  const vendors = [
    vendor('kie', 'Kie.ai', generationEnv.kieApiKey, { baseUrlHint: 'https://api.kie.ai' }),
    vendor('deepseek', 'DeepSeek', generationEnv.deepseekApiKey, { baseUrlHint: 'https://api.deepseek.com/v1' }),
    vendor('openai', 'OpenAI', generationEnv.openaiApiKey, { baseUrlHint: 'https://api.openai.com/v1' }),
    vendor('anthropic', 'Anthropic', generationEnv.anthropicApiKey, { baseUrlHint: 'https://api.anthropic.com' }),
  ]
  const models = [
    model('kie', 'gpt-image-2-text-to-image', 'GPT Image 2 · Text to image', 'image', { archetypeId: 'gpt-image-2' }),
    model('kie', 'gpt-image-2-image-to-image', 'GPT Image 2 · Image to image', 'image', { archetypeId: 'gpt-image-2' }),
    model('kie', 'seedream', 'Seedream 4.5', 'image', { archetypeId: 'seedream' }),
    model('kie', 'nano-banana', 'Nano Banana', 'image', { archetypeId: 'nano-banana' }),
    model('kie', 'bytedance/seedance-2', 'Seedance 2.0', 'video', { archetypeId: 'seedance-2' }),
    model('deepseek', 'deepseek-chat', 'DeepSeek Chat', 'text'),
    model('deepseek', 'deepseek-reasoner', 'DeepSeek Reasoner', 'text'),
    model('openai', 'gpt-5.2', 'GPT-5.2', 'text'),
    model('openai', 'gpt-5.1', 'GPT-5.1', 'text'),
    model('anthropic', 'claude-sonnet-4-5', 'Claude Sonnet 4.5', 'text'),
  ]
  return { vendors, models }
}

function filterCatalogModels(models, query) {
  let rows = models
  if (query && typeof query === 'object') {
    if (query.vendorKey) rows = rows.filter((row) => row.vendorKey === query.vendorKey)
    if (query.kind) rows = rows.filter((row) => row.kind === query.kind)
    if (typeof query.enabled === 'boolean') rows = rows.filter((row) => row.enabled === query.enabled)
  }
  return rows
}

function portalCatalogHealth(catalog) {
  const enabledVendors = catalog.vendors.filter((vendor) => vendor.enabled)
  const enabledModels = catalog.models.filter((model) => model.enabled)
  const usableVendorKeys = new Set(enabledVendors.filter((vendor) => vendor.authType === 'none' || vendor.hasApiKey).map((vendor) => vendor.key))
  const kinds = ['text', 'image', 'video', 'audio', 'model3d']
  const byKind = kinds.map((kind) => {
    const rows = enabledModels.filter((model) => model.kind === kind)
    return {
      kind,
      enabledModels: rows.length,
      executableModels: rows.filter((model) => usableVendorKeys.has(model.vendorKey)).length,
    }
  })
  const issues = []
  if (!catalog.vendors.some((vendor) => vendor.hasApiKey)) {
    issues.push({
      code: 'vendor_api_key_missing',
      severity: 'warning',
      message: 'No portal generation provider API key is configured on the server',
    })
  }
  return {
    ok: issues.every((issue) => issue.severity !== 'error'),
    counts: {
      vendors: catalog.vendors.length,
      enabledVendors: enabledVendors.length,
      models: catalog.models.length,
      enabledModels: enabledModels.length,
      mappings: 0,
      enabledMappings: 0,
      enabledApiKeys: enabledVendors.filter((vendor) => vendor.hasApiKey).length,
    },
    byKind,
    issues,
  }
}

function getByPath(value, path) {
  return String(path || '').split('.').reduce((current, segment) => {
    if (current == null || segment === '') return undefined
    if (/^\d+$/.test(segment) && Array.isArray(current)) return current[Number(segment)]
    return current[segment]
  }, value)
}

function normalizeTaskStatus(value, hasAssets) {
  const text = String(value || '').trim().toLowerCase()
  if (hasAssets) return 'succeeded'
  if (['success', 'succeeded', 'completed'].includes(text)) return 'succeeded'
  if (['fail', 'failed', 'error', 'expired'].includes(text)) return 'failed'
  if (['generating', 'processing', 'running'].includes(text)) return 'running'
  return 'queued'
}

function taskAsset(kind, url) {
  if (!url) return null
  if (kind === 'text_to_video' || kind === 'image_to_video') return { type: 'video', url, providerUrl: url }
  if (kind === 'text_to_audio' || kind === 'image_to_audio') return { type: 'audio', url, providerUrl: url }
  return { type: 'image', url, providerUrl: url }
}

function parseKieResultJson(value) {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function taskResultFromKieResponse(payload, request, fallbackId) {
  // Kie uses both object and JSON-encoded string forms for resultJson.
  const resultJson = parseKieResultJson(getByPath(payload, 'data.resultJson'))
  const resultUrl = getByPath(resultJson, 'resultUrls.0') || getByPath(payload, 'data.resultUrls.0')
  const asset = taskAsset(request.kind, clean(resultUrl))
  const status = normalizeTaskStatus(getByPath(payload, 'data.state') || getByPath(payload, 'state'), Boolean(asset))
  const taskId = clean(getByPath(payload, 'data.taskId')) || clean(getByPath(payload, 'taskId')) || fallbackId
  return {
    id: taskId,
    kind: request.kind,
    status,
    assets: asset ? [asset] : [],
    raw: payload,
    ...(status === 'succeeded' ? {
      provenance: {
        provider: 'kie',
        modelKey: clean(request.extras?.modelKey) || undefined,
        prompt: request.prompt,
        vendorRequestId: taskId,
        timestamp: Date.now(),
      },
    } : {}),
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value) && value.length) return value
    if (typeof value === 'number' || typeof value === 'boolean') return value
  }
  return undefined
}

function cleanObject(input) {
  const out = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue
    out[key] = value
  }
  return out
}

function defaultKieModelEnum(modelKey, taskKind) {
  if (modelKey === 'gpt-image-2-image-to-image' || taskKind === 'image_edit') return 'gpt-image-2-image-to-image'
  if (modelKey === 'seedream') return taskKind === 'image_edit' ? 'seedream/4.5-edit' : 'seedream/4.5-text-to-image'
  if (modelKey === 'nano-banana') return taskKind === 'image_edit' ? 'google/nano-banana-edit' : 'google/nano-banana'
  if (modelKey === 'bytedance/seedance-2') return 'bytedance/seedance-2'
  return modelKey || 'gpt-image-2-text-to-image'
}

async function runKieTask(generationEnv, request) {
  if (!generationEnv.kieApiKey) return { ok: false, status: 503, payload: { error: { code: 'UNCONFIGURED', message: 'Kie.ai API key is not configured' } } }
  const extras = request.extras && typeof request.extras === 'object' ? request.extras : {}
  const params = extras.archetypeInput && typeof extras.archetypeInput === 'object' ? extras.archetypeInput : extras
  const modelKey = clean(extras.modelKey) || clean(extras.modelAlias)
  const model = firstNonEmpty(params.model, defaultKieModelEnum(modelKey, request.kind))
  const input = cleanObject({
    prompt: request.prompt,
    aspect_ratio: firstNonEmpty(params.aspect_ratio, '16:9'),
    resolution: firstNonEmpty(params.resolution, request.kind.includes('image') ? '2K' : undefined),
    quality: firstNonEmpty(params.quality),
    output_format: firstNonEmpty(params.output_format),
    input_urls: firstNonEmpty(params.input_urls),
    image_urls: firstNonEmpty(params.image_urls),
    first_frame_url: firstNonEmpty(params.first_frame_url, params.firstFrameUrl),
    last_frame_url: firstNonEmpty(params.last_frame_url, params.lastFrameUrl),
    reference_image_urls: firstNonEmpty(params.reference_image_urls),
    'reference_video_urls ': firstNonEmpty(params.reference_video_urls),
    reference_audio_urls: firstNonEmpty(params.reference_audio_urls),
    duration: firstNonEmpty(params.duration),
    generate_audio: firstNonEmpty(params.generate_audio),
  })
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${generationEnv.kieApiKey}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ model, input }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) return { ok: false, status: response.status, payload: { error: { code: 'PROVIDER_ERROR', message: 'Kie.ai task request failed', provider: payload } } }
  return { ok: true, payload: taskResultFromKieResponse(payload, request, `task-${crypto.randomUUID()}`) }
}

async function fetchKieTaskResult(generationEnv, request) {
  const taskId = clean(request.taskId)
  if (!taskId) return { ok: false, status: 400, payload: { error: { code: 'INVALID_ARGUMENT', message: 'taskId is required' } } }
  if (!generationEnv.kieApiKey) return { ok: false, status: 503, payload: { error: { code: 'UNCONFIGURED', message: 'Kie.ai API key is not configured' } } }
  const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    headers: {
      authorization: `Bearer ${generationEnv.kieApiKey}`,
      accept: 'application/json',
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) return { ok: false, status: response.status, payload: { error: { code: 'PROVIDER_ERROR', message: 'Kie.ai task polling failed', provider: payload } } }
  const taskKind = clean(request.taskKind) || 'text_to_image'
  const result = taskResultFromKieResponse(payload, { kind: taskKind, prompt: clean(request.prompt) || '', extras: { modelKey: clean(request.modelKey) || null } }, taskId)
  return { ok: true, payload: { vendor: 'kie', result } }
}

function normalizedAssetScope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const organizationId = safeUuid(value.organizationId)
  const projectId = safeUuid(value.projectId)
  return organizationId && projectId ? { organizationId, projectId } : null
}

function importedAssetDescriptor(scope, input, method) {
  const idempotencyKey = clean(input.idempotencyKey)
  if (!idempotencyKey || idempotencyKey.length > 512) return null
  const identity = `${scope.organizationId}:${scope.projectId}:${method}:${idempotencyKey}`
  const idempotencyHash = sha256Text(identity, 'everville.nomi.imported-asset.idempotency.v1')
  const ids = deterministicAssetIds(idempotencyHash)
  return {
    ...ids,
    idempotencyHash,
    requestFingerprint: sha256Text(`${identity}:${clean(input.fileName) || ''}:${clean(input.claimedMediaType) || ''}`, 'everville.nomi.imported-asset.request.v1'),
    provider: 'nomi-import',
    providerTaskId: idempotencyHash,
    outputIndex: 0,
    mediaType: safeMediaType(input.claimedMediaType),
    classification: ['unknown', 'public', 'internal', 'confidential', 'restricted'].includes(input.classification)
      ? input.classification
      : 'internal',
    generated: false,
    method,
    fileName: clean(input.fileName),
  }
}

function decodeAssetMetadata(req) {
  const encoded = clean(req.headers['x-nomi-asset-metadata'])
  if (!encoded || encoded.length > 8192) return null
  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

async function persistTaskResultAssets({ req, env, dropboxEnv, bearerToken, scope, vendor, result }) {
  if (result?.status !== 'succeeded' || !Array.isArray(result.assets) || result.assets.length === 0) return { ok: true, value: result }
  if (!dropboxEnv) return { ok: false, status: 503, payload: { error: { code: 'ASSET_STORAGE_UNCONFIGURED', message: 'Durable asset storage is not configured' } } }

  const assets = []
  for (let outputIndex = 0; outputIndex < result.assets.length; outputIndex += 1) {
    const asset = result.assets[outputIndex]
    const remoteUrl = clean(asset?.providerUrl) || clean(asset?.url)
    if (!remoteUrl) return { ok: false, status: 502, payload: { error: { code: 'PROVIDER_ASSET_MISSING', message: 'Provider returned no asset URL' } } }
    const identity = `${scope.organizationId}:${scope.projectId}:${vendor}:${result.id}:${outputIndex}`
    const idempotencyHash = sha256Text(identity, 'everville.nomi.generated-asset.idempotency.v1')
    const requestFingerprint = sha256Text(`${identity}:${asset.type || result.kind}`, 'everville.nomi.generated-asset.request.v1')
    const ids = deterministicAssetIds(idempotencyHash)
    const stored = await persistRemoteAsset({
      req,
      env,
      dropboxEnv,
      bearerToken,
      scope,
      remoteUrl,
      descriptor: {
        ...ids,
        idempotencyHash,
        requestFingerprint,
        provider: vendor,
        providerTaskId: String(result.id),
        outputIndex,
        mediaType: asset.type === 'video' ? 'video/mp4' : asset.type === 'audio' ? 'audio/mpeg' : 'image/png',
        classification: 'internal',
        generated: true,
        modelId: result.provenance?.modelKey || 'unknown',
        operationId: result.provenance?.vendorRequestId || result.id,
        promptDigest: result.provenance?.prompt
          ? sha256Text(result.provenance.prompt, 'everville.nomi.prompt.v1')
          : null,
      },
    })
    if (!stored.ok) return stored
    const mediaType = stored.value.bundle?.version?.integrity?.mediaType || ''
    assets.push({
      type: assetType(mediaType, asset.type),
      url: stored.value.url,
      thumbnailUrl: null,
      assetId: ids.assetId,
      assetRefId: ids.versionId,
      providerUrl: null,
    })
  }

  return {
    ok: true,
    value: {
      ...result,
      assets,
      raw: { provider: vendor, taskId: result.id, status: result.status, stored: true },
    },
  }
}

function portalAssetReference(value) {
  if (typeof value !== 'string' || !value.includes('/api/portal/assets/content')) return null
  try {
    const url = new URL(value, 'https://cut.eva.mba')
    if (url.pathname !== '/api/portal/assets/content') return null
    const organizationId = safeUuid(url.searchParams.get('organizationId'))
    const projectId = safeUuid(url.searchParams.get('projectId'))
    const assetId = safeAssetId(url.searchParams.get('assetId'), 'ast')
    const versionId = safeAssetId(url.searchParams.get('versionId'), 'av')
    return organizationId && projectId && assetId && versionId
      ? { organizationId, projectId, assetId, versionId }
      : null
  } catch {
    return null
  }
}

async function materializeProviderAssetReferences({ env, dropboxEnv, bearerToken, scope, value, depth = 0 }) {
  if (depth > 12) throw new Error('ASSET_REFERENCE_DEPTH')
  const reference = portalAssetReference(value)
  if (reference) {
    if (!dropboxEnv || reference.organizationId !== scope.organizationId || reference.projectId !== scope.projectId) {
      throw new Error('ASSET_REFERENCE_SCOPE')
    }
    const authorized = await authorizeAssetScope({
      env,
      bearerToken,
      organizationId: reference.organizationId,
      projectId: reference.projectId,
      permission: 'asset.read',
    })
    if (!authorized.ok) throw new Error('ASSET_REFERENCE_DENIED')
    const stored = await serviceResolveAsset(env, authorized.value, reference.assetId, reference.versionId)
    if (!stored?.file_id) throw new Error('ASSET_REFERENCE_NOT_FOUND')
    return temporaryAssetLink(dropboxEnv, {
      fileId: stored.file_id,
      revision: stored.revision,
      contentHash: stored.content_hash,
    })
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => materializeProviderAssetReferences({ env, dropboxEnv, bearerToken, scope, value: item, depth: depth + 1 })))
  }
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([key, child]) => [
      key,
      await materializeProviderAssetReferences({ env, dropboxEnv, bearerToken, scope, value: child, depth: depth + 1 }),
    ]))
    return Object.fromEntries(entries)
  }
  return value
}

function extractTextFromOpenAiLike(payload) {
  const content = getByPath(payload, 'choices.0.message.content') || getByPath(payload, 'choices.0.text')
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) return content.map((part) => typeof part === 'string' ? part : clean(part?.text)).filter(Boolean).join('').trim()
  return ''
}

async function runTextTask(generationEnv, vendor, request) {
  const prompt = clean(request.prompt)
  if (!prompt) return { ok: false, status: 400, payload: { error: { code: 'INVALID_ARGUMENT', message: 'prompt is required' } } }
  const model = clean(request.extras?.modelKey) || clean(request.extras?.modelAlias) || (vendor === 'deepseek' ? 'deepseek-chat' : vendor === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-5.1')
  let response
  let payload
  if (vendor === 'deepseek') {
    if (!generationEnv.deepseekApiKey) return { ok: false, status: 503, payload: { error: { code: 'UNCONFIGURED', message: 'DeepSeek API key is not configured' } } }
    response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${generationEnv.deepseekApiKey}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: false }),
    })
    payload = await response.json().catch(() => null)
  } else if (vendor === 'anthropic') {
    if (!generationEnv.anthropicApiKey) return { ok: false, status: 503, payload: { error: { code: 'UNCONFIGURED', message: 'Anthropic API key is not configured' } } }
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': generationEnv.anthropicApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
    })
    payload = await response.json().catch(() => null)
    const text = Array.isArray(payload?.content) ? payload.content.map((part) => clean(part?.text)).filter(Boolean).join('') : ''
    payload = { ...payload, choices: [{ message: { content: text } }] }
  } else {
    if (!generationEnv.openaiApiKey) return { ok: false, status: 503, payload: { error: { code: 'UNCONFIGURED', message: 'OpenAI API key is not configured' } } }
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${generationEnv.openaiApiKey}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: false }),
    })
    payload = await response.json().catch(() => null)
  }
  if (!response.ok) return { ok: false, status: response.status, payload: { error: { code: 'PROVIDER_ERROR', message: `${vendor} text request failed`, provider: payload } } }
  const text = extractTextFromOpenAiLike(payload)
  return {
    ok: true,
    payload: {
      id: `task-${crypto.randomUUID()}`,
      kind: request.kind,
      status: text ? 'succeeded' : 'failed',
      assets: [],
      raw: payload,
      provenance: { provider: vendor, modelKey: model, prompt, vendorRequestId: clean(payload?.id) || undefined, timestamp: Date.now() },
    },
  }
}

async function findPortalMemberByEmail(env, email) {
  const result = await supabaseServiceRequest({
    env,
    path: '/rest/v1/rpc/nomi_portal_find_member_by_email',
    body: { request_email: email },
  })
  if (!result.ok) return { ok: false, status: result.status }
  const rows = Array.isArray(result.payload) ? result.payload : []
  return { ok: true, member: rows[0] || null }
}

async function findPortalMemberByTelegram(env, authData) {
  const result = await supabaseServiceRequest({
    env,
    path: '/rest/v1/rpc/nomi_portal_find_or_create_member_by_telegram',
    body: {
      request_telegram_id: String(authData.id),
      request_telegram_username: authData.username,
    },
  })
  if (!result.ok) return { ok: false, status: result.status }
  const rows = Array.isArray(result.payload) ? result.payload : []
  return { ok: true, member: rows[0] || null }
}

async function generatePortalMagicLink(env, email) {
  const result = await supabaseServiceRequest({
    env,
    path: '/auth/v1/admin/generate_link',
    body: {
      type: 'magiclink',
      email,
    },
  })
  if (!result.ok) return { ok: false, status: result.status }
  const properties = result.payload && typeof result.payload === 'object' ? result.payload.properties || result.payload : null
  const hashedToken = properties && clean(properties.hashed_token)
  const actionLink = properties && clean(properties.action_link)
  if (!hashedToken && !actionLink) return { ok: false, status: 502 }
  return { ok: true, hashedToken, actionLink }
}

function confirmUrlForRequest(redirectTo, hashedToken, publicOrigin) {
  const confirmUrl = new URL('/api/portal/auth/confirm', publicOrigin)
  confirmUrl.searchParams.set('token_hash', hashedToken)
  confirmUrl.searchParams.set('type', 'magiclink')
  confirmUrl.searchParams.set('redirectTo', redirectTo)
  return confirmUrl.toString()
}

async function createPortalSessionForEmail(env, email) {
  const link = await generatePortalMagicLink(env, email)
  if (!link.ok || !link.hashedToken) return { ok: false, status: link.status || 502 }

  const result = await supabaseRequest({
    env,
    path: '/auth/v1/verify',
    body: {
      token_hash: link.hashedToken,
      type: 'magiclink',
    },
  })
  const session = result.ok ? sessionPayload(result.payload) : null
  if (!session) return { ok: false, status: result.status || 502 }
  return { ok: true, session }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;'
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '"') return '&quot;'
    return '&#39;'
  })
}

async function sendPortalLoginEmail(env, email, loginUrl) {
  const safeLoginUrl = escapeHtml(loginUrl)
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.portalAuthFrom,
      to: [email],
      subject: 'Your Everville media portal login link',
      text: [
        'Open the Everville media portal with this secure link:',
        '',
        loginUrl,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;color:#1f1c19;">
          <h1 style="font-size:24px;font-weight:600;margin:0 0 14px;">Open Everville media portal</h1>
          <p style="font-size:15px;line-height:1.6;color:#706a64;">Use this secure link to sign in to the shared Nomi workspace.</p>
          <a href="${safeLoginUrl}"
             style="display:inline-block;background:#1f1c19;color:#fffaf4;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;margin:12px 0;">
            Open media portal
          </a>
          <p style="font-size:13px;line-height:1.5;color:#8c867f;">If you did not request this, you can ignore this email.</p>
        </div>
      `,
    }),
  })
  return { status: result.status, ok: result.ok }
}

async function requestCorporateMagicLink({ env, email, redirectTo, publicOrigin }) {
  const membership = await findPortalMemberByEmail(env, email)
  if (!membership.ok) return { ok: false, status: membership.status, code: 'MEMBERSHIP_LOOKUP_FAILED' }
  if (!membership.member) return { ok: true, delivery: 'not_sent_non_member' }

  const link = await generatePortalMagicLink(env, email)
  if (!link.ok) return { ok: false, status: link.status, code: 'MAGIC_LINK_FAILED' }

  const loginUrl = link.hashedToken ? confirmUrlForRequest(redirectTo, link.hashedToken, publicOrigin) : link.actionLink
  const emailResult = await sendPortalLoginEmail(env, email, loginUrl)
  if (!emailResult.ok) return { ok: false, status: emailResult.status, code: 'MAILER_ERROR' }

  return { ok: true, delivery: 'sent_by_everville_mailer' }
}

function sessionPayload(payload) {
  if (!payload || typeof payload !== 'object') return null
  const candidate = payload.session && typeof payload.session === 'object' ? payload.session : payload
  const accessToken = clean(candidate.access_token)
  const refreshToken = clean(candidate.refresh_token)
  if (!accessToken || !refreshToken) return null
  const expiresIn = Number(candidate.expires_in || 3600)
  return {
    accessToken,
    refreshToken,
    tokenType: clean(candidate.token_type) || 'bearer',
    expiresIn: Number.isFinite(expiresIn) ? Math.max(0, Math.floor(expiresIn)) : 3600,
  }
}

function sessionRedirectUrl(redirectTo, session) {
  const url = new URL(redirectTo)
  const params = new URLSearchParams()
  params.set('access_token', session.accessToken)
  params.set('refresh_token', session.refreshToken)
  params.set('expires_in', String(session.expiresIn))
  params.set('token_type', session.tokenType)
  params.set('type', 'magiclink')
  url.hash = params.toString()
  return url.toString()
}

function verifyTelegramAuth(authData, botToken, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!botToken) return { ok: false, code: 'UNCONFIGURED' }
  if (!authData) return { ok: false, code: 'INVALID_TELEGRAM_AUTH' }
  const maxAgeSeconds = 5 * 60
  if (authData.auth_date > nowSeconds + 60 || nowSeconds - authData.auth_date > maxAgeSeconds) {
    return { ok: false, code: 'TELEGRAM_AUTH_EXPIRED' }
  }

  const checkString = Object.entries(authData)
    .filter(([key, value]) => key !== 'hash' && value !== null && value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  if (!/^[a-f0-9]{64}$/i.test(authData.hash)) return { ok: false, code: 'INVALID_TELEGRAM_AUTH' }
  const provided = Buffer.from(authData.hash, 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return { ok: false, code: 'INVALID_TELEGRAM_AUTH' }
  }
  return { ok: true }
}

function authFailureRedirectUrl(redirectTo) {
  const url = new URL(redirectTo)
  const params = new URLSearchParams()
  params.set('error', 'access_denied')
  params.set('type', 'magiclink')
  url.hash = `#/studio?${params.toString()}`
  return url.toString()
}

export async function handlePortalRequest(req, res, pathInput = null) {
  const env = readPortalEnv()
  if (!env) return json(res, 503, { error: { code: 'UNCONFIGURED', message: 'Portal backend is not configured' } })

  const path = Array.isArray(pathInput) ? pathInput : Array.isArray(req.query.path) ? req.query.path : []

  try {
    if (req.method === 'GET' && path.join('/') === 'assets/content') {
      const token = bearer(req) || cookieBearer(req)
      const dropboxEnv = readDropboxAssetEnv()
      const scope = normalizedAssetScope({
        organizationId: queryValue(req, 'organizationId'),
        projectId: queryValue(req, 'projectId'),
      })
      const assetId = safeAssetId(queryValue(req, 'assetId'), 'ast')
      const versionId = safeAssetId(queryValue(req, 'versionId'), 'av')
      if (!token) return json(res, 401, { error: { code: 'PERMISSION_DENIED', message: 'Authentication is required' } })
      if (!dropboxEnv) return json(res, 503, { error: { code: 'ASSET_STORAGE_UNCONFIGURED', message: 'Durable asset storage is not configured' } })
      if (!scope || !assetId || !versionId) return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'Invalid asset reference' } })

      const authorized = await authorizeAssetScope({
        env,
        bearerToken: token,
        organizationId: scope.organizationId,
        projectId: scope.projectId,
        permission: 'asset.read',
      })
      if (!authorized.ok) return json(res, authorized.status, authorized.payload)
      const stored = await serviceResolveAsset(env, authorized.value, assetId, versionId)
      if (!stored?.file_id || !stored?.bundle) return json(res, 404, { error: { code: 'NOT_FOUND', message: 'Asset was not found' } })

      const response = await downloadAsset(dropboxEnv, {
        fileId: stored.file_id,
        revision: stored.revision,
        contentHash: stored.content_hash,
        range: clean(req.headers.range),
      })
      if (!response.ok || !response.body) return json(res, response.status === 416 ? 416 : 502, { error: { code: 'ASSET_READ_FAILED', message: 'Asset could not be read' } })
      setPortalSessionCookie(res, token)
      res.statusCode = response.status
      res.setHeader('content-type', stored.bundle.version?.integrity?.mediaType || 'application/octet-stream')
      res.setHeader('cache-control', 'private, no-store')
      res.setHeader('accept-ranges', response.headers.get('accept-ranges') || 'bytes')
      for (const header of ['content-length', 'content-range']) {
        const value = response.headers.get(header)
        if (value) res.setHeader(header, value)
      }
      Readable.fromWeb(response.body).pipe(res)
      return
    }

    if (req.method === 'POST' && path.join('/') === 'auth/magic-link') {
      const body = await readJson(req)
      const email = safeEmail(body.email)
      const redirectTo = safeRedirectTo(body.redirectTo, req)
      if (!email || !redirectTo) return json(res, 400, { error: { code: 'INVALID_EMAIL' } })

      if (shouldUseCorporateMailer(env)) {
        const result = await requestCorporateMagicLink({ env, email, redirectTo, publicOrigin: portalRequestOrigin(req) })
        if (!result.ok) {
          const status = result.status === 429 ? 429 : result.status === 401 || result.status === 403 ? result.status : 502
          const code = result.status === 429 ? 'RATE_LIMITED' : result.code || 'NETWORK_ERROR'
          return json(res, status, { error: { code, message: 'Portal auth request failed' } })
        }
        return json(res, 200, { email, redirectTo, delivery: result.delivery })
      }

      const result = await supabaseRequest({
        env,
        path: '/auth/v1/otp',
        body: {
          email,
          create_user: false,
          options: { email_redirect_to: redirectTo },
        },
      })
      if (!result.ok) {
        const code = result.status === 429 ? 'RATE_LIMITED' : result.status === 401 || result.status === 403 ? 'PERMISSION_DENIED' : 'NETWORK_ERROR'
        return json(res, result.status, { error: { code, message: 'Portal auth request failed' } })
      }
      return json(res, 200, { email, redirectTo, delivery: 'accepted_by_auth_provider' })
    }

    if (req.method === 'POST' && path.join('/') === 'auth/telegram') {
      const body = await readJson(req)
      const authData = safeTelegramAuthData(body.authData || body)
      if (!env.serviceRoleKey || !env.telegramBotToken) {
        return json(res, 503, { error: { code: 'UNCONFIGURED', message: 'Telegram auth is not configured' } })
      }

      const verification = verifyTelegramAuth(authData, env.telegramBotToken)
      if (!verification.ok) {
        const status = verification.code === 'TELEGRAM_AUTH_EXPIRED' ? 401 : 400
        return json(res, status, { error: { code: verification.code, message: 'Telegram auth was rejected' } })
      }

      const membership = await findPortalMemberByTelegram(env, authData)
      if (!membership.ok) {
        const status = membership.status === 401 || membership.status === 403 ? membership.status : 502
        return json(res, status, { error: { code: 'MEMBERSHIP_LOOKUP_FAILED', message: 'Portal member lookup failed' } })
      }
      if (!membership.member || !safeEmail(membership.member.email)) {
        return json(res, 403, { error: { code: 'PERMISSION_DENIED', message: 'Telegram user is not a portal member' } })
      }

      const sessionResult = await createPortalSessionForEmail(env, membership.member.email)
      if (!sessionResult.ok) {
        return json(res, sessionResult.status === 429 ? 429 : 502, {
          error: { code: sessionResult.status === 429 ? 'RATE_LIMITED' : 'SESSION_CREATE_FAILED', message: 'Portal session failed' },
        })
      }
      setPortalSessionCookie(res, sessionResult.session.accessToken)
      return json(res, 200, {
        email: safeEmail(membership.member.email),
        delivery: 'telegram_verified',
        session: sessionResult.session,
      })
    }

    if (req.method === 'GET' && path.join('/') === 'auth/confirm') {
      const tokenHash = queryValue(req, 'token_hash')
      const type = queryValue(req, 'type')
      const redirectTo = safeRedirectTo(queryValue(req, 'redirectTo'), req)
      if (!tokenHash || type !== 'magiclink' || !redirectTo) {
        return redirect(res, 302, authFailureRedirectUrl(`https://${req.headers.host || 'cut.eva.mba'}/`))
      }

      const result = await supabaseRequest({
        env,
        path: '/auth/v1/verify',
        body: {
          token_hash: tokenHash,
          type: 'magiclink',
        },
      })
      const session = result.ok ? sessionPayload(result.payload) : null
      return redirect(res, 302, session ? sessionRedirectUrl(redirectTo, session) : authFailureRedirectUrl(redirectTo))
    }

    const token = bearer(req)
    if (!token) return json(res, 401, { error: { code: 'PERMISSION_DENIED', message: 'Authentication is required' } })

    if (req.method === 'GET' && path.join('/') === 'identity/session') {
      const result = await supabaseRequest({ env, bearerToken: token, path: '/auth/v1/user', method: 'GET' })
      if (result.ok) setPortalSessionCookie(res, token)
      return json(res, result.status, result.payload)
    }

    if (path[0] === 'model-catalog') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)

      const generationEnv = readPortalGenerationEnv()
      const catalog = portalCatalogRows(generationEnv)
      if (req.method === 'POST' && path[1] === 'models') {
        const body = await readJson(req)
        return json(res, 200, filterCatalogModels(catalog.models, body || {}))
      }
      if (req.method === 'GET' && path[1] === 'models') {
        return json(res, 200, filterCatalogModels(catalog.models, req.query || {}))
      }
      if (req.method === 'GET' && path[1] === 'vendors') {
        return json(res, 200, catalog.vendors)
      }
      if (req.method === 'GET' && path[1] === 'health') {
        return json(res, 200, portalCatalogHealth(catalog))
      }
    }

    if (req.method === 'POST' && path.join('/') === 'assets/list') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)
      const body = await readJson(req)
      const scope = normalizedAssetScope(body)
      if (!scope) return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'Invalid asset scope' } })
      const result = await callRpc({
        env,
        bearerToken: token,
        functionName: 'nomi_portal_list_asset_bundles',
        body: {
          request_organization_id: scope.organizationId,
          request_project_id: scope.projectId,
          request_cursor: clean(body.cursor),
          request_limit: numberOrNull(body.limit),
        },
      })
      if (!result.ok) return json(res, result.status, result.payload)
      const rows = Array.isArray(result.payload) ? result.payload : []
      const items = rows.map((row) => row?.bundle).filter(Boolean)
      const cursor = items.length > 0 && items.length === Math.min(Math.max(Number(body.limit) || 100, 1), 500)
        ? items.at(-1)?.asset?.id || null
        : null
      setPortalSessionCookie(res, token)
      return json(res, 200, { items, cursor })
    }

    if (req.method === 'POST' && path.join('/') === 'assets/resolve') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)
      const body = await readJson(req)
      const scope = normalizedAssetScope(body)
      const assetId = safeAssetId(body.assetId, 'ast')
      const versionId = safeAssetId(body.versionId, 'av')
      if (!scope || !assetId || !versionId) return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'Invalid asset reference' } })
      const result = await callRpc({
        env,
        bearerToken: token,
        functionName: 'nomi_portal_get_asset_bundle',
        body: {
          request_organization_id: scope.organizationId,
          request_project_id: scope.projectId,
          request_asset_id: assetId,
          request_version_id: versionId,
        },
      })
      const row = result.ok && Array.isArray(result.payload) ? result.payload[0] : null
      if (!result.ok) return json(res, result.status, result.payload)
      if (!row?.bundle) return json(res, 404, { error: { code: 'NOT_FOUND', message: 'Asset was not found' } })
      setPortalSessionCookie(res, token)
      return json(res, 200, {
        bundle: row.bundle,
        url: publicAssetUrl(req, scope, assetId, versionId),
      })
    }

    if (req.method === 'POST' && path.join('/') === 'assets/import-remote') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)
      const dropboxEnv = readDropboxAssetEnv()
      if (!dropboxEnv) return json(res, 503, { error: { code: 'ASSET_STORAGE_UNCONFIGURED', message: 'Durable asset storage is not configured' } })
      const body = await readJson(req)
      const scope = normalizedAssetScope(body)
      const remoteUrl = clean(body.url)
      const descriptor = scope ? importedAssetDescriptor(scope, body, 'remote') : null
      if (!scope || !remoteUrl || !descriptor) return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'Invalid asset import request' } })
      const stored = await persistRemoteAsset({ req, env, dropboxEnv, bearerToken: token, scope, remoteUrl, descriptor })
      if (!stored.ok) return json(res, stored.status, stored.payload)
      setPortalSessionCookie(res, token)
      return json(res, 200, stored.value.bundle)
    }

    if (req.method === 'POST' && path.join('/') === 'assets/import-file') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)
      const dropboxEnv = readDropboxAssetEnv()
      const metadata = decodeAssetMetadata(req)
      const scope = normalizedAssetScope(metadata)
      const descriptor = scope && metadata ? importedAssetDescriptor(scope, metadata, 'file') : null
      if (!dropboxEnv) return json(res, 503, { error: { code: 'ASSET_STORAGE_UNCONFIGURED', message: 'Durable asset storage is not configured' } })
      if (!scope || !descriptor) return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'Invalid asset import metadata' } })
      const stored = await persistAssetSource({ req, env, dropboxEnv, bearerToken: token, scopeInput: scope, source: req, descriptor })
      if (!stored.ok) return json(res, stored.status, stored.payload)
      setPortalSessionCookie(res, token)
      return json(res, 200, stored.value.bundle)
    }

    if (req.method === 'POST' && path.join('/') === 'assets/persist-task-result') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)
      const body = await readJson(req)
      const scope = normalizedAssetScope(body.scope)
      const vendor = clean(body.vendor)
      if (!scope || !vendor || !body.result || typeof body.result !== 'object') {
        return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'Invalid task result persistence request' } })
      }
      const persisted = await persistTaskResultAssets({
        req,
        env,
        dropboxEnv: readDropboxAssetEnv(),
        bearerToken: token,
        scope,
        vendor,
        result: body.result,
      })
      if (!persisted.ok) return json(res, persisted.status, persisted.payload)
      setPortalSessionCookie(res, token)
      return json(res, 200, { vendor, result: persisted.value })
    }

    if (req.method === 'POST' && path.join('/') === 'project-revisions/current') {
      const body = await readJson(req)
      const result = await callRpc({
        env,
        bearerToken: token,
        functionName: 'nomi_portal_get_current_project_revision',
        body: {
          request_organization_id: body.organizationId,
          request_workspace_id: body.workspaceId,
          request_project_id: body.projectId,
        },
      })
      if (!result.ok) return json(res, result.status, result.payload)
      const row = Array.isArray(result.payload) ? result.payload[0] || null : null
      return json(res, 200, row)
    }

    if (req.method === 'POST' && path.join('/') === 'tasks/run') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)

      const generationEnv = readPortalGenerationEnv()
      const body = await readJson(req)
      const vendor = clean(body.vendor)
      const request = body.request && typeof body.request === 'object' ? body.request : null
      const scope = normalizedAssetScope(body.scope)
      if (!vendor || !request || !clean(request.prompt) || !clean(request.kind)) {
        return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'vendor and request are required' } })
      }
      const isTextTask = request.kind === 'chat' || request.kind === 'prompt_refine' || request.kind === 'image_to_prompt'
      if (!isTextTask && !scope) {
        return json(res, 400, { error: { code: 'INVALID_ARGUMENT', message: 'A shared project scope is required for durable generation' } })
      }
      let providerRequest = request
      if (!isTextTask) {
        try {
          providerRequest = await materializeProviderAssetReferences({
            env,
            dropboxEnv: readDropboxAssetEnv(),
            bearerToken: token,
            scope,
            value: request,
          })
        } catch {
          return json(res, 403, { error: { code: 'PERMISSION_DENIED', message: 'A referenced asset is not available to this project' } })
        }
      }
      const result = isTextTask
        ? await runTextTask(generationEnv, vendor, request)
        : vendor === 'kie'
          ? await runKieTask(generationEnv, providerRequest)
          : { ok: false, status: 404, payload: { error: { code: 'UNSUPPORTED_PROVIDER', message: `${vendor} is not available in the web portal runtime` } } }
      if (!result.ok) return json(res, result.status, result.payload)
      if (!isTextTask && result.payload?.status === 'succeeded') {
        const persisted = await persistTaskResultAssets({
          req,
          env,
          dropboxEnv: readDropboxAssetEnv(),
          bearerToken: token,
          scope,
          vendor,
          result: result.payload,
        })
        if (!persisted.ok) return json(res, persisted.status, persisted.payload)
        result.payload = persisted.value
      }
      setPortalSessionCookie(res, token)
      return json(res, 200, result.payload)
    }

    if (req.method === 'POST' && path.join('/') === 'tasks/result') {
      const session = await requirePortalSession(env, token)
      if (!session.ok) return json(res, session.status, session.payload)

      const generationEnv = readPortalGenerationEnv()
      const body = await readJson(req)
      const vendor = clean(body.vendor)
      const scope = normalizedAssetScope(body.scope)
      const result = vendor === 'kie'
        ? await fetchKieTaskResult(generationEnv, body)
        : { ok: false, status: 404, payload: { error: { code: 'UNSUPPORTED_PROVIDER', message: `${vendor || 'provider'} is not available in the web portal runtime` } } }
      if (!result.ok) return json(res, result.status, result.payload)
      if (scope && result.payload?.result?.status === 'succeeded') {
        const persisted = await persistTaskResultAssets({
          req,
          env,
          dropboxEnv: readDropboxAssetEnv(),
          bearerToken: token,
          scope,
          vendor,
          result: result.payload.result,
        })
        if (!persisted.ok) return json(res, persisted.status, persisted.payload)
        result.payload.result = persisted.value
      }
      setPortalSessionCookie(res, token)
      return json(res, 200, result.payload)
    }

    if (req.method === 'POST' && path[0] === 'query') {
      const body = await readJson(req)
      const mapper = TABLE_QUERY_RPC[body.table]
      if (!mapper) return json(res, 404, { error: { code: 'NOT_FOUND' } })
      const result = await callRpc({ env, bearerToken: token, ...mapper({ query: body.query || {} }) })
      return json(res, result.status, result.payload)
    }

    if (req.method === 'POST' && path[0] === 'insert') {
      const body = await readJson(req)
      const mapper = TABLE_INSERT_RPC[body.table]
      if (!mapper) return json(res, 404, { error: { code: 'NOT_FOUND' } })
      const result = await callRpc({ env, bearerToken: token, ...mapper({ body: body.body || {} }) })
      return json(res, result.status, result.payload)
    }

    if (req.method === 'POST' && path[0] === 'rpc' && path[1]) {
      const requestBody = await readJson(req)
      const functionName = LEGACY_RPC[path[1]] || path[1]
      const result = await callRpc({ env, bearerToken: token, functionName, body: requestBody })
      return json(res, result.status, result.payload)
    }

    return json(res, 404, { error: { code: 'NOT_FOUND' } })
  } catch (error) {
    const code = error && error.message === 'REQUEST_TOO_LARGE' ? 'REQUEST_TOO_LARGE' : 'NETWORK_ERROR'
    return json(res, code === 'REQUEST_TOO_LARGE' ? 413 : 500, { error: { code, message: 'Portal backend failed' } })
  }
}
