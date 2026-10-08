// Blueprint 02 §Sitemap V1 y §Work: /:lang/work/ (índice de casos). 04 §Flujo de datos: el loader corre
// en el build y el cliente recibe solo lo que devuelve; los casos `draft` nunca viajan en el JS ni en
// el `.data` de producción (05, verificación 10).
import { data } from 'react-router'
import type { Route } from './+types/work'
import { SHOW_DRAFTS } from '../env'
import { WorkPage } from '../features/work'
import { workData } from '../features/work/data'
import { isLocale } from '../i18n'
import { pageMeta } from '../seo/meta'

export function loader({ params }: Route.LoaderArgs) {
  if (!isLocale(params.lang)) throw data(null, { status: 404 })
  return workData(params.lang, { includeDrafts: SHOW_DRAFTS })
}

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('work', params.lang)
}

export default function Work({ loaderData }: Route.ComponentProps) {
  return <WorkPage data={loaderData} />
}
