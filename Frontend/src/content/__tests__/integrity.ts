// Verificación de integridad del contenido (05 §Verificación de integridad; 12 §Patrones de descripción;
// 03 §Diagramas). Funciones puras que devuelven la lista de problemas encontrados (vacía si todo está
// bien), para que content.test.ts las aplique al contenido real y al fixture, y para probar que cada
// chequeo falla cuando debe.
//
// El MDX se revisa como texto, antes del build: secciones, referencias a decisiones, métricas,
// diagramas y failure modes, y la misma regla de componentes que aplica el plugin de remark en el build
// (scripts/content-plugins.mjs). Un `draft` puede no tener todavía `en.mdx` (05: en desarrollo se permite
// con un aviso visible); uno publicado, no.

import { MDX_COMPONENTS } from '../mdx'
import type {
  ArchitectureGraph,
  CaseSectionId,
  CaseStudyMeta,
  Confidentiality,
  Evidence,
  Existence,
  Locale,
  Metric,
} from '../schema'

export const CONTENT_LOCALES: readonly Locale[] = ['es', 'en']

/** Idioma fuente (05: César escribe es.mdx); nunca puede faltar. */
export const SOURCE_LOCALE: Locale = 'es'

/** Verificación 8. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/

/** 12: la descripción mide 110–160 caracteres. */
export const DESCRIPTION_LENGTH = { min: 110, max: 160 } as const

/** 06: la tabla de failure modes tiene de 3 a 6 filas. */
export const FAILURE_MODE_ROWS = { min: 3, max: 6 } as const

// Record exhaustivo: si CaseSectionId cambia y esta lista no, no compila.
const SECTION_IDS: Record<CaseSectionId, true> = {
  context: true,
  problem: true,
  role: true,
  constraints: true,
  architecture: true,
  decisions: true,
  tradeoffs: true,
  security: true,
  'failure-modes': true,
  implementation: true,
  result: true,
  lessons: true,
}

function isCaseSectionId(id: string): id is CaseSectionId {
  return Object.hasOwn(SECTION_IDS, id)
}

const repeatedIn = (values: readonly string[]) => [...new Set(values.filter((v, i) => values.indexOf(v) !== i))]

// ---------------------------------------------------------------------------------------------
// MDX sin compilar

/** Quita bloques de código (``` o ~~~) y código en línea: lo que hay dentro no es estructura. */
export function stripCode(mdx: string): string {
  return mdx.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm, '').replace(/`[^`\n]*`/g, '')
}

/** Ids de cada `<Section>` en orden de aparición. Un `<Section>` sin id aparece como `''`. */
export function sectionIds(mdx: string): string[] {
  return componentRefs(mdx, 'Section')
}

/** Valor del atributo `id` de cada `<Name …>` en orden; `''` si no tiene. */
export function componentRefs(mdx: string, name: string): string[] {
  const ids: string[] = []
  for (const match of stripCode(mdx).matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'g'))) {
    const attrs = match[1] ?? ''
    const id = /\bid=(?:"([^"]*)"|'([^']*)')/.exec(attrs)
    ids.push(id?.[1] ?? id?.[2] ?? '')
  }
  return ids
}

/** Contenido de cada `<Section id>`, por id (las secciones no se anidan). */
export function sectionBodies(mdx: string): Map<string, string> {
  const bodies = new Map<string, string>()
  for (const match of stripCode(mdx).matchAll(/<Section\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/Section>/g)) {
    bodies.set(match[1] ?? '', match[2] ?? '')
  }
  return bodies
}

/**
 * 05 §Prosa en MDX, sobre el texto: solo los componentes permitidos, con atributos de texto; sin
 * import/export, sin HTML crudo, sin fragmentos y sin expresiones que no sean comentarios.
 */
export function mdxSyntaxProblems(mdx: string): string[] {
  const allowed = new Set<string>(MDX_COMPONENTS)
  const text = stripCode(mdx)
  const problems: string[] = []
  if (/^(?:import|export)\s/m.test(text)) problems.push('import/export no permitido dentro del MDX')
  if (/<>|<\/>/.test(text)) problems.push('fragmento JSX no permitido')
  for (const match of text.matchAll(/<([A-Za-z][\w.]*)([^>]*)>/g)) {
    const name = match[1] ?? ''
    const attrs = (match[2] ?? '').replace(/\/$/, '')
    if (/^[a-z]/.test(name)) problems.push(`HTML crudo no permitido: <${name}>`)
    else if (!allowed.has(name)) problems.push(`componente no permitido: <${name}>`)
    if (!/^(?:\s+[A-Za-z]+="[^"]*")*\s*$/.test(attrs)) problems.push(`<${name}> solo admite atributos de texto`)
  }
  const withoutComments = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/<[A-Za-z][^>]*>/g, '')
  if (/(?<!\\)\{/.test(withoutComments)) problems.push('expresión no permitida (solo comentarios {/* … */})')
  return [...new Set(problems)]
}

// ---------------------------------------------------------------------------------------------
// Índices publicados (verificaciones 3, 4 y 8)

export interface PublishedEntry {
  slug: string
  existence: Existence
  confidentiality: Confidentiality
}

export function checkPublishedIndex(index: string, entries: readonly PublishedEntry[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    const at = `${index}/${entry.slug}`
    if (!SLUG_PATTERN.test(entry.slug)) problems.push(`${at}: el slug no cumple ${String(SLUG_PATTERN)}`)
    if (seen.has(entry.slug)) problems.push(`${at}: slug repetido`)
    seen.add(entry.slug)
    if (entry.confidentiality === 'confidential') problems.push(`${at}: una entidad confidencial no se publica`)
    if (entry.existence === 'planned') problems.push(`${at}: lo planeado solo va en roadmap.ts`)
  }
  return problems
}

// ---------------------------------------------------------------------------------------------
// Caso de estudio (verificaciones 1, 2, 3, 5 y 6, más textos Localized no vacíos)

export interface ContentFiles {
  /** Fuente de cada MDX, por ruta. */
  sources: ReadonlyMap<string, string>
  /** Todas las rutas de archivo conocidas (MDX y evidencia). */
  files: ReadonlySet<string>
  /** Diagramas del caso (content/projects/<slug>/diagrams.ts). */
  diagrams?: readonly ArchitectureGraph[]
}

export function checkCaseEntity(meta: CaseStudyMeta, dir: string, content: ContentFiles): string[] {
  const { sources, files } = content
  const at = meta.slug
  const problems: string[] = []

  // 2 · meta.sections válido
  const unknown = meta.sections.filter((id) => !isCaseSectionId(id))
  if (unknown.length > 0) problems.push(`${at}: secciones desconocidas en meta.sections: ${unknown.join(', ')}`)
  const repeated = repeatedIn(meta.sections)
  if (repeated.length > 0) problems.push(`${at}: secciones repetidas en meta.sections: ${repeated.join(', ')}`)

  for (const locale of CONTENT_LOCALES) {
    // 1 · ambos idiomas (un draft puede no tener aún el que no es fuente)
    const path = `${dir}/${locale}.mdx`
    const source = sources.get(path)
    if (source === undefined) {
      if (locale === SOURCE_LOCALE || meta.publication === 'published') problems.push(`${at}: falta ${locale}.mdx`)
      continue
    }
    // 2 · <Section id> del MDX = meta.sections, en el mismo orden
    const found = sectionIds(source)
    if (found.includes('')) problems.push(`${at}: ${locale}.mdx tiene un <Section> sin id`)
    if (found.join(',') !== meta.sections.join(',')) {
      problems.push(
        `${at}: las secciones de ${locale}.mdx [${found.join(', ')}] no coinciden con meta.sections [${meta.sections.join(', ')}]`,
      )
    }
    problems.push(...mdxSyntaxProblems(source).map((problem) => `${at}: ${locale}.mdx: ${problem}`))
    problems.push(...checkReferences(meta, locale, source))
  }

  problems.push(...checkIds(meta))
  problems.push(...checkDescription(meta))
  problems.push(...checkDiagramsOf(meta, content.diagrams ?? []))
  problems.push(...checkDates(meta))
  problems.push(...(meta.evidence ?? []).flatMap((item, i) => checkEvidence(at, i, item, dir, files)))
  problems.push(...emptyLocalized(meta).map((path) => `${at}: texto vacío en ${path}`))
  return problems
}

/**
 * Lo que el MDX coloca existe en meta.ts y está donde debe: cada decisión una vez, dentro de
 * "decisions"; cada métrica al menos una vez; los diagramas de meta.diagrams y solo esos; la tabla de
 * failure modes una vez, dentro de su sección, si la sección existe.
 */
function checkReferences(meta: CaseStudyMeta, locale: Locale, source: string): string[] {
  const at = `${meta.slug}: ${locale}.mdx`
  const problems: string[] = []
  const bodies = sectionBodies(source)

  const decisionIds = meta.decisions.map((decision) => decision.id)
  const decisionRefs = componentRefs(source, 'Decision')
  if ([...decisionRefs].sort().join(',') !== [...decisionIds].sort().join(',')) {
    problems.push(
      `${at}: <Decision> [${decisionRefs.join(', ')}] no coincide con meta.decisions [${decisionIds.join(', ')}]`,
    )
  }
  const inDecisions = componentRefs(bodies.get('decisions') ?? '', 'Decision')
  if (decisionRefs.length > 0 && inDecisions.length !== decisionRefs.length) {
    problems.push(`${at}: cada <Decision> va dentro de <Section id="decisions">`)
  }

  const metricIds = new Set((meta.metrics ?? []).map((metric) => metric.id))
  const metricRefs = componentRefs(source, 'Metric')
  for (const id of metricRefs.filter((ref) => !metricIds.has(ref)))
    problems.push(`${at}: <Metric id="${id}"> no existe en meta.metrics`)
  for (const id of [...metricIds].filter((metric) => !metricRefs.includes(metric))) {
    problems.push(`${at}: la métrica "${id}" no aparece en el MDX`)
  }

  const diagramIds = meta.diagrams ?? []
  const diagramRefs = componentRefs(source, 'Diagram')
  if ([...new Set(diagramRefs)].sort().join(',') !== [...diagramIds].sort().join(',')) {
    problems.push(
      `${at}: <Diagram> [${diagramRefs.join(', ')}] no coincide con meta.diagrams [${diagramIds.join(', ')}]`,
    )
  }

  const tables = (stripCode(source).match(/<FailureModes\b/g) ?? []).length
  const inSection = (bodies.get('failure-modes')?.match(/<FailureModes\b/g) ?? []).length
  if (meta.sections.includes('failure-modes')) {
    if (tables !== 1 || inSection !== 1) problems.push(`${at}: <FailureModes /> va una vez, dentro de su sección`)
  } else if (tables > 0) {
    problems.push(`${at}: <FailureModes /> sin la sección failure-modes en meta.sections`)
  }
  return problems
}

function checkIds(meta: CaseStudyMeta): string[] {
  const at = meta.slug
  const problems: string[] = []
  const groups = {
    decisions: meta.decisions.map((decision) => decision.id),
    metrics: (meta.metrics ?? []).map((metric) => metric.id),
    failureModes: (meta.failureModes ?? []).map((mode) => mode.id),
    diagrams: meta.diagrams ?? [],
  }
  for (const [group, ids] of Object.entries(groups)) {
    const repeated = repeatedIn(ids)
    if (repeated.length > 0) problems.push(`${at}: ids repetidos en ${group}: ${repeated.join(', ')}`)
    const invalid = ids.filter((id) => !SLUG_PATTERN.test(id))
    if (invalid.length > 0)
      problems.push(`${at}: ids que no cumplen ${String(SLUG_PATTERN)} en ${group}: ${invalid.join(', ')}`)
  }
  const rows = meta.failureModes?.length ?? 0
  if (meta.sections.includes('failure-modes') && (rows < FAILURE_MODE_ROWS.min || rows > FAILURE_MODE_ROWS.max)) {
    problems.push(`${at}: la tabla de failure modes tiene ${String(rows)} filas (06: de 3 a 6)`)
  }
  return problems
}

/** 12: 110–160 caracteres y sin números (un snippet no puede mostrar la fuente de un dato). */
function checkDescription(meta: CaseStudyMeta): string[] {
  return CONTENT_LOCALES.flatMap((locale) => {
    const text = meta.description[locale]
    const problems: string[] = []
    if (text.length < DESCRIPTION_LENGTH.min || text.length > DESCRIPTION_LENGTH.max) {
      problems.push(`${meta.slug}: description.${locale} mide ${String(text.length)} caracteres (12: 110–160)`)
    }
    if (/\d/.test(text)) problems.push(`${meta.slug}: description.${locale} tiene números (12)`)
    return problems
  })
}

function checkDiagramsOf(meta: CaseStudyMeta, diagrams: readonly ArchitectureGraph[]): string[] {
  const known = new Set(diagrams.map((graph) => graph.id))
  return [
    ...(meta.diagrams ?? [])
      .filter((id) => !known.has(id))
      .map((id) => `${meta.slug}: meta.diagrams pide "${id}", que no está en diagrams.ts`),
    ...diagrams.flatMap((graph) => checkGraph(graph).map((problem) => `${meta.slug}: ${problem}`)),
  ]
}

// ---------------------------------------------------------------------------------------------
// Diagramas (03 §Diagramas, 05 ArchitectureGraph)

/**
 * Estructura de un grafo: ids únicos, aristas y fronteras entre nodos que existen, grilla que ubica
 * cada nodo exactamente una vez en un rectángulo, orden vertical completo, y fronteras que no encierran
 * nodos ajenos en ninguna de las dos variantes.
 */
export function checkGraph(graph: ArchitectureGraph): string[] {
  const at = `diagrama ${graph.id}`
  const problems: string[] = []
  const ids = graph.nodes.map((node) => node.id)
  const known = new Set(ids)
  const repeated = repeatedIn(ids)
  if (repeated.length > 0) problems.push(`${at}: nodos repetidos: ${repeated.join(', ')}`)

  const edgeKeys = graph.edges.map((edge) => `${edge.from}→${edge.to}`)
  for (const edge of graph.edges) {
    for (const end of [edge.from, edge.to]) {
      if (!known.has(end)) problems.push(`${at}: la arista ${edge.from}→${edge.to} usa "${end}", que no es un nodo`)
    }
    if (edge.from === edge.to) problems.push(`${at}: la arista ${edge.from}→${edge.to} vuelve al mismo nodo`)
  }
  for (const key of repeatedIn(edgeKeys)) problems.push(`${at}: arista repetida ${key}`)

  // Grilla: cada nodo una vez, en un rectángulo completo.
  const cells = new Map<string, Array<[number, number]>>()
  graph.layout.grid.forEach((row, r) => {
    row.forEach((id, c) => {
      if (id) cells.set(id, [...(cells.get(id) ?? []), [r, c]])
    })
  })
  for (const id of cells.keys()) if (!known.has(id)) problems.push(`${at}: la grilla usa "${id}", que no es un nodo`)
  for (const id of ids) {
    const own = cells.get(id)
    if (!own) {
      problems.push(`${at}: el nodo "${id}" no está en la grilla`)
      continue
    }
    const rows = own.map(([r]) => r)
    const cols = own.map(([, c]) => c)
    const area = (Math.max(...rows) - Math.min(...rows) + 1) * (Math.max(...cols) - Math.min(...cols) + 1)
    if (area !== own.length) problems.push(`${at}: las celdas de "${id}" no forman un rectángulo`)
  }

  const vertical = graph.layout.vertical
  if (vertical && [...vertical].sort().join(',') !== [...ids].sort().join(',')) {
    problems.push(`${at}: layout.vertical no tiene exactamente los nodos del diagrama`)
  }
  const order = vertical ?? [...cells.keys()]

  for (const boundary of graph.boundaries ?? []) {
    const members = new Set(boundary.nodes)
    for (const id of boundary.nodes) {
      if (!known.has(id)) problems.push(`${at}: la frontera ${boundary.id} usa "${id}", que no es un nodo`)
    }
    const positions = boundary.nodes.flatMap((id) => cells.get(id) ?? [])
    if (positions.length === 0) continue
    const [r0, r1] = [Math.min(...positions.map(([r]) => r)), Math.max(...positions.map(([r]) => r))]
    const [c0, c1] = [Math.min(...positions.map(([, c]) => c)), Math.max(...positions.map(([, c]) => c))]
    const intruders = new Set<string>()
    graph.layout.grid.slice(r0, r1 + 1).forEach((row) => {
      row.slice(c0, c1 + 1).forEach((id) => {
        if (id && !members.has(id)) intruders.add(id)
      })
    })
    if (intruders.size > 0) problems.push(`${at}: la frontera ${boundary.id} encierra a ${[...intruders].join(', ')}`)
    const indexes = boundary.nodes.map((id) => order.indexOf(id)).sort((a, b) => a - b)
    const first = indexes[0] ?? 0
    if (indexes.some((index, i) => index !== first + i)) {
      problems.push(`${at}: en la variante vertical, la frontera ${boundary.id} no es contigua`)
    }
  }
  return problems
}

/** 5 · fechas válidas: periodo 'YYYY-MM', fechas 'YYYY-MM-DD' que existen en el calendario. */
function checkDates(meta: CaseStudyMeta): string[] {
  const at = meta.slug
  const problems: string[] = []
  const { start, end } = meta.period
  if (!isYearMonth(start)) problems.push(`${at}: period.start "${start}" no es YYYY-MM`)
  if (end !== null && !isYearMonth(end)) problems.push(`${at}: period.end "${end}" no es YYYY-MM`)
  if (end !== null && isYearMonth(start) && isYearMonth(end) && end < start) {
    problems.push(`${at}: period.end es anterior a period.start`)
  }
  if (!isIsoDate(meta.updatedAt))
    problems.push(`${at}: updatedAt "${meta.updatedAt}" no es una fecha YYYY-MM-DD válida`)
  ;(meta.metrics ?? []).forEach((metric, i) => {
    const date = metricDate(metric)
    if (date !== null && !isIsoDate(date))
      problems.push(`${at}: metrics[${String(i)}] tiene la fecha inválida "${date}"`)
  })
  return problems
}

function metricDate({ source }: Metric): string | null {
  switch (source.type) {
    case 'measured':
      return source.date
    case 'repository':
      return source.countedAt
    case 'simulated':
      return null
  }
}

export function isYearMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** 6 · alt y leyenda en ambos idiomas, archivo existente; 3 · nada confidencial. */
function checkEvidence(at: string, index: number, item: Evidence, dir: string, files: ReadonlySet<string>): string[] {
  const where = `${at}: evidence[${String(index)}]`
  const problems: string[] = []
  for (const locale of CONTENT_LOCALES) {
    if (!item.alt[locale].trim()) problems.push(`${where} sin alt en ${locale}`)
    if (!item.caption[locale].trim()) problems.push(`${where} sin leyenda en ${locale}`)
  }
  if (item.src !== undefined && !files.has(`${dir}/${item.src}`)) {
    problems.push(`${where}: no existe el archivo ${item.src}`)
  }
  // El tipo ya lo impide; esto cubre datos que entren con una aserción.
  if ((item.confidentiality as Confidentiality) === 'confidential') problems.push(`${where} es confidencial`)
  return problems
}

/** Rutas de cada valor Localized ({ es, en }) con un texto vacío o una lista vacía. */
export function emptyLocalized(value: unknown, path = ''): string[] {
  if (typeof value !== 'object' || value === null) return []
  if (Array.isArray(value)) return value.flatMap((item, i) => emptyLocalized(item, `${path}[${String(i)}]`))

  const entries = Object.entries(value)
  const keys = entries.map(([key]) => key).sort()
  if (keys.join(',') === [...CONTENT_LOCALES].sort().join(',')) {
    return entries.filter(([, text]) => isEmptyText(text)).map(([locale]) => `${path}.${locale}`)
  }
  return entries.flatMap(([key, child]) => emptyLocalized(child, path ? `${path}.${key}` : key))
}

function isEmptyText(text: unknown): boolean {
  if (typeof text === 'string') return text.trim() === ''
  if (Array.isArray(text)) return text.length === 0 || text.some((item) => isEmptyText(item))
  return false
}

// ---------------------------------------------------------------------------------------------
// Enlaces relacionados (verificación 7)

export interface KnownEntities {
  cases: ReadonlySet<string>
  judgment: ReadonlySet<string>
  adrs: ReadonlySet<string>
}

export function checkRelated(meta: CaseStudyMeta, known: KnownEntities): string[] {
  const related = meta.related ?? {}
  return (['cases', 'judgment', 'adrs'] as const).flatMap((kind) =>
    (related[kind] ?? [])
      .filter((slug) => !known[kind].has(slug))
      .map((slug) => `${meta.slug}: related.${kind} apunta a "${slug}", que no existe`),
  )
}
