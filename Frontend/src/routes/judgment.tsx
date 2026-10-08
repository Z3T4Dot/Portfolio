// Blueprint 02 §Sitemap V1: /:lang/judgment/ (índice de Engineering Judgment; contenido en F8).
import type { Route } from './+types/judgment'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('judgment', params.lang)
}

export default function Judgment() {
  return <FixedPagePlaceholder page="judgment" />
}
