// Blueprint 03 §Componentes visuales (SkipLink: "Saltar al contenido", visible al recibir foco) y
// §Accesibilidad (WCAG 2.4.1).
import type { ReactNode } from 'react'
import styles from './SkipLink.module.css'

interface SkipLinkProps {
  /** id del elemento destino, normalmente <main>. */
  target: string
  children: ReactNode
}

export function SkipLink({ target, children }: SkipLinkProps) {
  return (
    <a className={styles.skip} href={`#${target}`}>
      {children}
    </a>
  )
}
