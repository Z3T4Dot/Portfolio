// Blueprint 03 §Componentes visuales (Button: principal en pill, --ink sobre --paper; secundario como
// texto subrayado) y 02 §CTAs (el texto dice exactamente lo que pasa, sin flechas decorativas).
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary'

interface ButtonLinkProps {
  to: string
  variant?: ButtonVariant
  children: ReactNode
}

/** Navegación interna con aspecto de botón (11 §7: prefetch="intent"; 03: View Transitions). */
export function ButtonLink({ to, variant = 'primary', children }: ButtonLinkProps) {
  return (
    <Link className={styles[variant]} to={to} prefetch="intent" viewTransition>
      {children}
    </Link>
  )
}

interface ButtonAnchorProps {
  href: string
  variant?: ButtonVariant
  /** Descarga de un archivo propio (CV en PDF). */
  download?: boolean
  children: ReactNode
}

/** Enlace que no es una ruta del sitio (archivo, mailto, perfil externo). */
export function ButtonAnchor({ href, variant = 'primary', download = false, children }: ButtonAnchorProps) {
  return (
    <a className={styles[variant]} href={href} download={download || undefined}>
      {children}
    </a>
  )
}
