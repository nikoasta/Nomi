import type {
  BillingModelKind,
  ModelCatalogHealthDto,
} from '../workbench/api/modelCatalogApi'
import type { ModelOption, NodeKind } from './models'
import { runtimeT } from '../i18n/runtimeTranslate'

export function resolveCatalogKind(kind?: NodeKind): BillingModelKind {
  if (kind === 'image' || kind === 'imageEdit') {
    return 'image'
  }
  if (kind === 'video') {
    return 'video'
  }
  if (kind === 'audio') {
    return 'audio'
  }
  return 'text'
}

export function normalizeCatalogLoadError(caught: unknown): Error {
  if (caught instanceof Error) {
    const message = caught.message.trim()
    if (
      caught instanceof TypeError ||
      /failed to fetch|networkerror|load failed|fetch failed/i.test(message)
    ) {
      return new Error(runtimeT('modelCatalog.localUnavailable'))
    }
    return caught
  }
  return new Error(runtimeT('modelCatalog.loadFailed'))
}

export type ModelCatalogStatus =
  | 'loading'
  | 'api_unreachable'
  | 'catalog_empty'
  | 'kind_empty'
  | 'incomplete'
  | 'ready'

export function deriveModelCatalogStatus(input: {
  kind?: NodeKind
  options: readonly ModelOption[]
  health: ModelCatalogHealthDto | null
  error: Error | null
  healthError?: Error | null
  loading: boolean
}): { status: ModelCatalogStatus; message: string } {
  if (input.loading) {
    return { status: 'loading', message: runtimeT('modelCatalog.loading') }
  }
  if (input.error) {
    return { status: 'api_unreachable', message: runtimeT('modelCatalog.loadFailedWithMessage', { message: input.error.message }) }
  }
  if (input.healthError) {
    return { status: 'api_unreachable', message: runtimeT('modelCatalog.healthFailedWithMessage', { message: input.healthError.message }) }
  }
  const catalogKind = resolveCatalogKind(input.kind)
  const health = input.health
  if (health?.issues.some((issue) => issue.code === 'catalog_empty' && issue.severity === 'error')) {
    return { status: 'catalog_empty', message: runtimeT('modelCatalog.empty') }
  }
  const kindSummary = health?.byKind.find((item) => item.kind === catalogKind)
  if (kindSummary && kindSummary.enabledModels === 0) {
    const label = catalogKind === 'image' ? runtimeT('modelCatalog.kind.image') : catalogKind === 'video' ? runtimeT('modelCatalog.kind.video') : runtimeT('modelCatalog.kind.text')
    return { status: 'kind_empty', message: runtimeT('modelCatalog.noKindModels', { kind: label }) }
  }
  if (
    health?.issues.some((issue) =>
      issue.severity === 'error' &&
      (issue.kind === catalogKind || typeof issue.kind === 'undefined')
    )
  ) {
    return { status: 'incomplete', message: runtimeT('modelCatalog.incomplete') }
  }
  if (input.options.length === 0) {
    const label = catalogKind === 'image' ? runtimeT('modelCatalog.kind.image') : catalogKind === 'video' ? runtimeT('modelCatalog.kind.video') : runtimeT('modelCatalog.kind.text')
    return { status: 'kind_empty', message: runtimeT('modelCatalog.noKindModels', { kind: label }) }
  }
  return { status: 'ready', message: runtimeT('modelCatalog.ready') }
}
