/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional https endpoint the Team Up form posts to. Unset means the form is hidden. */
  readonly VITE_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
