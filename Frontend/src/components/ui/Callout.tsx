// Blueprint 03 §Componentes visuales (Callout: nota o advertencia dentro de la prosa; barra lateral de
// 2px, sin ícono decorativo). El color de la barra no es la única señal: el título dice qué es.
import type { ReactNode } from 'react'
import styles from './Callout.module.css'

interface CalloutProps {
  title?: string | undefined
  children: ReactNode
}

export function Callout({ title, children }: CalloutProps) {
  return (
    <div className={styles.callout} role="note">
      {title ? <p className={styles.title}>{title}</p> : null}
      {children}
    </div>
  )
}
