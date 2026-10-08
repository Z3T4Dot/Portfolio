// Blueprint 11 §2 (seo: buildMeta, JSON-LD) y 12 §Metadata por ruta (patrones de título y
// descripción, canonical autorreferente, hreflang es/en/x-default, 404 con noindex).
import type { MetaDescriptor } from 'react-router'
import { describe, expect, it } from 'vitest'
import { site } from '../../content/site'
import { LOCALES, PAGE_IDS } from '../../i18n'
import { INDEXABLE } from '../indexing'
import { buildMeta, homeJsonLd, notFoundMeta, pageMeta, rootIndexMeta } from '../meta'

const ORIGIN = 'https://example.test'

const titleOf = (tags: MetaDescriptor[]) => tags.flatMap((tag) => ('title' in tag ? [String(tag.title)] : []))[0] ?? ''
const named = (tags: MetaDescriptor[], name: string) =>
  tags.flatMap((tag) => ('name' in tag && tag.name === name && 'content' in tag ? [String(tag.content)] : []))
const property = (tags: MetaDescriptor[], prop: string) =>
  tags.flatMap((tag) => ('property' in tag && tag.property === prop && 'content' in tag ? [String(tag.content)] : []))
const links = (tags: MetaDescriptor[], rel: string) =>
  tags.flatMap((tag) =>
    'tagName' in tag && tag.tagName === 'link' && tag.rel === rel
      ? [{ href: String(tag.href), hrefLang: String(tag.hrefLang) }]
      : [],
  )

describe('buildMeta', () => {
  const tags = buildMeta({
    target: { routeId: 'case', slug: 'quantum' },
    locale: 'es',
    title: 'Un caso',
    description: 'Descripción',
    ogType: 'article',
    siteUrl: ORIGIN,
  })

  it('título `{página} | Cesar Acosta` y og:title sin el sufijo', () => {
    expect(titleOf(tags)).toBe('Un caso | Cesar Acosta')
    expect(property(tags, 'og:title')).toEqual(['Un caso'])
  })

  it('canonical autorreferente y absoluto, igual a og:url', () => {
    const [canonical] = links(tags, 'canonical')
    expect(canonical?.href).toBe(`${ORIGIN}/es/work/quantum/`)
    expect(property(tags, 'og:url')).toEqual([`${ORIGIN}/es/work/quantum/`])
  })

  it('hreflang es, en y x-default (la versión en inglés)', () => {
    const alternates = Object.fromEntries(links(tags, 'alternate').map((tag) => [tag.hrefLang, tag.href]))
    expect(alternates).toEqual({
      es: `${ORIGIN}/es/work/quantum/`,
      en: `${ORIGIN}/en/work/quantum/`,
      'x-default': `${ORIGIN}/en/work/quantum/`,
    })
  })

  it('Open Graph, Twitter e idioma', () => {
    expect(property(tags, 'og:type')).toEqual(['article'])
    expect(property(tags, 'og:locale')).toEqual(['es_LA'])
    expect(property(tags, 'og:locale:alternate')).toEqual(['en_US'])
    expect(named(tags, 'twitter:card')).toEqual(['summary_large_image'])
  })

  it('noindex mientras el sitio no se lanza (12)', () => {
    expect(named(tags, 'robots')).toEqual(INDEXABLE ? [] : ['noindex'])
  })
})

describe('pageMeta de cada página fija', () => {
  const all = LOCALES.flatMap((locale) => PAGE_IDS.map((page) => ({ locale, page, tags: pageMeta(page, locale) })))

  it('Home invierte el orden: `Cesar Acosta | {rol}`, con x-default en `/`', () => {
    const home = pageMeta('home', 'en')
    expect(titleOf(home)).toBe(`Cesar Acosta | ${site.role.en}`)
    const xDefault = links(home, 'alternate').find((tag) => tag.hrefLang === 'x-default')
    expect(xDefault?.href).toMatch(/\/$/)
    expect(String(xDefault?.href)).not.toMatch(/\/en\/$/)
  })

  it('títulos finales de 60 caracteres o menos, distintos entre páginas del mismo idioma (12)', () => {
    expect(all.map(({ tags }) => titleOf(tags)).filter((title) => title.length > 60)).toEqual([])
    // Entre idiomas pueden coincidir: "Wazuh SOC Lab" es igual en ES y EN según 12.
    for (const locale of LOCALES) {
      const titles = all.filter((entry) => entry.locale === locale).map(({ tags }) => titleOf(tags))
      expect(new Set(titles).size).toBe(titles.length)
    }
  })

  it('descripciones de 110–160 caracteres y sin números (12)', () => {
    const descriptions = all.flatMap(({ locale, page, tags }) =>
      named(tags, 'description').map((text) => ({ at: `${locale}:${page}`, text })),
    )
    expect(descriptions).toHaveLength(all.length)
    expect(descriptions.filter(({ text }) => text.length < 110 || text.length > 160)).toEqual([])
    expect(descriptions.filter(({ text }) => /\d/.test(text))).toEqual([])
  })

  it('og:type: profile en About (con nombre y apellido), article en el lab, website en el resto', () => {
    const about = pageMeta('about', 'es')
    expect(property(about, 'og:type')).toEqual(['profile'])
    expect(property(about, 'profile:first_name')).toEqual([site.givenName])
    expect(property(pageMeta('securityLab', 'en'), 'og:type')).toEqual(['article'])
    expect(property(pageMeta('work', 'en'), 'og:type')).toEqual(['website'])
  })

  it('JSON-LD WebSite + Person solo en Home', () => {
    const withLd = all.filter(({ tags }) => tags.some((tag) => 'script:ld+json' in tag))
    expect(withLd.map(({ locale, page }) => `${locale}:${page}`)).toEqual(['es:home', 'en:home'])
  })

  it('un prefijo que no es idioma da la meta de la 404', () => {
    expect(pageMeta('work', 'xx')).toEqual(notFoundMeta('en'))
  })
})

describe('notFoundMeta y rootIndexMeta', () => {
  it('404: título localizado, noindex, sin canonical ni hreflang', () => {
    const tags = notFoundMeta('es')
    expect(titleOf(tags)).toBe('Página no encontrada | Cesar Acosta')
    expect(named(tags, 'robots')).toEqual(['noindex'])
    expect(links(tags, 'canonical')).toEqual([])
    expect(links(tags, 'alternate')).toEqual([])
  })

  it('`/`: bilingüe, canonical y x-default en sí misma, alternates a /es/ y /en/', () => {
    const tags = rootIndexMeta(ORIGIN)
    expect(titleOf(tags)).toBe(`Cesar Acosta | ${site.role.en} · ${site.role.es}`)
    expect(titleOf(tags).length).toBeLessThanOrEqual(60)
    const alternates = Object.fromEntries(links(tags, 'alternate').map((tag) => [tag.hrefLang, tag.href]))
    expect(alternates).toEqual({ es: `${ORIGIN}/es/`, en: `${ORIGIN}/en/`, 'x-default': `${ORIGIN}/` })
    const [description = ''] = named(tags, 'description')
    expect(description.length).toBeGreaterThanOrEqual(110)
    expect(description.length).toBeLessThanOrEqual(160)
  })
})

describe('homeJsonLd', () => {
  it('@graph con WebSite y Person, jobTitle localizado y sin campos pendientes', () => {
    const ld = JSON.parse(JSON.stringify(homeJsonLd('es', ORIGIN))) as { '@graph': Array<Record<string, unknown>> }
    expect(ld['@graph'].map((node) => node['@type'])).toEqual(['WebSite', 'Person'])
    const person = ld['@graph'][1] ?? {}
    expect(person.jobTitle).toBe(site.role.es)
    expect(person.url).toBe(`${ORIGIN}/`)
    // 12: sin worksFor, image ni knowsAbout; sameAs llega con las URL reales.
    for (const field of ['worksFor', 'image', 'knowsAbout', 'sameAs']) expect(person).not.toHaveProperty(field)
  })
})
