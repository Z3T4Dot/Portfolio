import { useMemo, type ReactNode } from 'react'
import { LocaleContext, type LocaleContextValue } from './locale-context'
import type { Locale } from './locales'
import { createT } from './translate'

interface LocaleProviderProps {
  /** Lo decide quien monta el árbol. Con el router, el parámetro `:lang` de la URL (02). */
  locale: Locale
  children: ReactNode
}

/**
 * Expone el idioma y `t` a los componentes. Es controlado y no conoce el router: no lee la URL,
 * no detecta el idioma ni toca localStorage. Así funciona igual en el prerender y en tests.
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = useMemo<LocaleContextValue>(() => ({ locale, t: createT(locale) }), [locale])
  return <LocaleContext value={value}>{children}</LocaleContext>
}
