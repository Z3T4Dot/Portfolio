// Blueprint 11 §8 (CSP estricta con hashes calculados por ruta en el build) y
// docs/spikes/d4-prerender.md, sorpresas 6 y 7.
import { attrs, elements, parseHtml, textOf } from './html'

export interface InlineScript {
  /** `classic`, `module` o el tipo de datos (`application/ld+json`). */
  type: string
  executable: boolean
  /** `sha256-<base64>` del contenido exacto; solo en los ejecutables. */
  hash?: string
  bytes: number
}

const EXECUTABLE_TYPES = new Set(['', 'text/javascript', 'module', 'application/javascript'])

export async function sha256(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
  return `sha256-${btoa(String.fromCharCode(...digest))}`
}

/**
 * Cada <script> inline del HTML. Los bloques de datos (`application/ld+json`) no se ejecutan y la
 * CSP no les aplica: se informan sin hash.
 */
export async function inlineScripts(html: string): Promise<InlineScript[]> {
  const found: InlineScript[] = []
  for (const element of elements(parseHtml(html))) {
    if (element.tagName !== 'script') continue
    const attributes = attrs(element)
    if (attributes.has('src')) continue
    const type = (attributes.get('type') ?? '').trim().toLowerCase()
    const text = textOf(element)
    const bytes = new TextEncoder().encode(text).length
    if (EXECUTABLE_TYPES.has(type)) {
      found.push({ type: type || 'classic', executable: true, hash: await sha256(text), bytes })
    } else {
      found.push({ type, executable: false, bytes })
    }
  }
  return found
}

export function executableHashes(scripts: readonly InlineScript[]): string[] {
  return [...new Set(scripts.flatMap((script) => (script.hash ? [script.hash] : [])))]
}

/**
 * Política de 11 §8 con el ajuste del spike: `default-src 'self'` (y no 'none') porque, en CSP3, el
 * <link rel="prefetch"> de `<Link prefetch="intent">` se rige por default-src y Firefox lo bloquea;
 * lo demás se cierra con directivas explícitas. Sin 'unsafe-inline' ni Trusted Types (fuera de V1).
 */
export function contentSecurityPolicy(hashes: readonly string[], options: { https: boolean }): string {
  const scriptSrc = ["'self'", ...[...new Set(hashes)].map((hash) => `'${hash}'`)].join(' ')
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ]
  // En http://localhost, upgrade-insecure-requests haría que WebKit pida los assets por https.
  if (options.https) directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}
