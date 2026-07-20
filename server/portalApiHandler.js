/* global Buffer, fetch, process, URL */

const RPC_ALLOWLIST = new Set([
  'nomi_portal_list_organizations',
  'nomi_portal_list_workspaces',
  'nomi_portal_list_memberships',
  'nomi_portal_list_projects',
  'nomi_portal_create_project',
  'nomi_portal_save_project_revision',
  'nomi_portal_list_review_queue',
  'nomi_portal_decide_approval_gate',
  'nomi_portal_append_audit_event',
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
  decide_approval_gate: 'nomi_portal_decide_approval_gate',
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function readPortalEnv() {
  const endpoint = clean(process.env.SUPABASE_URL) || clean(process.env.VITE_SUPABASE_URL)
  const publishableKey =
    clean(process.env.SUPABASE_PUBLISHABLE_KEY) || clean(process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  if (!endpoint || !publishableKey) return null
  try {
    const url = new URL(endpoint.replace(/\/+$/, ''))
    if (url.protocol !== 'https:') return null
    if (!publishableKey.startsWith('sb_publishable_')) return null
    return { endpoint: url.toString().replace(/\/+$/, ''), publishableKey }
  } catch {
    return null
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
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return null
    return url.toString()
  } catch {
    return null
  }
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

export async function handlePortalRequest(req, res, pathInput = null) {
  const env = readPortalEnv()
  if (!env) return json(res, 503, { error: { code: 'UNCONFIGURED', message: 'Portal backend is not configured' } })

  const path = Array.isArray(pathInput) ? pathInput : Array.isArray(req.query.path) ? req.query.path : []

  try {
    if (req.method === 'POST' && path.join('/') === 'auth/magic-link') {
      const body = await readJson(req)
      const email = safeEmail(body.email)
      const redirectTo = safeRedirectTo(body.redirectTo, req)
      if (!email || !redirectTo) return json(res, 400, { error: { code: 'INVALID_EMAIL' } })

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
      return json(res, 200, { email, redirectTo })
    }

    const token = bearer(req)
    if (!token) return json(res, 401, { error: { code: 'PERMISSION_DENIED', message: 'Authentication is required' } })

    if (req.method === 'GET' && path.join('/') === 'identity/session') {
      const result = await supabaseRequest({ env, bearerToken: token, path: '/auth/v1/user', method: 'GET' })
      return json(res, result.status, result.payload)
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
