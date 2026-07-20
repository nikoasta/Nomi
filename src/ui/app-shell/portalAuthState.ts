import React from 'react'
import {
  getBrowserWebPortalClientConfig,
  readWebPortalRuntimeEnv,
  WEB_PORTAL_AUTH_CHANGE_EVENT,
  WEB_PORTAL_SESSION_STORAGE_KEY,
} from '../../platform/webPortalSession'

export type PortalAuthState = 'unconfigured' | 'anonymous' | 'authenticated'

export function readPortalAuthState(): PortalAuthState {
  if (!readWebPortalRuntimeEnv()) return 'unconfigured'
  return getBrowserWebPortalClientConfig() ? 'authenticated' : 'anonymous'
}

export function usePortalAuthState(): PortalAuthState {
  const [authState, setAuthState] = React.useState<PortalAuthState>(() => readPortalAuthState())

  React.useEffect(() => {
    const sync = () => setAuthState(readPortalAuthState())
    sync()
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === WEB_PORTAL_SESSION_STORAGE_KEY) sync()
    }
    window.addEventListener(WEB_PORTAL_AUTH_CHANGE_EVENT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(WEB_PORTAL_AUTH_CHANGE_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return authState
}
