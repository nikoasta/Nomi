import React from 'react'
import { IconCircleCheck, IconDownload, IconExternalLink, IconRefresh, IconSparkles, IconUserCheck } from '@tabler/icons-react'
import { cn } from '../../utils/cn'
import { getDesktopBridge } from '../../desktop/bridge'
import { toast } from '../toast'
import { FoldableModelCard } from './FoldableModelCard'
import { useI18n } from '../../i18n/i18nContext'
import { onboardingTranslate } from './onboardingI18n'

export const HIGGSFIELD_VENDOR_KEY = 'higgsfield-cli'

export type HiggsfieldStatus = {
  installed: boolean
  loggedIn: boolean
  version: string
  latestVersion: string
  planType: string
  credits: number | null
  workspaceName: string
  modelCount: number
  workflowCount: number
  voiceCount: number
  error: string
}

type HiggsfieldCliCardProps = {
  status: HiggsfieldStatus | null
  onChanged: () => void
}

export function HiggsfieldCliCard({ status, onChanged }: HiggsfieldCliCardProps): JSX.Element | null {
  const { locale } = useI18n()
  const tt = React.useCallback((key: Parameters<typeof onboardingTranslate>[1], params?: Record<string, string | number>) => onboardingTranslate(locale, key, params), [locale])
  const higgsfield = getDesktopBridge()?.higgsfield
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  if (!higgsfield || !status) return null

  const handleInstall = async () => {
    setBusy(true); setError('')
    try {
      const r = await higgsfield.install()
      if (r.ok) { toast(tt('higgsfield.installToast'), 'success'); onChanged() }
      else setError(r.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const handleLogin = async () => {
    setBusy(true); setError('')
    try {
      const r = await higgsfield.login()
      if (r.ok) { toast(tt('higgsfield.loginToast'), 'success'); onChanged() }
      else setError(r.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const handleSync = async () => {
    setBusy(true); setError('')
    try {
      const r = await higgsfield.syncCatalog()
      if (r.ok) { toast(tt('higgsfield.syncToast', { count: r.models }), 'success'); onChanged() }
      else setError(r.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const cardStatus: 'ok' | 'todo' = status.installed && status.loggedIn ? 'ok' : 'todo'
  const statusLabel = !status.installed ? tt('higgsfield.notInstalled') : !status.loggedIn ? tt('higgsfield.loginPending') : tt('higgsfield.connected')

  return (
    <FoldableModelCard
      glyph={<IconSparkles size={16} stroke={1.7} />}
      glyphTone="ink"
      name={tt('higgsfield.name')}
      subtitle={tt('higgsfield.subtitle')}
      status={cardStatus}
      statusLabel={statusLabel}
      defaultExpanded={false}
    >
      {!status.installed ? (
        <>
          <div className="text-caption text-nomi-ink-60 leading-relaxed">{tt('higgsfield.installDescription')}</div>
          <button
            type="button"
            onClick={handleInstall}
            disabled={busy}
            className={cn('w-full h-9 rounded-nomi-sm bg-nomi-ink text-nomi-paper text-body-sm font-semibold',
              'inline-flex items-center justify-center gap-1.5 hover:bg-nomi-accent disabled:opacity-50')}
          >
            <IconDownload size={15} stroke={1.8} />{busy ? tt('higgsfield.installing') : tt('higgsfield.installCli')}
          </button>
          <button
            type="button"
            onClick={() => window.open('https://higgsfield.ai/cli', '_blank', 'noopener')}
            className="self-start text-caption text-nomi-ink-40 hover:text-nomi-accent inline-flex items-center gap-1"
          >
            {tt('higgsfield.openDocs')}<IconExternalLink size={13} stroke={1.6} />
          </button>
        </>
      ) : !status.loggedIn ? (
        <>
          <div className="text-caption text-nomi-ink-60 leading-relaxed">{tt('higgsfield.loginDescription')}</div>
          {status.version ? <div className="text-micro text-nomi-ink-40">{tt('higgsfield.version', { version: status.version })}</div> : null}
          <button
            type="button"
            onClick={handleLogin}
            disabled={busy}
            className={cn('w-full h-9 rounded-nomi-sm bg-nomi-ink text-nomi-paper text-body-sm font-semibold',
              'inline-flex items-center justify-center gap-1.5 hover:bg-nomi-accent disabled:opacity-50')}
          >
            <IconUserCheck size={15} stroke={1.8} />{busy ? tt('higgsfield.starting') : tt('higgsfield.signIn')}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-nomi-sm bg-[var(--workbench-success-soft)] px-3 py-2.5">
            <IconCircleCheck size={17} className="shrink-0 mt-0.5 text-workbench-success" />
            <div className="min-w-0">
              <div className="text-body-sm font-semibold text-nomi-ink">
                {tt('higgsfield.connectedTitle')}
                {status.credits != null ? <span className="text-nomi-ink-60 font-normal"> · {tt('higgsfield.credits', { count: Math.round(status.credits * 100) / 100 })}</span> : null}
              </div>
              <div className="text-caption text-nomi-ink-60 mt-0.5">
                {tt('higgsfield.catalogSummary', { models: status.modelCount, workflows: status.workflowCount, voices: status.voiceCount })}
              </div>
              {status.planType ? <div className="text-micro text-nomi-ink-40 mt-0.5">{tt('higgsfield.plan', { plan: status.planType })}</div> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={busy}
            className={cn('w-full h-9 rounded-nomi-sm border border-nomi-line text-body-sm text-nomi-ink font-semibold',
              'inline-flex items-center justify-center gap-1.5 hover:border-nomi-accent hover:text-nomi-accent disabled:opacity-50')}
          >
            <IconRefresh size={15} stroke={1.8} />{busy ? tt('higgsfield.syncing') : tt('higgsfield.syncCatalog')}
          </button>
          <div className="text-micro text-nomi-ink-40 leading-relaxed">{tt('higgsfield.catalogOnly')}</div>
        </>
      )}

      {error ? <div className="text-caption text-workbench-danger">{error}</div> : null}
    </FoldableModelCard>
  )
}
