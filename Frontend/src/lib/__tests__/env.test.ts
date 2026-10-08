// Blueprint 13 §Variables de entorno: una variable mal puesta hace fallar el build.
import { describe, expect, it } from 'vitest'
import { parseBuildDate, parseShowDrafts, parseSiteUrl } from '../env'

describe('parseShowDrafts (vista previa de borradores, 05)', () => {
  it('en desarrollo se ven por defecto; VITE_SHOW_DRAFTS=false los oculta', () => {
    expect(parseShowDrafts(undefined, true)).toBe(true)
    expect(parseShowDrafts('true', true)).toBe(true)
    expect(parseShowDrafts('', true)).toBe(true)
    expect(parseShowDrafts('false', true)).toBe(false)
    expect(parseShowDrafts(' false ', true)).toBe(false)
  })

  it('un build de producción nunca incluye borradores, aunque la variable esté puesta', () => {
    expect(parseShowDrafts('true', false)).toBe(false)
    expect(parseShowDrafts(undefined, false)).toBe(false)
  })
})

describe('parseSiteUrl', () => {
  it('acepta https y localhost por http', () => {
    expect(parseSiteUrl('https://cesar.dev', 'http://localhost:8788')).toBe('https://cesar.dev')
    expect(parseSiteUrl('http://localhost:8788', 'x')).toBe('http://localhost:8788')
    expect(parseSiteUrl('https://pr-4.portfolio.pages.dev', 'x')).toBe('https://pr-4.portfolio.pages.dev')
  })

  it('sin valor usa el de respaldo', () => {
    expect(parseSiteUrl(undefined, 'http://localhost:8788')).toBe('http://localhost:8788')
    expect(parseSiteUrl('  ', 'http://localhost:5173')).toBe('http://localhost:5173')
  })

  it('rechaza http fuera de localhost, barra final, rutas y valores inválidos', () => {
    expect(() => parseSiteUrl('http://cesar.dev', 'x')).toThrow(/https/)
    expect(() => parseSiteUrl('https://cesar.dev/', 'x')).toThrow(/barra final/)
    expect(() => parseSiteUrl('https://cesar.dev/es', 'x')).toThrow(/solo el origen/)
    expect(() => parseSiteUrl('cesar.dev', 'x')).toThrow(/no es una URL/)
  })
})

describe('parseBuildDate', () => {
  it('fecha válida o null si no hay', () => {
    expect(parseBuildDate('2026-10-06')).toBe('2026-10-06')
    expect(parseBuildDate(undefined)).toBeNull()
    expect(parseBuildDate('')).toBeNull()
  })

  it('rechaza formatos y fechas que no existen', () => {
    expect(() => parseBuildDate('2026-02-30')).toThrow(/AAAA-MM-DD/)
    expect(() => parseBuildDate('06/10/2026')).toThrow(/AAAA-MM-DD/)
  })
})
