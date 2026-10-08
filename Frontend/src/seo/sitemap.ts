// Blueprint 12 §sitemap.xml y §robots.txt: generadores puros. Los llama scripts/postbuild.mjs con
// la tabla de site-pages.ts y el origen validado (13).
import { LOCALES } from '../i18n/locales'
import type { SitePage } from './site-pages'

interface UrlEntry {
  loc: string
  lastmod?: string
  alternates: Array<{ hreflang: string; href: string }>
}

/**
 * Una entrada por URL y por idioma, cada una con el grupo completo de alternates (es, en,
 * x-default). Incluye `/` con su propio grupo. Sin `priority` ni `changefreq` (Google los ignora).
 */
export function sitemapEntries(pages: readonly SitePage[], siteUrl: string): UrlEntry[] {
  const abs = (pathname: string) => `${siteUrl}${pathname}`
  const root: UrlEntry = {
    loc: abs('/'),
    alternates: [
      ...pages
        .filter((page) => page.routeId === 'home')
        .flatMap((page) => LOCALES.map((locale) => ({ hreflang: locale, href: abs(page.paths[locale]) }))),
      { hreflang: 'x-default', href: abs('/') },
    ],
  }
  const localized = pages.flatMap((page) => {
    const xDefault = page.routeId === 'home' ? abs('/') : abs(page.paths.en)
    const alternates = [
      ...LOCALES.map((locale) => ({ hreflang: locale, href: abs(page.paths[locale]) })),
      { hreflang: 'x-default', href: xDefault },
    ]
    return LOCALES.map((locale) => ({
      loc: abs(page.paths[locale]),
      ...(page.lastmod ? { lastmod: page.lastmod } : {}),
      alternates,
    }))
  })
  return [root, ...localized]
}

export function renderSitemap(entries: readonly UrlEntry[]): string {
  const url = (entry: UrlEntry) =>
    [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      ...(entry.lastmod ? [`    <lastmod>${entry.lastmod}</lastmod>`] : []),
      ...entry.alternates.map(
        (alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}"/>`,
      ),
      '  </url>',
    ].join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(url),
    '</urlset>',
    '',
  ].join('\n')
}

/** robots.txt de 12: nada que bloquear. El noindex previo al lanzamiento va en cabecera y meta. */
export function renderRobots(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
