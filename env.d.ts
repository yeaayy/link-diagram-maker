/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_API_BASE: string
  readonly VITE_STORAGE_KEY: string
  readonly VITE_DEFAULT_UNDO_LIMIT: string
  readonly VITE_DEFAULT_AUTOSAVE_DELAY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
