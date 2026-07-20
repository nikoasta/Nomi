import React from 'react'
import {
  readWebPortalRuntimeEnv,
  requestWebPortalTelegramLogin,
  type WebPortalTelegramAuthPayload,
  type WebPortalTelegramAuthRequestResult,
} from '../../platform/webPortalSession'

type PortalTelegramLoginProps = {
  disabled?: boolean
  onStart?: () => void
  onFinish?: (result: WebPortalTelegramAuthRequestResult) => void
}

export function PortalTelegramLogin({ disabled = false, onStart, onFinish }: PortalTelegramLoginProps): JSX.Element | null {
  const env = readWebPortalRuntimeEnv()
  const botUsername = env?.telegramBotUsername
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || !botUsername || disabled) return

    const iframe = document.createElement('iframe')
    const widgetOrigin = 'https://oauth.telegram.org'
    const src = new URL(`/embed/${botUsername}`, widgetOrigin)
    src.searchParams.set('origin', window.location.origin)
    src.searchParams.set('return_to', window.location.href)
    src.searchParams.set('size', 'large')
    src.searchParams.set('userpic', 'true')
    src.searchParams.set('request_access', 'write')
    src.searchParams.set('radius', '8')
    iframe.src = src.toString()
    iframe.width = '238'
    iframe.height = '40'
    iframe.title = 'Telegram'
    iframe.setAttribute('frameborder', '0')
    iframe.setAttribute('scrolling', 'no')
    iframe.style.overflow = 'hidden'
    iframe.style.backgroundColor = 'transparent'
    iframe.style.border = 'none'

    function postToIframe(event: string, data: Record<string, unknown> = {}): void {
      try {
        iframe.contentWindow?.postMessage(JSON.stringify({ ...data, event }), '*')
      } catch {
        /* Telegram iframe coordination is best effort */
      }
    }

    function handleMessage(event: MessageEvent): void {
      if (event.source !== iframe.contentWindow || event.origin !== widgetOrigin) return
      let data: { event?: unknown; auth_data?: unknown; height?: unknown; width?: unknown; _cb?: unknown }
      try {
        data = JSON.parse(String(event.data))
      } catch {
        return
      }
      if (data.event === 'resize') {
        if (typeof data.height === 'number') iframe.height = String(data.height)
        if (typeof data.width === 'number') iframe.width = String(data.width)
        return
      }
      if (data.event === 'ready') {
        postToIframe('focus', { has_focus: document.hasFocus() })
        return
      }
      if (data.event === 'get_coords') {
        const rect = iframe.getBoundingClientRect()
        postToIframe('callback', {
          _cb: data._cb,
          value: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            visible: true,
          },
        })
        return
      }
      if (data.event === 'auth_user' && data.auth_data && typeof data.auth_data === 'object') {
        onStart?.()
        void requestWebPortalTelegramLogin({ authData: data.auth_data as WebPortalTelegramAuthPayload }).then((result) => {
          onFinish?.(result)
        })
      }
    }

    window.addEventListener('message', handleMessage)
    container.replaceChildren(iframe)

    return () => {
      window.removeEventListener('message', handleMessage)
      container.replaceChildren()
    }
  }, [botUsername, disabled, onFinish, onStart])

  if (!botUsername) return null
  return <div ref={containerRef} className="min-h-10" aria-disabled={disabled} />
}
