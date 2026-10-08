// Blueprint 16 §Contenido ("Sin PENDIENTE visible") y 15 C4 (content/pending.ts), y 05 verificación 10
// (vista previa de borradores: content/publication.ts → visibleOnly).
import { describe, expect, it } from 'vitest'
import { isPending, pendingFields } from '../pending'
import { visibleOnly } from '../publication'
import { site } from '../site'

describe('isPending / pendingFields', () => {
  it('distingue un valor pendiente de uno real, también de textos por idioma', () => {
    expect(isPending({ pending: 'correo (C4)' })).toBe(true)
    expect(isPending('cesar@example.test')).toBe(false)
    expect(isPending({ es: 'Bogotá', en: 'Bogotá' })).toBe(false)
  })

  it('lista la ruta y la nota de cada pendiente, a cualquier profundidad', () => {
    const contact = { email: 'a@b.test', cv: { es: { pending: 'CV ES' }, en: '/cv/en.pdf' }, tz: { pending: 'zona' } }
    expect(pendingFields(contact, 'contact')).toEqual([
      { path: 'contact.cv.es', note: 'CV ES' },
      { path: 'contact.tz', note: 'zona' },
    ])
    expect(pendingFields({ email: 'a@b.test' })).toEqual([])
  })

  it('el contacto del sitio no inventa valores: lo que no es pendiente es una URL, un correo o una ruta real', () => {
    const { email, linkedin, github, cv } = site.contact
    if (!isPending(email)) expect(email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/i)
    for (const url of [linkedin, github]) if (!isPending(url)) expect(url).toMatch(/^https:\/\//)
    for (const path of [cv.es, cv.en]) if (!isPending(path)) expect(path).toMatch(/^\/cv\/[\w-]+\.pdf$/)
  })
})

describe('visibleOnly (vista previa de borradores)', () => {
  const entries = [
    { slug: 'publicado', publication: 'published' },
    { slug: 'borrador', publication: 'draft' },
  ] as const

  it('sin la vista previa solo quedan los publicados; con ella, también los draft', () => {
    expect(visibleOnly(entries, false).map((entry) => entry.slug)).toEqual(['publicado'])
    expect(visibleOnly(entries, true).map((entry) => entry.slug)).toEqual(['publicado', 'borrador'])
  })
})
