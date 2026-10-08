// Blueprint 11 §2 (lib: utilidades de fecha por idioma).
import { describe, expect, it } from 'vitest'
import { formatDate, formatMonthPeriod, formatStagePeriod } from '../date'

describe('formatDate', () => {
  it('formatea en el idioma pedido, sin correrse por la zona horaria', () => {
    expect(formatDate('2026-10-06', 'es')).toBe('6 de octubre de 2026')
    expect(formatDate('2026-10-06', 'en')).toBe('October 6, 2026')
    expect(formatDate('2026-01-01', 'en')).toBe('January 1, 2026')
  })
})

describe('formatMonthPeriod', () => {
  // Intl separa los extremos con espacios finos (U+2009) alrededor de la raya cuando hace falta.
  it('un rango de meses en el idioma pedido, también entre años', () => {
    expect(formatMonthPeriod('2026-04', '2026-09', 'es')).toBe('abril–septiembre de 2026')
    expect(formatMonthPeriod('2026-04', '2026-09', 'en')).toBe('April – September 2026')
    expect(formatMonthPeriod('2025-09', '2026-05', 'es')).toBe('septiembre de 2025 – mayo de 2026')
  })

  it('sin fin o con el mismo mes, solo el inicio (enero no se corre a diciembre)', () => {
    expect(formatMonthPeriod('2025-07', null, 'es')).toBe('julio de 2025')
    expect(formatMonthPeriod('2026-01', '2026-01', 'en')).toBe('January 2026')
  })
})

describe('formatStagePeriod', () => {
  const since = (date: string) => `Desde ${date}`

  it('un periodo cerrado empieza en mayúscula; uno en curso usa la frase recibida', () => {
    expect(formatStagePeriod('2026-04', '2026-09', 'es', since)).toBe('Abril–septiembre de 2026')
    expect(formatStagePeriod('2025-07', null, 'es', since)).toBe('Desde julio de 2025')
    expect(formatStagePeriod('2026-04', '2026-04', 'en', since)).toBe('April 2026')
  })
})
