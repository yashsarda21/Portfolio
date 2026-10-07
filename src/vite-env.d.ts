/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional https endpoint the Team Up form posts to. Unset means the form opens the visitor's email app instead. */
  readonly VITE_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** The year of the build, replaced at build time (vite.define.ts). Read it through `BUILD_YEAR` in shell/config. */
declare const __BUILD_YEAR__: number;
