// Blueprint 13 §Variables de entorno: validación de las variables públicas del build. Funciones
// puras: las usa src/env.ts (app) y scripts/postbuild.mjs (sitemap y CSP), con los mismos valores.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

/**
 * Origen del sitio para canonicals, hreflang, og:url y sitemap (12). Debe ser https (salvo
 * localhost), sin barra final y sin ruta: una variable mal puesta hace fallar el build en lugar de
 * publicar canonicals rotos.
 */
export function parseSiteUrl(raw: string | undefined, fallback: string): string {
  const value = raw?.trim() ? raw.trim() : fallback
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`VITE_SITE_URL no es una URL válida: "${value}"`)
  }
  const local = LOCAL_HOSTS.has(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error(`VITE_SITE_URL debe usar https (salvo localhost): "${value}"`)
  }
  if (value.endsWith('/')) throw new Error(`VITE_SITE_URL va sin barra final: "${value}"`)
  if (url.origin !== value) throw new Error(`VITE_SITE_URL debe ser solo el origen, sin ruta ni parámetros: "${value}"`)
  return url.origin
}

/** Fecha del commit desplegado para el footer (02, 13). Vacía: el footer no muestra fecha. */
export function parseBuildDate(raw: string | undefined): string | null {
  const value = raw?.trim() ?? ''
  if (!value) return null
  if (!isIsoDate(value)) throw new Error(`VITE_BUILD_DATE debe ser una fecha AAAA-MM-DD válida: "${value}"`)
  return value
}

/**
 * Vista previa de borradores (05: un draft se desarrolla y se prueba). En el servidor de desarrollo
 * se ven por defecto, marcados "BORRADOR", para revisar el avance; `VITE_SHOW_DRAFTS=false` los
 * oculta. En un build de producción siempre es `false`, aunque la variable esté puesta, y el
 * postbuild falla si un draft aparece.
 */
export function parseShowDrafts(raw: string | undefined, isDev: boolean): boolean {
  return isDev && raw?.trim() !== 'false'
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
