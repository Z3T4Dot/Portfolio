// Blueprint 02 §Sitemap V1 y §About: /:lang/about/ (perfil, pilares, timeline y cómo trabajo). 04 §Flujo
// de datos: el loader corre en el build y el cliente recibe solo lo que devuelve; las etapas `draft`
// nunca viajan en el JS (05, verificación 10).
import { data } from 'react-router'
import type { Route } from './+types/about'
import { SHOW_DRAFTS } from '../env'
import { AboutPage } from '../features/about'
import { aboutData } from '../features/about/data'
import { isLocale } from '../i18n'
import { pageMeta } from '../seo/meta'

export function loader({ params }: Route.LoaderArgs) {
  if (!isLocale(params.lang)) throw data(null, { status: 404 })
  return aboutData(params.lang, { includeDrafts: SHOW_DRAFTS })
}

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('about', params.lang)
}

export default function About({ loaderData }: Route.ComponentProps) {
  return <AboutPage data={loaderData} />
}
