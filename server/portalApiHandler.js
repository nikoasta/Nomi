/* global Buffer, fetch, process, URL, URLSearchParams */

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
  const portalAuthFrom = clean(process.env.PORTAL_AUTH_FROM_EMAIL) || 'Everville Team <notifications@everville.estate>'
  if (!endpoint || !publishableKey) return null
  try {
    const url = new URL(endpoint.replace(/\/+$/, ''))
    if (url.protocol !== 'https:') return null
    if (!publishableKey.startsWith('sb_publishable_')) return null
    return { endpoint: url.toString().replace(/\/+$/, ''), publishableKey, serviceRoleKey, resendApiKey, portalAuthFrom }
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

function confirmUrlForRequest(redirectTo, hashedToken) {
  const redirectUrl = new URL(redirectTo)
  const confirmUrl = new URL('/api/portal/auth/confirm', redirectUrl.origin)
  confirmUrl.searchParams.set('token_hash', hashedToken)
  confirmUrl.searchParams.set('type', 'magiclink')
  confirmUrl.searchParams.set('redirectTo', redirectTo)
  return confirmUrl.toString()
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

async function requestCorporateMagicLink({ env, email, redirectTo }) {
  const membership = await findPortalMemberByEmail(env, email)
  if (!membership.ok) return { ok: false, status: membership.status, code: 'MEMBERSHIP_LOOKUP_FAILED' }
  if (!membership.member) return { ok: true, delivery: 'not_sent_non_member' }

  const link = await generatePortalMagicLink(env, email)
  if (!link.ok) return { ok: false, status: link.status, code: 'MAGIC_LINK_FAILED' }

  const loginUrl = link.hashedToken ? confirmUrlForRequest(redirectTo, link.hashedToken) : link.actionLink
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
    if (req.method === 'POST' && path.join('/') === 'auth/magic-link') {
      const body = await readJson(req)
      const email = safeEmail(body.email)
      const redirectTo = safeRedirectTo(body.redirectTo, req)
      if (!email || !redirectTo) return json(res, 400, { error: { code: 'INVALID_EMAIL' } })

      if (shouldUseCorporateMailer(env)) {
        const result = await requestCorporateMagicLink({ env, email, redirectTo })
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
