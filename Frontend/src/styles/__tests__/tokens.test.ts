import { describe, expect, it } from 'vitest'
import tokensCss from '../tokens.css?raw'

// Gate sobre la paleta (03): contraste de texto en ambos temas y paleta oscura sin desincronizarse
// entre sus dos copias. axe en CI (11) verifica después las combinaciones reales de cada página.

const COLOR_TOKENS = [
  'paper',
  'surface',
  'surface-2',
  'ink',
  'muted',
  'line',
  'line-strong',
  'line-ui',
  'accent',
  'accent-wash',
  'ok',
  'warn',
  'threat',
] as const

type ColorToken = (typeof COLOR_TOKENS)[number]

/** Tokens que se usan como color de texto y deben dar ≥ 4.5:1 sobre --paper y --surface. */
const TEXT_TOKENS: readonly ColorToken[] = ['ink', 'muted', 'accent', 'ok', 'warn', 'threat']
const BACKGROUNDS: readonly ColorToken[] = ['paper', 'surface']

const css = tokensCss.replace(/\/\*[\s\S]*?\*\//g, '')

function block(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`No se encontró el bloque ${selector}`)
  const open = css.indexOf('{', start)
  const body = css.slice(open + 1, css.indexOf('}', open))
  return new Map(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1] ?? '', (match[2] ?? '').trim()]),
  )
}

const themes = {
  light: block(':root'),
  darkSystem: block(":root:not([data-theme='light'])"),
  darkChosen: block(":root[data-theme='dark']"),
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r = 0, g = 0, b = 0] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

describe('tokens de color', () => {
  it.each(Object.entries(themes))('%s define los 13 colores en hex', (_, theme) => {
    for (const token of COLOR_TOKENS) expect(theme.get(token), token).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('las dos copias de la paleta oscura son idénticas', () => {
    const pick = (theme: Map<string, string>) => COLOR_TOKENS.map((token) => [token, theme.get(token)])
    expect(pick(themes.darkChosen)).toEqual(pick(themes.darkSystem))
  })

  it.each([
    ['claro', themes.light],
    ['oscuro', themes.darkChosen],
  ])('tema %s: texto ≥ 4.5:1 sobre --paper y --surface', (_, theme) => {
    const failing = TEXT_TOKENS.flatMap((fg) =>
      BACKGROUNDS.map((bg) => ({ pair: `${fg}/${bg}`, ratio: contrast(theme.get(fg) ?? '', theme.get(bg) ?? '') })),
    ).filter(({ ratio }) => ratio < 4.5)
    expect(failing).toEqual([])
  })

  it.each([
    ['claro', themes.light],
    ['oscuro', themes.darkChosen],
  ])('tema %s: --line-ui ≥ 3:1 sobre las tres superficies (WCAG 1.4.11)', (_, theme) => {
    const failing = (['paper', 'surface', 'surface-2'] as const)
      .map((bg) => ({ bg, ratio: contrast(theme.get('line-ui') ?? '', theme.get(bg) ?? '') }))
      .filter(({ ratio }) => ratio < 3)
    expect(failing).toEqual([])
  })
})
