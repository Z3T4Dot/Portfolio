// Blueprint 03 §Diagramas y §Componentes visuales (Diagram: grafo tipado → SVG accesible; Figure):
// nodos con radio --radius-m y borde --line-ui, aristas de 1px --line-ui con punta de flecha, fronteras
// discontinuas con etiqueta. Cada nodo es un botón: al pasar el puntero, enfocarlo o pulsarlo se
// resaltan el nodo y sus aristas, y el panel muestra qué hace y sus controles; Escape lo cierra (WCAG
// 1.4.13). En móvil se dibuja la variante vertical (layout.ts). La alternativa textual sale de los
// mismos datos y es desplegable. 04: components/ no conoce la app; los textos llegan por props.
//
// El SVG no lleva role="img": sus hijos serían presentacionales y los botones de los nodos quedarían
// fuera del árbol de accesibilidad. Es un grupo con nombre y descripción, y el dibujo es aria-hidden.
import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import styles from './Diagram.module.css'
import { gridLayout, TYPE, verticalLayout, type DiagramLayout, type Point } from './layout'

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

export interface DiagramNode {
  id: string
  label: string
  kind: DiagramNodeKind
  /** Nombre del tipo en el idioma de la página ("Servicio"). */
  kindLabel: string
  description: string
  controls?: readonly string[] | undefined
}

export interface DiagramGraph {
  id: string
  title: string
  description: string
  nodes: readonly DiagramNode[]
  edges: ReadonlyArray<{ from: string; to: string; label?: string | undefined }>
  boundaries?: ReadonlyArray<{ id: string; label: string; nodes: readonly string[] }> | undefined
  grid: ReadonlyArray<ReadonlyArray<string | null>>
  vertical?: readonly string[] | undefined
}

export interface DiagramStrings {
  /** Resumen del desplegable con la alternativa textual. */
  textAlternative: string
  components: string
  connections: string
  boundaries: string
  controls: string
  /** Texto del panel cuando ningún nodo está activo. */
  hint: string
  /** "De {from} a {to}". */
  edge: (from: string, to: string) => string
  /** Nota de procedencia y clasificación bajo el título ("Redibujado a nivel lógico…"). */
  note: string
}

interface DiagramProps {
  graph: DiagramGraph
  strings: DiagramStrings
}

const path = (points: readonly Point[]) =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${String(x)} ${String(y)}`).join(' ')

export function Diagram({ graph, strings }: DiagramProps) {
  // useId puede traer caracteres que no sirven en url(#…): se dejan solo letras, números y guiones.
  const uid = `${graph.id}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [active, setActive] = useState<string | null>(null)
  const wide = useMemo(() => gridLayout(graph), [graph])
  const narrow = useMemo(() => verticalLayout(graph), [graph])
  const byId = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph])
  const activeNode = active === null ? undefined : byId.get(active)
  const labelOf = (id: string) => byId.get(id)?.label ?? id

  const ids = {
    title: `${uid}-title`,
    description: `${uid}-description`,
    panel: `${uid}-panel`,
    node: (id: string) => `${uid}-node-${id}`,
  }

  const canvas = (variant: 'wide' | 'narrow', layout: DiagramLayout) => (
    <svg
      className={variant === 'wide' ? styles.wide : styles.narrow}
      data-variant={variant}
      viewBox={`0 0 ${String(layout.width)} ${String(layout.height)}`}
      role="group"
      aria-labelledby={ids.title}
      aria-describedby={ids.description}
    >
      <defs>
        {(['arrow', 'arrow-active'] as const).map((marker) => (
          <marker
            key={marker}
            id={`${uid}-${variant}-${marker}`}
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path className={marker === 'arrow' ? styles.arrow : styles.arrowActive} d="M0 0 L10 5 L0 10 z" />
          </marker>
        ))}
      </defs>
      <g aria-hidden="true">
        {layout.boundaries.map((boundary) => (
          <g key={boundary.id}>
            <rect
              className={styles.boundary}
              x={boundary.rect.x}
              y={boundary.rect.y}
              width={boundary.rect.w}
              height={boundary.rect.h}
              rx={14}
            />
            <text className={styles.boundaryLabel} x={boundary.label.x} y={boundary.label.y}>
              {boundary.label.text}
            </text>
          </g>
        ))}
        {layout.edges.map((edge) => {
          const on = active !== null && (edge.from === active || edge.to === active)
          return (
            <path
              key={edge.index}
              className={styles.edge}
              data-active={on || undefined}
              d={path(edge.points)}
              markerEnd={`url(#${uid}-${variant}-${on ? 'arrow-active' : 'arrow'})`}
            />
          )
        })}
        {layout.edges.flatMap((edge) =>
          edge.label
            ? [
                <g key={`label-${String(edge.index)}`}>
                  <rect
                    className={styles.labelBox}
                    x={edge.label.box.x}
                    y={edge.label.box.y}
                    width={edge.label.box.w}
                    height={edge.label.box.h}
                    rx={4}
                  />
                  <text className={styles.edgeLabel} x={edge.label.x} y={edge.label.y} textAnchor={edge.label.anchor}>
                    {edge.label.text}
                  </text>
                </g>,
              ]
            : [],
        )}
      </g>
      {layout.nodes.map((placed) => {
        const node = byId.get(placed.id)
        if (!node) return null
        const { x, y, w, h } = placed.rect
        const cx = x + w / 2
        const firstLine = y + h / 2 - ((placed.lines.length - 1) * TYPE.lineHeight) / 2 + TYPE.node * 0.36
        const activate = () => {
          setActive(node.id)
        }
        const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
          if (event.key === 'Escape') {
            setActive(null)
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            activate()
          }
        }
        return (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={node.label}
            aria-describedby={ids.node(node.id)}
            aria-controls={ids.panel}
            className={styles.node}
            data-kind={node.kind}
            data-active={active === node.id || undefined}
            onFocus={activate}
            onMouseEnter={activate}
            onClick={activate}
            onKeyDown={onKeyDown}
          >
            <rect className={styles.ring} x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx={12} />
            <rect className={styles.box} x={x} y={y} width={w} height={h} rx={8} />
            <text className={styles.nodeLabel} x={cx} y={firstLine} textAnchor="middle" aria-hidden="true">
              {placed.lines.map((line, i) => (
                <tspan key={`${String(i)}-${line}`} x={cx} dy={i === 0 ? 0 : TYPE.lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}
    </svg>
  )

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        <span id={ids.title} className={styles.title}>
          {graph.title}
        </span>{' '}
        <span id={ids.description}>{graph.description}</span> <span className={styles.note}>{strings.note}</span>
      </figcaption>
      <div className={styles.canvas}>
        {canvas('wide', wide)}
        {canvas('narrow', narrow)}
      </div>
      <div id={ids.panel} className={styles.panel}>
        {activeNode ? (
          <>
            <p className={styles.panelTitle}>
              {activeNode.label} <span className={styles.kind}>{activeNode.kindLabel}</span>
            </p>
            <p>{activeNode.description}</p>
            {activeNode.controls?.length ? (
              <>
                <p className={styles.panelSub}>{strings.controls}</p>
                <ul className={styles.list}>
                  {activeNode.controls.map((control) => (
                    <li key={control}>{control}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : (
          <p className={styles.hint}>{strings.hint}</p>
        )}
      </div>
      <details className={styles.alt}>
        <summary className={styles.summary}>{strings.textAlternative}</summary>
        <p className={styles.panelSub}>{strings.components}</p>
        <ul className={styles.list}>
          {graph.nodes.map((node) => (
            <li key={node.id}>
              <strong>{node.label}</strong> ({node.kindLabel}).{' '}
              <span id={ids.node(node.id)}>
                {node.description}
                {node.controls?.length ? ` ${strings.controls}: ${node.controls.join('; ')}.` : ''}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.panelSub}>{strings.connections}</p>
        <ul className={styles.list}>
          {graph.edges.map((edge) => (
            <li key={`${edge.from}-${edge.to}`}>
              {strings.edge(labelOf(edge.from), labelOf(edge.to))}
              {edge.label ? `: ${edge.label}` : ''}
            </li>
          ))}
        </ul>
        {graph.boundaries?.length ? (
          <>
            <p className={styles.panelSub}>{strings.boundaries}</p>
            <ul className={styles.list}>
              {graph.boundaries.map((boundary) => (
                <li key={boundary.id}>
                  {boundary.label}: {boundary.nodes.map(labelOf).join(', ')}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </details>
    </figure>
  )
}
