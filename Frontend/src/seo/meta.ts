// Blueprint 12 §Metadata por ruta: `buildMeta` es una función pura que concentra todo el <head> de
// una ruta (título, descripción, canonical, hreflang, Open Graph, Twitter y JSON-LD).
import type { MetaDescriptor } from 'react-router'
import { site } from '../content/site'
import { SITE_URL } from '../env'
import { DEFAULT_LOCALE, LOCALES, createT, href, isLocale, perLocale, type Locale, type PageId } from '../i18n'
import { INDEXABLE } from './indexing'

export type OgType = 'website' | 'article' | 'profile'

/** Ruta a describir: una página fija o una de detalle con su slug. */
export type MetaTarget = { routeId: PageId } | { routeId: 'case'; slug: string }

export interface MetaInput {
  target: MetaTarget
  locale: Locale
  /** Título sin el sufijo del sitio. En Home es el rol. */
  title: string
  description: string
  ogType?: OgType
  jsonLd?: MetaJsonLd
  /** Origen absoluto (13). Por defecto, VITE_SITE_URL validado en env.ts. */
  siteUrl?: string
}

type MetaJsonLd = Extract<MetaDescriptor, { 'script:ld+json': unknown }>['script:ld+json']

const OG_LOCALE: Record<Locale, string> = { es: 'es_LA', en: 'en_US' }

/** og:type por página fija (12): `profile` en About, `article` en el lab, `website` en el resto. */
const OG_TYPE: Partial<Record<PageId, OgType>> = { about: 'profile', securityLab: 'article' }

const NOINDEX: MetaDescriptor = { name: 'robots', content: 'noindex' }

export function absoluteUrl(pathname: string, siteUrl = SITE_URL): string {
  return `${siteUrl}${pathname}`
}

export function pathsOf(target: MetaTarget): Record<Locale, string> {
  return target.routeId === 'case'
    ? perLocale((locale) => href('case', locale, { slug: target.slug }))
    : perLocale((locale) => href(target.routeId, locale))
}

export function buildMeta(input: MetaInput): MetaDescriptor[] {
  const { target, locale, title, description, ogType = 'website', jsonLd, siteUrl = SITE_URL } = input
  const isHome = target.routeId === 'home'
  const fullTitle = isHome ? `${site.name} | ${title}` : `${title} | ${site.name}`
  const paths = pathsOf(target)
  const canonical = absoluteUrl(paths[locale], siteUrl)
  // x-default: Home apunta a `/`, que elige idioma; el resto, a la versión en inglés (02, 12).
  const xDefault = absoluteUrl(isHome ? '/' : paths.en, siteUrl)

  const tags: MetaDescriptor[] = [
    { title: fullTitle },
    { name: 'description', content: description },
    ...(INDEXABLE ? [] : [NOINDEX]),
    { tagName: 'link', rel: 'canonical', href: canonical },
    ...LOCALES.map((l) => ({ tagName: 'link', rel: 'alternate', hrefLang: l, href: absoluteUrl(paths[l], siteUrl) })),
    { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: xDefault },
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: site.name },
    { property: 'og:title', content: isHome ? fullTitle : title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    ...LOCALES.filter((l) => l !== locale).map((l) => ({ property: 'og:locale:alternate', content: OG_LOCALE[l] })),
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
  if (ogType === 'profile') {
    tags.push(
      { property: 'profile:first_name', content: site.givenName },
      { property: 'profile:last_name', content: site.familyName },
    )
  }
  if (jsonLd) tags.push({ 'script:ld+json': jsonLd })
  return tags
}

/**
 * `meta` de una página fija. Con un prefijo que no es idioma (`/xx/`, solo en navegación cliente)
 * devuelve la de la 404.
 */
export function pageMeta(page: PageId, lang: string | undefined): MetaDescriptor[] {
  if (!isLocale(lang)) return notFoundMeta(DEFAULT_LOCALE)
  const t = createT(lang)
  if (page === 'home') {
    return buildMeta({
      target: { routeId: 'home' },
      locale: lang,
      title: site.role[lang],
      description: t('pages.home.description'),
      jsonLd: homeJsonLd(lang),
    })
  }
  return buildMeta({
    target: { routeId: page },
    locale: lang,
    title: t(`pages.${page}.title`),
    description: t(`pages.${page}.description`),
    ogType: OG_TYPE[page] ?? 'website',
  })
}

/** 404: noindex siempre, sin canonical ni hreflang (12). */
export function notFoundMeta(locale: Locale): MetaDescriptor[] {
  return [{ title: `${createT(locale)('notFound.title')} | ${site.name}` }, NOINDEX]
}

/** `/`: página mínima bilingüe con sus propios hreflang; x-default es ella misma (12). */
export function rootIndexMeta(siteUrl = SITE_URL): MetaDescriptor[] {
  const description = `${createT('en')('rootIndex.description')} / ${createT('es')('rootIndex.description')}`
  const title = `${site.name} | ${site.role.en} · ${site.role.es}`
  const canonical = absoluteUrl('/', siteUrl)
  return [
    { title },
    { name: 'description', content: description },
    ...(INDEXABLE ? [] : [NOINDEX]),
    { tagName: 'link', rel: 'canonical', href: canonical },
    ...LOCALES.map((l) => ({
      tagName: 'link',
      rel: 'alternate',
      hrefLang: l,
      href: absoluteUrl(href('home', l), siteUrl),
    })),
    { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: canonical },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: site.name },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
}

/**
 * JSON-LD de Home (12): `WebSite` + `Person` en un `@graph`. Sin `sameAs` hasta tener las URL
 * reales de GitHub y LinkedIn (decisión 6 de 12); sin `worksFor`, `image` ni `knowsAbout`.
 */
export function homeJsonLd(locale: Locale, siteUrl = SITE_URL): MetaJsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: site.name,
        inLanguage: [...LOCALES],
        publisher: { '@id': `${siteUrl}/#person` },
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: site.name,
        url: `${siteUrl}/`,
        jobTitle: site.role[locale],
      },
    ],
  }
}
