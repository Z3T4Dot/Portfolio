// Blueprint 02 §About (estructura y CTAs "Descargar CV" y "Contactar"), 03 (Timeline; sin barras de
// nivel), el cargo formal separado de las responsabilidades reales (respuesta de César, C2) y 16
// ("Sin PENDIENTE visible": el CV pendiente solo se anuncia en desarrollo).
import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAtPath } from '../../site/__tests__/render'
import { aboutData, type AboutData } from '../data'
import { AboutPage } from '../AboutPage'

const real = (): AboutData => aboutData('es', { includeDrafts: false })

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('AboutPage', () => {
  it('h1, lede e introducción; cargo formal separado de las responsabilidades', () => {
    renderAtPath('/es/about/', <AboutPage data={real()} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Sobre mí' })).toBeInTheDocument()
    expect(screen.getByText(/^Soy desarrollador de software/)).toBeInTheDocument()
    const role = screen.getByRole('region', { name: 'Cargo y responsabilidades' })
    expect(within(role).getByText('Desarrollador Junior en Brandex (desde julio de 2025)')).toBeInTheDocument()
    expect(within(role).getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('los cuatro pilares con habilidades en lista simple (sin niveles ni barras)', () => {
    renderAtPath('/es/about/', <AboutPage data={real()} />)
    const pillars = screen.getByRole('region', { name: 'Pilares' })
    const names = within(pillars)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(names).toEqual(['Ingeniería', 'Seguridad', 'Liderazgo técnico', 'Sistemas de negocio'])
    expect(within(pillars).queryByRole('progressbar')).not.toBeInTheDocument()
    expect(within(pillars).queryByRole('meter')).not.toBeInTheDocument()
    // Sin casos publicados todavía, ningún pilar enlaza a evidencia.
    expect(within(pillars).queryByText('Evidencia')).not.toBeInTheDocument()
  })

  it('timeline con id para el enlace desde Home, principios, formación y CTA a Contacto', () => {
    renderAtPath('/es/about/', <AboutPage data={real()} />)
    const timeline = screen.getByRole('region', { name: 'Trayectoria' })
    expect(timeline).toHaveAttribute('id', 'timeline')
    expect(within(timeline).getByRole('heading', { name: 'Desarrollador Junior en Brandex' })).toBeInTheDocument()
    expect(within(timeline).getByText('Desde julio de 2025')).toBeInTheDocument()
    const principles = screen.getByRole('region', { name: 'Cómo trabajo' })
    expect(within(principles).getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(4)
    expect(screen.getByRole('region', { name: 'Formación' })).toHaveTextContent(
      'Tecnólogo en Análisis y Desarrollo de Software (ADSO), SENA, 2025',
    )
    expect(screen.getByRole('link', { name: 'Contactar' })).toHaveAttribute('href', '/es/contact/')
  })

  it('Selected Work se enlaza (no se duplica) solo si hay fichas visibles', () => {
    const { unmount } = renderAtPath('/es/about/', <AboutPage data={real()} />)
    expect(screen.queryByRole('link', { name: /Selected Work/ })).not.toBeInTheDocument()
    unmount()
    renderAtPath('/es/about/', <AboutPage data={{ ...real(), hasSelectedWork: true }} />)
    expect(screen.getByRole('link', { name: /Selected Work/ })).toHaveAttribute('href', '/es/work/#selected-work')
  })

  it('el CV pendiente: aviso en desarrollo, nada en producción (ni enlace inventado)', () => {
    const { unmount } = renderAtPath('/es/about/', <AboutPage data={real()} />)
    expect(screen.getByRole('note')).toHaveTextContent(/PENDIENTE.*CV en PDF en español/)
    expect(screen.queryByRole('link', { name: /Descargar CV/ })).not.toBeInTheDocument()
    unmount()
    vi.stubEnv('DEV', false)
    renderAtPath('/es/about/', <AboutPage data={real()} />)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/PENDIENTE|BORRADOR/)
  })

  it('una etapa draft, y un caso draft que abre, se ven marcados como BORRADOR (solo en la vista previa)', () => {
    const data = aboutData('es', { includeDrafts: true })
    renderAtPath('/es/about/', <AboutPage data={data} />)
    const drafts = data.timeline.filter((stage) => stage.draft)
    const draftCases = data.timeline.flatMap((stage) => stage.projects.filter((project) => project.draft))
    expect(drafts.length).toBeGreaterThan(0)
    expect(draftCases.map((project) => project.slug)).toContain('quantum')
    const timeline = screen.getByRole('region', { name: 'Trayectoria' })
    expect(within(timeline).getAllByText('BORRADOR')).toHaveLength(drafts.length + draftCases.length)
    expect(within(timeline).getByRole('link', { name: 'Quantum' })).toHaveAttribute('href', '/es/work/quantum/')
  })
})
