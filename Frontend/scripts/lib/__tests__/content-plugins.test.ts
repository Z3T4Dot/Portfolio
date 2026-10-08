// Blueprint 05 §Prosa en MDX ("No se permiten `import` dentro del MDX: lo verifica un plugin de remark en
// build"; sin HTML crudo) y verificación 10 (la prosa de un draft no entra al build). 11 principio 1:
// cada regla se prueba con un MDX que debe fallar, compilado con el mismo compilador que usa el build.
import { compile } from '@mdx-js/mdx'
import { describe, expect, it } from 'vitest'
import { MDX_COMPONENTS } from '../../../src/content/mdx'
import { caseProseModule, isAssetQuery, remarkMdxGuard } from '../../content-plugins.mjs'

const build = (source: string) =>
  compile(source, { remarkPlugins: [[remarkMdxGuard, { components: MDX_COMPONENTS }]] }).then(() => 'ok')

describe('remarkMdxGuard', () => {
  it('acepta las secciones, los componentes de la lista, comentarios y código', async () => {
    const source = [
      '{/* Comentario de trazabilidad */}',
      '<Section id="context">',
      '',
      'Texto con `código` y **énfasis**.',
      '',
      '<Metric id="a" /> <Metric id="b" />',
      '',
      '```tsx',
      'import X from "x"',
      '<div>{x}</div>',
      '```',
      '',
      '</Section>',
    ].join('\n')
    await expect(build(source)).resolves.toBe('ok')
  })

  it.each([
    ['import', 'import X from \'./x\'\n\n<Section id="a">Texto.</Section>', /import\/export no permitido/],
    ['export', 'export const a = 1', /import\/export no permitido/],
    ['HTML crudo', '<div>crudo</div>', /HTML crudo no permitido \(<div>\)/],
    ['componente fuera de la lista', '<Chart id="x" />', /componente no permitido \(<Chart>\)/],
    ['atributo con expresión', '<Metric id={dato} />', /debe ser un texto, no una expresión/],
    ['atributo con spread', '<Metric {...props} />', /spread no permitido/],
    ['expresión en el texto', 'Hoy es {new Date().getFullYear()}.', /expresión no permitida/],
    ['fragmento', '<>\nTexto\n</>', /fragmento JSX no permitido/],
  ])('rechaza %s', async (_, source, message) => {
    await expect(build(source)).rejects.toThrow(message)
  })

  it('el MDX real de los casos cumple (lo mismo que hace el build)', async () => {
    const sources = import.meta.glob<string>('../../../src/content/projects/*/*.mdx', {
      query: '?raw',
      import: 'default',
      eager: true,
    })
    expect(Object.keys(sources).length).toBeGreaterThan(0)
    for (const source of Object.values(sources)) await expect(build(source)).resolves.toBe('ok')
  })
})

describe('virtual:case-prose', () => {
  const entries = [
    { slug: 'publicado', publication: 'published' },
    { slug: 'borrador', publication: 'draft' },
  ] as const

  it('en el build solo importa la prosa de casos publicados', () => {
    const code = caseProseModule(entries, { includeDrafts: false })
    expect(code).toContain('"/src/content/projects/publicado/*.mdx"')
    expect(code).not.toContain('borrador')
  })

  it('en desarrollo importa también la de los borradores', () => {
    expect(caseProseModule(entries, { includeDrafts: true })).toContain('"/src/content/projects/borrador/*.mdx"')
  })

  it('sin casos publicados no hay ningún import (Quantum es draft: nada de su prosa en el build)', () => {
    expect(caseProseModule([{ slug: 'quantum', publication: 'draft' }], { includeDrafts: false })).toBe(
      'export const caseProse = {}\n',
    )
  })

  it('el texto crudo (?raw) no se compila como MDX; un import de HMR sí', () => {
    expect(isAssetQuery('/src/content/projects/x/es.mdx?raw')).toBe(true)
    expect(isAssetQuery('/src/content/projects/x/es.mdx?import&raw')).toBe(true)
    expect(isAssetQuery('/src/content/projects/x/es.mdx?url')).toBe(true)
    expect(isAssetQuery('/src/content/projects/x/es.mdx?t=1696000000')).toBe(false)
    expect(isAssetQuery('/src/content/projects/x/es.mdx')).toBe(false)
  })
})
