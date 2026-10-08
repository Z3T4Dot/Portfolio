// Blueprint 02 §Navegación (móvil: botón "Menú" con los mismos enlaces, idioma y tema) y 03 (menú
// desplegable con focus trap). En la 404 estática, <details> nativo sin tema (decisión de César).
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MobileNav } from '../MobileNav'
import { renderAtPath } from './render'

describe('MobileNav en páginas hidratadas', () => {
  it('el botón "Menú" abre y cierra el panel con aria-expanded', async () => {
    const user = userEvent.setup()
    renderAtPath('/es/', <MobileNav staticPage={false} />)
    const button = screen.getByRole('button', { name: 'Menú' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Trabajo', 'Seguridad', 'Criterio', 'Sobre mí', 'Contacto'])
    // Idioma y tema dentro del menú (02)
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cambiar a tema/ })).toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('Escape cierra y devuelve el foco al botón', async () => {
    const user = userEvent.setup()
    renderAtPath('/en/', <MobileNav staticPage={false} />)
    const button = screen.getByRole('button', { name: 'Menu' })
    await user.click(button)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Work' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('el foco no sale del menú abierto (Tab y Shift+Tab)', async () => {
    const user = userEvent.setup()
    renderAtPath('/en/', <MobileNav staticPage={false} />)
    const button = screen.getByRole('button', { name: 'Menu' })
    await user.click(button)
    const theme = screen.getByRole('button', { name: /Switch to/ })
    theme.focus()
    await user.tab()
    expect(button).toHaveFocus()
    await user.tab({ shift: true })
    expect(theme).toHaveFocus()
  })

  it('se cierra al navegar', async () => {
    const user = userEvent.setup()
    renderAtPath('/es/', <MobileNav staticPage={false} />)
    await user.click(screen.getByRole('button', { name: 'Menú' }))
    await user.click(screen.getByRole('link', { name: 'Contacto' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/es/contact/')
    expect(screen.getByRole('button', { name: 'Menú' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('MobileNav en la 404 estática', () => {
  it('es un <details> nativo: funciona sin JavaScript y no trae selector de tema', () => {
    const { container } = renderAtPath('/es/no-existe/', <MobileNav staticPage />)
    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details?.querySelector('summary')).toHaveTextContent('Menú')
    expect(screen.queryByRole('button', { name: /tema/ })).not.toBeInTheDocument()
    // Los idiomas llevan al inicio: la ruta actual no existe en ninguno.
    const links = details?.querySelectorAll('a[hreflang]') ?? []
    expect([...links].map((link) => link.getAttribute('href'))).toEqual(['/es/', '/en/'])
  })
})
