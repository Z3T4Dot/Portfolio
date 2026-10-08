// Blueprint 05 §Verificación de integridad, punto 10: ningún `draft` es alcanzable en producción.
// El filtro vive aquí, en la capa de contenido: los índices publicados, las rutas a prerenderizar,
// el sitemap y los enlaces se construyen solo con lo que devuelven estas funciones.
import type { Publication } from './schema'

interface Publishable {
  slug: string
  publication: Publication
}

export function isPublished(entry: Publishable): boolean {
  return entry.publication === 'published'
}

export function publishedOnly<T extends Publishable>(entries: readonly T[]): readonly T[] {
  return entries.filter(isPublished)
}

/** La entidad publicada con ese slug. Un `draft` no se encuentra, igual que un slug inexistente. */
export function findPublished<T extends Publishable>(entries: readonly T[], slug: string | undefined): T | undefined {
  return entries.find((entry) => entry.slug === slug && isPublished(entry))
}

/**
 * Vista previa de borradores (solo desarrollo): con `includeDrafts` devuelve también los `draft`;
 * sin él, lo mismo que `publishedOnly`. Quien llama decide con `SHOW_DRAFTS` de src/env.ts, que en
 * un build de producción siempre es `false`. Se llama solo desde loaders: el índice completo nunca
 * viaja al cliente, y el postbuild falla si un draft aparece en el build (findDraftLeaks).
 */
export function visibleOnly<T extends Publishable>(entries: readonly T[], includeDrafts: boolean): readonly T[] {
  return includeDrafts ? entries : publishedOnly(entries)
}
