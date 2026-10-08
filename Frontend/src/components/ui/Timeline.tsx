// Blueprint 03 §Componentes visuales (Timeline: etapas con evidencia, vertical en móvil y horizontal
// desde 1024px; es una secuencia real, así que lleva orden visual) y 02 §About y §Home bloque 5.
// Recibe textos ya resueltos en el idioma de la página: components/ no conoce content ni i18n (04).
import type { ReactNode } from 'react'
import styles from './Timeline.module.css'

export interface TimelineItem {
  id: string
  /** Inicio en `AAAA-MM`, para <time dateTime>. */
  dateTime: string
  /** Periodo legible ("Desde julio de 2025"). */
  period: string
  title: string
  /** Marca junto al título (p. ej. BORRADOR en la vista previa de desarrollo). */
  mark?: ReactNode
  summary?: string | undefined
  /** Enlaces a los proyectos que abre la etapa. */
  children?: ReactNode
}

export function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className={styles.timeline}>
      {items.map((item) => (
        <li key={item.id} className={styles.stage}>
          <p className={styles.period}>
            <time dateTime={item.dateTime}>{item.period}</time>
          </p>
          <h3 className={styles.title}>
            {item.title}
            {item.mark}
          </h3>
          {item.summary ? <p className={styles.summary}>{item.summary}</p> : null}
          {item.children}
        </li>
      ))}
    </ol>
  )
}
