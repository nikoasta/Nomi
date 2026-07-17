import { getDesktopActiveProjectId } from '../../desktop/activeProject'
import {
  getPlatformClient,
  type PlatformError,
  type PlatformResult,
  type WorkbenchAssetDto,
} from '../../platform/client'
import type { TaskKind } from './taskApi'

export type { WorkbenchAssetDto } from '../../platform/client'

/** 从落盘资产 DTO 取可持久化 URL（nomi-local://）；无则空串。单一实现，别在各 adapter 各抄一份（P1）。 */
export function hostedAssetUrl(asset: WorkbenchAssetDto | null | undefined): string {
  return typeof asset?.data?.url === 'string' ? asset.data.url.trim() : ''
}

export type UploadWorkbenchAssetMeta = {
  prompt?: string | null
  vendor?: string | null
  modelKey?: string | null
  taskKind?: TaskKind | string | null
  projectId?: string | null
  ownerNodeId?: string | null
}

export class PlatformOperationError extends Error {
  readonly code: PlatformError['code']
  readonly capability: PlatformError['capability']
  readonly retryable: boolean
  readonly details?: Readonly<Record<string, unknown>>

  constructor(error: PlatformError, fallbackMessage?: string) {
    super(fallbackMessage || error.message)
    this.name = 'PlatformOperationError'
    this.code = error.code
    this.capability = error.capability
    this.retryable = error.retryable
    this.details = error.details
  }
}

function unwrapPlatformResult<T>(result: PlatformResult<T>, feature: string): T {
  if (result.ok) return result.value
  const fallbackMessage =
    result.error.code === 'UNSUPPORTED_CAPABILITY' ? `${feature} requires the Electron desktop runtime` : undefined
  throw new PlatformOperationError(result.error, fallbackMessage)
}

function resolveProjectId(meta?: UploadWorkbenchAssetMeta): string {
  const projectId = (meta?.projectId || getDesktopActiveProjectId() || '').trim()
  if (!projectId) throw new Error('projectId is required for local asset import')
  return projectId
}

export function buildWorkbenchAssetImportRequestKey(
  file: File,
  name?: string,
  meta?: UploadWorkbenchAssetMeta,
): string {
  const fileName = typeof file.name === 'string' ? file.name.trim() : ''
  const fileSize = typeof file.size === 'number' && Number.isFinite(file.size) ? String(file.size) : ''
  const lastModified =
    typeof file.lastModified === 'number' && Number.isFinite(file.lastModified) ? String(file.lastModified) : ''
  const fileType = typeof file.type === 'string' ? file.type.trim().toLowerCase() : ''
  const uploadName = typeof name === 'string' ? name.trim() : ''
  const projectId = typeof meta?.projectId === 'string' ? meta.projectId.trim() : ''
  const ownerNodeId = typeof meta?.ownerNodeId === 'string' ? meta.ownerNodeId.trim() : ''
  return [fileName, fileSize, lastModified, fileType, uploadName, projectId, ownerNodeId].join('|')
}

export async function listWorkbenchLocalAssets(): Promise<{ items: WorkbenchAssetDto[]; cursor: string | null }> {
  const projectId = getDesktopActiveProjectId()
  if (!projectId) return { items: [], cursor: null }
  const client = getPlatformClient()
  const result = await client.assets.list({ projectId, limit: 200 })
  return unwrapPlatformResult<{ items: WorkbenchAssetDto[]; cursor: string | null }>(result, 'local asset list')
}

export async function importWorkbenchLocalAssetFile(
  file: File,
  name?: string,
  meta?: UploadWorkbenchAssetMeta,
): Promise<WorkbenchAssetDto> {
  const client = getPlatformClient()
  const arrayBuffer = await file.arrayBuffer()
  const result = await client.assets.importFile({
    projectId: resolveProjectId(meta),
    fileName: name || file.name || 'asset',
    contentType: file.type || 'application/octet-stream',
    bytes: arrayBuffer,
    kind: 'upload',
  })
  return unwrapPlatformResult<WorkbenchAssetDto>(result, 'local asset import')
}

export async function importWorkbenchRemoteAssetUrl(
  url: string,
  name?: string,
  meta?: UploadWorkbenchAssetMeta,
): Promise<WorkbenchAssetDto> {
  const client = getPlatformClient()
  const result = await client.assets.importRemoteUrl({
    projectId: resolveProjectId(meta),
    url,
    kind: 'upload',
    fileName: name,
    ownerNodeId: meta?.ownerNodeId || null,
  })
  return unwrapPlatformResult<WorkbenchAssetDto>(result, 'remote asset import')
}

export async function recoverImportedWorkbenchLocalAssetFile(_file: File): Promise<WorkbenchAssetDto | null> {
  return null
}
