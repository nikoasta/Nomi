import {
  AUTHORIZATION_PERMISSIONS,
  type AuthorizationPolicyRequest,
  type OrganizationMembership,
  type PlatformSession,
  type ProjectPermission,
} from './authorization/contracts'
import { evaluateAuthorization } from './authorization/policy'
import {
  ASSET_RECORD_CAPABILITIES,
  parseAssetId,
  parseAssetRecordBundle,
  parseAssetResolution,
  validateAssetRecordGraph,
  type AssetId,
  type AssetRecordImportFileRequest,
  type AssetRecordImportRemoteUrlRequest,
  type AssetRecordBundle,
  type AssetResolution,
  type AssetResolveRequest,
  type PlatformAssetRecords,
} from './assets/contracts'
import { PORTAL_CAPABILITIES } from './collaboration/contracts'
import type {
  PersistedConversationsV2,
  PlatformAssetImportFileRequest,
  PlatformAssetImportRemoteUrlRequest,
  PlatformAssetListRequest,
  PlatformCapability,
  PlatformClient,
  PlatformConversationValue,
  PlatformError,
  PlatformErrorCode,
  PlatformResult,
  WorkbenchAssetDto,
} from './client'

type ElectronConversationReadRequest = { projectId: string }
type ElectronConversationWriteRequest = PlatformConversationValue & { projectId: string }

type ElectronConversationReadResponse = {
  ok: boolean
  conversations?: PersistedConversationsV2 | null
  error?: string
}

type ElectronConversationWriteResponse = {
  ok: boolean
  error?: string
}

export type AssetRecordImportOperation = Readonly<{
  authorizeAssetWrite(assetId: AssetId): Promise<boolean>
}>

export type AssetRecordAdapter = Pick<Partial<PlatformAssetRecords>, 'list' | 'resolve'> & {
  importFile?: (
    request: AssetRecordImportFileRequest,
    operation: AssetRecordImportOperation,
  ) => ReturnType<PlatformAssetRecords['importFile']>
  importRemoteUrl?: (
    request: AssetRecordImportRemoteUrlRequest,
    operation: AssetRecordImportOperation,
  ) => ReturnType<PlatformAssetRecords['importRemoteUrl']>
}

type AssetRecordAuthorizationAdapter = {
  authorize(request: {
    capability: 'project.read' | 'project.write' | 'asset.read' | 'asset.write'
    organizationId: string
    projectId: string
    assetId?: string
  }): Promise<unknown>
}

type ElectronPlatformClientOptions = {
  bridge: ElectronPlatformBridge
  assetRecordAdapter?: AssetRecordAdapter
  authorization?: AssetRecordAuthorizationAdapter
  session?: unknown
}

export type ElectronPlatformBridge = {
  conversations?: {
    read?: (request: ElectronConversationReadRequest) => Promise<ElectronConversationReadResponse>
    write?: (request: ElectronConversationWriteRequest) => Promise<ElectronConversationWriteResponse>
  }
  assets?: {
    list?: (request: PlatformAssetListRequest) => Promise<{ items: WorkbenchAssetDto[]; cursor: string | null }>
    importFile?: (request: PlatformAssetImportFileRequest) => Promise<WorkbenchAssetDto>
    importRemoteUrl?: (request: PlatformAssetImportRemoteUrlRequest) => Promise<WorkbenchAssetDto>
  }
  assetRecords?: Pick<PlatformAssetRecords, 'list' | 'importFile' | 'importRemoteUrl' | 'resolve'>
}

const CAPABILITY_ORDER: readonly PlatformCapability[] = [
  'identity.session.read',
  'authorization.check',
  'conversations.read',
  'conversations.write',
  'assets.list',
  'assets.import-file',
  'assets.import-remote-url',
  ...ASSET_RECORD_CAPABILITIES,
  ...PORTAL_CAPABILITIES,
]

const LOCAL_PRINCIPAL_ID = 'local-runtime:principal'
const LOCAL_ORGANIZATION_ID = 'local-runtime:organization'
const LOCAL_PROJECT_PERMISSIONS = AUTHORIZATION_PERMISSIONS.filter(
  (permission): permission is ProjectPermission => permission !== 'organization.admin',
)

type LocalPlatformSession = Extract<PlatformSession, { state: 'authenticated' }> & {
  activeMembership: OrganizationMembership
}

export function createLocalSession(): LocalPlatformSession {
  return {
    state: 'authenticated',
    principal: {
      id: LOCAL_PRINCIPAL_ID,
      kind: 'local-runtime',
      displayName: 'Local runtime',
    },
    activeMembership: {
      principalId: LOCAL_PRINCIPAL_ID,
      organizationId: LOCAL_ORGANIZATION_ID,
      status: 'active',
      organizationPermissions: [],
      projects: [],
    },
  }
}

function localAuthorizationSession(projectId: string): LocalPlatformSession {
  const session = createLocalSession()
  session.activeMembership.projects = [{ projectId, permissions: LOCAL_PROJECT_PERMISSIONS }]
  return session
}

export function createLocalAssetRecordAuthorization(): AssetRecordAuthorizationAdapter {
  return {
    authorize: async (request) => {
      const policyRequest: AuthorizationPolicyRequest = {
        session: localAuthorizationSession(request.projectId),
        permission: request.capability,
        resource:
          request.capability === 'asset.read' || request.capability === 'asset.write'
            ? {
                family: 'asset',
                resourceId: request.assetId ?? '',
                scope: {
                  kind: 'project',
                  organizationId: request.organizationId,
                  projectId: request.projectId,
                },
              }
            : {
                family: 'project',
                scope: {
                  kind: 'project',
                  organizationId: request.organizationId,
                  projectId: request.projectId,
                },
              },
      }
      return { ok: true, value: evaluateAuthorization(policyRequest) }
    },
  }
}

const CODE_MESSAGES: Record<PlatformErrorCode, string> = {
  UNSUPPORTED_CAPABILITY: 'Capability is not supported by this runtime',
  INVALID_ARGUMENT: 'The operation received an invalid argument',
  NOT_FOUND: 'The requested resource was not found',
  PERMISSION_DENIED: 'The operation was not permitted',
  CONFLICT: 'The operation conflicts with the current state',
  PAYLOAD_TOO_LARGE: 'The operation payload is too large',
  NETWORK_ERROR: 'The operation failed because of a network error',
  IO_ERROR: 'The operation failed because of an I/O error',
  ABORTED: 'The operation was aborted',
  INTEGRITY_ERROR: 'The asset failed integrity validation',
  INTERNAL: 'The operation failed unexpectedly',
}

function classifyRejectedError(message: string): PlatformErrorCode {
  const normalized = message.toLowerCase()
  if (/required|invalid|must be|unsupported url|only http/.test(normalized)) {
    return 'INVALID_ARGUMENT'
  }
  if (/not found|enoent|does not exist/.test(normalized)) return 'NOT_FOUND'
  if (/permission|denied|forbidden|eacces|eperm/.test(normalized)) {
    return 'PERMISSION_DENIED'
  }
  if (/conflict|already exists|eexist/.test(normalized)) return 'CONFLICT'
  if (/too large|payload.*large|entity.*large|max bytes/.test(normalized)) {
    return 'PAYLOAD_TOO_LARGE'
  }
  if (/network|fetch|timeout|timed out|dns|econn|socket/.test(normalized)) {
    return 'NETWORK_ERROR'
  }
  if (/\beio\b|read failed|write failed|filesystem|disk/.test(normalized)) {
    return 'IO_ERROR'
  }
  if (/abort|cancel/.test(normalized)) return 'ABORTED'
  return 'INTERNAL'
}

function classifyFailedResponse(message: string | undefined): PlatformErrorCode {
  const normalized = String(message ?? '').toLowerCase()
  if (/project not found|\benoent\b|does not exist/.test(normalized)) return 'NOT_FOUND'
  if (/\beio\b|filesystem|disk/.test(normalized)) return 'IO_ERROR'
  if (/permission|denied|forbidden|\beacces\b|\beperm\b/.test(normalized)) return 'PERMISSION_DENIED'
  if (/conflict|already exists|\beexist\b/.test(normalized)) return 'CONFLICT'
  if (/too large|payload.*large|entity.*large|max bytes/.test(normalized)) return 'PAYLOAD_TOO_LARGE'
  if (/network|timeout|timed out|dns|\beconn[a-z]*\b|socket/.test(normalized)) return 'NETWORK_ERROR'
  if (/abort|cancel/.test(normalized)) return 'ABORTED'
  return 'INTERNAL'
}

function retryable(code: PlatformErrorCode): boolean {
  return code === 'NETWORK_ERROR' || code === 'IO_ERROR' || code === 'ABORTED'
}

type FilterableCapabilitySet = ReadonlySet<PlatformCapability> & {
  filter(predicate: (capability: PlatformCapability) => boolean): PlatformCapability[]
}

function filterableCapabilities(values: readonly PlatformCapability[]): FilterableCapabilitySet {
  const capabilities = new Set<PlatformCapability>(values)
  return Object.assign(capabilities, {
    filter: (predicate: (capability: PlatformCapability) => boolean) => [...capabilities].filter(predicate),
  })
}

function operationError(
  capability: PlatformCapability,
  code: PlatformErrorCode,
  details?: Readonly<Record<string, unknown>>,
): PlatformError {
  return {
    code,
    capability,
    message: `${CODE_MESSAGES[code]} (${capability})`,
    retryable: retryable(code),
    ...(details ? { details } : {}),
  }
}

function unsupported<T>(capability: PlatformCapability): PlatformResult<T> {
  return {
    ok: false,
    error: operationError(capability, 'UNSUPPORTED_CAPABILITY'),
  }
}

function failedResponse<T>(capability: PlatformCapability, message: string | undefined): PlatformResult<T> {
  const code = classifyFailedResponse(message)
  return {
    ok: false,
    error: operationError(capability, code, {
      source: 'bridge-response',
      hasDiagnostic: Boolean(message),
    }),
  }
}

function diagnosticText(error: unknown): string {
  try {
    if (error instanceof Error && typeof error.message === 'string') return error.message
    return typeof error === 'string' ? error : ''
  } catch {
    return ''
  }
}

function rejected<T>(capability: PlatformCapability, error: unknown): PlatformResult<T> {
  const message = diagnosticText(error)
  return {
    ok: false,
    error: operationError(capability, classifyRejectedError(message), {
      source: 'bridge-rejection',
    }),
  }
}

async function invoke<T>(
  capability: PlatformCapability,
  operation: (() => Promise<T>) | undefined,
): Promise<PlatformResult<T>> {
  if (!operation) return unsupported(capability)
  try {
    return { ok: true, value: await operation() }
  } catch (error) {
    return rejected(capability, error)
  }
}

function isClientOptions(
  value: ElectronPlatformBridge | ElectronPlatformClientOptions,
): value is ElectronPlatformClientOptions {
  return Boolean(
    value &&
    typeof value === 'object' &&
    ('bridge' in value || 'assetRecordAdapter' in value || 'authorization' in value || 'session' in value),
  )
}

function activeSessionFacts(session: unknown): {
  principalId: string
  organizationId: string
  displayName?: string
} | null {
  if (!session || typeof session !== 'object') return null
  const raw = session as Record<string, unknown>
  const principal = raw.principal && typeof raw.principal === 'object' ? (raw.principal as Record<string, unknown>) : {}
  const membership =
    raw.activeMembership && typeof raw.activeMembership === 'object'
      ? (raw.activeMembership as Record<string, unknown>)
      : {}
  const principalId = String(raw.principalId || principal.id || '').trim()
  const organizationId = String(raw.activeOrganizationId || membership.organizationId || '').trim()
  const displayName =
    typeof principal.displayName === 'string' && principal.displayName.trim() ? principal.displayName : undefined
  return principalId && organizationId ? { principalId, organizationId, ...(displayName ? { displayName } : {}) } : null
}

function identitySession(session: unknown): PlatformSession {
  const facts = activeSessionFacts(session)
  if (!facts) return createLocalSession()
  return {
    state: 'authenticated',
    principal: {
      id: facts.principalId,
      kind: 'local-runtime',
      ...(facts.displayName ? { displayName: facts.displayName } : {}),
    },
    activeMembership: {
      principalId: facts.principalId,
      organizationId: facts.organizationId,
      status: 'active',
      organizationPermissions: [],
      projects: [],
    },
  }
}

function authorizationAllowed(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false
  const raw = response as Record<string, unknown>
  if (Object.prototype.hasOwnProperty.call(raw, 'ok') && raw.ok !== true) return false
  const candidate = Object.prototype.hasOwnProperty.call(raw, 'ok') ? raw.value : raw
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false
  const value = candidate as Record<string, unknown>
  if (value.allowed === false || value.decision === 'deny') return false
  return value.allowed === true || value.decision === 'allow'
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f || character.charCodeAt(0) === 0x7f)
}

function hasRequestedElectronLocator(url: string, projectId: string): boolean {
  const locatorPrefix = `nomi-local://asset/${encodeURIComponent(projectId)}/`
  if (!url.startsWith(locatorPrefix)) return false
  return url
    .slice('nomi-local://asset/'.length)
    .split('/')
    .every((segment) => {
      try {
        const decoded = decodeURIComponent(segment)
        return (
          segment.length > 0 &&
          segment === encodeURIComponent(decoded) &&
          decoded !== '.' &&
          decoded !== '..' &&
          !decoded.includes('/') &&
          !decoded.includes('\\') &&
          !hasControlCharacter(decoded)
        )
      } catch {
        return false
      }
    })
}

function resolutionForRequest(value: unknown, request: AssetResolveRequest): AssetResolution | null {
  let resolution: AssetResolution
  try {
    resolution = parseAssetResolution(value)
  } catch {
    return null
  }
  const scope = resolution.scope
  const locator = resolution.locator
  if (
    resolution.assetId !== request.assetId ||
    resolution.versionId !== request.versionId ||
    scope?.organizationId !== request.organizationId ||
    scope.projectId !== request.projectId ||
    resolution.purpose !== request.purpose ||
    locator?.kind !== 'runtime-url' ||
    locator.runtime !== 'electron' ||
    typeof locator.url !== 'string' ||
    !hasRequestedElectronLocator(locator.url, request.projectId)
  ) {
    return null
  }
  return resolution
}

export function createElectronPlatformClient(
  input: ElectronPlatformBridge | ElectronPlatformClientOptions,
): PlatformClient {
  const options: ElectronPlatformClientOptions = isClientOptions(input) ? input : { bridge: input }
  const bridge = options.bridge
  const hostAssetRecordAdapter = bridge.assetRecords
  const assetRecordAdapter = options.assetRecordAdapter ?? hostAssetRecordAdapter
  const hostAuthorizesGeneratedAssets = !options.assetRecordAdapter && Boolean(hostAssetRecordAdapter)
  const authorization =
    options.authorization ?? (hostAssetRecordAdapter ? createLocalAssetRecordAuthorization() : undefined)
  const assetSession = options.session ?? createLocalSession()
  const filteredListCursors = new Map<
    string,
    { organizationId: string; projectId: string; items: AssetRecordBundle[] }
  >()
  const available = new Set<PlatformCapability>(['identity.session.read', 'authorization.check'])
  if (bridge.conversations?.read) available.add('conversations.read')
  if (bridge.conversations?.write) available.add('conversations.write')
  if (bridge.assets?.list) available.add('assets.list')
  if (bridge.assets?.importFile) available.add('assets.import-file')
  if (bridge.assets?.importRemoteUrl) available.add('assets.import-remote-url')
  if (assetRecordAdapter?.list) available.add('asset-records.list')
  if (assetRecordAdapter?.importFile) available.add('asset-records.import-file')
  if (assetRecordAdapter?.importRemoteUrl) available.add('asset-records.import-remote-url')
  if (assetRecordAdapter?.resolve) available.add('asset-records.resolve')

  const capabilities = filterableCapabilities(CAPABILITY_ORDER.filter((capability) => available.has(capability)))

  async function authorizeAssetRecord(
    capability: 'project.read' | 'project.write' | 'asset.read' | 'asset.write',
    request: { organizationId: string; projectId: string },
    assetId?: string,
  ): Promise<boolean> {
    const session = activeSessionFacts(assetSession)
    if (!session || session.organizationId !== request.organizationId || !authorization) return false
    try {
      return authorizationAllowed(
        await authorization.authorize({ capability, ...request, ...(assetId ? { assetId } : {}) }),
      )
    } catch {
      return false
    }
  }

  function denied<T>(capability: PlatformCapability): PlatformResult<T> {
    return { ok: false, error: operationError(capability, 'PERMISSION_DENIED') }
  }

  async function invokeAssetRecord<T>(
    capability: PlatformCapability,
    operation: (() => Promise<PlatformResult<T>>) | undefined,
  ): Promise<PlatformResult<T>> {
    if (!operation) return unsupported(capability)
    try {
      const result = await operation()
      if (result.ok) return result
      const code = result.error.code in CODE_MESSAGES ? result.error.code : 'INTERNAL'
      const reasonCode =
        result.error.details && typeof result.error.details.reasonCode === 'string'
          ? result.error.details.reasonCode
          : undefined
      return {
        ok: false,
        error: operationError(capability, code, reasonCode ? { reasonCode } : undefined),
      }
    } catch (error) {
      return rejected(capability, error)
    }
  }

  return {
    capabilities,
    supports: (capability) => capabilities.has(capability),
    identity: {
      getSession: () => Promise.resolve({ ok: true, value: identitySession(assetSession) }),
    },
    authorization: {
      check: (request) => {
        try {
          const policyRequest: AuthorizationPolicyRequest = {
            session: createLocalSession(),
            resource: request.resource,
            permission: request.permission,
          }
          const initialDecision = evaluateAuthorization(policyRequest)
          if (initialDecision.reason !== 'DENY_PROJECT_SCOPE_MISMATCH') {
            return Promise.resolve({ ok: true, value: initialDecision })
          }

          const scope = policyRequest.resource.scope
          if (scope.kind !== 'project' || typeof scope.projectId !== 'string') {
            return Promise.resolve({
              ok: true,
              value: { allowed: false, reason: 'DENY_MALFORMED_REQUEST' },
            })
          }

          return Promise.resolve({
            ok: true,
            value: evaluateAuthorization({
              ...policyRequest,
              session: localAuthorizationSession(scope.projectId),
            }),
          })
        } catch {
          return Promise.resolve({
            ok: true,
            value: { allowed: false, reason: 'DENY_MALFORMED_REQUEST' },
          })
        }
      },
    },
    conversations: {
      async read(projectId) {
        const capability = 'conversations.read'
        const read = bridge.conversations?.read
        if (!read) return unsupported(capability)
        try {
          const response = await read.call(bridge.conversations, { projectId })
          if (!response?.ok) return failedResponse(capability, response?.error)
          return { ok: true, value: response.conversations ?? null }
        } catch (error) {
          return rejected(capability, error)
        }
      },
      async write(projectId, value) {
        const capability = 'conversations.write'
        const write = bridge.conversations?.write
        if (!write) return unsupported(capability)
        try {
          const response = await write.call(bridge.conversations, {
            projectId,
            ...value,
          })
          if (!response?.ok) return failedResponse(capability, response?.error)
          return { ok: true, value: undefined }
        } catch (error) {
          return rejected(capability, error)
        }
      },
    },
    assets: {
      list: (request) => invoke('assets.list', bridge.assets?.list ? () => bridge.assets!.list!(request) : undefined),
      importFile: (request) =>
        invoke('assets.import-file', bridge.assets?.importFile ? () => bridge.assets!.importFile!(request) : undefined),
      importRemoteUrl: (request) =>
        invoke(
          'assets.import-remote-url',
          bridge.assets?.importRemoteUrl ? () => bridge.assets!.importRemoteUrl!(request) : undefined,
        ),
    },
    assetRecords: {
      async list(request) {
        const capability = 'asset-records.list'
        if (!assetRecordAdapter?.list) return unsupported(capability)
        if (!(await authorizeAssetRecord('project.read', request))) return denied(capability)
        const limit = request.limit ?? 200
        const items: AssetRecordBundle[] = []
        if (request.cursor != null) {
          const state = filteredListCursors.get(request.cursor!)
          filteredListCursors.delete(request.cursor!)
          if (!state || state.organizationId !== request.organizationId || state.projectId !== request.projectId)
            return { ok: false, error: operationError(capability, 'INVALID_ARGUMENT') }
          for (const bundle of state.items) {
            if (await authorizeAssetRecord('asset.read', request, bundle.asset.id)) items.push(bundle)
          }
        } else {
          const trustedItems: AssetRecordBundle[] = []
          const seenAdapterCursors = new Set<string>()
          let adapterCursor: string | null = null
          do {
            const adapterRequest = { ...request, cursor: adapterCursor }
            const result = await invokeAssetRecord(capability, () => assetRecordAdapter.list!(adapterRequest))
            if (!result.ok) return result
            const rawPage = result.value as unknown
            if (!rawPage || typeof rawPage !== 'object' || Array.isArray(rawPage)) {
              return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
            }
            const page = rawPage as Record<string, unknown>
            if (
              Object.keys(page).some((key) => key !== 'items' && key !== 'cursor') ||
              !Array.isArray(page.items) ||
              (page.cursor !== null && typeof page.cursor !== 'string')
            )
              return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
            try {
              for (const item of page.items) {
                const bundle = parseAssetRecordBundle(item)
                if (
                  bundle.asset.scope.organizationId === request.organizationId &&
                  bundle.asset.scope.projectId === request.projectId
                )
                  trustedItems.push(bundle)
              }
            } catch {
              return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
            }
            if (trustedItems.length > 10_000) {
              return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
            }
            adapterCursor = page.cursor as string | null
            if (adapterCursor !== null) {
              if (seenAdapterCursors.has(adapterCursor)) {
                return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
              }
              seenAdapterCursors.add(adapterCursor)
            }
          } while (adapterCursor !== null)
          let trustedGraph: readonly AssetRecordBundle[]
          try {
            trustedGraph = validateAssetRecordGraph(trustedItems)
          } catch {
            return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
          }
          for (const bundle of trustedGraph) {
            if (await authorizeAssetRecord('asset.read', request, bundle.asset.id)) items.push(bundle)
          }
        }
        const pageItems = items.splice(0, limit)
        let cursor: string | null = null
        if (items.length > 0) {
          cursor = `arc_${globalThis.crypto.randomUUID()}`
          filteredListCursors.set(cursor, {
            organizationId: request.organizationId,
            projectId: request.projectId,
            items,
          })
          if (filteredListCursors.size > 256) filteredListCursors.delete(filteredListCursors.keys().next().value!)
        }
        return { ok: true, value: { items: pageItems, cursor } }
      },
      async importFile(request) {
        const capability = 'asset-records.import-file'
        if (!assetRecordAdapter?.importFile) return unsupported(capability)
        if (!(await authorizeAssetRecord('project.write', request))) return denied(capability)
        const authorizedAssetIds = new Set<AssetId>()
        const operation: AssetRecordImportOperation = Object.freeze({
          authorizeAssetWrite: async (candidate) => {
            let assetId: AssetId
            try {
              assetId = parseAssetId(candidate)
            } catch {
              return false
            }
            const allowed = await authorizeAssetRecord('asset.write', request, assetId)
            if (allowed) authorizedAssetIds.add(assetId)
            return allowed
          },
        })
        const result = await invokeAssetRecord(capability, () => assetRecordAdapter.importFile!(request, operation))
        if (!result.ok) return result
        try {
          const bundle = parseAssetRecordBundle(result.value)
          validateAssetRecordGraph([bundle])
          if (
            bundle.asset.scope.organizationId !== request.organizationId ||
            bundle.asset.scope.projectId !== request.projectId
          ) {
            return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
          }
          return hostAuthorizesGeneratedAssets || authorizedAssetIds.has(bundle.asset.id)
            ? { ok: true, value: bundle }
            : denied(capability)
        } catch {
          return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
        }
      },
      async importRemoteUrl(request) {
        const capability = 'asset-records.import-remote-url'
        if (!assetRecordAdapter?.importRemoteUrl) return unsupported(capability)
        if (!(await authorizeAssetRecord('project.write', request))) return denied(capability)
        const authorizedAssetIds = new Set<AssetId>()
        const operation: AssetRecordImportOperation = Object.freeze({
          authorizeAssetWrite: async (candidate) => {
            let assetId: AssetId
            try {
              assetId = parseAssetId(candidate)
            } catch {
              return false
            }
            const allowed = await authorizeAssetRecord('asset.write', request, assetId)
            if (allowed) authorizedAssetIds.add(assetId)
            return allowed
          },
        })
        const result = await invokeAssetRecord(capability, () =>
          assetRecordAdapter.importRemoteUrl!(request, operation),
        )
        if (!result.ok) return result
        try {
          const bundle = parseAssetRecordBundle(result.value)
          validateAssetRecordGraph([bundle])
          if (
            bundle.asset.scope.organizationId !== request.organizationId ||
            bundle.asset.scope.projectId !== request.projectId
          ) {
            return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
          }
          return hostAuthorizesGeneratedAssets || authorizedAssetIds.has(bundle.asset.id)
            ? { ok: true, value: bundle }
            : denied(capability)
        } catch {
          return { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
        }
      },
      async resolve(request) {
        const capability = 'asset-records.resolve'
        if (!assetRecordAdapter?.resolve) return unsupported(capability)
        if (!(await authorizeAssetRecord('asset.read', request, request.assetId))) return denied(capability)
        const result = await invokeAssetRecord(capability, () => assetRecordAdapter.resolve!(request))
        if (!result.ok) return result
        const resolution = resolutionForRequest(result.value, request)
        return resolution
          ? { ok: true, value: resolution }
          : { ok: false, error: operationError(capability, 'INTEGRITY_ERROR') }
      },
    },
    collaboration: {
      listProjects: () => Promise.resolve(unsupported('portal.projects.list')),
      createProject: () => Promise.resolve(unsupported('portal.projects.create')),
      saveProjectRevision: () => Promise.resolve(unsupported('portal.project-revisions.save')),
      listReviewQueue: () => Promise.resolve(unsupported('portal.review-queue.list')),
      decideApproval: () => Promise.resolve(unsupported('portal.approvals.decide')),
      appendAuditEvent: () => Promise.resolve(unsupported('portal.audit-events.append')),
    },
  }
}
