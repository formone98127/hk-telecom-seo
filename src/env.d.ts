/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly MOBILE_PLANS_CSV_URL?: string;
  readonly BROADBAND_PLANS_CSV_URL?: string;
  readonly ESTATES_CSV_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
