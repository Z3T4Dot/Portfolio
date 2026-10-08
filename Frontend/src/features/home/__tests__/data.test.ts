// Blueprint 02 §Home (bloques 2, 3 y 5) y 05 verificación 10: lo que el loader de Home entrega al
// cliente. Sin la vista previa nunca hay un draft; con ella, los draft llegan marcados y enlazan a su página de vista previa.
import { describe, expect, it } from 'vitest'
import { meta as fixtureCase } from '../../../content/__fixtures__/projects/fixture-case/meta'
import type { CaseStudyMeta, EssayMeta, TimelineStage } from '../../../content/schema'
import { FEATURED_LIMIT, homeData, type HomeSources } from '../data'

const published = (slug: string): CaseStudyMeta => ({ ...structuredClone(fixtureCase), slug, publication: 'published' })
const draftCase: CaseStudyMeta = { ...structuredClone(fixtureCase), slug: 'borrador' }
const essay = (slug: string, publication: EssayMeta['publication']): EssayMeta => ({
  slug,
  publication,
  title: { es: `Ensayo ${slug}`, en: `Essay ${slug}` },
  thesis: { es: 'Tesis.', en: 'Thesis.' },
})
const stages: TimelineStage[] = [
  { slug: 'inicio', publication: 'published', start: '2025-07', end: null, title: { es: 'Inicio', en: 'Start' } },
  { slug: 'oculta', publication: 'draft', start: '2026-04', end: '2026-09', title: { es: 'Oculta', en: 'Hidden' } },
]
const sources: HomeSources = {
  projects: [draftCase, published('uno'), published('dos'), published('tres'), published('cuatro')],
  essays: [essay('publicado', 'published'), essay('pendiente', 'draft')],
  timeline: stages,
}

describe('homeData', () => {
  it('sin la vista previa no entrega ningún draft (producción)', () => {
    const data = homeData('es', { includeDrafts: false }, sources)
    expect(data.featured.map((item) => item.slug)).toEqual(['uno', 'dos', 'tres'])
    expect(data.essays.map((item) => item.slug)).toEqual(['publicado'])
    expect(data.timeline.map((item) => item.slug)).toEqual(['inicio'])
    expect([...data.featured, ...data.essays, ...data.timeline].some((item) => item.draft)).toBe(false)
    expect(JSON.stringify(data)).not.toMatch(/borrador|Oculta|pendiente/)
  })

  it('con la vista previa los draft llegan marcados y con enlace (su página existe solo en la vista previa)', () => {
    const data = homeData('es', { includeDrafts: true }, sources)
    expect(data.featured).toHaveLength(FEATURED_LIMIT)
    expect(data.featured[0]).toMatchObject({ slug: 'borrador', draft: true, href: '/es/work/borrador/' })
    expect(data.featured[1]).toMatchObject({ slug: 'uno', draft: false, href: '/es/work/uno/' })
    expect(data.essays.find((item) => item.slug === 'pendiente')?.draft).toBe(true)
    expect(data.timeline.find((item) => item.slug === 'oculta')).toMatchObject({ draft: true, title: 'Oculta' })
  })

  it('textos y periodos en el idioma pedido', () => {
    const es = homeData('es', { includeDrafts: true }, sources)
    const en = homeData('en', { includeDrafts: true }, sources)
    expect(es.timeline.map((item) => item.period)).toEqual(['Desde julio de 2025', 'Abril–septiembre de 2026'])
    expect(en.timeline.map((item) => item.period)).toEqual(['Since July 2025', 'April – September 2026'])
    expect(en.featured[1]).toMatchObject({ title: 'Fictional test case', problem: 'Fictional one-line problem.' })
  })

  it('con el contenido real y sin vista previa: solo etapas publicadas, sin casos ni ensayos todavía', () => {
    const data = homeData('es', { includeDrafts: false })
    expect(data.timeline.length).toBeGreaterThan(0)
    expect(data.timeline.every((item) => !item.draft)).toBe(true)
    expect(data.featured).toEqual([])
    expect(data.essays).toEqual([])
  })
})
