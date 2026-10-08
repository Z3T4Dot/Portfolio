// Blueprint 02 §Sitemap V1 (prefijo /:lang) y 04 §Flujo de datos (el idioma sale de la URL):
// conecta el parámetro :lang con el LocaleProvider y monta el shell global.
import { Outlet, isRouteErrorResponse } from 'react-router'
import type { Route } from './+types/lang-layout'
import { ErrorContent, NotFoundContent, SiteShell } from '../features/site'
import { DEFAULT_LOCALE, LocaleProvider, isLocale } from '../i18n'

export default function LangLayout({ params }: Route.ComponentProps) {
  // Un prefijo que no es idioma (/xx/) no se prerenderiza: el host sirve la 404. En navegación
  // cliente se muestra el mismo contenido.
  if (!isLocale(params.lang)) {
    return (
      <LocaleProvider locale={DEFAULT_LOCALE}>
        <SiteShell staticPage>
          <NotFoundContent />
        </SiteShell>
      </LocaleProvider>
    )
  }
  return (
    <LocaleProvider locale={params.lang}>
      <SiteShell>
        <Outlet />
      </SiteShell>
    </LocaleProvider>
  )
}

/**
 * Errores de las rutas hijas (11 §9): el header y el footer siguen ahí. Un 404 lanzado por un
 * loader (slug inexistente o draft) muestra la 404 localizada; cualquier otro error, el mensaje
 * genérico sin stack.
 */
export function ErrorBoundary({ error, params }: Route.ErrorBoundaryProps) {
  const locale = isLocale(params.lang) ? params.lang : DEFAULT_LOCALE
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <LocaleProvider locale={locale}>
      <SiteShell>{notFound ? <NotFoundContent /> : <ErrorContent />}</SiteShell>
    </LocaleProvider>
  )
}
