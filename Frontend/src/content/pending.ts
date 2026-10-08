// Blueprint 16 §Contenido ("Sin PENDIENTE visible en el sitio") y 15 C4: un dato que César aún no
// entregó es `Pending` (content/schema.ts). Quien lo renderiza pregunta con `isPending`; el build de
// lanzamiento lista los que quedan con `pendingFields` (scripts/lib/launch.ts).
import type { OrPending, Pending } from './schema'

export function isPending<T>(value: OrPending<T>): value is Pending {
  return typeof value === 'object' && value !== null && 'pending' in value
}

/** Rutas ("contact.cv.en") y notas de cada valor `Pending` dentro de `value`, a cualquier profundidad. */
export function pendingFields(value: unknown, path = ''): Array<{ path: string; note: string }> {
  if (typeof value !== 'object' || value === null) return []
  if (isPending(value)) return [{ path, note: value.pending }]
  return Object.entries(value).flatMap(([key, child]) => pendingFields(child, path ? `${path}.${key}` : key))
}
