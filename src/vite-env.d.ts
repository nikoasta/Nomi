interface ImportMetaEnv {
  readonly VITE_PORTAL_API_BASE?: string
  readonly VITE_PORTAL_AUTH_ENABLED?: string
  readonly VITE_TELEGRAM_BOT_USERNAME?: string
  readonly VITE_WORKBENCH_EVENTS_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __NOMI_BUILD_ID__: string
