import React from 'react'
import { IconLock, IconMessage } from '@tabler/icons-react'
import { NomiLogoMark, WorkbenchButton } from '../../design'
import { isDesktopRuntime } from '../../desktop/bridge'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'
import { useI18n } from '../../i18n/i18nContext'
import { requestWebPortalMagicLink } from '../../platform/webPortalSession'
import { cn } from '../../utils/cn'
import { usePortalAuthState } from './portalAuthState'

type PortalAuthMessageKey =
  | 'portal.auth.configMissing'
  | 'portal.auth.emailInvalid'
  | 'portal.auth.linkSent'
  | 'portal.auth.rateLimited'
  | 'portal.auth.sendError'
  | null

export function PortalAuthGate({ children }: { children: React.ReactNode }): JSX.Element {
  const { t } = useI18n()
  const authState = usePortalAuthState()
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [messageKey, setMessageKey] = React.useState<PortalAuthMessageKey>(null)

  React.useEffect(() => {
    setMessageKey((current) => {
      if (authState === 'unconfigured') return 'portal.auth.configMissing'
      return current === 'portal.auth.configMissing' ? null : current
    })
  }, [authState])

  if (isDesktopRuntime() || authState === 'authenticated') {
    return <>{children}</>
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSubmitting(true)
    setMessageKey(null)
    const result = await requestWebPortalMagicLink({ email })
    setSubmitting(false)
    if (result.ok) {
      setMessageKey('portal.auth.linkSent')
      return
    }
    if (result.error.code === 'INVALID_EMAIL') setMessageKey('portal.auth.emailInvalid')
    else if (result.error.code === 'RATE_LIMITED') setMessageKey('portal.auth.rateLimited')
    else if (result.error.code === 'UNCONFIGURED') setMessageKey('portal.auth.configMissing')
    else setMessageKey('portal.auth.sendError')
  }

  return (
    <main className="min-h-screen bg-nomi-bg text-nomi-ink font-nomi-sans">
      <div className="fixed right-5 top-5 z-10 app-no-drag">
        <LanguageSwitcher />
      </div>
      <section className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <NomiLogoMark size={40} />
          <div className="text-[28px] font-semibold leading-none tracking-normal">Nomi</div>
        </div>
        <div className="grid gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-[var(--nomi-radius-sm)] border border-workbench-border bg-workbench-surface px-3 py-1.5 text-caption text-[var(--nomi-ink-60)]">
            <IconLock size={15} stroke={1.8} />
            {t('portal.auth.gateBadge')}
          </div>
          <div className="grid gap-3">
            <h1 className="m-0 text-[34px] font-semibold leading-[1.08] tracking-normal text-[var(--nomi-ink)]">
              {t('portal.auth.gateTitle')}
            </h1>
            <p className="m-0 text-body-md leading-relaxed text-[var(--nomi-ink-60)]">
              {t('portal.auth.gateSubtitle')}
            </p>
          </div>
          <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
            <label className="grid gap-1.5 text-caption font-medium text-[var(--nomi-ink-60)]">
              <span>{t('portal.auth.emailLabel')}</span>
              <span className="relative block">
                <IconMessage
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--nomi-ink-40)]"
                  size={16}
                  stroke={1.8}
                />
                <input
                  className={cn(
                    'h-11 w-full min-w-0 rounded-[var(--nomi-radius-sm)] border border-workbench-border bg-workbench-bg pl-9 pr-3',
                    'font-inherit text-body-sm text-[var(--nomi-ink)] outline-none',
                    'focus:border-[var(--nomi-accent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--nomi-accent)_20%,transparent)]',
                  )}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  placeholder={t('portal.auth.emailPlaceholder')}
                  disabled={authState === 'unconfigured' || submitting}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
              </span>
            </label>
            {messageKey ? <p className="m-0 text-caption leading-snug text-[var(--nomi-ink-60)]">{t(messageKey)}</p> : null}
            <WorkbenchButton
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-[var(--nomi-radius-sm)] border border-transparent bg-[var(--nomi-ink)] px-4 text-body-sm font-semibold text-[var(--nomi-paper)] disabled:opacity-50"
              disabled={authState === 'unconfigured' || submitting}
            >
              {submitting ? t('portal.auth.sending') : t('portal.auth.sendLink')}
            </WorkbenchButton>
          </form>
          <p className="m-0 text-caption leading-relaxed text-[var(--nomi-ink-50)]">
            {t('portal.auth.gateFootnote')}
          </p>
        </div>
      </section>
    </main>
  )
}
