import {
  AUTHORIZATION_PERMISSIONS,
  type AuthorizationPolicyRequest,
  type OrganizationMembership,
  type PlatformSession,
  type ProjectPermission,
} from './authorization/contracts'
import { evaluateAuthorization } from './authorization/policy'
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
}

const CAPABILITY_ORDER: readonly PlatformCapability[] = [
  'identity.session.read',
  'authorization.check',
  'conversations.read',
  'conversations.write',
  'assets.list',
  'assets.import-file',
  'assets.import-remote-url',
]

const LOCAL_PRINCIPAL_ID = 'local-runtime:principal'
const LOCAL_ORGANIZATION_ID = 'local-runtime:organization'
const LOCAL_PROJECT_PERMISSIONS = AUTHORIZATION_PERMISSIONS.filter(
  (permission): permission is ProjectPermission => permission !== 'organization.admin',
)

type LocalPlatformSession = Extract<PlatformSession, { state: 'authenticated' }> & {
  activeMembership: OrganizationMembership
}

function createLocalSession(): LocalPlatformSession {
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

export function createElectronPlatformClient(bridge: ElectronPlatformBridge): PlatformClient {
  const available = new Set<PlatformCapability>(['identity.session.read', 'authorization.check'])
  if (bridge.conversations?.read) available.add('conversations.read')
  if (bridge.conversations?.write) available.add('conversations.write')
  if (bridge.assets?.list) available.add('assets.list')
  if (bridge.assets?.importFile) available.add('assets.import-file')
  if (bridge.assets?.importRemoteUrl) available.add('assets.import-remote-url')

  const capabilities = new Set(CAPABILITY_ORDER.filter((capability) => available.has(capability)))

  return {
    capabilities,
    supports: (capability) => capabilities.has(capability),
    identity: {
      getSession: () => Promise.resolve({ ok: true, value: createLocalSession() }),
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
  }
}
