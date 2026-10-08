// Blueprint 03 §Componentes visuales (StatusTag: texto siempre visible, REAL con punto --ok,
// EXPERIMENTO con --warn, PLANEADO con contorno --muted; ClassificationTag: texto en --muted) y 00
// (contrato de autenticidad: el color nunca es la única señal).
import type { ReactNode } from 'react'
import styles from './Tag.module.css'

/** Igual que Existence de content/schema.ts; components/ no importa content (04). */
export type StatusTagState = 'real' | 'experiment' | 'planned'

export function StatusTag({ state, children }: { state: StatusTagState; children: ReactNode }) {
  return (
    <span className={styles.status} data-state={state}>
      {children}
    </span>
  )
}

export function ClassificationTag({ children }: { children: ReactNode }) {
  return <span className={styles.classification}>{children}</span>
}
