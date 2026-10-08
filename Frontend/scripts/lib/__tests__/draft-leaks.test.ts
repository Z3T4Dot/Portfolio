// Blueprint 05 verificación 10 y 11 principio 1 ("un gate solo cuenta si puede fallar"): el chequeo
// de drafts sobre el build se prueba con builds sintéticos que filtran un draft de cada forma.
import { describe, expect, it } from 'vitest'
import { findDraftLeaks, type BuiltSite, type DraftEntity } from '../draft-leaks'

const draft: DraftEntity = {
  label: 'case quantum',
  paths: ['/es/work/quantum/', '/en/work/quantum/'],
  markers: ['Plataforma Quantum', 'Quantum platform'],
}

const page = (body: string) => `<!doctype html><html><head></head><body>${body}</body></html>`

function site(files: Record<string, string>, binary: string[] = []): BuiltSite {
  return { files: [...Object.keys(files), ...binary], texts: new Map(Object.entries(files)) }
}

const clean = {
  'es/index.html': page('<a href="/es/work/">Trabajo</a>'),
  'es/work/index.html': page('<h1>Casos</h1>'),
  'sitemap.xml': '<urlset><url><loc>https://x.test/es/work/</loc></url></urlset>',
  'assets/home-abc.js': 'export const x = 1',
}

describe('findDraftLeaks', () => {
  it('un build limpio no reporta nada', () => {
    expect(findDraftLeaks([draft], site(clean))).toEqual([])
  })

  it('detecta la ruta generada (HTML o datos)', () => {
    const problems = findDraftLeaks([draft], site(clean, ['en/work/quantum/index.html', 'en/work/quantum/_.data']))
    expect(problems.join('\n')).toMatch(/generó su ruta/)
  })

  it('detecta la entrada del sitemap (loc o alternate)', () => {
    const sitemap =
      '<urlset><url><loc>https://x.test/es/work/</loc><xhtml:link href="https://x.test/en/work/quantum/"/></url></urlset>'
    const problems = findDraftLeaks([draft], site({ ...clean, 'sitemap.xml': sitemap }))
    expect(problems).toEqual(['case quantum: aparece en sitemap.xml (/en/work/quantum/)'])
  })

  it('detecta un enlace, también absoluto o sin barra final', () => {
    for (const href of ['/es/work/quantum/', 'https://x.test/es/work/quantum/', '/es/work/quantum']) {
      const problems = findDraftLeaks(
        [draft],
        site({ ...clean, 'es/work/index.html': page(`<a href="${href}">x</a>`) }),
      )
      expect(problems.some((problem) => problem.includes('es/work/index.html enlaza a /es/work/quantum/'))).toBe(true)
    }
  })

  it('detecta sus textos en el JS o en los datos de navegación', () => {
    const problems = findDraftLeaks([draft], site({ ...clean, 'assets/home-abc.js': 'const t="Quantum platform"' }))
    expect(problems).toEqual(['case quantum: assets/home-abc.js contiene "Quantum platform"'])
  })

  it('una etapa draft del timeline (sin ruta propia) se detecta por su texto en el HTML o en _.data', () => {
    const stage: DraftEntity = { label: 'timeline keepme', paths: [], markers: ['KeepMe'] }
    expect(findDraftLeaks([stage], site(clean))).toEqual([])
    const leaked = site({
      ...clean,
      'es/about/index.html': page('<h3>KeepMe</h3>'),
      'es/about/_.data': '[{"title":"KeepMe"}]',
    })
    expect(findDraftLeaks([stage], leaked)).toEqual([
      'timeline keepme: es/about/index.html contiene "KeepMe"',
      'timeline keepme: es/about/_.data contiene "KeepMe"',
    ])
  })
})
