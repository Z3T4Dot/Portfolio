// Blueprint 02 §Sitemap V1 y §Home: /:lang/. Título `Cesar Acosta | {rol}` y JSON-LD WebSite + Person
// (12). 04 §Flujo de datos: el loader corre en el build (prerender) y el cliente recibe solo lo que
// devuelve; nunca el índice completo, así que un draft no puede viajar en el JS (05, verificación 10).
import type { Route } from './+types/home'
import { SHOW_DRAFTS } from '../env'
import { HomePage } from '../features/home'
import { homeData, type HomeData } from '../features/home/data'
import { isLocale } from '../i18n'
import { pageMeta } from '../seo/meta'

/**
 * Con un prefijo que no es idioma no hay Home: lang-layout muestra la 404. No se lanza un 404 porque
 * `/404/` (la 404 sin prefijo de 13) se prerenderiza por esta misma ruta y el prerender falla si el
 * loader responde 404; con datos vacíos, el postbuild la mueve a 404.html como siempre.
 */
const NO_HOME: HomeData = { featured: [], essays: [], timeline: [] }

export function loader({ params }: Route.LoaderArgs) {
  return isLocale(params.lang) ? homeData(params.lang, { includeDrafts: SHOW_DRAFTS }) : NO_HOME
}

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('home', params.lang)
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <HomePage data={loaderData} />
}
