// Blueprint 13 §_headers y 11 §4 (límites de reglas y de largo de línea).
import { describe, expect, it } from 'vitest'
import { MAX_LINE, MAX_RULES, headerLimitProblems, renderHeaders } from '../headers'

const pages = [
  { url: null, hashes: ['sha256-tema'] },
  { url: '/es/', hashes: ['sha256-tema', 'sha256-contexto'] },
  { url: '/', hashes: ['sha256-tema', 'sha256-redireccion'] },
]

function rule(text: string, url: string): string[] {
  const blocks = text.split('\n\n')
  const block = blocks.find((candidate) => candidate.split('\n').includes(url)) ?? ''
  return block.split('\n').slice(block.split('\n').indexOf(url) + 1)
}

describe('renderHeaders', () => {
  const file = renderHeaders({ pages, https: true, indexable: false })

  it('/* lleva las cabeceras de seguridad, noindex y la CSP de las 404', () => {
    const global = rule(file.text, '/*')
    for (const header of [
      'Strict-Transport-Security: max-age=86400',
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy: same-origin',
      'Cross-Origin-Resource-Policy: same-origin',
      'X-Frame-Options: DENY',
      'X-Robots-Tag: noindex',
    ]) {
      expect(global).toContain(`  ${header}`)
    }
    const csp = global.find((line) => line.includes('Content-Security-Policy'))
    expect(csp).toContain("'sha256-tema'")
    expect(csp).not.toContain('sha256-contexto')
  })

  it('cada página quita la CSP heredada antes de declarar la suya (una sola CSP por respuesta)', () => {
    const es = rule(file.text, '/es/')
    expect(es[0]).toBe('  ! Content-Security-Policy')
    expect(es[1]).toContain("'sha256-contexto'")
    expect(rule(file.text, '/')[1]).toContain("'sha256-redireccion'")
  })

  it('cuenta las reglas: /*, una por página y /assets/*', () => {
    expect(file.rules).toBe(4)
    expect(rule(file.text, '/assets/*')).toContain('  Cache-Control: public, max-age=31536000, immutable')
  })

  it('al lanzar (indexable) desaparece el noindex', () => {
    expect(renderHeaders({ pages, https: true, indexable: true }).text).not.toContain('X-Robots-Tag')
  })
})

describe('headerLimitProblems', () => {
  it('falla por encima de los límites de Cloudflare Pages menos el margen', () => {
    expect(headerLimitProblems({ text: '', rules: MAX_RULES, longestLine: MAX_LINE })).toEqual([])
    expect(headerLimitProblems({ text: '', rules: MAX_RULES + 1, longestLine: MAX_LINE + 1 })).toHaveLength(2)
  })
})
