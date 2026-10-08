// Blueprint 02 §Sitemap V1 y §Contact: /:lang/contact/ (contacto y CV). Sin loader: los datos salen de
// content/site.ts, que el shell ya carga, y ninguno es un draft.
import type { Route } from './+types/contact'
import { ContactPage } from '../features/contact'
import { pageMeta } from '../seo/meta'

export function meta({ params }: Route.MetaArgs) {
  return pageMeta('contact', params.lang)
}

export default function Contact() {
  return <ContactPage />
}
