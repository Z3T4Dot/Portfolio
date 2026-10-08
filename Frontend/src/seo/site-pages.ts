// Blueprint 04 §Flujo de datos (5) y 12 §sitemap.xml: una sola tabla de páginas alimenta el
// prerender (react-router.config.ts) y el sitemap (scripts/postbuild.mjs). No puede listar una página
// que no existe ni omitir una que sí. Sin dependencias de env ni de React: la importan los scripts.
import { projects } from '../content/projects'
import { isPublished, publishedOnly } from '../content/publication'
import type { CaseStudyMeta } from '../content/schema'
// Directo a los módulos de i18n y no a su índice: este archivo se carga en la configuración del
// build y en el postbuild, donde no hace falta arrastrar React.
import { LOCALES, type Locale } from '../i18n/locales'
import { PAGE_IDS, href, perLocale, type RouteId } from '../i18n/paths'

export interface SitePage {
  routeId: RouteId
  /** Ruta canónica en cada idioma, relativa al origen y con barra final. */
  paths: Record<Locale, string>
  /** `updatedAt` del contenido (12: lastmod honesto); nunca la fecha del build. */
  lastmod?: string
}

/**
 * Todas las páginas indexables × idioma. Los casos salen solo de entidades `published`: aunque
 * reciba el índice completo, un `draft` no genera página (05, verificación 10).
 */
export function sitePages(cases: readonly CaseStudyMeta[] = projects): SitePage[] {
  const fixed = PAGE_IDS.map((routeId) => ({ routeId, paths: perLocale((locale) => href(routeId, locale)) }))
  const details = publishedOnly(cases).map((entry) => ({
    routeId: 'case' as const,
    paths: perLocale((locale) => href('case', locale, { slug: entry.slug })),
    lastmod: entry.updatedAt,
  }))
  return [...fixed, ...details]
}

/**
 * 404 prerenderizadas que el postbuild mueve a `404.html` (13: Pages sirve la más cercana con
 * status 404): una sin prefijo (inglés, el x-default de 02) y una por idioma.
 */
export const NOT_FOUND_PATHS: readonly string[] = ['/404/', ...LOCALES.map((locale) => `/${locale}/404/`)]

/** Paths para `prerender`, siempre con barra final (sorpresa 4 del spike: si no, no hay `_.data`). */
export function prerenderPaths(cases: readonly CaseStudyMeta[] = projects): string[] {
  const pages = sitePages(cases).flatMap((page) => LOCALES.map((locale) => page.paths[locale]))
  return ['/', ...pages, ...NOT_FOUND_PATHS]
}

/**
 * Páginas de los casos `draft`, solo para la vista previa de `npm run dev` (05: un draft se desarrolla
 * y se prueba). Con ssr:false, React Router exige también en dev que una ruta con `loader` tenga paths
 * en `prerender`. react-router.config.ts las agrega solo con SHOW_DRAFTS, que en un build es `false`;
 * nunca entran al sitemap, que sale de sitePages().
 */
export function draftPreviewPaths(cases: readonly CaseStudyMeta[]): string[] {
  return cases
    .filter((entry) => !isPublished(entry))
    .flatMap((entry) => LOCALES.map((locale) => href('case', locale, { slug: entry.slug })))
}
