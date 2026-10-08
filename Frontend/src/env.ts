// Blueprint 13 §Variables de entorno: `env.ts` valida las variables en el build. Todas son públicas
// (se incrustan en el bundle) y ninguna es un secreto.
import { parseBuildDate, parseShowDrafts, parseSiteUrl } from './lib/env'

// Valores locales de 13: `npm run dev` y `wrangler pages dev build/client`.
const DEV_ORIGIN = 'http://localhost:5173'
const LOCAL_DIST_ORIGIN = 'http://localhost:8788'

export const SITE_URL = parseSiteUrl(
  import.meta.env.VITE_SITE_URL,
  import.meta.env.DEV ? DEV_ORIGIN : LOCAL_DIST_ORIGIN,
)

export const BUILD_DATE = parseBuildDate(import.meta.env.VITE_BUILD_DATE)

/**
 * Vista previa de borradores, solo en `npm run dev`, activa por defecto (`VITE_SHOW_DRAFTS=false` la
 * apaga) (05: un draft se desarrolla y se prueba). La leen los loaders: con ella, Home y About incluyen los `draft` marcados
 * "BORRADOR". En el build de producción es `false` siempre, y el postbuild falla si un draft aparece.
 */
export const SHOW_DRAFTS = parseShowDrafts(import.meta.env.VITE_SHOW_DRAFTS, import.meta.env.DEV)
