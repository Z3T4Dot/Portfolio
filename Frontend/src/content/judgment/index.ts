// Blueprint 05 §Estructura (judgment/index.ts) y 02 Home bloque 3 ("Cómo pienso": títulos de ensayos
// con su tesis en una línea). Vacío hasta que haya ensayos con respaldo verificado (07, 10): un
// ensayo solo se publica si un caso, un capítulo del lab o un ADR lo respalda.
import { publishedOnly } from '../publication'
import type { EssayMeta } from '../schema'

/** Todos los ensayos, también los `draft`. Solo para la verificación de integridad y los loaders. */
export const allEssays: readonly EssayMeta[] = []

/** Índice publicado (05, verificación 10). */
export const essays = publishedOnly(allEssays)
