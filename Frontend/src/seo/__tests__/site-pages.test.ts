// Blueprint 12 §sitemap.xml (misma tabla que el prerender) y 05 verificación 10: ningún draft genera
// ruta ni entrada en el sitemap. El filtro se prueba con el fixture, que es un draft.
import { describe, expect, it } from 'vitest'
import { meta as draftFixture } from '../../content/__fixtures__/projects/fixture-case/meta'
import { allProjects, projects } from '../../content/projects'
import type { CaseStudyMeta } from '../../content/schema'
import { LOCALES, PAGE_IDS } from '../../i18n'
import { NOT_FOUND_PATHS, draftPreviewPaths, prerenderPaths, sitePages } from '../site-pages'
import { renderRobots, renderSitemap, sitemapEntries } from '../sitemap'

const ORIGIN = 'https://example.test'
const published: CaseStudyMeta = { ...structuredClone(draftFixture), slug: 'published-case', publication: 'published' }

describe('prerenderPaths', () => {
  const paths = prerenderPaths()

  it('incluye `/`, cada página fija × idioma y las 404', () => {
    expect(paths[0]).toBe('/')
    for (const locale of LOCALES) expect(paths).toContain(`/${locale}/cyber-ops/firewall/`)
    expect(paths).toHaveLength(1 + PAGE_IDS.length * LOCALES.length + projects.length * LOCALES.length + 3)
    expect(NOT_FOUND_PATHS).toEqual(['/404/', '/es/404/', '/en/404/'])
  })

  it('todas con barra final y sin parámetros (sorpresas 3 y 4 del spike)', () => {
    expect(paths.filter((path) => !path.endsWith('/') || /[:*]/.test(path))).toEqual([])
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('genera las páginas de los casos publicados, con lastmod de updatedAt', () => {
    const pages = sitePages([published])
    const page = pages.find((entry) => entry.routeId === 'case')
    expect(page?.paths).toEqual({ es: '/es/work/published-case/', en: '/en/work/published-case/' })
    expect(page?.lastmod).toBe(published.updatedAt)
  })
})

describe('un draft no es alcanzable (05, verificación 10)', () => {
  it('el fixture es un draft', () => {
    expect(draftFixture.publication).toBe('draft')
  })

  it('aunque reciba el índice completo, la tabla no genera su ruta', () => {
    const paths = prerenderPaths([draftFixture, published])
    expect(paths.filter((path) => path.includes(draftFixture.slug))).toEqual([])
    expect(paths).toContain('/es/work/published-case/')
  })

  it('el sitemap no lo lista', () => {
    const xml = renderSitemap(sitemapEntries(sitePages([draftFixture, published]), ORIGIN))
    expect(xml).not.toContain(draftFixture.slug)
    expect(xml).toContain(`${ORIGIN}/en/work/published-case/`)
  })

  it('el índice publicado real no contiene drafts y la tabla real no genera ninguno', () => {
    const drafts = allProjects.filter((entry) => entry.publication !== 'published')
    expect(projects.filter((entry) => entry.publication !== 'published')).toEqual([])
    const paths = prerenderPaths()
    expect(drafts.filter((draft) => paths.some((path) => path.includes(`/work/${draft.slug}/`)))).toEqual([])
  })

  it('la vista previa de desarrollo lista solo las páginas de los draft, y el sitemap nunca las ve', () => {
    expect(draftPreviewPaths([draftFixture, published])).toEqual(['/es/work/fixture-case/', '/en/work/fixture-case/'])
    expect(draftPreviewPaths(allProjects)).toContain('/es/work/quantum/')
    const xml = renderSitemap(sitemapEntries(sitePages(allProjects), ORIGIN))
    expect(xml).not.toContain('/work/quantum/')
  })
})

describe('sitemap.xml y robots.txt (12)', () => {
  const entries = sitemapEntries(sitePages([published]), ORIGIN)
  const xml = renderSitemap(entries)

  it('una entrada por URL y por idioma, más `/`', () => {
    expect(entries).toHaveLength(1 + (PAGE_IDS.length + 1) * LOCALES.length)
    expect(entries[0]?.loc).toBe(`${ORIGIN}/`)
  })

  it('alternates recíprocos: cada loc está en su propio grupo y el grupo es igual para ambos idiomas', () => {
    for (const entry of entries) expect(entry.alternates.map((alt) => alt.href)).toContain(entry.loc)
    const work = entries.filter((entry) => entry.loc.endsWith('/work/'))
    expect(work).toHaveLength(2)
    expect(work[0]?.alternates).toEqual(work[1]?.alternates)
  })

  it('lastmod solo donde el contenido tiene fecha; sin priority ni changefreq', () => {
    expect(entries.filter((entry) => entry.lastmod).map((entry) => entry.loc)).toEqual([
      `${ORIGIN}/es/work/published-case/`,
      `${ORIGIN}/en/work/published-case/`,
    ])
    expect(xml).not.toMatch(/priority|changefreq/)
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
  })

  it('robots.txt permite todo y apunta al sitemap', () => {
    expect(renderRobots(ORIGIN)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)
  })
})
