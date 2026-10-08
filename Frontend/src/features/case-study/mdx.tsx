// Blueprint 05 §Prosa en MDX: cada sección es un componente explícito (<Section id>) y el MDX solo usa
// los componentes permitidos (content/mdx.ts), que recibe en el render: no hay `import` dentro del MDX.
// Los datos de cada componente (decisiones, métricas, diagramas, failure modes) vienen del caso que
// provee CasePage, ya resueltos en el idioma de la página.
import { Children, createContext, isValidElement, use, type ReactNode } from 'react'
import { Diagram as DiagramFigure } from '../../components/diagram/Diagram'
import { Callout as CalloutNote } from '../../components/ui/Callout'
import { Figure as FigureBox } from '../../components/ui/Figure'
import { Metric as MetricValue } from '../../components/ui/Metric'
import { ClassificationTag } from '../../components/ui/Tag'
import type { MdxComponentName } from '../../content/mdx'
import { useLocale } from '../../i18n'
import type { CaseData } from './data'
import { DecisionBlock } from './DecisionBlock'
import { FailureModeTable } from './FailureModeTable'
import styles from './CasePage.module.css'

export const CaseContext = createContext<CaseData | null>(null)

function useCase(): CaseData {
  const data = use(CaseContext)
  if (!data) throw new Error('Los componentes del MDX de un caso necesitan CaseContext (CasePage).')
  return data
}

/** Un dato que el MDX pide y el caso no tiene: lo impide content.test.ts; aquí falla en voz alta. */
function missing(kind: string, id: string): never {
  throw new Error(`El MDX pide ${kind} "${id}", que no está en meta.ts`)
}

function Section({ id, children }: { id: string; children?: ReactNode }) {
  const { sections } = useCase()
  const section = sections.find((item) => item.id === id) ?? missing('la sección', id)
  return (
    // tabIndex -1: el índice de secciones lleva el foco al ancla (11 §5).
    <section id={id} aria-labelledby={`${id}-title`} tabIndex={-1} className={styles.section}>
      <h2 id={`${id}-title`}>{section.label}</h2>
      {groupMetrics(children)}
    </section>
  )
}

/**
 * Varias <Metric> seguidas en el MDX forman una fila que se reparte el ancho (03: el número manda,
 * sin tarjetas). El autor solo las escribe una tras otra.
 */
function groupMetrics(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = []
  let group: ReactNode[] = []
  const flush = () => {
    if (group.length > 0)
      out.push(
        <div key={`metrics-${String(out.length)}`} className={styles.metrics}>
          {group}
        </div>,
      )
    group = []
  }
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === Metric) group.push(child)
    else if (typeof child === 'string' && child.trim() === '' && group.length > 0) continue
    else {
      flush()
      out.push(child)
    }
  }
  flush()
  return out
}

function Decision({ id, children }: { id: string; children?: ReactNode }) {
  const decision = useCase().decisions[id] ?? missing('la decisión', id)
  return <DecisionBlock decision={decision}>{children}</DecisionBlock>
}

function FailureModes() {
  return <FailureModeTable rows={useCase().failureModes} />
}

function Diagram({ id }: { id: string }) {
  const { t } = useLocale()
  const view = useCase().diagrams[id] ?? missing('el diagrama', id)
  const graph = {
    ...view,
    nodes: view.nodes.map((node) => ({ ...node, kindLabel: t(`diagram.kinds.${node.kind}`) })),
  }
  return (
    <div className={styles.wide}>
      <DiagramFigure
        graph={graph}
        strings={{
          textAlternative: t('diagram.textAlternative'),
          components: t('diagram.components'),
          connections: t('diagram.connections'),
          boundaries: t('diagram.boundaries'),
          controls: t('diagram.controls'),
          hint: t('diagram.hint'),
          note: t('diagram.note'),
          edge: (from, to) => t('diagram.edge', { from, to }),
        }}
      />
    </div>
  )
}

function Metric({ id }: { id: string }) {
  const { t } = useLocale()
  const metric = useCase().metrics[id] ?? missing('la métrica', id)
  return (
    <MetricValue
      value={metric.value}
      label={metric.label}
      kind={metric.kind}
      kindLabel={t(`metricSource.${metric.kind}`)}
      source={metric.source}
    />
  )
}

function Callout({ title, children }: { title?: string; children?: ReactNode }) {
  return <CalloutNote title={title}>{children}</CalloutNote>
}

function Figure({ caption, children }: { caption: string; children?: ReactNode }) {
  return (
    <div className={styles.wide}>
      <FigureBox caption={caption}>{children}</FigureBox>
    </div>
  )
}

function Tag({ children }: { children?: ReactNode }) {
  return <ClassificationTag>{children}</ClassificationTag>
}

/** Los componentes del MDX de un caso. Si falta uno de la lista de 05, no compila. */
export const caseMdxComponents = {
  Section,
  Decision,
  FailureModes,
  Figure,
  Diagram,
  Callout,
  Metric,
  Tag,
} satisfies Record<MdxComponentName, unknown>
