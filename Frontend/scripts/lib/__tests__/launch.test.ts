// Blueprint 16 §Contenido ("Sin PENDIENTE visible"; contacto y CV funcionando) y 11 principio 1 ("un
// gate solo cuenta si puede fallar"): cada chequeo de scripts/lib/launch.ts se prueba con datos rotos.
import { describe, expect, it } from 'vitest'
import type { ContactMeta } from '../../../src/content/schema'
import { site } from '../../../src/content/site'
import { devMarkerLeaks, isLaunchBuild, launchProblems } from '../launch'

const complete: ContactMeta = {
  email: 'cesar@example.test',
  linkedin: 'https://www.linkedin.com/in/example',
  github: 'https://github.com/example',
  cv: { es: '/cv/cesar-acosta-cv-es.pdf', en: '/cv/cesar-acosta-cv-en.pdf' },
  location: { es: 'Colombia', en: 'Colombia' },
  timezone: 'America/Bogota',
  availability: { es: 'Disponible', en: 'Available' },
  roleSought: { es: 'Backend', en: 'Backend' },
}
const cvFiles = ['cv/cesar-acosta-cv-es.pdf', 'cv/cesar-acosta-cv-en.pdf']

describe('isLaunchBuild', () => {
  it('lanzamiento = INDEXABLE o LAUNCH=true explícito', () => {
    expect(isLaunchBuild(false, {})).toBe(false)
    expect(isLaunchBuild(false, { LAUNCH: 'false' })).toBe(false)
    expect(isLaunchBuild(false, { LAUNCH: 'true' })).toBe(true)
    expect(isLaunchBuild(true, {})).toBe(true)
  })
})

describe('launchProblems', () => {
  it('un contacto pendiente hace fallar el build de lanzamiento, con la ruta del dato', () => {
    const contact = { ...complete, email: { pending: 'correo (C4)' }, cv: { ...complete.cv, en: { pending: 'CV EN' } } }
    expect(launchProblems(contact, cvFiles, true)).toEqual([
      'lanzamiento: contact.email sigue pendiente (correo (C4)); complétalo en src/content/site.ts',
      'lanzamiento: contact.cv.en sigue pendiente (CV EN); complétalo en src/content/site.ts',
    ])
  })

  it('fuera del lanzamiento no bloquea el build (F3: los datos dependen de C4)', () => {
    expect(launchProblems(site.contact, [], false)).toEqual([])
  })

  it('el contacto actual del sitio, todavía pendiente, fallaría al lanzar', () => {
    expect(launchProblems(site.contact, [], true).length).toBeGreaterThan(0)
  })

  it('un CV declarado que no está en el build también falla', () => {
    expect(launchProblems(complete, cvFiles, true)).toEqual([])
    expect(launchProblems(complete, cvFiles.slice(0, 1), true)).toEqual([
      'lanzamiento: el CV en en (/cv/cesar-acosta-cv-en.pdf) no existe en el build',
    ])
  })
})

describe('devMarkerLeaks', () => {
  it('un build limpio no reporta nada', () => {
    const texts = new Map([
      ['es/index.html', '<p>Quedaron pendientes, en minúsculas, como cualquier texto.</p>'],
      ['assets/home.js', 'export const x = 1'],
    ])
    expect(devMarkerLeaks(texts)).toEqual([])
  })

  it('detecta BORRADOR o PENDIENTE en el HTML, los datos de navegación o el JS', () => {
    const texts = new Map([
      ['es/index.html', '<span lang="es">BORRADOR</span>'],
      ['es/contact/_.data', '"PENDIENTE"'],
      ['assets/about.js', 'children:"BORRADOR"'],
    ])
    expect(devMarkerLeaks(texts)).toEqual([
      'es/index.html contiene "BORRADOR", que solo existe en desarrollo',
      'es/contact/_.data contiene "PENDIENTE", que solo existe en desarrollo',
      'assets/about.js contiene "BORRADOR", que solo existe en desarrollo',
    ])
  })
})
