// Tipos de todo el contenido: fuente de verdad (docs/blueprint/05-content-architecture.md).
// Solo tipos: los archivos de content/ los importan con `import type`. Lo que el sistema de tipos
// no puede expresar (slugs únicos, fechas válidas, texto no vacío, paridad del MDX) lo verifica
// content/__tests__/content.test.ts.

export type Locale = 'es' | 'en'
export type Localized<T = string> = Record<Locale, T>

// Contrato de autenticidad (00)
export type Existence = 'real' | 'experiment' | 'planned'
export type ProjectKind = 'product' | 'lab' | 'spike' // un lab REAL no se presenta como producto
// draft: se desarrolla y se prueba, pero el build de producción no genera su ruta, ni su entrada en
// el sitemap, ni enlaces hacia él (05, verificación 10). El filtro vive en content/publication.ts.
export type Publication = 'draft' | 'published'
export type Confidentiality = 'public' | 'sanitized' | 'confidential'
export type MetricSource =
  | { type: 'measured'; tool: string; date: string; method: Localized }
  | { type: 'repository'; countedAt: string; how: Localized }
  | { type: 'simulated'; note: Localized }

// Sin `source` no compila: el contrato de autenticidad se aplica en el compilador.
export interface Metric {
  value: string
  label: Localized
  source: MetricSource
}

/** Pilares del perfil (01 §Perfil profesional a comunicar). */
export type Pillar = 'engineering' | 'security' | 'leadership' | 'business-systems'

/**
 * Dato que César aún no entregó (15, tarea C4). Nunca se inventa un valor: en desarrollo se ve un
 * aviso, en producción no se renderiza nada y el build de lanzamiento falla si queda alguno (16:
 * "Sin PENDIENTE visible"; scripts/lib/launch.ts).
 */
export interface Pending {
  /** Qué falta, para el aviso de desarrollo. */
  pending: string
}
export type OrPending<T> = T | Pending

export type CaseSectionId =
  | 'context'
  | 'problem'
  | 'role'
  | 'constraints'
  | 'architecture'
  | 'decisions'
  | 'tradeoffs'
  | 'security'
  | 'failure-modes'
  | 'implementation'
  | 'result'
  | 'lessons'

export interface CaseStudyMeta {
  slug: string
  existence: Exclude<Existence, 'planned'> // lo PLANEADO no puede ser un caso
  publication: Publication
  projectKind: ProjectKind
  confidentiality: Exclude<Confidentiality, 'confidential'>
  title: Localized
  kind: Localized // "Plataforma de operaciones para eventos"
  problem: Localized // el problema en una línea (02: Home bloque 2 e índice de /work)
  highlight: Localized // una decisión o hallazgo en una línea (02: Home bloque 2)
  summary: Localized // 60–90 palabras ("En 30 segundos")
  // 12 §Patrones de descripción: el problema y la decisión principal en una frase, 110–160
  // caracteres y sin números (meta description y og:description). Lo verifica content.test.ts.
  description: Localized
  role: Localized
  period: { start: string; end: string | null } // 'YYYY-MM'
  team?: Localized // PENDIENTE si no se conoce
  stack: string[]
  pillars: Pillar[]
  sections: CaseSectionId[] // orden y presencia; debe coincidir con el MDX
  // Cada decisión se coloca en el MDX con <Decision id>; sus campos viven aquí para que el formato
  // de 06 sea el mismo en ambos idiomas y no dependa de la prosa.
  decisions: CaseDecision[]
  metrics?: CaseMetric[] // cada una se coloca en el MDX con <Metric id>
  failureModes?: FailureMode[] // la tabla de 06, que el MDX coloca con <FailureModes />
  diagrams?: string[] // ids en diagrams.ts; el MDX los coloca con <Diagram id>
  evidence?: Evidence[]
  related?: { judgment?: string[]; adrs?: string[]; cases?: string[] }
  canonical?: string // p. ej. el lab vive en /security/…
  updatedAt: string
}

/** Respuesta a "¿Lo repetiría?" (06 §Formato de una decisión). */
export type RepeatAnswer = 'yes' | 'no' | 'nuanced'

/**
 * Decisión en el formato de 06: contexto, opciones, elección (cuál y por qué), costo, ¿lo
 * repetiría? y ADR. `repeat` solo existe si César dio su respuesta: sin material validado, el
 * bloque queda más corto en lugar de rellenarse (06).
 */
export interface CaseDecision {
  id: string
  title: Localized
  context: Localized
  options: Localized<string[]>
  choice: Localized
  cost: Localized
  repeat?: { answer: RepeatAnswer; reason: Localized }
  adr?: string // id de un ADR de este sitio (content/adrs), si existe
}

/** Métrica referenciable desde el MDX. La fuente sigue siendo obligatoria (Metric). */
export interface CaseMetric extends Metric {
  id: string
}

/**
 * Fila de la tabla de failure modes (06): solo fallas cuya mitigación existe en el código o en la
 * documentación, redactadas sin nombres internos ni debilidades explotables (sanitización de 06).
 */
export interface FailureMode {
  id: string
  failure: Localized
  detection: Localized
  impact: Localized
  mitigation: Localized
  residual: Localized
}

// Identidad del sitio (05: content/site.ts). Los enlaces y el contacto se agregan con los datos de
// César (C4 en 15); no se inventan: mientras no existan son `Pending`.
export interface SiteMeta {
  name: string
  givenName: string // profile:first_name en About (12)
  familyName: string // profile:last_name en About (12)
  role: Localized // título de Home y jobTitle del JSON-LD (12); decidido por César el 2026-10-07 (01)
  positioning: Localized // frase de posicionamiento del hero (01, 02 Home bloque 1, 03 §Hero)
  contact: ContactMeta
}

/** Contacto (02 §Contact). Cada dato es real o `Pending`; nunca un valor de relleno. */
export interface ContactMeta {
  email: OrPending<string>
  linkedin: OrPending<string> // URL https del perfil
  github: OrPending<string> // URL https del perfil
  cv: Localized<OrPending<string>> // ruta del PDF en public/cv/ (04), por idioma
  location: OrPending<Localized>
  timezone: OrPending<string> // zona IANA, p. ej. America/Bogota
  availability: OrPending<Localized>
  roleSought: OrPending<Localized> // qué tipo de rol busca
}

// About (05: content/about/). Datos neutrales en meta.ts; prosa por idioma en es.ts y en.ts.

/** Etapa del Engineering Timeline (02 About, 03 Timeline). */
export interface TimelineStage {
  slug: string
  // draft: la etapa se ve en la vista previa de desarrollo, nunca en producción (05, verificación 10).
  publication: Publication
  start: string // 'YYYY-MM'
  end: string | null // null: en curso
  title: Localized
  summary?: Localized
  projects?: string[] // casos que abre la etapa (02); solo se enlazan los visibles
}

export interface AboutMeta {
  formalTitle: Localized // cargo formal, separado de las responsabilidades reales
  responsibilities: Localized<string[]> // responsabilidades reales, por área
  education: Localized
  pillars: Array<{ id: Pillar; skills: Localized<string[]> }> // lista simple, sin niveles (02)
  timeline: TimelineStage[] // en orden cronológico, desde la primera etapa con evidencia (07)
}

/** Prosa de About en un idioma. es.ts define el texto fuente; en.ts debe cumplir el mismo tipo. */
export interface AboutProse {
  intro: string[] // máximo 3 párrafos (02)
  principles: Array<{ title: string; body: string }> // "Cómo trabajo": 4–5 principios (02)
}

// Engineering Judgment (02, 05: content/judgment/). Lo mínimo que necesita el bloque "Cómo pienso"
// de Home; los ensayos completos (MDX, respaldo) llegan con F8.
export interface EssayMeta {
  slug: string
  publication: Publication
  title: Localized
  thesis: Localized // la tesis en una línea (02)
}

// Selected Work: trabajo para clientes confidenciales. Ficha breve, sin página ni MDX.
// Vive en content/selected-work/<slug>.ts.
export interface SelectedWorkMeta {
  slug: string
  existence: 'real'
  publication: Publication
  confidentiality: 'sanitized' // el cliente nunca se nombra
  what: Localized // "Plataforma de inscripción para … un cliente corporativo"
  role: Localized // atribución exacta del registro de hechos
  built: Localized<string[]> // 2–4 aportes concretos
  stack: string[] // alto nivel, sin versiones
  status: { state: 'production' | 'delivered'; year: number }
}

export interface Evidence {
  kind: 'screenshot' | 'diagram' | 'snippet' | 'document'
  src?: string
  alt: Localized
  caption: Localized
  confidentiality: Exclude<Confidentiality, 'confidential'>
  sanitizedNote?: Localized // qué se ocultó
}

/**
 * Tipo de nodo de un diagrama (05). Además de los componentes de arquitectura, `config` (módulos
 * declarativos), `step`, `event` y `outcome` describen pipelines y workflows (Q2 y Q3 de 07).
 */
export type DiagramNodeKind =
  | 'client'
  | 'edge'
  | 'service'
  | 'datastore'
  | 'queue'
  | 'external'
  | 'observability'
  | 'config'
  | 'step'
  | 'event'
  | 'outcome'

/**
 * Grafo tipado → SVG accesible (03 §Diagramas). `layout.grid` es la disposición de escritorio: filas
 * de arriba abajo; un id repetido ocupa varias celdas (siempre un rectángulo) y `null` deja la celda
 * vacía para que pasen las aristas. `layout.vertical` es el orden de la variante vertical de móvil
 * (por defecto, la grilla leída fila por fila). Sustituye a `mobileLayout` de 05: la variante
 * vertical existe siempre.
 */
export interface ArchitectureGraph {
  id: string
  title: Localized
  description: Localized // qué muestra; va en la leyenda y en la descripción accesible
  nodes: Array<{
    id: string
    label: Localized
    kind: DiagramNodeKind
    description: Localized
    controls?: Localized<string[]>
  }>
  edges: Array<{ from: string; to: string; label?: Localized; protocol?: string }>
  boundaries?: Array<{ id: string; label: Localized; nodes: string[] }>
  layout: { grid: Array<Array<string | null>>; vertical?: string[] }
}
