// Blueprint 11 §3: componentes con rutas se prueban con createRoutesStub de React Router.
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createRoutesStub, useLocation } from 'react-router'
import { LocaleProvider, localeFromPath, type Locale } from '../../../i18n'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>
}

/**
 * Monta `ui` en un router de memoria que acepta cualquier URL, con el idioma del prefijo (o el
 * indicado). Muestra la URL actual en `data-testid="location"` para verificar la navegación.
 */
export function renderAtPath(path: string, ui: ReactNode, locale?: Locale) {
  const Stub = createRoutesStub([
    {
      path: '*',
      Component() {
        const { pathname } = useLocation()
        return (
          <LocaleProvider locale={locale ?? localeFromPath(pathname) ?? 'en'}>
            {ui}
            <LocationProbe />
          </LocaleProvider>
        )
      },
    },
  ])
  return render(<Stub initialEntries={[path]} />)
}
