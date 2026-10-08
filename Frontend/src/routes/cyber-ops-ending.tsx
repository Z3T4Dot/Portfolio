// Blueprint 02 §Sitemap V1: /:lang/cyber-ops/ending/ (cierre, id cyberOps.ending de 09 §3.1; contenido en F7).
import type { Route } from './+types/cyber-ops-ending'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('cyberOpsEnding', params.lang)
}

export default function CyberOpsEnding() {
  return <FixedPagePlaceholder page="cyberOpsEnding" />
}
