// Blueprint 16 §Contenido ("Sin PENDIENTE visible en el sitio"; "Contacto: email, LinkedIn, GitHub y
// CV en PDF funcionando") y 05 (un draft se desarrolla y se prueba, nunca se publica). El postbuild
// aplica dos chequeos sobre build/client:
//
// 1. Siempre: ninguna marca de desarrollo ("BORRADOR", "PENDIENTE") llega al build. Las renderiza
//    components/ui/DevMarks.tsx solo con import.meta.env.DEV; si aparecen, algo se publicó de más.
// 2. Solo en un build de lanzamiento: ningún dato de contacto sigue `pending` (content/site.ts) y
//    cada CV declarado existe en el build. Hoy el sitio está en desarrollo (F3) y esos datos dependen
//    de César (C4), así que no bloquean el build normal.
//
// "Lanzamiento" es la misma condición que usa el blueprint para abrir el sitio a buscadores (12, F10):
// `INDEXABLE` en src/seo/indexing.ts. Para ensayarlo antes de cambiar INDEXABLE:
//   LAUNCH=true npm run build        (PowerShell: $env:LAUNCH='true'; npm run build)
import { isPending, pendingFields } from '../../src/content/pending'
import type { ContactMeta } from '../../src/content/schema'

/** Textos que solo existen en desarrollo (DevMarks.tsx). En mayúsculas: el contenido no los usa así. */
export const DEV_ONLY_MARKERS: readonly string[] = ['BORRADOR', 'PENDIENTE']

export function isLaunchBuild(indexable: boolean, env: Readonly<Record<string, string | undefined>>): boolean {
  return indexable || env.LAUNCH?.trim() === 'true'
}

/** Archivos de texto del build que contienen una marca de desarrollo. */
export function devMarkerLeaks(texts: ReadonlyMap<string, string>): string[] {
  const problems: string[] = []
  for (const [file, text] of texts) {
    const found = DEV_ONLY_MARKERS.filter((marker) => text.includes(marker))
    if (found.length > 0) {
      problems.push(`${file} contiene ${found.map((m) => `"${m}"`).join(', ')}, que solo existe en desarrollo`)
    }
  }
  return problems
}

/**
 * En un build de lanzamiento, cada dato de contacto pendiente es un problema, y un CV declarado debe
 * existir como archivo del build (`/cv/x.pdf` → `cv/x.pdf`). Fuera del lanzamiento no reporta nada.
 */
export function launchProblems(contact: ContactMeta, files: readonly string[], launch: boolean): string[] {
  if (!launch) return []
  const pending = pendingFields(contact, 'contact').map(
    ({ path, note }) => `lanzamiento: ${path} sigue pendiente (${note}); complétalo en src/content/site.ts`,
  )
  const missing = Object.entries(contact.cv).flatMap(([locale, value]) => {
    if (isPending(value)) return []
    const file = value.replace(/^\//, '')
    return files.includes(file) ? [] : [`lanzamiento: el CV en ${locale} (${value}) no existe en el build`]
  })
  return [...pending, ...missing]
}
