import React from 'react'
import { DEFAULT_LOCALE, isSupportedLocale, translate, type SupportedLocale } from '../i18n/translations'

type Props = { children: React.ReactNode }
type State = { error: Error | null; info: string }
type DesktopReloadBridge = { nomiDesktop?: { app?: { hardReloadWindow?: () => void } } }

function reloadRendererWindow(): void {
  try {
    const hardReloadWindow = (window as unknown as DesktopReloadBridge).nomiDesktop?.app?.hardReloadWindow
    if (hardReloadWindow) {
      hardReloadWindow()
      return
    }
  } catch {
    /* fall back to browser reload */
  }
  window.location.reload()
}

function readErrorBoundaryLocale(): SupportedLocale {
  try {
    const stored = window.localStorage.getItem('nomi.interface-language')
    if (isSupportedLocale(stored)) return stored
  } catch {
    /* best effort */
  }
  return DEFAULT_LOCALE
}

/**
 * 根 ErrorBoundary（多维审计 P0-8）：渲染层任意抛错时，给可读兜底 + 可复制错误，
 * 而不是整屏白让用户/维护者盲修。错误同时打到主进程崩溃日志（若桥可用）。
 */
export class RootErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: '' }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const detail = info.componentStack || ''
    this.setState({ info: detail })
    // 落到主进程崩溃日志（contextBridge 暴露的话）；否则至少 console。
    try {
      ;(window as unknown as { nomiDesktop?: { logRendererCrash?: (m: string) => void } }).nomiDesktop?.logRendererCrash?.(
        `${error.name}: ${error.message}\n${error.stack || ''}\n--- componentStack ---${detail}`,
      )
    } catch {
      /* ignore */
    }
    console.error('[nomi] renderer crashed:', error, detail)
  }

  private handleCopy = (): void => {
    const { error, info } = this.state
    const text = `${error?.name}: ${error?.message}\n${error?.stack || ''}\n--- componentStack ---${info}`
    void navigator.clipboard?.writeText(text).catch(() => undefined)
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    const locale = readErrorBoundaryLocale()
    const t = (key: Parameters<typeof translate>[1]): string => translate(locale, key)
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-nomi-bg p-8 text-nomi-ink">
        <div className="max-w-lg rounded-nomi border border-nomi-line bg-white p-6 shadow-nomi-md">
          <h1 className="text-title font-nomi-display">{t('errorBoundary.title')}</h1>
          <p className="mt-2 text-body text-nomi-ink-soft">
            {t('errorBoundary.message')}
          </p>
          <pre className="mt-3 max-h-40 overflow-auto rounded-nomi bg-nomi-bg p-3 text-caption text-nomi-ink-soft">
            {error.name}: {error.message}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="rounded-nomi bg-nomi-ink px-3 py-1.5 text-body-sm text-white"
              onClick={reloadRendererWindow}
            >
              {t('errorBoundary.reload')}
            </button>
            <button
              type="button"
              className="rounded-nomi border border-nomi-line px-3 py-1.5 text-body-sm"
              onClick={this.handleCopy}
            >
              {t('errorBoundary.copy')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
