// Blueprint 02 §About (pilares con enlaces a evidencia, timeline donde cada etapa abre proyectos reales,
// Selected Work enlazado y no duplicado) y 05 verificación 10: lo que el loader de About entrega.
import { describe, expect, it } from 'vitest'
import { meta as fixtureCase } from '../../../content/__fixtures__/projects/fixture-case/meta'
import { en } from '../../../content/about/en'
import { es } from '../../../content/about/es'
import { aboutMeta } from '../../../content/about/meta'
import type { CaseStudyMeta, SelectedWorkMeta } from '../../../content/schema'
import { aboutData, type AboutSources } from '../data'

const securityCase: CaseStudyMeta = {
  ...structuredClone(fixtureCase),
  slug: 'publicado',
  publication: 'published',
  pillars: ['security'],
}
const draftCase: CaseStudyMeta = { ...structuredClone(fixtureCase), slug: 'borrador', pillars: ['security'] }
const card: SelectedWorkMeta = {
  slug: 'ficha',
  existence: 'real',
  publication: 'draft',
  confidentiality: 'sanitized',
  what: { es: 'Qué', en: 'What' },
  role: { es: 'Rol', en: 'Role' },
  built: { es: ['a'], en: ['a'] },
  stack: [],
  status: { state: 'production', year: 2026 },
}
const sources: AboutSources = {
  meta: {
    ...aboutMeta,
    timeline: [
      {
        slug: 'etapa',
        publication: 'published',
        start: '2026-01',
        end: '2026-03',
        title: { es: 'Etapa', en: 'Stage' },
        projects: ['publicado', 'borrador'],
      },
      { slug: 'oculta', publication: 'draft', start: '2026-04', end: null, title: { es: 'Oculta', en: 'Hidden' } },
    ],
  },
  prose: { es, en },
  projects: [securityCase, draftCase],
  selectedWork: [card],
}

describe('aboutData', () => {
  it('sin la vista previa: evidencia y proyectos solo publicados, sin etapas draft ni Selected Work draft', () => {
    const data = aboutData('es', { includeDrafts: false }, sources)
    const security = data.pillars.find((pillar) => pillar.id === 'security')
    expect(security?.evidence).toEqual([
      { slug: 'publicado', title: 'Caso ficticio de prueba', href: '/es/work/publicado/', draft: false },
    ])
    expect(data.timeline.map((stage) => stage.slug)).toEqual(['etapa'])
    expect(data.timeline[0]?.projects.map((link) => link.slug)).toEqual(['publicado'])
    expect(data.hasSelectedWork).toBe(false)
    expect(JSON.stringify(data)).not.toMatch(/borrador|Oculta/)
  })

  it('con la vista previa: los draft llegan marcados y con enlace a su página de vista previa', () => {
    const data = aboutData('es', { includeDrafts: true }, sources)
    expect(data.timeline.map((stage) => stage.slug)).toEqual(['etapa', 'oculta'])
    expect(data.timeline[0]?.projects.find((link) => link.slug === 'borrador')).toMatchObject({
      draft: true,
      href: '/es/work/borrador/',
    })
    expect(data.timeline[1]).toMatchObject({ draft: true, period: 'Desde abril de 2026', summary: null })
    expect(data.hasSelectedWork).toBe(true)
  })

  it('con el contenido real y sin vista previa: cuatro pilares, timeline publicado y textos del idioma pedido', () => {
    const data = aboutData('en', { includeDrafts: false })
    expect(data.pillars.map((pillar) => pillar.id)).toEqual([
      'engineering',
      'security',
      'leadership',
      'business-systems',
    ])
    expect(data.timeline.every((stage) => !stage.draft)).toBe(true)
    expect(data.timeline[0]).toMatchObject({ title: 'Junior Developer at Brandex', period: 'Since July 2025' })
    expect(data.intro).toEqual(en.intro)
    expect(data.formalTitle).toBe(aboutMeta.formalTitle.en)
  })
})
