// Blueprint 02 §Home (bloques en orden; los que listan contenido no aparecen vacíos), 01 §Los primeros
// 30 segundos (nombre, rol, posicionamiento, dos CTAs), 02 §CTAs (sin flechas) y 05 (BORRADOR solo en
// desarrollo).
import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAtPath } from '../../site/__tests__/render'
import type { HomeData } from '../data'
import { HomePage } from '../HomePage'

const empty: HomeData = { featured: [], essays: [], timeline: [] }

const full: HomeData = {
  featured: [
    {
      slug: 'caso',
      title: 'Caso publicado',
      problem: 'El problema en una línea.',
      highlight: 'La decisión en una línea.',
      existence: 'real',
      confidentiality: 'sanitized',
      href: '/es/work/caso/',
      draft: false,
    },
    {
      slug: 'borrador',
      title: 'Caso en borrador',
      problem: 'Otro problema.',
      highlight: 'Otra decisión.',
      existence: 'real',
      confidentiality: 'public',
      href: '/es/work/borrador/',
      draft: true,
    },
  ],
  essays: [{ slug: 'ensayo', title: 'Un ensayo', thesis: 'Su tesis.', draft: false }],
  timeline: [{ slug: 'inicio', dateTime: '2025-07', period: 'Desde julio de 2025', title: 'Etapa', draft: false }],
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('HomePage', () => {
  it('bloque 1: nombre como h1, rol, posicionamiento y los dos CTAs de 02', () => {
    renderAtPath('/es/', <HomePage data={empty} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Cesar Acosta' })).toBeInTheDocument()
    expect(screen.getByText('Desarrollador de software')).toBeInTheDocument()
    expect(screen.getByText(/Construyo sistemas empresariales/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver casos' })).toHaveAttribute('href', '/es/work/')
    expect(screen.getByRole('link', { name: 'Explorar el Security Lab' })).toHaveAttribute(
      'href',
      '/es/security/wazuh-soc-lab/',
    )
  })

  it('sin casos ni ensayos visibles, esos bloques no se renderizan; Cyber Ops y contacto sí', () => {
    renderAtPath('/es/', <HomePage data={empty} />)
    expect(screen.queryByRole('heading', { name: 'Trabajo seleccionado' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Cómo pienso' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Trayectoria' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Jugar Cyber Ops' })).toHaveAttribute('href', '/es/cyber-ops/')
    expect(screen.getByRole('link', { name: 'Ir a la página de contacto' })).toHaveAttribute('href', '/es/contact/')
  })

  it('con contenido: filas con problema, decisión y etiquetas; el borrador (solo en la vista previa) va marcado y enlaza a su página de vista previa', () => {
    renderAtPath('/es/', <HomePage data={full} />)
    const featured = screen.getByRole('region', { name: 'Trabajo seleccionado' })
    expect(within(featured).getByRole('link', { name: 'Caso publicado' })).toHaveAttribute('href', '/es/work/caso/')
    expect(within(featured).getByText('El problema en una línea.')).toBeInTheDocument()
    expect(within(featured).getAllByText('Real')).toHaveLength(2)
    expect(within(featured).getByText('Sanitizado')).toBeInTheDocument()
    expect(within(featured).getByRole('link', { name: 'Caso en borrador' })).toHaveAttribute(
      'href',
      '/es/work/borrador/',
    )
    expect(within(featured).getByRole('heading', { name: 'Caso en borrador BORRADOR' })).toBeInTheDocument()

    expect(screen.getByRole('region', { name: 'Cómo pienso' })).toHaveTextContent('Su tesis.')
    const timeline = screen.getByRole('region', { name: 'Trayectoria' })
    expect(within(timeline).getByText('Desde julio de 2025')).toHaveAttribute('datetime', '2025-07')
    expect(within(timeline).getByRole('link', { name: 'Ver la trayectoria completa' })).toHaveAttribute(
      'href',
      '/es/about/#timeline',
    )
  })

  it('en un build de producción no aparece BORRADOR ni PENDIENTE, aunque llegara un draft', () => {
    vi.stubEnv('DEV', false)
    renderAtPath('/es/', <HomePage data={full} />)
    expect(document.body).not.toHaveTextContent(/BORRADOR|PENDIENTE/)
  })

  it('en desarrollo, el correo pendiente se ve como aviso, nunca como un valor inventado', () => {
    renderAtPath('/es/', <HomePage data={empty} />)
    const contact = screen.getByRole('region', { name: 'Contacto' })
    expect(within(contact).getByRole('note')).toHaveTextContent(/PENDIENTE.*correo de contacto/)
    expect(within(contact).queryByRole('link', { name: /@/ })).not.toBeInTheDocument()
  })

  it('los enlaces dicen lo que pasa, sin flechas decorativas (02, 03)', () => {
    renderAtPath('/en/', <HomePage data={full} />)
    const texts = screen.getAllByRole('link').map((link) => link.textContent)
    expect(texts.filter((text) => /[→›»]/.test(text))).toEqual([])
    expect(screen.getByRole('link', { name: 'See the case studies' })).toHaveAttribute('href', '/en/work/')
  })
})
