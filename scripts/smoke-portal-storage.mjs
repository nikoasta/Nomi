import { randomBytes, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
const portalOrigin = process.env.NOMI_PORTAL_ORIGIN || 'https://cut.eva.mba'

if (!supabaseUrl || !serviceKey || !publishableKey) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_PUBLISHABLE_KEY are required')
}

async function jsonRequest(url, init = {}) {
  const response = await fetch(url, init)
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`${init.method || 'GET'} ${new URL(url).pathname} returned ${response.status}`)
  return payload
}

const serviceHeaders = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
  accept: 'application/json',
}

function linkedQuery(sql) {
  const output = execFileSync('npx', [
    '--yes',
    'supabase@latest',
    'db',
    'query',
    '--linked',
    '--output',
    'json',
    sql,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
  return JSON.parse(output).rows || []
}

const projectId = randomUUID()
const slug = `storage-smoke-${Date.now()}`
const email = `${slug}@everville.invalid`
const password = randomBytes(32).toString('base64url')
let userId = null
let bundle = null

try {
  const [workspace] = linkedQuery("select id, organization_id from app.workspaces where status = 'active' order by created_at limit 1")
  if (!workspace?.id || !workspace.organization_id) throw new Error('No active portal workspace is available')

  const user = await jsonRequest(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { ...serviceHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  userId = user.id

  linkedQuery(`
    insert into app.projects (
      id, organization_id, workspace_id, slug, title, classification, created_by_user_id
    ) values (
      '${projectId}', '${workspace.organization_id}', '${workspace.id}', '${slug}',
      'Portal storage smoke', 'internal', '${userId}'
    );
    insert into app.project_memberships (
      organization_id, workspace_id, project_id, user_id, permissions
    ) values (
      '${workspace.organization_id}', '${workspace.id}', '${projectId}', '${userId}',
      array['project.read', 'project.write']
    );
  `)

  const session = await jsonRequest(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const bearer = session.access_token
  if (!bearer) throw new Error('Smoke user session was not created')

  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  const idempotencyKey = `smoke:${projectId}`
  const metadata = Buffer.from(JSON.stringify({
    organizationId: workspace.organization_id,
    projectId,
    fileName: 'storage-smoke.png',
    claimedMediaType: 'image/png',
    classification: 'internal',
    idempotencyKey,
  })).toString('base64url')
  const upload = async () => jsonRequest(`${portalOrigin}/api/portal/assets/import-file`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bearer}`,
      'content-type': 'image/png',
      'x-nomi-asset-metadata': metadata,
    },
    body: bytes,
  })
  bundle = await upload()
  const repeated = await upload()
  if (bundle.asset?.id !== repeated.asset?.id || bundle.version?.id !== repeated.version?.id) {
    throw new Error('Idempotent upload returned a different asset identity')
  }

  const list = await jsonRequest(`${portalOrigin}/api/portal/assets/list`, {
    method: 'POST',
    headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
    body: JSON.stringify({ organizationId: workspace.organization_id, projectId }),
  })
  if (!list.items?.some((item) => item.asset?.id === bundle.asset.id)) throw new Error('Uploaded asset is missing from list')

  const resolved = await jsonRequest(`${portalOrigin}/api/portal/assets/resolve`, {
    method: 'POST',
    headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      organizationId: workspace.organization_id,
      projectId,
      assetId: bundle.asset.id,
      versionId: bundle.version.id,
      purpose: 'display',
    }),
  })
  const full = await fetch(resolved.url, { headers: { authorization: `Bearer ${bearer}` } })
  const fullBytes = Buffer.from(await full.arrayBuffer())
  if (full.status !== 200 || !fullBytes.equals(bytes)) throw new Error('Full asset download failed integrity verification')
  const range = await fetch(resolved.url, {
    headers: { authorization: `Bearer ${bearer}`, range: 'bytes=0-7' },
  })
  const rangeBytes = Buffer.from(await range.arrayBuffer())
  if (range.status !== 206 || !rangeBytes.equals(bytes.subarray(0, 8))) throw new Error('Range download failed integrity verification')

  console.log(JSON.stringify({
    ok: true,
    projectId,
    dropboxCleanupPath: `/Content/NOMI/projects/${projectId}`,
    assetId: bundle.asset.id,
    versionId: bundle.version.id,
    bytes: bytes.length,
    listCount: list.items.length,
    fullStatus: full.status,
    rangeStatus: range.status,
  }))
} finally {
  try { linkedQuery(`delete from app.projects where id = '${projectId}'`) } catch {}
  if (userId) {
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: serviceHeaders,
    }).catch(() => null)
  }
}
