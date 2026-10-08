// Blueprint 02 §Sitemap V1: /:lang/cyber-ops/detection/ (misión 02, id cyberOps.mission de 09 §3.1; contenido en F7).
import type { Route } from './+types/cyber-ops-detection'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('cyberOpsDetection', params.lang)
}

export default function CyberOpsDetection() {
  return <FixedPagePlaceholder page="cyberOpsDetection" />
}
