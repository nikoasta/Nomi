import React from 'react'
import { IconLockOpen, IconUser, IconUserCheck } from '@tabler/icons-react'
import { WorkbenchButton } from '../../design'
import { isDesktopRuntime } from '../../desktop/bridge'
import { useI18n } from '../../i18n/i18nContext'
import { cn } from '../../utils/cn'
import {
  clearWebPortalSession,
  requestWebPortalMagicLink,
} from '../../platform/webPortalSession'
import { usePortalAuthState } from './portalAuthState'

export function PortalAuthControl(): JSX.Element | null {
  const { t } = useI18n()
  const authState = usePortalAuthState()
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [messageKey, setMessageKey] = React.useState<
    | 'portal.auth.configMissing'
    | 'portal.auth.emailInvalid'
    | 'portal.auth.linkSent'
    | 'portal.auth.rateLimited'
    | 'portal.auth.sendError'
    | null
  >(authState === 'unconfigured' ? 'portal.auth.configMissing' : null)

  React.useEffect(() => {
    setMessageKey((current) => {
      if (authState === 'unconfigured') return 'portal.auth.configMissing'
      return current === 'portal.auth.configMissing' ? null : current
    })
  }, [authState])

  if (isDesktopRuntime()) return null

  const signedIn = authState === 'authenticated'

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
    <div className="relative app-no-drag">
      <WorkbenchButton
        type="button"
        className={cn(
          'inline-flex h-[30px] items-center gap-1.5 rounded-[var(--nomi-radius-sm)] border px-2.5',
          'bg-workbench-bg font-inherit text-body-sm transition-[background,color,border-color]',
          signedIn
            ? 'border-[color-mix(in_oklch,var(--nomi-accent)_30%,var(--workbench-border))] text-[var(--nomi-accent)]'
            : 'border-workbench-border text-[var(--nomi-ink-80)] hover:bg-[var(--nomi-ink-05)] hover:text-[var(--nomi-ink)]',
          'max-[1400px]:w-[30px] max-[1400px]:justify-center max-[1400px]:p-0',
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={signedIn ? t('portal.auth.connected') : t('portal.auth.signIn')}
        title={signedIn ? t('portal.auth.connected') : t('portal.auth.signIn')}
        onClick={() => setOpen((value) => !value)}
      >
        {signedIn ? <IconUserCheck size={15} stroke={1.8} /> : <IconUser size={15} stroke={1.8} />}
        <span className={cn('nomi-appbar__action-text', 'max-[1400px]:hidden')}>
          {signedIn ? t('portal.auth.connectedShort') : t('portal.auth.portal')}
        </span>
      </WorkbenchButton>

      {open ? (
        <div
          className={cn(
            'absolute right-0 top-[calc(100%+8px)] z-[260] w-[min(320px,calc(100vw-24px))]',
            'rounded-[var(--nomi-radius-sm)] border border-workbench-border bg-workbench-surface p-3 shadow-nomi-lg',
          )}
          role="dialog"
          aria-label={t('portal.auth.dialog')}
        >
          {signedIn ? (
            <div className="grid gap-2">
              <div className="text-body-sm font-semibold text-[var(--nomi-ink)]">{t('portal.auth.connected')}</div>
              <p className="m-0 text-caption leading-snug text-[var(--nomi-ink-60)]">{t('portal.auth.connectedBody')}</p>
              <WorkbenchButton
                type="button"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--nomi-radius-sm)] border border-workbench-border bg-workbench-bg px-2.5 text-body-sm text-[var(--nomi-ink-80)]"
                onClick={() => {
                  clearWebPortalSession()
                  setMessageKey(null)
                }}
              >
                <IconLockOpen size={15} stroke={1.8} />
                {t('portal.auth.signOut')}
              </WorkbenchButton>
            </div>
          ) : (
            <form className="grid gap-2" onSubmit={(event) => void submit(event)}>
              <label className="grid gap-1 text-caption text-[var(--nomi-ink-60)]">
                <span>{t('portal.auth.emailLabel')}</span>
                <input
                  className={cn(
                    'h-9 min-w-0 rounded-[var(--nomi-radius-sm)] border border-workbench-border bg-workbench-bg px-2.5',
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
              </label>
              {messageKey ? <p className="m-0 text-caption leading-snug text-[var(--nomi-ink-60)]">{t(messageKey)}</p> : null}
              <WorkbenchButton
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-[var(--nomi-radius-sm)] border border-transparent bg-[var(--nomi-ink)] px-2.5 text-body-sm text-[var(--nomi-paper)] disabled:opacity-50"
                disabled={authState === 'unconfigured' || submitting}
              >
                {submitting ? t('portal.auth.sending') : t('portal.auth.sendLink')}
              </WorkbenchButton>
            </form>
          )}
        </div>
      ) : null}
    </div>
  )
}
