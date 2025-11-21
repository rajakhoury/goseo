/// <reference types="chrome"/>
/// <reference types="vite/client" />

declare global {
  interface Window {
    chrome: typeof chrome;
  }

  interface ImportMetaEnv {
    MODE: string;
    BASE_URL: string;
    PROD: boolean;
    DEV: boolean;
    SSR: boolean;
    VITE_DEV_SERVER_URL?: string;
    [key: string]: string | boolean | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
