// Blueprint 06 (anatomía del caso: cabecera, "En 30 segundos", las doce secciones, cierre; tiempo de
// lectura), 04 §Flujo de datos (el loader obtiene la entidad por lang y slug; 404 si no existe) y 05
// verificación 10 (un draft solo existe en la vista previa de desarrollo).
//
// Solo lo importa el loader de routes/case.tsx, que corre en el build (prerender) o en el servidor de
// desarrollo. El cliente recibe únicamente lo que devuelve caseData, ya resuelto en su idioma.
import { allProjects, projectDiagrams } from '../../content/projects'
import { isPublished, visibleOnly } from '../../content/publication'
import type {
  ArchitectureGraph,
  CaseSectionId,
  CaseStudyMeta,
  Confidentiality,
  DiagramNodeKind,
  Existence,
  MetricSource,
  ProjectKind,
  RepeatAnswer,
} from '../../content/schema'
import { caseHref, createT, type Locale } from '../../i18n'
import { formatDate, formatMonthPeriod } from '../../lib/date'

export interface DecisionView {
  id: string
  title: string
  context: string
  options: string[]
  choice: string
  cost: string
  repeat: { answer: RepeatAnswer; reason: string } | null
  adr: string | null
}

export interface FailureModeView {
  id: string
  failure: string
  detection: string
  impact: string
  mitigation: string
  residual: string
}

export interface MetricView {
  id: string
  value: string
  label: string
  kind: MetricSource['type']
  /** Fuente en una frase, ya en el idioma de la página. */
  source: string
}

export interface DiagramView {
  id: string
  title: string
  description: string
  nodes: Array<{ id: string; label: string; kind: DiagramNodeKind; description: string; controls?: string[] }>
  edges: Array<{ from: string; to: string; label?: string }>
  boundaries: Array<{ id: string; label: string; nodes: string[] }>
  grid: Array<Array<string | null>>
  vertical?: string[]
}

export interface CaseData {
  locale: Locale
  slug: string
  /** Solo en la vista previa de desarrollo (SHOW_DRAFTS). */
  draft: boolean
  title: string
  kind: string
  description: string
  summary: string
  existence: Exclude<Existence, 'planned'>
  projectKind: ProjectKind
  confidentiality: Exclude<Confidentiality, 'confidential'>
  role: string
  team: string | null
  stack: string[]
  period: { dateTime: string; text: string }
  readingMinutes: number
  updatedAt: { dateTime: string; text: string }
  sections: Array<{ id: CaseSectionId; label: string }>
  decisions: Record<string, DecisionView>
  failureModes: FailureModeView[]
  metrics: Record<string, MetricView>
  diagrams: Record<string, DiagramView>
  /** Siguiente caso visible (02 §CTAs: "Siguiente caso"); `null` si es el último. */
  next: { title: string; href: string } | null
}

/** Prosa MDX sin compilar, por `"<slug>/<idioma>"`: solo para contar palabras (tiempo de lectura). */
export type ProseSources = Readonly<Record<string, () => Promise<string>>>

export interface CaseSources {
  projects: readonly CaseStudyMeta[]
  diagrams: Readonly<Record<string, readonly ArchitectureGraph[]>>
  prose: ProseSources
}

const RAW = import.meta.glob<string>('../../content/projects/*/*.mdx', { query: '?raw', import: 'default' })
const PROSE: ProseSources = Object.fromEntries(
  Object.entries(RAW).flatMap(([file, load]) => {
    const match = /projects\/([^/]+)\/([^/]+)\.mdx$/.exec(file)
    return match ? [[`${match[1] ?? ''}/${match[2] ?? ''}`, load]] : []
  }),
)

const SOURCES: CaseSources = { projects: allProjects, diagrams: projectDiagrams, prose: PROSE }

/** Palabras por minuto para el tiempo de lectura (06: "se muestra el tiempo de lectura"). */
export const WORDS_PER_MINUTE = 200

/** Palabras de un texto (letras o números; "V2", "CI/CD" y "30.000" cuentan como una). */
export function countWords(text: string): number {
  return text.match(/[\p{L}\p{N}]+(?:[./'’-][\p{L}\p{N}]+)*/gu)?.length ?? 0
}

/** Texto legible de un MDX: sin comentarios ni etiquetas de componentes. */
export function proseText(mdx: string): string {
  return mdx.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/<\/?[A-Z][^>]*>/g, ' ')
}

interface Options {
  /** SHOW_DRAFTS de src/env.ts: solo en desarrollo, activo por defecto. */
  includeDrafts: boolean
}

export async function caseData(
  locale: Locale,
  slug: string | undefined,
  { includeDrafts }: Options,
  sources: CaseSources = SOURCES,
): Promise<CaseData | null> {
  const visible = visibleOnly(sources.projects, includeDrafts)
  const position = visible.findIndex((entry) => entry.slug === slug)
  const entry = visible[position]
  if (!entry) return null
  const t = createT(locale)
  const following = visible[position + 1]

  const decisions = entry.decisions.map((decision): DecisionView => ({
    id: decision.id,
    title: decision.title[locale],
    context: decision.context[locale],
    options: decision.options[locale],
    choice: decision.choice[locale],
    cost: decision.cost[locale],
    repeat: decision.repeat ? { answer: decision.repeat.answer, reason: decision.repeat.reason[locale] } : null,
    adr: decision.adr ?? null,
  }))
  const failureModes = (entry.failureModes ?? []).map((mode): FailureModeView => ({
    id: mode.id,
    failure: mode.failure[locale],
    detection: mode.detection[locale],
    impact: mode.impact[locale],
    mitigation: mode.mitigation[locale],
    residual: mode.residual[locale],
  }))
  const metrics = (entry.metrics ?? []).map((metric): MetricView => ({
    id: metric.id,
    value: metric.value,
    label: metric.label[locale],
    kind: metric.source.type,
    source: metricSource(metric.source, locale),
  }))
  const graphs = (sources.diagrams[entry.slug] ?? []).filter((graph) => (entry.diagrams ?? []).includes(graph.id))

  // Tiempo de lectura: la prosa del idioma más lo que la página muestra desde meta.ts.
  const load = sources.prose[`${entry.slug}/${locale}`]
  const prose = load ? proseText(await load()) : ''
  const shown = [
    entry.summary[locale],
    ...decisions.flatMap((d) => [d.title, d.context, ...d.options, d.choice, d.cost, d.repeat?.reason ?? '']),
    ...failureModes.flatMap((m) => [m.failure, m.detection, m.impact, m.mitigation, m.residual]),
  ].join(' ')
  const words = countWords(prose) + countWords(shown)

  return {
    locale,
    slug: entry.slug,
    draft: !isPublished(entry),
    title: entry.title[locale],
    kind: entry.kind[locale],
    description: entry.description[locale],
    summary: entry.summary[locale],
    existence: entry.existence,
    projectKind: entry.projectKind,
    confidentiality: entry.confidentiality,
    role: entry.role[locale],
    team: entry.team?.[locale] ?? null,
    stack: entry.stack,
    period: { dateTime: entry.period.start, text: periodText(entry.period, locale) },
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    updatedAt: { dateTime: entry.updatedAt, text: formatDate(entry.updatedAt, locale) },
    sections: entry.sections.map((id) => ({ id, label: t(`caseStudy.sections.${id}`) })),
    decisions: Object.fromEntries(decisions.map((decision) => [decision.id, decision])),
    failureModes,
    metrics: Object.fromEntries(metrics.map((metric) => [metric.id, metric])),
    diagrams: Object.fromEntries(graphs.map((graph) => [graph.id, diagramView(graph, locale)])),
    next: following ? { title: following.title[locale], href: caseHref(locale, following) } : null,
  }
}

function periodText(period: CaseStudyMeta['period'], locale: Locale): string {
  const text = formatMonthPeriod(period.start, period.end, locale)
  return `${text.charAt(0).toLocaleUpperCase(locale)}${text.slice(1)}`
}

function metricSource(source: MetricSource, locale: Locale): string {
  const t = createT(locale)
  switch (source.type) {
    case 'repository':
      return `${t('caseStudy.metric.repository', { date: formatDate(source.countedAt, locale) })} ${source.how[locale]}`
    case 'measured':
      return `${t('caseStudy.metric.measured', { tool: source.tool, date: formatDate(source.date, locale) })} ${source.method[locale]}`
    case 'simulated':
      return source.note[locale]
  }
}

function diagramView(graph: ArchitectureGraph, locale: Locale): DiagramView {
  return {
    id: graph.id,
    title: graph.title[locale],
    description: graph.description[locale],
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      label: node.label[locale],
      kind: node.kind,
      description: node.description[locale],
      ...(node.controls ? { controls: node.controls[locale] } : {}),
    })),
    edges: graph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      ...(edge.label ? { label: edge.label[locale] } : {}),
    })),
    boundaries: (graph.boundaries ?? []).map((boundary) => ({
      id: boundary.id,
      label: boundary.label[locale],
      nodes: boundary.nodes,
    })),
    grid: graph.layout.grid,
    ...(graph.layout.vertical ? { vertical: graph.layout.vertical } : {}),
  }
}
