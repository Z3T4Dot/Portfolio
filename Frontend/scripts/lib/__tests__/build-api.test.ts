// Blueprint 05 verificación 10: ningún draft es alcanzable en producción. draftEntities() es la lista
// que el postbuild busca en build/client; aquí se verifica que cubra cada tipo de draft y, sobre el
// contenido real, que ningún texto publicado nombre un draft (el build fallaría).
import { describe, expect, it } from 'vitest'
import { en as aboutEn } from '../../../src/content/about/en'
import { es as aboutEs } from '../../../src/content/about/es'
import { aboutMeta } from '../../../src/content/about/meta'
import { meta as fixtureCase } from '../../../src/content/__fixtures__/projects/fixture-case/meta'
import { allProjects } from '../../../src/content/projects'
import { publishedOnly } from '../../../src/content/publication'
import { site } from '../../../src/content/site'
import { flatMessages } from '../../../src/i18n/translate'
import { draftEntities } from '../build-api'

describe('draftEntities', () => {
  it('cubre casos, Selected Work, ensayos y etapas del timeline', () => {
    const drafts = draftEntities({
      projects: [fixtureCase],
      selectedWork: [],
      essays: [
        { slug: 'ensayo', publication: 'draft', title: { es: 'Título', en: 'Title' }, thesis: { es: 't', en: 't' } },
      ],
      timeline: [
        {
          slug: 'etapa',
          publication: 'draft',
          start: '2026-01',
          end: null,
          title: { es: 'Producto', en: 'Producto' },
          summary: { es: 'Resumen', en: 'Summary' },
        },
        { slug: 'visible', publication: 'published', start: '2026-02', end: null, title: { es: 'V', en: 'V' } },
      ],
    })
    expect(drafts).toEqual([
      {
        label: 'case fixture-case',
        paths: ['/es/work/fixture-case/', '/en/work/fixture-case/'],
        markers: [
          'Caso ficticio de prueba',
          'Fictional test case',
          fixtureCase.kind.es,
          fixtureCase.kind.en,
          fixtureCase.problem.es,
          fixtureCase.problem.en,
          fixtureCase.highlight.es,
          fixtureCase.highlight.en,
          fixtureCase.summary.es,
          fixtureCase.summary.en,
          fixtureCase.description.es,
          fixtureCase.description.en,
        ],
      },
      { label: 'essay ensayo', paths: [], markers: ['Título', 'Title'] },
      { label: 'timeline etapa', paths: [], markers: ['Producto', 'Resumen', 'Summary'] },
    ])
  })

  it('incluye cada caso draft real, con su ruta y su título', () => {
    const drafts = draftEntities()
    const draftCases = allProjects.filter((entry) => entry.publication === 'draft')
    expect(draftCases.map((entry) => entry.slug)).toContain('quantum')
    for (const entry of draftCases) {
      const draft = drafts.find((candidate) => candidate.label === `case ${entry.slug}`)
      expect(draft?.paths).toEqual([`/es/work/${entry.slug}/`, `/en/work/${entry.slug}/`])
      expect(draft?.markers).toContain(entry.title.es)
    }
  })

  it('incluye cada etapa draft del timeline real', () => {
    const labels = draftEntities().map((draft) => draft.label)
    const draftStages = aboutMeta.timeline.filter((stage) => stage.publication === 'draft')
    expect(draftStages.length).toBeGreaterThan(0)
    for (const stage of draftStages) expect(labels).toContain(`timeline ${stage.slug}`)
  })

  it('ningún texto publicado (site, About, mensajes de interfaz) contiene el texto de un draft', () => {
    const published = [
      JSON.stringify(site),
      JSON.stringify({ ...aboutMeta, timeline: publishedOnly(aboutMeta.timeline) }),
      JSON.stringify([aboutEs, aboutEn]),
      ...flatMessages('es').values(),
      ...flatMessages('en').values(),
    ].join('\n')
    const leaked = draftEntities().flatMap((draft) =>
      draft.markers.filter((marker) => published.includes(marker)).map((marker) => `${draft.label}: "${marker}"`),
    )
    expect(leaked).toEqual([])
  })
})
