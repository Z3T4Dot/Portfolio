// Blueprint 11 §3 (error boundaries: una ruta que lanza muestra el fallback con salida a Home; la de
// 404 muestra el texto localizado) y 04 §Flujo de datos (el idioma sale de la URL).
import { render, screen, within } from '@testing-library/react'
import { createRoutesStub, data } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import LangLayout, { ErrorBoundary } from '../lang-layout'

function Throws(): never {
  throw new Error('fallo de render')
}

function renderLayout(path: string) {
  const Stub = createRoutesStub([
    {
      path: '/:lang',
      Component: LangLayout,
      ErrorBoundary,
      children: [
        { index: true, Component: () => <h1>Inicio de prueba</h1> },
        { path: 'boom', Component: Throws },
        {
          path: 'work/:slug',
          loader: () => {
            throw data(null, { status: 404 })
          },
          Component: () => null,
        },
      ],
    },
  ])
  return render(<Stub initialEntries={[path]} />)
}

describe('lang-layout', () => {
  it('pasa el idioma de la URL al LocaleProvider', async () => {
    renderLayout('/en/')
    expect(await screen.findByRole('heading', { name: 'Inicio de prueba' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument()
  })

  it('un prefijo que no es idioma muestra la 404', async () => {
    renderLayout('/xx/')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('un error de render muestra el mensaje con salida a Home y conserva header y footer', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderLayout('/es/boom')
    expect(await screen.findByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/es/')
    // El <header> de PageHeader está dentro de <main> y no es banner, pero jsdom no aplica esa regla.
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.queryByText('fallo de render')).not.toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('un loader que lanza 404 (slug inexistente o draft) muestra la 404 localizada', async () => {
    renderLayout('/es/work/borrador/')
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    const exits = screen.getByRole('navigation', { name: 'Salidas' })
    expect(
      within(exits)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/es/', '/es/work/', '/es/contact/'])
  })
})
