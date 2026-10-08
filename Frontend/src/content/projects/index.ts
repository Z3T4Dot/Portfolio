// Blueprint 05 §Estructura (projects/index.ts: orden de los casos, único archivo que los lista) y
// verificación 10 (los índices publicados no contienen drafts).
import { publishedOnly } from '../publication'
import type { ArchitectureGraph, CaseStudyMeta } from '../schema'
import { diagrams as quantumDiagrams } from './quantum/diagrams'
import { meta as quantum } from './quantum/meta'

// Casos en orden, verificados contra el registro de hechos. Nunca se agrega aquí nada de
// content/__fixtures__ (lo impiden el lint y content.test.ts).

/** Todos los casos, también los `draft`. Para loaders (vista previa) y la verificación de integridad. */
export const allProjects: readonly CaseStudyMeta[] = [quantum]

/** Diagramas de cada caso, por slug (05: content/projects/<slug>/diagrams.ts). */
export const projectDiagrams: Readonly<Record<string, readonly ArchitectureGraph[]>> = {
  quantum: quantumDiagrams,
}

/**
 * Índice publicado (05, verificación 10): lo único de donde salen rutas, sitemap y enlaces.
 * Un `draft` no aparece aquí.
 */
export const projects = publishedOnly(allProjects)
