// Blueprint 03 §Componentes visuales (MetaList: rol, periodo, stack, equipo; lista de definición en dos
// columnas; stack en texto, sin logos) y 12 §HTML semántico (<dl> para los metadatos de un caso).
import type { ReactNode } from 'react'
import styles from './MetaList.module.css'

export interface MetaItem {
  term: string
  detail: ReactNode
}

export function MetaList({ items }: { items: readonly MetaItem[] }) {
  return (
    <dl className={styles.meta}>
      {items.map((item) => (
        <div key={item.term} className={styles.row}>
          <dt>{item.term}</dt>
          <dd>{item.detail}</dd>
        </div>
      ))}
    </dl>
  )
}
