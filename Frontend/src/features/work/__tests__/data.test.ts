// Blueprint 02 §Work (cada fila: nombre, tipo, rol, periodo, etiquetas y el problema) y 05 verificación
// 10: sin la vista previa, el índice de casos no entrega ningún draft.
import { describe, expect, it } from 'vitest'
import { meta as fixtureCase } from '../../../content/__fixtures__/projects/fixture-case/meta'
import type { CaseStudyMeta } from '../../../content/schema'
import { workData } from '../data'

const published: CaseStudyMeta = { ...structuredClone(fixtureCase), slug: 'publicado', publication: 'published' }

describe('workData', () => {
  it('sin la vista previa solo hay casos publicados (producción)', () => {
    const data = workData('es', { includeDrafts: false }, [fixtureCase, published])
    expect(data.cases.map((item) => item.slug)).toEqual(['publicado'])
    expect(JSON.stringify(data)).not.toContain(fixtureCase.slug)
  })

  it('con la vista previa el draft llega marcado y con enlace a su página de vista previa', () => {
    const data = workData('es', { includeDrafts: true }, [fixtureCase, published])
    expect(data.cases[0]).toMatchObject({ slug: 'fixture-case', draft: true, href: '/es/work/fixture-case/' })
    expect(data.cases[1]).toMatchObject({
      slug: 'publicado',
      draft: false,
      title: 'Caso ficticio de prueba',
      kind: 'Fixture de pruebas',
      role: 'Ninguno: es un fixture',
      problem: 'Problema ficticio en una línea.',
      period: { dateTime: '2026-01', text: 'Enero–febrero de 2026' },
    })
  })

  it('con el contenido real y sin vista previa: Quantum (draft) no aparece', () => {
    expect(workData('es', { includeDrafts: false }).cases.map((item) => item.slug)).not.toContain('quantum')
    expect(workData('es', { includeDrafts: true }).cases.map((item) => item.slug)).toContain('quantum')
  })
})
