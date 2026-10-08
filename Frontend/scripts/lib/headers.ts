// Blueprint 13 §_headers (generado; nunca a mano), 11 §8 §Cabeceras y 12 §robots.txt (noindex
// hasta el lanzamiento).
import { contentSecurityPolicy } from './csp'

export interface PageHashes {
  /** URL de la regla (`/es/work/`). `null` para las 404: se sirven en cualquier URL inexistente. */
  url: string | null
  hashes: readonly string[]
}

export interface HeadersInput {
  pages: readonly PageHashes[]
  https: boolean
  indexable: boolean
}

export interface HeadersFile {
  text: string
  rules: number
  longestLine: number
}

/** Límites del chequeo de `dist` (11 §4): Cloudflare Pages admite 100 reglas y 2.000 caracteres por línea. */
export const MAX_RULES = 90
export const MAX_LINE = 2000

const SECURITY_HEADERS = [
  // HSTS escalonado (13): etapa 1 hasta el lanzamiento.
  'Strict-Transport-Security: max-age=86400',
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy: same-origin',
  'Cross-Origin-Resource-Policy: same-origin',
  'X-Frame-Options: DENY',
]

/**
 * `/*` lleva las cabeceras comunes y la CSP de las respuestas sin regla propia (404). Cada página
 * quita esa CSP con `! Content-Security-Policy` antes de declarar la suya: Cloudflare une con coma
 * los valores repetidos y dos CSP se intersectan (13, criterio B3 del spike).
 */
export function renderHeaders({ pages, https, indexable }: HeadersInput): HeadersFile {
  const fallback = pages.filter((page) => page.url === null).flatMap((page) => page.hashes)
  const lines = [
    '# Generado por scripts/postbuild.mjs. No editar.',
    '/*',
    ...SECURITY_HEADERS.map((header) => `  ${header}`),
    ...(indexable ? [] : ['  X-Robots-Tag: noindex']),
    `  Content-Security-Policy: ${contentSecurityPolicy(fallback, { https })}`,
    '',
  ]
  let rules = 1
  const routed = pages.flatMap((page) => (page.url === null ? [] : [{ url: page.url, hashes: page.hashes }]))
  for (const page of [...routed].sort((a, b) => a.url.localeCompare(b.url))) {
    lines.push(
      page.url,
      '  ! Content-Security-Policy',
      `  Content-Security-Policy: ${contentSecurityPolicy(page.hashes, { https })}`,
      '',
    )
    rules++
  }
  lines.push('/assets/*', '  Cache-Control: public, max-age=31536000, immutable', '')
  rules++
  return { text: lines.join('\n'), rules, longestLine: Math.max(...lines.map((line) => line.length)) }
}

export function headerLimitProblems({ rules, longestLine }: HeadersFile): string[] {
  return [
    ...(rules > MAX_RULES ? [`_headers: ${String(rules)} reglas (máximo ${String(MAX_RULES)})`] : []),
    ...(longestLine > MAX_LINE
      ? [`_headers: línea de ${String(longestLine)} caracteres (máximo ${String(MAX_LINE)})`]
      : []),
  ]
}
