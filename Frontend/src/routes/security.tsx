// Blueprint 02 §Sitemap V1: /:lang/security/ (Security hub; contenido en F5, 08 §7.1).
import type { Route } from './+types/security'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('securityHub', params.lang)
}

export default function Security() {
  return <FixedPagePlaceholder page="securityHub" />
}
