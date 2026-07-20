interface ImportMetaEnv {
  readonly VITE_PORTAL_API_BASE?: string
  readonly VITE_PORTAL_AUTH_ENABLED?: string
  readonly VITE_WORKBENCH_EVENTS_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
