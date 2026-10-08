// Blueprint 02 §Work (lista de casos, no rejilla; cada fila enlaza al caso), 03 (CaseRow) y 05 (BORRADOR
// solo en desarrollo, en la vista previa).
import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAtPath } from '../../site/__tests__/render'
import type { WorkData } from '../data'
import { WorkPage } from '../WorkPage'

const item = {
  slug: 'caso',
  title: 'Caso publicado',
  kind: 'Plataforma de prueba',
  role: 'Diseñé la arquitectura.',
  period: { dateTime: '2026-04', text: 'Abril–septiembre de 2026' },
  problem: 'El problema en una línea.',
  existence: 'real',
  confidentiality: 'sanitized',
  href: '/es/work/caso/',
  draft: false,
} as const satisfies WorkData['cases'][number]

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('WorkPage', () => {
  it('sin casos visibles: título, lede y el aviso de construcción, sin lista', () => {
    renderAtPath('/es/work/', <WorkPage data={{ cases: [] }} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Casos de estudio')
    expect(screen.getByText('Esta página está en construcción.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('cada fila: nombre enlazado, tipo, problema, rol, periodo y etiquetas; un borrador va marcado', () => {
    renderAtPath(
      '/es/work/',
      <WorkPage
        data={{ cases: [item, { ...item, slug: 'b', title: 'Caso en borrador', href: '/es/work/b/', draft: true }] }}
      />,
    )
    const rows = within(screen.getByRole('region', { name: 'Casos y labs' })).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    const [first, second] = rows
    if (!first || !second) throw new Error('faltan filas')
    expect(within(first).getByRole('link', { name: 'Caso publicado' })).toHaveAttribute('href', '/es/work/caso/')
    expect(first).toHaveTextContent('Plataforma de prueba')
    expect(first).toHaveTextContent('El problema en una línea.')
    expect(first).toHaveTextContent('Diseñé la arquitectura.')
    expect(within(first).getByText('Abril–septiembre de 2026')).toHaveAttribute('datetime', '2026-04')
    expect(within(first).getByText('Real')).toBeInTheDocument()
    expect(within(first).getByText('Sanitizado')).toBeInTheDocument()
    expect(first).not.toHaveTextContent('BORRADOR')
    expect(within(second).getByRole('heading', { level: 3 })).toHaveTextContent('Caso en borrador BORRADOR')

    vi.stubEnv('DEV', false)
    renderAtPath('/es/work/', <WorkPage data={{ cases: [{ ...item, draft: true }] }} />)
    expect(screen.getAllByRole('heading', { level: 3 }).at(-1)).toHaveTextContent(/^Caso publicado$/)
  })
})
