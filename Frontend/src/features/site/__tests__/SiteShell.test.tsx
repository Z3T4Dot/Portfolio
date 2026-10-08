// Blueprint 02 §Navegación (header sin Cyber Ops por D11; footer con Cyber Ops) y 03 §Accesibilidad
// (landmarks, skip link, aria-current).
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SiteShell } from '../SiteShell'
import { renderAtPath } from './render'

const shell = (
  <SiteShell>
    <h1>Contenido</h1>
  </SiteShell>
)

describe('SiteShell', () => {
  it('landmarks y skip link hacia <main>', () => {
    renderAtPath('/es/', shell)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main')
  })

  it('header: nombre → Home y Trabajo · Seguridad · Criterio · Sobre mí · Contacto, sin Cyber Ops (D11)', () => {
    renderAtPath('/en/', shell)
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Cesar Acosta' })).toHaveAttribute('href', '/en/')
    // Solo el nav de escritorio es accesible: el del menú móvil está cerrado (hidden).
    const nav = within(banner).getByRole('navigation', { name: 'Main' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/en/work/', '/en/security/', '/en/judgment/', '/en/about/', '/en/contact/'])
    expect(within(banner).queryByRole('link', { name: 'Cyber Ops' })).not.toBeInTheDocument()
  })

  it('footer: Contacto, Cyber Ops y Cómo está hecho este sitio', () => {
    renderAtPath('/es/', shell)
    const footer = screen.getByRole('navigation', { name: 'Enlaces del sitio' })
    expect(
      within(footer)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Contacto', 'Cyber Ops', 'Cómo está hecho este sitio'])
  })

  it('aria-current: "page" en la página exacta y "true" dentro de su sección', () => {
    renderAtPath('/es/security/wazuh-soc-lab/', shell)
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByRole('link', { name: 'Seguridad' })).toHaveAttribute('aria-current', 'true')
    expect(within(nav).getByRole('link', { name: 'Trabajo' })).not.toHaveAttribute('aria-current')
  })

  it('se recorre con el teclado: el primer Tab enfoca el skip link y luego el nombre', async () => {
    const user = userEvent.setup()
    renderAtPath('/es/', shell)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Cesar Acosta' })).toHaveFocus()
  })

  it('en la 404 estática no hay selector de tema', () => {
    renderAtPath(
      '/es/no-existe/',
      <SiteShell staticPage>
        <h1>404</h1>
      </SiteShell>,
    )
    expect(screen.queryByRole('button', { name: /tema/ })).not.toBeInTheDocument()
  })
})
