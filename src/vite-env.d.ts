/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROVENIQ_CORE_URL: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
