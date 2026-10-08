// Blueprint 02 §Contact y 16 §Contenido ("Sin PENDIENTE visible"): cada dato pendiente (15 C4) se ve
// como aviso en desarrollo y desaparece por completo en producción. Nunca hay un valor inventado.
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pendingFields } from '../../../content/pending'
import { site } from '../../../content/site'
import { renderAtPath } from '../../site/__tests__/render'
import { ContactPage } from '../ContactPage'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('ContactPage', () => {
  it('en desarrollo, un aviso por cada dato pendiente, bajo su etiqueta', () => {
    renderAtPath('/es/contact/', <ContactPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Contacto' })).toBeInTheDocument()
    const notes = screen.getAllByRole('note')
    expect(notes).toHaveLength(pendingFields(site.contact).length)
    expect(screen.getByText('Correo')).toBeInTheDocument()
    expect(notes.map((note) => note.textContent).join('\n')).toMatch(/GitHub, confirmada como pública/)
    // Nada de mailto ni perfiles inventados mientras sean pendientes.
    expect(screen.queryAllByRole('link')).toEqual([])
  })

  it('en producción, los datos pendientes no dejan valor, etiqueta ni aviso', () => {
    vi.stubEnv('DEV', false)
    renderAtPath('/en/contact/', <ContactPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Contact' })).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    expect(screen.queryByText('Email')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/PENDIENTE|BORRADOR/)
  })
})
