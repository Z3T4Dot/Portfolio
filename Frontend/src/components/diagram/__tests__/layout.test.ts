// Blueprint 03 §Diagramas (aristas con flecha entre nodos, fronteras; variante vertical en móvil, "si un
// diagrama no cabe, no se reduce hasta quedar ilegible") y 11 §2: la geometría es lógica pura y cada
// diagrama real se verifica en las dos variantes y en los dos idiomas.
import { describe, expect, it } from 'vitest'
import { projectDiagrams } from '../../../content/projects'
import type { Locale } from '../../../content/schema'
import { gridLayout, layoutProblems, verticalLayout, verticalOrder, wrapLabel, type LayoutSource } from '../layout'

const node = (id: string, label = id) => ({ id, label })

describe('wrapLabel', () => {
  it('parte por palabras sin pasar del máximo y no corta una palabra larga', () => {
    expect(wrapLabel('Auditoría, notificaciones y analítica', 16)).toEqual([
      'Auditoría,',
      'notificaciones y',
      'analítica',
    ])
    expect(wrapLabel('Runtime', 4)).toEqual(['Runtime'])
    expect(wrapLabel('  dos   espacios ', 40)).toEqual(['dos espacios'])
  })
})

describe('gridLayout', () => {
  it('nodos alineados en columna: arista recta de abajo hacia arriba del siguiente', () => {
    const layout = gridLayout({ nodes: [node('a'), node('b')], edges: [{ from: 'a', to: 'b' }], grid: [['a'], ['b']] })
    const [a, b] = layout.nodes
    const [edge] = layout.edges
    expect(edge?.points).toHaveLength(2)
    expect(edge?.points[0]?.[1]).toBe((a?.rect.y ?? 0) + (a?.rect.h ?? 0))
    expect(edge?.points[1]?.[1]).toBe(b?.rect.y)
  })

  it('nodos en columnas distintas: codo por el hueco entre filas', () => {
    const layout = gridLayout({
      nodes: [node('a'), node('b')],
      edges: [{ from: 'a', to: 'b', label: 'sí' }],
      grid: [
        ['a', null],
        [null, 'b'],
      ],
    })
    const edge = layout.edges[0]
    expect(edge?.points).toHaveLength(4)
    expect(edge?.label?.text).toBe('sí')
    expect(layoutProblems(layout)).toEqual([])
  })

  it('un id repetido ocupa varias celdas y recibe aristas rectas desde cada columna', () => {
    const layout = gridLayout({
      nodes: [node('a'), node('b'), node('db')],
      edges: [
        { from: 'a', to: 'db' },
        { from: 'b', to: 'db' },
      ],
      grid: [
        ['a', 'b'],
        ['db', 'db'],
      ],
    })
    const db = layout.nodes.find((n) => n.id === 'db')
    const a = layout.nodes.find((n) => n.id === 'a')
    expect(db?.rect.w).toBeGreaterThan((a?.rect.w ?? 0) * 2)
    expect(layout.edges.every((edge) => edge.points.length === 2)).toBe(true)
  })

  it('un par de aristas de ida y vuelta se dibuja como dos rectas paralelas', () => {
    const layout = gridLayout({
      nodes: [node('pep'), node('pdp')],
      edges: [
        { from: 'pep', to: 'pdp' },
        { from: 'pdp', to: 'pep' },
      ],
      grid: [['pep', 'pdp']],
    })
    const [ida, vuelta] = layout.edges
    expect(ida?.points).toHaveLength(2)
    expect(vuelta?.points).toHaveLength(2)
    expect(ida?.points[0]?.[1]).not.toBe(vuelta?.points[0]?.[1])
  })

  it('la frontera envuelve a sus nodos con espacio para su etiqueta', () => {
    const layout = gridLayout({
      nodes: [node('a'), node('b')],
      edges: [],
      boundaries: [{ id: 'red', label: 'Red interna', nodes: ['b'] }],
      grid: [['a'], ['b']],
    })
    const b = layout.nodes[1]?.rect
    const boundary = layout.boundaries[0]
    expect(boundary?.rect.y).toBeLessThan((b?.y ?? 0) - 20)
    expect(boundary?.label.text).toBe('Red interna')
    expect(layoutProblems(layout)).toEqual([])
  })
})

describe('verticalLayout', () => {
  const source: LayoutSource = {
    nodes: [node('a'), node('b'), node('c'), node('d')],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'a', to: 'c', label: 'salta' },
      { from: 'b', to: 'd' },
      { from: 'd', to: 'a' },
    ],
    grid: [['a', 'b', 'c', 'd']],
  }

  it('un nodo por fila, en el orden de la grilla si no se indica otro', () => {
    expect(verticalOrder(source)).toEqual(['a', 'b', 'c', 'd'])
    const layout = verticalLayout(source)
    const ys = layout.nodes.map((n) => n.rect.y)
    expect([...ys].sort((p, q) => p - q)).toEqual(ys)
    expect(new Set(layout.nodes.map((n) => n.rect.x)).size).toBe(1)
  })

  it('las aristas entre nodos no contiguos van por carriles distintos a la derecha, sin cruzar nodos', () => {
    const layout = verticalLayout(source)
    const right = (layout.nodes[0]?.rect.x ?? 0) + (layout.nodes[0]?.rect.w ?? 0)
    const lanes = layout.edges.filter((edge) => edge.points.length === 4).map((edge) => edge.points[1]?.[0] ?? 0)
    expect(lanes).toHaveLength(3)
    expect(lanes.every((x) => x > right)).toBe(true)
    expect(new Set(lanes).size).toBe(3)
    expect(layoutProblems(layout)).toEqual([])
  })
})

describe('layoutProblems', () => {
  it('detecta una arista que atraviesa un nodo ajeno (el chequeo puede fallar)', () => {
    const layout = gridLayout({
      nodes: [node('a'), node('b'), node('c')],
      edges: [{ from: 'a', to: 'c' }],
      grid: [['a', 'b', 'c']],
    })
    expect(layoutProblems(layout)).toEqual(['la arista a→c cruza b'])
  })

  it('detecta una etiqueta que tapa un nodo', () => {
    const layout = gridLayout({
      nodes: [node('a'), node('b')],
      edges: [{ from: 'a', to: 'b', label: 'una etiqueta demasiado larga para el hueco' }],
      grid: [['a', 'b']],
    })
    expect(layoutProblems(layout).join('\n')).toMatch(/tapa/)
  })
})

describe('diagramas reales: ninguna arista cruza un nodo ni una etiqueta tapa nada', () => {
  const locales: Locale[] = ['es', 'en']
  const graphs = Object.values(projectDiagrams).flat()

  it.each(graphs.flatMap((graph) => locales.map((locale) => [graph.id, locale, graph] as const)))(
    '%s (%s)',
    (_, locale, graph) => {
      const source: LayoutSource = {
        nodes: graph.nodes.map((n) => ({ id: n.id, label: n.label[locale] })),
        edges: graph.edges.map((e) => ({ from: e.from, to: e.to, label: e.label?.[locale] })),
        boundaries: graph.boundaries?.map((b) => ({ id: b.id, label: b.label[locale], nodes: b.nodes })),
        grid: graph.layout.grid,
        vertical: graph.layout.vertical,
      }
      expect(layoutProblems(gridLayout(source)), 'escritorio').toEqual([])
      expect(layoutProblems(verticalLayout(source)), 'móvil').toEqual([])
      // Legible: a lo sumo tres líneas por nodo en cualquier variante.
      for (const layout of [gridLayout(source), verticalLayout(source)]) {
        expect(Math.max(...layout.nodes.map((n) => n.lines.length))).toBeLessThanOrEqual(3)
      }
    },
  )
})
