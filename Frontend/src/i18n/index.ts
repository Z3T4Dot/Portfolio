// API pública de i18n. Las demás capas importan desde aquí, no desde los archivos internos.
export {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  detectLocale,
  isLocale,
  readStoredLocale,
  rememberLocale,
  type Locale,
  type LocaleSignals,
} from './locales'
export {
  DETAIL_SEGMENTS,
  PAGE_IDS,
  PAGE_SEGMENTS,
  caseHref,
  href,
  localeFromPath,
  localizedPath,
  perLocale,
  type DetailId,
  type PageId,
  type RouteId,
} from './paths'
export { localeRedirectScript } from './redirect-script'
export { createT, type MessageKey, type MessageParams, type Translate } from './translate'
export type { Messages } from './messages/es'
export { LocaleProvider } from './LocaleProvider'
export { useLocale, type LocaleContextValue } from './locale-context'
