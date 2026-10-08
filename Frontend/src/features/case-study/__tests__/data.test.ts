// Blueprint 06 (anatomía del caso y tiempo de lectura), 04 §Flujo de datos (loader por lang y slug; 404
// si no existe) y 05 verificación 10: lo que el loader del caso entrega al cliente. Sin la vista previa,
// un draft no existe; con ella, llega marcado.
import { describe, expect, it } from 'vitest'
import { meta as fixtureCase } from '../../../content/__fixtures__/projects/fixture-case/meta'
import type { CaseStudyMeta } from '../../../content/schema'
import { caseData, countWords, proseText, WORDS_PER_MINUTE, type CaseSources } from '../data'

const published = (slug: string): CaseStudyMeta => ({ ...structuredClone(fixtureCase), slug, publication: 'published' })
const prose = (words: number) => () =>
  Promise.resolve(`{/* comentario */}\n<Section id="context">\n${'palabra '.repeat(words)}\n</Section>`)

const sources: CaseSources = {
  projects: [published('uno'), fixtureCase, published('dos')],
  diagrams: {},
  prose: { 'uno/es': prose(2000), 'uno/en': prose(10) },
}

describe('caseData', () => {
  it('sin la vista previa un draft no existe, igual que un slug inexistente (404)', async () => {
    expect(await caseData('es', fixtureCase.slug, { includeDrafts: false }, sources)).toBeNull()
    expect(await caseData('es', 'no-existe', { includeDrafts: false }, sources)).toBeNull()
    expect(await caseData('es', undefined, { includeDrafts: true }, sources)).toBeNull()
  })

  it('con la vista previa el draft llega marcado; publicado, no', async () => {
    expect(await caseData('es', fixtureCase.slug, { includeDrafts: true }, sources)).toMatchObject({ draft: true })
    expect(await caseData('es', 'uno', { includeDrafts: false }, sources)).toMatchObject({ draft: false })
  })

  it('todo llega resuelto en el idioma pedido: cabecera, secciones, decisiones y métricas', async () => {
    const es = await caseData('es', 'uno', { includeDrafts: false }, sources)
    const en = await caseData('en', 'uno', { includeDrafts: false }, sources)
    expect(es).toMatchObject({
      title: 'Caso ficticio de prueba',
      period: { dateTime: '2026-01', text: 'Enero–febrero de 2026' },
    })
    expect(en?.title).toBe('Fictional test case')
    // Intl separa el rango con espacios finos: se compara la forma, no los espacios.
    expect(en?.period.text).toMatch(/^January\s–\sFebruary 2026$/)
    expect(es?.sections.map((section) => section.label)).toEqual([
      'Contexto',
      'Problema',
      'Decisiones técnicas',
      'Resultado',
      'Lecciones',
    ])
    expect(es?.decisions['fixture-decision']).toMatchObject({
      title: 'Decisión ficticia',
      options: ['Un fixture mínimo.', 'Un caso real.'],
      repeat: null,
    })
    expect(es?.metrics['fixture-number']).toEqual({
      id: 'fixture-number',
      value: '42',
      label: 'Número de prueba',
      kind: 'simulated',
      source: 'Valor inventado para el fixture.',
    })
  })

  it('una métrica del repositorio dice su fecha de conteo y cómo se contó', async () => {
    const counted: CaseStudyMeta = {
      ...published('uno'),
      metrics: [
        {
          id: 'servicios',
          value: '15',
          label: { es: 'servicios', en: 'services' },
          source: { type: 'repository', countedAt: '2026-10-05', how: { es: 'Módulos Maven.', en: 'Maven modules.' } },
        },
      ],
    }
    const data = await caseData('es', 'uno', { includeDrafts: false }, { ...sources, projects: [counted] })
    expect(data?.metrics.servicios?.source).toBe('contado el 5 de octubre de 2026. Módulos Maven.')
  })

  it('tiempo de lectura: palabras de la prosa del idioma más lo que la página muestra desde meta.ts', async () => {
    const es = await caseData('es', 'uno', { includeDrafts: false }, sources)
    expect(es?.readingMinutes).toBeGreaterThanOrEqual(Math.round(2000 / WORDS_PER_MINUTE))
    const en = await caseData('en', 'uno', { includeDrafts: false }, sources)
    expect(en?.readingMinutes).toBe(1)
    expect(countWords(proseText('{/* no cuenta */}\n<Metric id="x" /> V2 usa CI/CD y 30.000 líneas.'))).toBe(6)
  })

  it('siguiente caso: el próximo visible en el orden del índice; el último no tiene', async () => {
    const first = await caseData('es', 'uno', { includeDrafts: false }, sources)
    expect(first?.next).toEqual({ title: 'Caso ficticio de prueba', href: '/es/work/dos/' })
    const withDrafts = await caseData('es', 'uno', { includeDrafts: true }, sources)
    expect(withDrafts?.next?.href).toBe('/es/work/fixture-case/')
    expect((await caseData('es', 'dos', { includeDrafts: false }, sources))?.next).toBeNull()
  })

  it('con el contenido real: Quantum es draft y solo existe en la vista previa, con sus tres diagramas', async () => {
    expect(await caseData('es', 'quantum', { includeDrafts: false })).toBeNull()
    const quantum = await caseData('es', 'quantum', { includeDrafts: true })
    expect(quantum).toMatchObject({ draft: true, title: 'Quantum', existence: 'real', confidentiality: 'sanitized' })
    expect(Object.keys(quantum?.diagrams ?? {})).toEqual(['platform', 'pipeline', 'workflow'])
    expect(quantum?.sections).toHaveLength(12)
    expect(quantum?.readingMinutes).toBeGreaterThan(5)
  })
})
