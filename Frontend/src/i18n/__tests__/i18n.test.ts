import { describe, expect, it } from 'vitest'
import { createSafeStorage, type StorageLike } from '../../lib/storage'
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  detectLocale,
  isLocale,
  readStoredLocale,
  rememberLocale,
} from '../locales'
import { createT, flatMessages } from '../translate'

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

const blocked = createSafeStorage(() => {
  throw new DOMException('Bloqueado', 'SecurityError')
})

describe('isLocale', () => {
  it('acepta solo los idiomas soportados', () => {
    expect(LOCALES.every(isLocale)).toBe(true)
    for (const value of ['fr', 'ES', 'es-CO', '', null, undefined, 1, {}]) expect(isLocale(value)).toBe(false)
  })
})

describe('detectLocale: preferencia guardada → navegador → en (02)', () => {
  it('la preferencia guardada gana sobre el navegador', () => {
    expect(detectLocale({ stored: 'es', languages: ['en-US'] })).toBe('es')
    expect(detectLocale({ stored: 'en', languages: ['es-CO'] })).toBe('en')
  })

  it('una preferencia guardada inválida se ignora', () => {
    expect(detectLocale({ stored: 'fr', languages: ['es-MX'] })).toBe('es')
    expect(detectLocale({ stored: '{"x":1}', languages: [] })).toBe(DEFAULT_LOCALE)
  })

  it('del navegador usa el primer idioma soportado por su subetiqueta principal', () => {
    expect(detectLocale({ stored: null, languages: ['es-CO'] })).toBe('es')
    expect(detectLocale({ stored: null, languages: ['fr-FR', 'es-ES', 'en-US'] })).toBe('es')
    expect(detectLocale({ stored: null, languages: ['pt-BR', 'en-GB'] })).toBe('en')
    expect(detectLocale({ stored: null, languages: ['ES'] })).toBe('es')
  })

  it('sin señales soportadas cae en en', () => {
    expect(DEFAULT_LOCALE).toBe('en')
    expect(detectLocale({ stored: null, languages: ['fr-FR'] })).toBe('en')
    expect(detectLocale({ stored: null, languages: [] })).toBe('en')
  })

  it('sin argumentos no lanza aunque no haya navegador ni storage', () => {
    expect(isLocale(detectLocale())).toBe(true)
  })
})

describe('rememberLocale / readStoredLocale', () => {
  it('guarda y lee la preferencia con la clave compartida', () => {
    const backing = memoryStorage()
    const storage = createSafeStorage(() => backing)
    expect(rememberLocale('es', storage)).toBe(true)
    expect(backing.data.get(LOCALE_STORAGE_KEY)).toBe('es')
    expect(readStoredLocale(storage)).toBe('es')
  })

  it('un valor guardado inválido se lee como null', () => {
    const storage = createSafeStorage(() => memoryStorage({ [LOCALE_STORAGE_KEY]: 'klingon' }))
    expect(readStoredLocale(storage)).toBeNull()
  })

  it('con storage bloqueado no lanza: solo se pierde la preferencia', () => {
    expect(rememberLocale('en', blocked)).toBe(false)
    expect(readStoredLocale(blocked)).toBeNull()
  })
})

describe('createT', () => {
  it('traduce por clave en cada idioma', () => {
    expect(createT('es')('nav.work')).toBe('Trabajo')
    expect(createT('en')('nav.work')).toBe('Work')
    expect(createT('en')('caseStudy.sections.failure-modes')).toBe('Failure modes')
  })

  it('interpola los parámetros', () => {
    expect(createT('es')('footer.updated', { date: '2026-10-06' })).toBe('Actualizado el 2026-10-06')
    expect(createT('en')('footer.updated', { date: 2026 })).toBe('Updated 2026')
  })

  it('es puro: el mismo idioma da el mismo resultado', () => {
    expect(createT('es')('nav.about')).toBe(createT('es')('nav.about'))
    expect(flatMessages('es')).toBe(flatMessages('es'))
  })
})

describe('mensajes ES/EN', () => {
  const es = flatMessages('es')
  const en = flatMessages('en')
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

  it('tienen las mismas claves (respaldo en runtime de la verificación del compilador)', () => {
    expect([...en.keys()].sort()).toEqual([...es.keys()].sort())
  })

  it('cada clave tiene los mismos marcadores {param} en ambos idiomas', () => {
    const mismatched = [...es].filter(([key, text]) => {
      return placeholders(text).join() !== placeholders(en.get(key) ?? '').join()
    })
    expect(mismatched).toEqual([])
  })

  it('ningún texto está vacío', () => {
    const empty = LOCALES.flatMap((locale) =>
      [...flatMessages(locale)].filter(([, text]) => !text.trim()).map(([key]) => `${locale}:${key}`),
    )
    expect(empty).toEqual([])
  })
})
