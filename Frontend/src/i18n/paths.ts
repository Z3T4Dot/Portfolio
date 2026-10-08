// Blueprint 02 §Sitemap V1 y 12 §Canonical, barra final y hreflang: la URL canónica de cada ruta
// sale de una sola función, `href`, y el selector de idioma conserva la ruta (02 §Navegación).
import { isLocale, type Locale } from './locales'

/**
 * Segmento de cada página fija, sin idioma (02). Los slugs son en inglés e iguales en ambos
 * idiomas. Lo usan routes.ts (registro), los enlaces y la tabla de prerender: no pueden divergir.
 */
export const PAGE_SEGMENTS = {
  home: '',
  work: 'work',
  securityHub: 'security',
  securityLab: 'security/wazuh-soc-lab',
  judgment: 'judgment',
  cyberOpsHub: 'cyber-ops',
  cyberOpsFirewall: 'cyber-ops/firewall',
  cyberOpsDetection: 'cyber-ops/detection',
  cyberOpsRecovery: 'cyber-ops/recovery',
  cyberOpsEnding: 'cyber-ops/ending',
  about: 'about',
  contact: 'contact',
  architecture: 'architecture',
} as const

export type PageId = keyof typeof PAGE_SEGMENTS

export const PAGE_IDS: readonly PageId[] = [
  'home',
  'work',
  'securityHub',
  'securityLab',
  'judgment',
  'cyberOpsHub',
  'cyberOpsFirewall',
  'cyberOpsDetection',
  'cyberOpsRecovery',
  'cyberOpsEnding',
  'about',
  'contact',
  'architecture',
]

/** Rutas de detalle: `<segmento>/:slug`. Los ensayos y los ADRs llegan con sus índices (05). */
export const DETAIL_SEGMENTS = {
  case: 'work',
} as const

export type DetailId = keyof typeof DETAIL_SEGMENTS
export type RouteId = PageId | DetailId

/** Forma canónica, relativa al origen: prefijo de idioma y barra final (12, criterio H2 del spike). */
export function href(routeId: PageId, locale: Locale): string
export function href(routeId: DetailId, locale: Locale, params: { slug: string }): string
export function href(routeId: RouteId, locale: Locale, params?: { slug: string }): string {
  const segment = routeId === 'case' ? `${DETAIL_SEGMENTS.case}/${params?.slug ?? ''}` : PAGE_SEGMENTS[routeId]
  return segment ? `/${locale}/${segment}/` : `/${locale}/`
}

/**
 * Enlace a un caso (02: una sola página canónica por cosa). Con `canonical`, la ruta sin idioma donde
 * vive ("security/wazuh-soc-lab"); sin él, su página en /work.
 */
export function caseHref(locale: Locale, entry: { slug: string; canonical?: string | undefined }): string {
  const canonical = entry.canonical?.replace(/^\/+|\/+$/g, '')
  return canonical ? `/${locale}/${canonical}/` : href('case', locale, { slug: entry.slug })
}

/** Idioma del primer segmento de la URL; `null` si no es un idioma soportado (`/xx/`, `/`). */
export function localeFromPath(pathname: string): Locale | null {
  const first = pathname.split('/')[1]
  return isLocale(first) ? first : null
}

/**
 * La misma ruta en otro idioma (02: el selector conserva la ruta). Una URL sin prefijo de idioma
 * lleva al inicio del idioma pedido.
 */
export function localizedPath(location: { pathname: string; search?: string; hash?: string }, locale: Locale): string {
  const { pathname, search = '', hash = '' } = location
  if (localeFromPath(pathname) === null) return `/${locale}/`
  return `${pathname.replace(/^\/[^/]+/, `/${locale}`)}${search}${hash}`
}

/** Un valor por idioma (las URL de una ruta para hreflang y sitemap, 12). Si se agrega un idioma, no compila. */
export function perLocale<T>(build: (locale: Locale) => T): Record<Locale, T> {
  return { es: build('es'), en: build('en') }
}
