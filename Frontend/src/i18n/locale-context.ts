import { createContext, use } from 'react'
import type { Locale } from './locales'
import type { Translate } from './translate'

export interface LocaleContextValue {
  locale: Locale
  t: Translate
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

/** Idioma activo y su traductor. Lanza fuera de <LocaleProvider>: es un error de composición. */
export function useLocale(): LocaleContextValue {
  const value = use(LocaleContext)
  if (!value) throw new Error('useLocale() necesita un <LocaleProvider> por encima.')
  return value
}
