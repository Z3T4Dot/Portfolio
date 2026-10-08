// Blueprint 02 §Sitemap V1: /:lang/cyber-ops/ (hub del juego, id cyberOps.hub de 09 §3.1; contenido en F6).
import type { Route } from './+types/cyber-ops'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('cyberOpsHub', params.lang)
}

export default function CyberOps() {
  return <FixedPagePlaceholder page="cyberOpsHub" />
}
