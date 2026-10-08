// Blueprint 02 §Sitemap V1: /:lang/architecture/ (cómo está hecho este sitio; contenido en F8).
import type { Route } from './+types/architecture'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('architecture', params.lang)
}

export default function Architecture() {
  return <FixedPagePlaceholder page="architecture" />
}
