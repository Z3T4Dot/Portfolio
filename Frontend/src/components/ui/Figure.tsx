// Blueprint 03 §Componentes visuales (Figure: contenido + leyenda + fuente + clasificación; borde --line,
// radio --radius-l, fondo --surface). La leyenda va siempre: una figura sin leyenda no se publica (05).
import type { ReactNode } from 'react'
import styles from './Figure.module.css'

interface FigureProps {
  caption: ReactNode
  children: ReactNode
}

export function Figure({ caption, children }: FigureProps) {
  return (
    <figure className={styles.figure}>
      <div className={styles.content}>{children}</div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  )
}
