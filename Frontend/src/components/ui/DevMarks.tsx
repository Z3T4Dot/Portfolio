// Marcas que solo existen en `npm run dev`: 05 (un draft se desarrolla y se prueba, nunca se publica)
// y 16 §Contenido ("Sin PENDIENTE visible en el sitio"). En un build de producción ambas devuelven
// `null` y su texto desaparece del bundle; el postbuild falla si "BORRADOR" o "PENDIENTE" aparecen en
// build/client (scripts/lib/launch.ts). Textos en español a propósito: son para César, no para el
// visitante, y no pasan por i18n.
import type { ReactNode } from 'react'
import styles from './DevMarks.module.css'

/** Etiqueta de un borrador en la vista previa de desarrollo (activa por defecto en `npm run dev`). */
export function DraftTag() {
  if (!import.meta.env.DEV) return null
  // El espacio separa la marca del título también para lectores de pantalla.
  return (
    <>
      {' '}
      <span className={styles.draft} lang="es">
        BORRADOR
      </span>
    </>
  )
}

/** Aviso en lugar de un dato que César aún no entregó (15, C4). */
export function PendingNotice({ children }: { children: ReactNode }) {
  if (!import.meta.env.DEV) return null
  return (
    <p className={styles.pending} lang="es" role="note">
      <strong>PENDIENTE</strong> (solo visible en desarrollo): {children}
    </p>
  )
}
