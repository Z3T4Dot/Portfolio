// Blueprint 11 §2 (i18n: mapeo de rutas ES↔EN) y 12 §Canonical (forma canónica con barra final).
import { describe, expect, it } from 'vitest'
import { PAGE_IDS, PAGE_SEGMENTS, href, localeFromPath, localizedPath, perLocale } from '../paths'

describe('href: forma canónica (12)', () => {
  it('prefijo de idioma y barra final en cada página fija', () => {
    expect(href('home', 'es')).toBe('/es/')
    expect(href('work', 'en')).toBe('/en/work/')
    expect(href('securityLab', 'es')).toBe('/es/security/wazuh-soc-lab/')
    expect(href('cyberOpsEnding', 'en')).toBe('/en/cyber-ops/ending/')
    for (const page of PAGE_IDS) expect(href(page, 'es')).toMatch(/^\/es\/([a-z0-9-]+\/)*$/)
  })

  it('casos de estudio bajo /work/<slug>/', () => {
    expect(href('case', 'en', { slug: 'quantum' })).toBe('/en/work/quantum/')
  })

  it('cubre todas las páginas fijas de 02, sin repetir segmentos', () => {
    expect([...PAGE_IDS].sort()).toEqual(Object.keys(PAGE_SEGMENTS).sort())
    const segments = Object.values(PAGE_SEGMENTS)
    expect(new Set(segments).size).toBe(segments.length)
  })
})

describe('localeFromPath', () => {
  it('lee el idioma del primer segmento', () => {
    expect(localeFromPath('/es/work/')).toBe('es')
    expect(localeFromPath('/en')).toBe('en')
  })

  it('null sin prefijo o con uno que no es idioma', () => {
    for (const path of ['/', '/xx/', '/work/es/', '/ES/', '/esp/']) expect(localeFromPath(path)).toBeNull()
  })
})

describe('localizedPath: el selector de idioma conserva la ruta (02)', () => {
  it('cambia solo el prefijo', () => {
    expect(localizedPath({ pathname: '/es/work/quantum/' }, 'en')).toBe('/en/work/quantum/')
    expect(localizedPath({ pathname: '/en/' }, 'es')).toBe('/es/')
  })

  it('conserva la búsqueda y el ancla (los ids de sección son iguales en ambos idiomas)', () => {
    expect(localizedPath({ pathname: '/es/security/wazuh-soc-lab/', search: '?x=1', hash: '#detection' }, 'en')).toBe(
      '/en/security/wazuh-soc-lab/?x=1#detection',
    )
  })

  it('sin prefijo de idioma lleva al inicio', () => {
    expect(localizedPath({ pathname: '/no-existe' }, 'es')).toBe('/es/')
    expect(localizedPath({ pathname: '/xx/a/' }, 'en')).toBe('/en/')
  })
})

describe('perLocale', () => {
  it('un valor por idioma', () => {
    expect(perLocale((locale) => locale.toUpperCase())).toEqual({ es: 'ES', en: 'EN' })
  })
})
