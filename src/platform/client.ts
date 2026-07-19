import { getDesktopBridge, type DesktopBridge } from '../desktop/bridge'
import type { AuthorizationCheckRequest, AuthorizationDecision, PlatformSession } from './authorization/contracts'
import type { AssetRecordCapability, PlatformAssetRecords } from './assets/contracts'
import { createBrowserPlatformClient } from './browserPlatformClient'
import type { PlatformCollaboration, PortalCapability } from './collaboration/contracts'
import { createElectronPlatformClient, type ElectronPlatformBridge } from './electronPlatformClient'
import type { OrganizationCapability, PlatformOrganizations } from './organizations/contracts'

export type PersistedAiMessage = { id: string; role: string; content: string }

export type PersistedThread = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: PersistedAiMessage[]
}

export type PersistedConversationArea = {
  activeId: string | null
  threads: PersistedThread[]
}

export type PersistedConversationsV2 = {
  v: 2
  creation: PersistedConversationArea
  generation: PersistedConversationArea
  committedProposal?: unknown
}

export type WorkbenchAssetDto = {
  id: string
  name: string
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
  userId: string
  projectId?: string | null
}

export type PlatformCapability =
  | 'identity.session.read'
  | 'authorization.check'
  | 'conversations.read'
  | 'conversations.write'
  | 'assets.list'
  | 'assets.import-file'
  | 'assets.import-remote-url'
  | AssetRecordCapability
  | PortalCapability
  | OrganizationCapability

export type PlatformErrorCode =
  | 'UNSUPPORTED_CAPABILITY'
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'IO_ERROR'
  | 'ABORTED'
  | 'INTEGRITY_ERROR'
  | 'INTERNAL'

export type PlatformError = {
  code: PlatformErrorCode
  capability: PlatformCapability
  message: string
  retryable: boolean
  details?: Readonly<Record<string, unknown>>
}

export type PlatformResult<T> = { ok: true; value: T } | { ok: false; error: PlatformError }

export type PlatformConversationValue = {
  creation: PersistedConversationArea
  generation: PersistedConversationArea
  committedProposal?: unknown
}

export type PlatformConversations = {
  read(projectId: string): Promise<PlatformResult<PersistedConversationsV2 | null>>
  write(projectId: string, value: PlatformConversationValue): Promise<PlatformResult<void>>
}

export type PlatformIdentity = {
  getSession(): Promise<PlatformResult<PlatformSession>>
}

export type PlatformAuthorization = {
  check(request: AuthorizationCheckRequest): Promise<PlatformResult<AuthorizationDecision>>
}

export type PlatformAssetListRequest = {
  projectId: string
  cursor?: string | null
  limit?: number
  kind?: string
}

export type PlatformAssetImportFileRequest = {
  projectId: string
  fileName: string
  contentType?: string
  bytes: ArrayBuffer
  kind?: string
}

export type PlatformAssetImportRemoteUrlRequest = {
  projectId: string
  url: string
  kind?: string
  fileName?: string
  ownerNodeId?: string | null
}

export type PlatformAssets = {
  list(request: PlatformAssetListRequest): Promise<
    PlatformResult<{
      items: WorkbenchAssetDto[]
      cursor: string | null
    }>
  >
  importFile(request: PlatformAssetImportFileRequest): Promise<PlatformResult<WorkbenchAssetDto>>
  importRemoteUrl(request: PlatformAssetImportRemoteUrlRequest): Promise<PlatformResult<WorkbenchAssetDto>>
}

export type PlatformClient = {
  readonly capabilities: ReadonlySet<PlatformCapability>
  supports(capability: PlatformCapability): boolean
  readonly identity: PlatformIdentity
  readonly authorization: PlatformAuthorization
  readonly conversations: PlatformConversations
  readonly assets: PlatformAssets
  readonly assetRecords: PlatformAssetRecords
  readonly collaboration: PlatformCollaboration
  readonly organizations: PlatformOrganizations
}

export function adaptDesktopBridge(bridge: DesktopBridge): ElectronPlatformBridge {
  const conversations = bridge.conversations
  const assets = bridge.assets
  const platformAssets = bridge.platformAssets
  return {
    conversations: conversations
      ? {
          read: ({ projectId }) => conversations.read(projectId),
          write: ({ projectId, creation, generation, committedProposal }) =>
            conversations.write(projectId, {
              creation,
              generation,
              committedProposal,
            }),
        }
      : undefined,
    assets: assets
      ? {
          list: (request) => assets.list(request),
          importFile: (request) => assets.importFile(request),
          importRemoteUrl: (request) => assets.importRemoteUrl(request),
        }
      : undefined,
    assetRecords: platformAssets
      ? {
          list: (request) => platformAssets.list(request),
          importFile: (request) => platformAssets.importFile(request),
          importRemoteUrl: (request) => platformAssets.importRemoteUrl(request),
          resolve: (request) => platformAssets.resolve(request),
        }
      : undefined,
  }
}

let cachedBridge: DesktopBridge | null | undefined
let cachedClient: PlatformClient | undefined

export function getPlatformClient(): PlatformClient {
  const bridge = getDesktopBridge()
  if (cachedClient && cachedBridge === bridge) return cachedClient

  cachedBridge = bridge
  cachedClient = bridge ? createElectronPlatformClient(adaptDesktopBridge(bridge)) : createBrowserPlatformClient()
  return cachedClient
}
