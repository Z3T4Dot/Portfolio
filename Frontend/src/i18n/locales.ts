import { safeLocal, type SafeStorage } from '../lib/storage'

export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Idioma cuando ni la preferencia guardada ni el navegador indican uno soportado (02). */
export const DEFAULT_LOCALE: Locale = 'en'

/**
 * Clave de la preferencia en localStorage. El script inline que redirige desde `/` (12) lee la misma
 * clave: si cambia aquí, cambia allá.
 */
export const LOCALE_STORAGE_KEY = 'locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export interface LocaleSignals {
  /** Lo que haya en localStorage, sin validar. */
  stored: unknown
  /** navigator.languages, en orden de preferencia. */
  languages: readonly string[]
}

/**
 * Precedencia (02): preferencia guardada → idioma del navegador → `en`.
 * Del navegador cuenta el idioma principal de cada etiqueta: `es-CO` → `es`, `fr-FR` → nada.
 * Sin argumentos lee el entorno real; en tests y en el prerender se pasan las señales.
 */
export function detectLocale(signals: Partial<LocaleSignals> = {}): Locale {
  const stored = 'stored' in signals ? signals.stored : readStoredLocale()
  if (isLocale(stored)) return stored

  for (const tag of signals.languages ?? browserLanguages()) {
    const primary = tag.split('-')[0]?.toLowerCase()
    if (isLocale(primary)) return primary
  }
  return DEFAULT_LOCALE
}

/** Guarda la elección explícita del usuario (selector de idioma). Con storage bloqueado no hace nada. */
export function rememberLocale(locale: Locale, storage: SafeStorage = safeLocal): boolean {
  return storage.write(LOCALE_STORAGE_KEY, locale)
}

export function readStoredLocale(storage: SafeStorage = safeLocal): Locale | null {
  return storage.read(LOCALE_STORAGE_KEY, isLocale)
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages.length > 0 ? navigator.languages : [navigator.language]
}
