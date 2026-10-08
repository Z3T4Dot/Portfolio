# 05 · Content architecture blueprint

**Objetivo:** proyectos, experiencia, habilidades, ADRs, ensayos y textos ES/EN desacoplados de los
componentes. Cambiar de idioma no duplica componentes ni datos que no se traducen.

## Opciones evaluadas

### A. Árbol por idioma (propuesta inicial)

```text
content/es/projects/…   content/en/projects/…
```

- **A favor:** quien traduce ve un idioma completo.
- **En contra:** los datos que no se traducen (stack, fechas, estado, clasificación, diagramas,
  evidencia, slugs) quedan duplicados o partidos entre carpetas, y con el tiempo se desincronizan
  (el stack de Quantum distinto en ES y EN). Agregar un proyecto obliga a tocar dos árboles.
  Verificar la paridad es difícil.

### B. Entidad primero, prosa por idioma (recomendada)

```text
content/projects/quantum/meta.ts   ← datos neutrales, una sola vez
content/projects/quantum/es.mdx    ← prosa en español
content/projects/quantum/en.mdx    ← prosa en inglés
```

- **A favor:** cada dato existe una sola vez. Las dos prosas están lado a lado. La paridad se
  verifica de forma trivial (cada carpeta tiene ambos archivos). Agregar un proyecto es agregar
  una carpeta.
- **En contra:** quien traduce trabaja entidad por entidad. Para un sitio con una sola persona
  escribiendo, no es un costo real.

### C. Todo en objetos TS con `{ es, en }`

- **A favor:** todo tipado.
- **En contra:** la prosa larga en strings de TS es incómoda (escapes, sin Markdown, difícil de
  revisar).
- **Uso:** solo para textos cortos y estructurados dentro de `meta.ts`.

**Decisión:** B para la prosa larga y campos `Localized` (C) para los textos cortos dentro de
`meta.ts`. Sin librería de i18n: el router da el idioma y un helper tipado resuelve los textos
(ADR-0003).

## Estructura

```text
src/content/
├── schema.ts                       tipos de todo el contenido (fuente de verdad)
├── site.ts                         nombre, posicionamiento, enlaces, contacto (Localized)
├── about/
│   ├── meta.ts                     pilares, habilidades, etapas del timeline (con slugs)
│   ├── es.mdx                      introducción y "cómo trabajo"
│   └── en.mdx
├── projects/
│   ├── index.ts                    orden de los casos (único archivo que los lista)
│   └── quantum/
│       ├── meta.ts                 CaseStudyMeta
│       ├── diagrams.ts             ArchitectureGraph[] con etiquetas Localized
│       ├── es.mdx
│       └── en.mdx
├── security/
│   ├── index.ts
│   └── wazuh-soc-lab/
│       ├── meta.ts                 LabMeta (capítulos, evidencia)
│       ├── diagrams.ts
│       ├── evidence/               capturas ya sanitizadas (AVIF/WebP)
│       ├── es.mdx
│       └── en.mdx
├── judgment/
│   ├── index.ts
│   └── <slug>/  meta.ts, es.mdx, en.mdx
├── adrs/
│   ├── index.ts
│   └── 0001-<slug>/  meta.ts, es.mdx, en.mdx
├── selected-work/
│   ├── index.ts                    orden de las fichas
│   └── <slug>.ts                   SelectedWorkMeta (textos cortos Localized, sin MDX)
├── roadmap.ts                      "Lo que viene": solo entradas PLANEADAS
└── __tests__/content.test.ts       verificación de integridad (abajo)
```

Los mensajes de interfaz (botones, navegación, etiquetas) viven en `src/i18n/messages/es.ts` y
`en.ts`:

```ts
// es.ts define la forma; en.ts debe cumplirla o no compila.
export const es = { nav: { work: 'Trabajo', security: 'Seguridad' /* … */ } } as const
export type Messages = DeepStringify<typeof es>
export const en = { nav: { work: 'Work', security: 'Security' } } satisfies Messages
```

El juego mantiene sus textos dentro de `game/` con las mismas reglas (09).

Los ADRs de este sitio viven solo en `content/adrs/`. `docs/adr/README.md` enlaza allí: una sola
fuente de verdad.

## Esquema (resumen de `schema.ts`)

```ts
export type Locale = 'es' | 'en'
export type Localized<T = string> = Record<Locale, T>

// Contrato de autenticidad (00)
export type Existence = 'real' | 'experiment' | 'planned'
export type ProjectKind = 'product' | 'lab' | 'spike'   // un lab REAL no se presenta como producto
// draft: se desarrolla y se prueba, pero el build de producción no genera su ruta, ni su entrada en
// el sitemap, ni enlaces hacia él. Ejemplo: Quantum y KeepMe hasta tener el permiso de Brandex (G3).
export type Publication = 'draft' | 'published'
export type Confidentiality = 'public' | 'sanitized' | 'confidential'
export type MetricSource =
  | { type: 'measured'; tool: string; date: string; method: Localized }
  | { type: 'repository'; countedAt: string; how: Localized }
  | { type: 'simulated'; note: Localized }

export interface Metric { value: string; label: Localized; source: MetricSource }

export type CaseSectionId =
  | 'context' | 'problem' | 'role' | 'constraints' | 'architecture' | 'decisions'
  | 'tradeoffs' | 'security' | 'failure-modes' | 'implementation' | 'result' | 'lessons'

export interface CaseStudyMeta {
  slug: string
  existence: Exclude<Existence, 'planned'>      // lo PLANEADO no puede ser un caso
  publication: Publication
  projectKind: ProjectKind
  confidentiality: Exclude<Confidentiality, 'confidential'>
  title: Localized
  kind: Localized                                // "Plataforma de operaciones para eventos"
  summary: Localized                             // 60–90 palabras ("En 30 segundos")
  role: Localized
  period: { start: string; end: string | null }  // 'YYYY-MM'
  team?: Localized                               // PENDIENTE si no se conoce
  stack: string[]
  pillars: Array<'engineering' | 'security' | 'leadership' | 'business-systems'>
  sections: CaseSectionId[]                      // orden y presencia; debe coincidir con el MDX
  decisions: Array<{ id: string; title: Localized; adr?: string }>
  metrics?: Metric[]
  diagrams?: string[]                            // ids en diagrams.ts
  evidence?: Evidence[]
  related?: { judgment?: string[]; adrs?: string[]; cases?: string[] }
  canonical?: string                             // p. ej. el lab vive en /security/…
  updatedAt: string
}

// Selected Work: trabajo para clientes confidenciales. Ficha breve, sin página ni MDX.
// Vive en content/selected-work/<slug>.ts.
export interface SelectedWorkMeta {
  slug: string
  existence: 'real'
  publication: Publication
  confidentiality: 'sanitized'                   // el cliente nunca se nombra
  what: Localized                                // "Plataforma de inscripción para … un cliente corporativo"
  role: Localized                                // atribución exacta del registro de hechos
  built: Localized<string[]>                     // 2–4 aportes concretos
  stack: string[]                                // alto nivel, sin versiones
  status: { state: 'production' | 'delivered'; year: number }
}

export interface Evidence {
  kind: 'screenshot' | 'diagram' | 'snippet' | 'document'
  src?: string
  alt: Localized
  caption: Localized
  confidentiality: Exclude<Confidentiality, 'confidential'>
  sanitizedNote?: Localized                      // qué se ocultó
}

export interface ArchitectureGraph {
  id: string
  title: Localized
  nodes: Array<{ id: string; label: Localized; kind: 'client' | 'edge' | 'service' | 'datastore'
    | 'queue' | 'external' | 'observability'; description: Localized; controls?: Localized<string[]> }>
  edges: Array<{ from: string; to: string; label?: Localized; protocol?: string }>
  boundaries?: Array<{ id: string; label: Localized; nodes: string[] }>
  mobileLayout?: 'vertical' | 'simplified'
}
```

`Metric` no se puede crear sin `source`: el contrato de autenticidad se aplica en el compilador.

## Prosa en MDX

Cada sección del caso es un componente explícito, sin depender de la convención de títulos:

```mdx
<Section id="problem">
El inventario se gestionaba en hojas de cálculo por bodega…
</Section>

<Section id="decisions">
<Decision id="authz-central">
…
</Decision>
</Section>
```

- Componentes permitidos en MDX: `Section`, `Decision`, `FailureModes`, `Figure`, `Diagram`,
  `Callout`, `Metric`, `Tag`, más bloques de código Markdown. No se permiten `import` dentro del
  MDX: lo verifica un plugin de remark en build.
- Código en línea con backticks. Sin HTML crudo.
- Párrafos cortos. Encabezados internos desde h3.

## Verificación de integridad (rompe el build)

`content.test.ts` corre en CI antes del build:

1. Cada entidad publicada tiene `es.mdx` y `en.mdx` (en desarrollo y preview se permite que falte
   `en` con un aviso visible; en producción, no).
2. Los ids de `<Section>` en cada MDX coinciden exactamente con `meta.sections`, en ambos idiomas.
3. Ninguna entidad `confidential` aparece en un índice publicado.
4. Ninguna entidad `planned` aparece fuera de `roadmap.ts`.
5. Cada `Metric` tiene fuente (garantizado por tipos) y las fechas son válidas.
6. Cada `Evidence` tiene `alt` y `caption` en ambos idiomas, y el archivo existe.
7. Los enlaces `related` (judgment, adrs, cases) apuntan a entidades que existen.
8. Los slugs son únicos y cumplen `^[a-z0-9-]+$`.
9. `messages/en.ts` cumple el tipo de `es.ts` (garantizado por el compilador).
10. **Ningún `draft` es alcanzable en producción.** El filtro vive en la capa de contenido: los índices
    publicados, la lista de rutas a prerenderizar, el sitemap y los enlaces relacionados se construyen
    solo con entidades `published`. Un test sobre el build de producción falla si aparece la ruta, la
    entrada del sitemap o un enlace hacia un `draft`. Esconderlo en la interfaz no cuenta.

## Flujo de escritura

1. César escribe `meta.ts` y `es.mdx` (o los revisa si los redacta un agente desde la investigación).
2. Revisión de sanitización con la checklist de 06.
3. Pase de traducción: `en.mdx` en inglés natural, no literal.
4. PR: verificación de integridad en verde, revisión de clasificación, preview desplegado.

## Voz y honestidad

- Primera persona, verbos concretos, frases cortas. Sin adjetivos de venta.
- Cada decisión, con su porqué y su costo: "Elegí X porque Y; el costo fue Z".
- Primero lo que el lector entiende ("las sesiones robadas se detectan") y después el detalle técnico
  ("rotación de refresh tokens con detección de reutilización por `jti`").
- Español neutro (Latinoamérica) e inglés natural. Ambos dicen lo mismo.
- Títulos en sentence case, sin emojis.
- Lo que no se puede verificar no se publica; queda como PENDIENTE en las notas privadas.
