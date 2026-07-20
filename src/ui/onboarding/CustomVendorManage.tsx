/**
 * 自定义 / 中转站供应商的「接入管理」区（改地址 / 换 key / 断开 / 删除整个供应商）。
 * 用户反馈（2026-07-04）：自定义接入的供应商卡此前只能删单个模型，没法改 BaseURL、换 key、
 * 也没法整家删掉没用的 API。后端接口（upsertVendor / upsertVendorApiKey / clearVendorApiKey /
 * deleteVendor）本就现成，只是没在这张卡上露出来——本组件把它们补齐。
 *
 * 视觉与内置家卡（VendorOnboardCard）的凭证/地址编辑块一致；区别：自定义家凭证恒为单个 apiKey、
 * 地址恒可改、且可**整家删除**（内置家是 seed 的、只断 key 不删）。共用同一套 bridge 调用（P1）。
 */
import React from 'react'
import { IconKey, IconPencil, IconTrash } from '@tabler/icons-react'
import { cn } from '../../utils/cn'
import { getDesktopBridge } from '../../desktop/bridge'
import { confirmDialog } from '../../design'
import { confirmAndDeleteVendor } from './vendorDeleteAction'
import { useI18n } from '../../i18n/i18nContext'

type CustomVendorManageProps = {
  vendorKey: string
  vendorName: string
  baseUrl: string
  hasApiKey: boolean
  modelCount: number
  /** 变更后刷新外层目录。 */
  onChanged: () => void
}

export function CustomVendorManage({
  vendorKey,
  vendorName,
  baseUrl,
  hasApiKey,
  modelCount,
  onChanged,
}: CustomVendorManageProps): JSX.Element {
  const { t } = useI18n()
  const [keyEditing, setKeyEditing] = React.useState(!hasApiKey)
  const [keyDraft, setKeyDraft] = React.useState('')
  const [urlEditing, setUrlEditing] = React.useState(false)
  const [urlDraft, setUrlDraft] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => { setKeyEditing(!hasApiKey) }, [hasApiKey])

  const handleSaveKey = React.useCallback(() => {
    const apiKey = keyDraft.trim()
    if (!apiKey) { setError(t('vendorCard.missingApiKey')); return }
    const bridge = getDesktopBridge()
    if (!bridge) return
    setBusy(true); setError('')
    try {
      bridge.modelCatalog.upsertVendorApiKey(vendorKey, { apiKey, enabled: true })
      setKeyDraft(''); setKeyEditing(false); onChanged()
    } catch (e) {
      setError(t('vendorCard.saveFailed', { message: e instanceof Error ? e.message : String(e) }))
    } finally { setBusy(false) }
  }, [keyDraft, onChanged, t, vendorKey])

  const handleDisconnect = React.useCallback(async () => {
    const bridge = getDesktopBridge()
    if (!bridge) return
    const ok = await confirmDialog({
      title: t('vendorCard.disconnectTitle'),
      message: t('vendorCard.disconnectMessage', { name: vendorName }),
      confirmLabel: t('vendorCard.disconnect'),
      danger: true,
    })
    if (!ok) return
    setBusy(true); setError('')
    try {
      bridge.modelCatalog.clearVendorApiKey(vendorKey); onChanged()
    } catch (e) {
      setError(t('vendorCard.disconnectFailed', { message: e instanceof Error ? e.message : String(e) }))
    } finally { setBusy(false) }
  }, [onChanged, t, vendorKey, vendorName])

  const handleSaveBaseUrl = React.useCallback(() => {
    const next = urlDraft.trim().replace(/\/+$/, '')
    if (!/^https?:\/\/\S+$/.test(next)) { setError(t('vendorCard.invalidBaseUrl')); return }
    const bridge = getDesktopBridge()
    if (!bridge) return
    setBusy(true); setError('')
    try {
      bridge.modelCatalog.upsertVendor({ key: vendorKey, baseUrlHint: next })
      setUrlEditing(false); onChanged()
    } catch (e) {
      setError(t('vendorCard.saveFailed', { message: e instanceof Error ? e.message : String(e) }))
    } finally { setBusy(false) }
  }, [onChanged, t, urlDraft, vendorKey])

  const handleDeleteVendor = React.useCallback(async () => {
    setBusy(true); setError('')
    const res = await confirmAndDeleteVendor({ vendorKey, vendorName, modelCount, onChanged })
    if (res.error) setError(res.error)
    setBusy(false)
  }, [vendorKey, vendorName, modelCount, onChanged])

  return (
    <div className="flex flex-col gap-2.5 border-t border-nomi-line-soft pt-3">
      {/* 凭证：已存→更换/断开；未存/更换中→输入框 */}
      {keyEditing ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="password"
              aria-label={`${vendorName} API Key`}
              placeholder={t('vendorCard.defaultCredentialPlaceholder')}
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveKey() }}
              disabled={busy}
              className={cn(
                'flex-1 min-w-0 h-8 rounded-nomi-sm border border-nomi-line bg-nomi-paper px-2.5',
                'text-body-sm text-nomi-ink placeholder:text-nomi-ink-40 outline-none focus:border-nomi-accent',
              )}
            />
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={busy}
              className={cn(
                'shrink-0 h-8 px-3 rounded-nomi-sm bg-nomi-ink text-nomi-paper text-body-sm font-semibold',
                'inline-flex items-center gap-1.5 hover:bg-nomi-accent disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              <IconKey size={14} stroke={1.6} />{t('vendorCard.save')}
            </button>
          </div>
          {hasApiKey ? (
            <button type="button" onClick={() => setKeyEditing(false)} disabled={busy} className="self-start text-caption text-nomi-ink-40 hover:text-nomi-ink-60">{t('vendorCard.cancel')}</button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-nomi-ink-60">{t('vendorCard.credentialSaved')}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => setKeyEditing(true)} disabled={busy} className="text-caption text-nomi-ink-60 border border-nomi-line rounded-full px-2.5 py-[3px] hover:border-nomi-ink-20">{t('vendorCard.change')}</button>
            <button type="button" onClick={handleDisconnect} disabled={busy} className="text-caption text-nomi-ink-40 px-1 hover:text-workbench-danger">{t('vendorCard.disconnect')}</button>
          </div>
        </div>
      )}

      {/* 接入地址（可就地改——StepFun 那类填错地址的根因入口）*/}
      {urlEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            aria-label={t('vendorCard.editBaseUrl', { name: vendorName })}
            placeholder="https://…"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBaseUrl(); if (e.key === 'Escape') { setUrlEditing(false); setError('') } }}
            disabled={busy}
            autoFocus
            className={cn(
              'flex-1 min-w-0 h-8 rounded-nomi-sm border border-nomi-line bg-nomi-paper px-2.5',
              'text-body-sm text-nomi-ink placeholder:text-nomi-ink-40 outline-none focus:border-nomi-accent',
            )}
          />
          <button type="button" onClick={handleSaveBaseUrl} disabled={busy} className="shrink-0 h-8 px-3 rounded-nomi-sm bg-nomi-ink text-nomi-paper text-body-sm font-semibold hover:bg-nomi-accent disabled:opacity-50">{t('vendorCard.save')}</button>
          <button type="button" onClick={() => { setUrlEditing(false); setError('') }} disabled={busy} className="shrink-0 text-caption text-nomi-ink-40 hover:text-nomi-ink-60">{t('vendorCard.cancel')}</button>
        </div>
      ) : (
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-caption text-nomi-ink-30 truncate">{baseUrl ? t('vendorCard.baseUrl', { baseUrl }) : t('vendorCard.baseUrlUnset')}</span>
          <button type="button" aria-label={t('vendorCard.editBaseUrl', { name: vendorName })} onClick={() => { setUrlDraft(baseUrl); setUrlEditing(true) }} disabled={busy} className="shrink-0 p-0.5 text-nomi-ink-30 hover:text-nomi-ink-60">
            <IconPencil size={13} stroke={1.6} />
          </button>
        </div>
      )}

      {error ? <div className="text-caption text-workbench-danger">{error}</div> : null}

      {/* 删除整个供应商（用户主诉：没用的 API 一键删掉）*/}
      <button
        type="button"
        onClick={handleDeleteVendor}
        disabled={busy}
        className={cn(
          'self-start inline-flex items-center gap-1.5 h-8 px-2.5 rounded-nomi-sm',
          'text-caption text-workbench-danger border border-[var(--workbench-danger-soft)]',
          'hover:bg-[var(--workbench-danger-soft)] disabled:opacity-50',
        )}
      >
        <IconTrash size={14} stroke={1.7} />{t('vendorCard.deleteVendor')}
      </button>
    </div>
  )
}
