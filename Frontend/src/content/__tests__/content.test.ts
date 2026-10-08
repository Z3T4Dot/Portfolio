// Blueprint 05 §Verificación de integridad (1–10), 06 (formato de decisión y de failure modes), 12
// §Patrones de descripción y 11 principio 1 ("un gate solo cuenta si puede fallar": cada chequeo se
// prueba con un dato roto). Corre en cada PR y antes del build (11).
import { describe, expect, it } from 'vitest'
import { meta as fixtureMeta } from '../__fixtures__/projects/fixture-case/meta'
import { aboutMeta } from '../about/meta'
import { allEssays, essays } from '../judgment'
import { allProjects, projectDiagrams, projects } from '../projects'
import type { ArchitectureGraph, CaseStudyMeta } from '../schema'
import { allSelectedWork, selectedWork } from '../selected-work'
import {
  checkCaseEntity,
  checkGraph,
  checkPublishedIndex,
  checkRelated,
  componentRefs,
  emptyLocalized,
  isIsoDate,
  mdxSyntaxProblems,
  sectionIds,
  type ContentFiles,
  type KnownEntities,
} from './integrity'

// Las rutas son relativas a este archivo, como las devuelve import.meta.glob.
const mdxSources = import.meta.glob<string>('../**/*.mdx', { query: '?raw', import: 'default', eager: true })
const evidencePaths = Object.keys(import.meta.glob('../**/evidence/*'))
const fixtureModules = import.meta.glob<{ meta: { slug: string } }>('../__fixtures__/**/meta.ts', { eager: true })

const content: ContentFiles = {
  sources: new Map(Object.entries(mdxSources)),
  files: new Set([...Object.keys(mdxSources), ...evidencePaths]),
}
const contentOf = (slug: string): ContentFiles => ({ ...content, diagrams: projectDiagrams[slug] ?? [] })

const PROJECTS_DIR = '../projects'
const FIXTURE_DIR = '../__fixtures__/projects/fixture-case'

// El índice de ADRs aún no existe; un enlace a él falla hasta que exista.
// Que un enlace a un `draft` no se muestre en producción lo decide quien lo renderiza, con
// findPublished o visibleOnly (content/publication.ts); aquí solo se exige que la entidad exista.
const known: KnownEntities = {
  cases: new Set(allProjects.map((project) => project.slug)),
  judgment: new Set(allEssays.map((essay) => essay.slug)),
  adrs: new Set(),
}

// Los borradores también se verifican: un draft se desarrolla y se prueba (05).
describe('contenido (publicado y draft)', () => {
  it('índices: slugs válidos y únicos, nada confidencial ni planeado (3, 4, 8)', () => {
    expect(checkPublishedIndex('projects', allProjects)).toEqual([])
    expect(checkPublishedIndex('selected-work', allSelectedWork)).toEqual([])
  })

  it('casos: idiomas, secciones, referencias del MDX, descripción, diagramas, fechas, evidencia y textos (1, 2, 3, 5, 6)', () => {
    const problems = allProjects.flatMap((meta) =>
      checkCaseEntity(meta, `${PROJECTS_DIR}/${meta.slug}`, contentOf(meta.slug)),
    )
    expect(problems).toEqual([])
  })

  it('casos: cada caso tiene los dos idiomas, aunque sea draft (Quantum: en.mdx es borrador)', () => {
    for (const meta of allProjects) {
      expect(content.sources.has(`${PROJECTS_DIR}/${meta.slug}/es.mdx`)).toBe(true)
      expect(content.sources.has(`${PROJECTS_DIR}/${meta.slug}/en.mdx`)).toBe(true)
    }
  })

  it('casos: los enlaces relacionados apuntan a entidades que existen (7)', () => {
    expect(allProjects.flatMap((meta) => checkRelated(meta, known))).toEqual([])
  })

  it('timeline: cada etapa abre casos que existen', () => {
    const missing = aboutMeta.timeline.flatMap((stage) =>
      (stage.projects ?? []).filter((slug) => !known.cases.has(slug)).map((slug) => `${stage.slug} → ${slug}`),
    )
    expect(missing).toEqual([])
  })

  it('selected work: textos no vacíos en ambos idiomas', () => {
    const problems = allSelectedWork.flatMap((meta) => emptyLocalized(meta).map((path) => `${meta.slug}: ${path}`))
    expect(problems).toEqual([])
  })

  it('los índices publicados no contienen ningún draft (10)', () => {
    expect([...projects, ...selectedWork, ...essays].filter((entry) => entry.publication !== 'published')).toEqual([])
  })

  it('ensayos: slugs válidos y únicos, textos no vacíos en ambos idiomas (8)', () => {
    const entries = allEssays.map(
      (essay) => ({ slug: essay.slug, existence: 'real', confidentiality: 'public' }) as const,
    )
    expect(checkPublishedIndex('judgment', entries)).toEqual([])
    expect(allEssays.flatMap((essay) => emptyLocalized(essay).map((path) => `${essay.slug}: ${path}`))).toEqual([])
  })

  it('ningún fixture aparece en un índice', () => {
    const fixtureSlugs = Object.values(fixtureModules).map((module) => module.meta.slug)
    expect(fixtureSlugs).toContain(fixtureMeta.slug)
    const listed = [...allProjects, ...allSelectedWork].map((entry) => entry.slug)
    expect(listed.filter((slug) => fixtureSlugs.includes(slug))).toEqual([])
    expect(allProjects).not.toContain(fixtureMeta)
  })
})

describe('fixture', () => {
  it('pasa todos los chequeos leyendo sus archivos reales', () => {
    expect(checkPublishedIndex('fixtures', [fixtureMeta])).toEqual([])
    expect(checkCaseEntity(fixtureMeta, FIXTURE_DIR, content)).toEqual([])
    expect(checkRelated(fixtureMeta, known)).toEqual([])
  })

  it('las secciones dentro de un bloque de código no cuentan', () => {
    const es = content.sources.get(`${FIXTURE_DIR}/es.mdx`) ?? ''
    expect(es).toContain('<Section id="security">')
    expect(sectionIds(es)).toEqual(fixtureMeta.sections)
  })
})

// Un chequeo solo cuenta si puede fallar (11): cada uno se prueba con un dato roto.
describe('los chequeos fallan cuando deben', () => {
  const base = (): CaseStudyMeta => structuredClone(fixtureMeta)
  // MDX mínimo válido para el fixture: cada sección, la decisión dentro de "decisions" y la métrica.
  const mdx = (...ids: string[]) =>
    ids
      .map((id) => {
        const inner = id === 'decisions' ? '<Decision id="fixture-decision" />' : 'Texto.'
        return `<Section id="${id}">\n\n${inner}\n\n</Section>`
      })
      .join('\n\n')
      .concat('\n\n<Metric id="fixture-number" />')
  const files = (sources: Record<string, string>, extra: string[] = []): ContentFiles => ({
    sources: new Map(Object.entries(sources)),
    files: new Set([...Object.keys(sources), ...extra]),
  })
  const both = (body: string) => files({ 'x/es.mdx': body, 'x/en.mdx': body })
  const sections = fixtureMeta.sections
  const valid = mdx(...sections)

  it('el MDX mínimo de estas pruebas es válido', () => {
    expect(checkCaseEntity(base(), 'x', both(valid))).toEqual([])
  })

  it('1 · falta un idioma: es.mdx siempre; en.mdx solo si el caso está publicado', () => {
    expect(checkCaseEntity(base(), 'x', files({ 'x/en.mdx': valid }))).toEqual(['fixture-case: falta es.mdx'])
    // Un draft puede no tener aún la traducción (05: en desarrollo, con aviso visible).
    expect(checkCaseEntity(base(), 'x', files({ 'x/es.mdx': valid }))).toEqual([])
    const published = { ...base(), publication: 'published' as const }
    expect(checkCaseEntity(published, 'x', files({ 'x/es.mdx': valid }))).toEqual(['fixture-case: falta en.mdx'])
  })

  it('2 · una sección falta, sobra o cambia de orden en el MDX', () => {
    const decisionsLast = [...sections.filter((id) => id !== 'decisions'), 'decisions']
    expect(checkCaseEntity(base(), 'x', both(mdx(...decisionsLast)))).toHaveLength(2)
    expect(checkCaseEntity(base(), 'x', both(mdx(...sections, 'security')))).toHaveLength(2)
    expect(checkCaseEntity(base(), 'x', both(mdx(...sections.filter((id) => id !== 'lessons'))))).toHaveLength(2)
  })

  it('2 · un <Section> sin id o una sección repetida en meta', () => {
    const sinId = `${valid}\n\n<Section>\nTexto.\n</Section>`
    expect(checkCaseEntity(base(), 'x', both(sinId)).join('\n')).toMatch(/<Section> sin id/)
    const meta = { ...base(), sections: [...sections, 'context' as const] }
    expect(checkCaseEntity(meta, 'x', both(mdx(...meta.sections))).join('\n')).toMatch(/repetidas.*context/)
  })

  it('MDX: import, HTML crudo, componentes no permitidos, expresiones y fragmentos (05 §Prosa en MDX)', () => {
    expect(mdxSyntaxProblems("import X from './x'\n\nTexto.")).toEqual(['import/export no permitido dentro del MDX'])
    expect(mdxSyntaxProblems('export const a = 1')).toHaveLength(1)
    expect(mdxSyntaxProblems('<div>crudo</div>')).toEqual(['HTML crudo no permitido: <div>'])
    expect(mdxSyntaxProblems('<Chart id="x" />')).toEqual(['componente no permitido: <Chart>'])
    expect(mdxSyntaxProblems('<Metric id={dato} />').join('\n')).toMatch(/solo admite atributos de texto/)
    expect(mdxSyntaxProblems('Hoy son {new Date().getFullYear()}.')).toHaveLength(1)
    expect(mdxSyntaxProblems('<>\nTexto\n</>')).toEqual(['fragmento JSX no permitido'])
    // Lo que sí vale: comentarios, componentes de la lista y código (que no es estructura).
    expect(mdxSyntaxProblems('{/* nota */}\n\n<Callout title="Nota">\n\nTexto.\n\n</Callout>')).toEqual([])
    expect(mdxSyntaxProblems('```tsx\nimport X from "x"\n<div>{x}</div>\n```\n\nUsa `<div>`.')).toEqual([])
    const broken = `${valid}\n\n<div>crudo</div>`
    expect(checkCaseEntity(base(), 'x', both(broken)).join('\n')).toMatch(/es\.mdx: HTML crudo no permitido/)
  })

  it('06 · cada decisión de meta va una vez en el MDX, dentro de "decisions"', () => {
    const missing = valid.replace('<Decision id="fixture-decision" />', 'Sin decisión.')
    expect(checkCaseEntity(base(), 'x', both(missing)).join('\n')).toMatch(/<Decision> \[\] no coincide/)
    const unknown = `${valid}\n\n<Decision id="otra" />`
    expect(checkCaseEntity(base(), 'x', both(unknown)).join('\n')).toMatch(/no coincide con meta\.decisions/)
    const outside = valid
      .replace('<Decision id="fixture-decision" />', 'Texto.')
      .replace('<Section id="result">\n\nTexto.', '<Section id="result">\n\n<Decision id="fixture-decision" />')
    expect(checkCaseEntity(base(), 'x', both(outside)).join('\n')).toMatch(/dentro de <Section id="decisions">/)
  })

  it('métricas: cada <Metric id> existe y cada métrica aparece; ids únicos', () => {
    const unknown = valid.replace('<Metric id="fixture-number" />', '<Metric id="no-existe" />')
    const problems = checkCaseEntity(base(), 'x', both(unknown))
    expect(problems.join('\n')).toMatch(/<Metric id="no-existe"> no existe/)
    expect(problems.join('\n')).toMatch(/"fixture-number" no aparece en el MDX/)
    const metric = base().metrics?.[0]
    if (!metric) throw new Error('el fixture tiene una métrica')
    const twice = { ...base(), metrics: [metric, metric] }
    expect(checkCaseEntity(twice, 'x', both(valid)).join('\n')).toMatch(/ids repetidos en metrics: fixture-number/)
  })

  it('failure modes: la tabla va una vez dentro de su sección y tiene de 3 a 6 filas', () => {
    const row = {
      id: 'uno',
      failure: { es: 'F', en: 'F' },
      detection: { es: 'D', en: 'D' },
      impact: { es: 'I', en: 'I' },
      mitigation: { es: 'M', en: 'M' },
      residual: { es: 'R', en: 'R' },
    }
    const withSection = (rows: number): CaseStudyMeta => ({
      ...base(),
      sections: [...sections, 'failure-modes'],
      failureModes: Array.from({ length: rows }, (_, i) => ({ ...row, id: `f${String(i)}` })),
    })
    const table = mdx(...sections, 'failure-modes').replace(
      '<Section id="failure-modes">\n\nTexto.',
      '<Section id="failure-modes">\n\n<FailureModes />',
    )
    expect(checkCaseEntity(withSection(3), 'x', both(table))).toEqual([])
    expect(checkCaseEntity(withSection(2), 'x', both(table)).join('\n')).toMatch(/tiene 2 filas/)
    expect(checkCaseEntity(withSection(7), 'x', both(table)).join('\n')).toMatch(/tiene 7 filas/)
    const withoutTable = mdx(...sections, 'failure-modes')
    expect(checkCaseEntity(withSection(3), 'x', both(withoutTable)).join('\n')).toMatch(/<FailureModes \/> va una vez/)
    expect(checkCaseEntity(base(), 'x', both(`${valid}\n\n<FailureModes />`)).join('\n')).toMatch(/sin la sección/)
  })

  it('12 · descripción de 110–160 caracteres y sin números', () => {
    const corta = { ...base(), description: { es: 'Muy corta.', en: base().description.en } }
    expect(checkCaseEntity(corta, 'x', both(valid))).toEqual([
      'fixture-case: description.es mide 10 caracteres (12: 110–160)',
    ])
    const conNumero = {
      ...base(),
      description: { es: base().description.es, en: `${base().description.en.slice(0, 120)} 15` },
    }
    expect(checkCaseEntity(conNumero, 'x', both(valid))).toEqual(['fixture-case: description.en tiene números (12)'])
  })

  it('diagramas: <Diagram id> = meta.diagrams, y cada id existe en diagrams.ts', () => {
    const graph: ArchitectureGraph = {
      id: 'g',
      title: { es: 'G', en: 'G' },
      description: { es: 'Grafo.', en: 'Graph.' },
      nodes: [
        { id: 'a', label: { es: 'A', en: 'A' }, kind: 'service', description: { es: 'a', en: 'a' } },
        { id: 'b', label: { es: 'B', en: 'B' }, kind: 'service', description: { es: 'b', en: 'b' } },
      ],
      edges: [{ from: 'a', to: 'b' }],
      layout: { grid: [['a', 'b']] },
    }
    const meta = { ...base(), diagrams: ['g'] }
    const withDiagram = `${valid}\n\n<Diagram id="g" />`
    expect(checkCaseEntity(meta, 'x', { ...both(withDiagram), diagrams: [graph] })).toEqual([])
    expect(checkCaseEntity(meta, 'x', { ...both(valid), diagrams: [graph] }).join('\n')).toMatch(
      /<Diagram> \[\] no coincide/,
    )
    expect(checkCaseEntity(meta, 'x', both(withDiagram)).join('\n')).toMatch(/pide "g", que no está en diagrams\.ts/)
  })

  it('diagramas: estructura del grafo (nodos, aristas, grilla, orden vertical y fronteras)', () => {
    const node = (id: string) => ({
      id,
      label: { es: id, en: id },
      kind: 'service' as const,
      description: { es: id, en: id },
    })
    const graph = (patch: Partial<ArchitectureGraph>): ArchitectureGraph => ({
      id: 'g',
      title: { es: 'G', en: 'G' },
      description: { es: 'G', en: 'G' },
      nodes: [node('a'), node('b'), node('c')],
      edges: [{ from: 'a', to: 'b' }],
      layout: { grid: [['a', 'b', 'c']] },
      ...patch,
    })
    expect(checkGraph(graph({}))).toEqual([])
    expect(checkGraph(graph({ edges: [{ from: 'a', to: 'z' }] })).join('\n')).toMatch(/usa "z", que no es un nodo/)
    expect(
      checkGraph(
        graph({
          edges: [
            { from: 'a', to: 'b' },
            { from: 'a', to: 'b' },
          ],
        }),
      ).join('\n'),
    ).toMatch(/repetida/)
    expect(checkGraph(graph({ layout: { grid: [['a', 'b']] } })).join('\n')).toMatch(/"c" no está en la grilla/)
    expect(
      checkGraph(
        graph({
          layout: {
            grid: [
              ['a', 'b', 'a'],
              [null, 'c', null],
            ],
          },
        }),
      ).join('\n'),
    ).toMatch(/"a" no forman un rectángulo/)
    expect(checkGraph(graph({ layout: { grid: [['a', 'b', 'c']], vertical: ['a', 'b'] } })).join('\n')).toMatch(
      /layout\.vertical/,
    )
    const boundary = { id: 'red', label: { es: 'Red', en: 'Network' }, nodes: ['a', 'c'] }
    expect(checkGraph(graph({ boundaries: [boundary] })).join('\n')).toMatch(/encierra a b/)
  })

  it('3, 4, 8 · índice con algo confidencial, planeado o con slug inválido o repetido', () => {
    const ok = { slug: 'ok', existence: 'real', confidentiality: 'public' } as const
    expect(checkPublishedIndex('i', [{ ...ok, confidentiality: 'confidential' }])).toHaveLength(1)
    expect(checkPublishedIndex('i', [{ ...ok, existence: 'planned' }])).toHaveLength(1)
    expect(checkPublishedIndex('i', [{ ...ok, slug: 'Caso Uno' }])).toHaveLength(1)
    expect(checkPublishedIndex('i', [{ ...ok, slug: 'caso_uno' }])).toHaveLength(1)
    expect(checkPublishedIndex('i', [ok, ok])).toEqual(['i/ok: slug repetido'])
  })

  it('5 · fechas inválidas', () => {
    const body = both(valid)
    const check = (meta: CaseStudyMeta) => checkCaseEntity(meta, 'x', body)
    expect(check({ ...base(), period: { start: '2026-13', end: null } })).toHaveLength(1)
    expect(check({ ...base(), period: { start: '2026-05', end: '2026-01' } })).toHaveLength(1)
    expect(check({ ...base(), updatedAt: '2026-02-30' })).toHaveLength(1)
    const measured = { type: 'measured', tool: 'Lighthouse', date: '2026-1-2', method: { es: 'm', en: 'm' } } as const
    const metric = { id: 'fixture-number', value: '1', label: { es: 'a', en: 'a' }, source: measured }
    expect(check({ ...base(), metrics: [metric] })).toHaveLength(1)
    expect(isIsoDate('2028-02-29')).toBe(true)
  })

  it('6 · evidencia sin alt o leyenda en un idioma, o con un archivo que no existe', () => {
    const body = { 'x/es.mdx': valid, 'x/en.mdx': valid }
    const evidence = {
      kind: 'screenshot',
      src: 'evidence/captura.webp',
      alt: { es: 'Captura', en: ' ' },
      caption: { es: '', en: 'Caption' },
      confidentiality: 'sanitized',
    } as const
    const problems = checkCaseEntity({ ...base(), evidence: [evidence] }, 'x', files(body))
    expect(problems.filter((p) => p.startsWith('fixture-case: evidence[0]'))).toEqual([
      'fixture-case: evidence[0] sin leyenda en es',
      'fixture-case: evidence[0] sin alt en en',
      'fixture-case: evidence[0]: no existe el archivo evidence/captura.webp',
    ])
    const fixed = { ...evidence, alt: { es: 'Captura', en: 'Screenshot' }, caption: { es: 'Leyenda', en: 'Caption' } }
    expect(checkCaseEntity({ ...base(), evidence: [fixed] }, 'x', files(body, ['x/evidence/captura.webp']))).toEqual([])
  })

  it('textos Localized vacíos en cualquier nivel', () => {
    const meta = { ...base(), title: { es: 'Título', en: '  ' } }
    expect(checkCaseEntity(meta, 'x', both(valid))).toEqual(['fixture-case: texto vacío en title.en'])
    expect(emptyLocalized({ built: { es: ['a'], en: [] } })).toEqual(['built.en'])
  })

  it('7 · un enlace relacionado que no existe', () => {
    const meta = { ...base(), related: { cases: ['no-existe'], adrs: ['0001-x'] } }
    expect(checkRelated(meta, known)).toHaveLength(2)
  })

  it('componentRefs ignora el código y conserva el orden', () => {
    expect(componentRefs('<Metric id="a" /> `<Metric id="b" />` <Metric id="c" />', 'Metric')).toEqual(['a', 'c'])
  })
})
