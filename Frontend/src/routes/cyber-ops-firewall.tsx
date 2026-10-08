// Blueprint 02 §Sitemap V1: /:lang/cyber-ops/firewall/ (misión 01, id cyberOps.mission de 09 §3.1; contenido en F6).
import type { Route } from './+types/cyber-ops-firewall'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('cyberOpsFirewall', params.lang)
}

export default function CyberOpsFirewall() {
  return <FixedPagePlaceholder page="cyberOpsFirewall" />
}
