// Blueprint 02 §Sitemap V1: /:lang/security/wazuh-soc-lab/ (Wazuh SOC Lab por capítulos; contenido en F5, 08 §7.2).
import type { Route } from './+types/security-lab'
import { FixedPagePlaceholder } from '../features/site'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('securityLab', params.lang)
}

export default function SecurityLab() {
  return <FixedPagePlaceholder page="securityLab" />
}
