import { publishedOnly } from '../publication'
import type { SelectedWorkMeta } from '../schema'

// Fichas de Selected Work en orden (05). Vacío hasta que haya fichas verificadas contra el registro
// de hechos.

/** Todas las fichas, también las `draft`. Solo para la verificación de integridad (05). */
export const allSelectedWork: readonly SelectedWorkMeta[] = []

/** Índice publicado (05, verificación 10): lo único que se muestra en /work. */
export const selectedWork = publishedOnly(allSelectedWork)
