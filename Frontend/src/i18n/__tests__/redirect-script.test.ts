// Blueprint 12 §hreflang y 11 §5 (spec de idioma): el script inline de `/` debe decidir igual que
// detectLocale (preferencia guardada → navegador → en). Aquí se ejecuta con un entorno simulado.
import { describe, expect, it } from 'vitest'
import { LOCALE_STORAGE_KEY, detectLocale } from '../locales'
import { localeRedirectScript } from '../redirect-script'

interface Environment {
  stored?: string | null
  storageThrows?: boolean
  languages?: readonly string[]
  language?: string
}

function runScript(env: Environment): string {
  let target = ''
  const localStorage = {
    getItem: (key: string) => {
      if (env.storageThrows) throw new Error('bloqueado')
      return key === LOCALE_STORAGE_KEY ? (env.stored ?? null) : null
    },
  }
  const navigator = { languages: env.languages ?? [], language: env.language ?? '' }
  const location = {
    replace: (url: string) => {
      target = url
    },
  }
  // El script es código propio generado en el build; ejecutarlo así es la forma de probarlo tal cual.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const script = new Function('localStorage', 'navigator', 'location', localeRedirectScript()) as (
    ...globals: unknown[]
  ) => void
  script(localStorage, navigator, location)
  return target
}

const CASES: Environment[] = [
  { stored: 'es', languages: ['en-US'] },
  { stored: 'en', languages: ['es-CO'] },
  { stored: 'fr', languages: ['es-MX'] },
  { stored: null, languages: ['fr-FR', 'es-ES', 'en-US'] },
  { stored: null, languages: ['pt-BR', 'en-GB'] },
  { stored: null, languages: ['ES'] },
  { stored: null, languages: ['fr-FR'] },
  { stored: null, languages: [] },
  { stored: null, languages: [], language: 'es-AR' },
  { storageThrows: true, languages: ['es-CL'] },
]

describe('script de redirección de /', () => {
  it.each(CASES)('coincide con detectLocale: %o', (env) => {
    const languages = env.languages?.length ? env.languages : [env.language ?? '']
    const expected = detectLocale({ stored: env.storageThrows ? null : (env.stored ?? null), languages })
    expect(runScript(env)).toBe(`/${expected}/`)
  })

  it('usa la misma clave de localStorage que el selector de idioma', () => {
    expect(localeRedirectScript()).toContain(JSON.stringify(LOCALE_STORAGE_KEY))
  })
})
