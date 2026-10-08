// Blueprint 02 §404 y 11 §9 (ruta inexistente: 404 localizada con status 404 y noindex).
import { useLocation } from 'react-router'
import type { Route } from './+types/not-found'
import { NotFoundContent, SiteShell } from '../features/site'
import { DEFAULT_LOCALE, LocaleProvider, localeFromPath } from '../i18n'
import { notFoundMeta } from '../seo/meta'

// Sin loader: el contenido depende solo del prefijo de la URL. Así el HTML prerenderizado en
// /es/404/ sirve igual cuando el host lo entrega como 404.html en /es/cualquier-cosa.
export function meta({ location }: Route.MetaArgs) {
  return notFoundMeta(localeFromPath(location.pathname) ?? DEFAULT_LOCALE)
}

export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <LocaleProvider locale={localeFromPath(pathname) ?? DEFAULT_LOCALE}>
      <SiteShell staticPage>
        <NotFoundContent />
      </SiteShell>
    </LocaleProvider>
  )
}
