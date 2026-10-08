// Blueprint 03 §Diagramas: los diagramas se generan desde datos tipados y se renderizan como SVG; en
// móvil hay una variante vertical. Geometría pura, sin DOM: el prerender y el cliente calculan lo
// mismo, así que el HTML estático ya trae el diagrama completo y la hidratación no cambia nada.
//
// - `gridLayout`: escritorio. Cada nodo ocupa celdas de una grilla; las aristas salen y entran por
//   el lado que mira al otro nodo, rectas si se alinean y en codo por el hueco entre filas o columnas.
// - `verticalLayout`: móvil. Un nodo por fila a todo el ancho; las aristas entre nodos contiguos son
//   rectas y el resto va por carriles a la derecha, así ninguna cruza un nodo.
// - `layoutProblems`: lo que un test exige de cada diagrama real (ninguna arista atraviesa un nodo
//   ajeno, ninguna etiqueta tapa un nodo u otra etiqueta).

export type Point = readonly [number, number]

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface LayoutSource {
  nodes: ReadonlyArray<{ id: string; label: string }>
  edges: ReadonlyArray<{ from: string; to: string; label?: string | undefined }>
  boundaries?: ReadonlyArray<{ id: string; label: string; nodes: readonly string[] }> | undefined
  grid: ReadonlyArray<ReadonlyArray<string | null>>
  vertical?: readonly string[] | undefined
}

export interface PlacedLabel {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  text: string
  /** Caja aproximada del texto, con margen; se pinta con el fondo para que la arista no lo cruce. */
  box: Rect
}

export interface PlacedNode {
  id: string
  rect: Rect
  lines: string[]
}

export interface PlacedEdge {
  index: number
  from: string
  to: string
  points: Point[]
  label: PlacedLabel | null
}

export interface PlacedBoundary {
  id: string
  rect: Rect
  label: PlacedLabel
}

export interface DiagramLayout {
  width: number
  height: number
  nodes: PlacedNode[]
  edges: PlacedEdge[]
  boundaries: PlacedBoundary[]
}

/** Tipografía en unidades del viewBox (03: etiqueta de nodo en Archivo 14px). */
export const TYPE = { node: 14, lineHeight: 18, label: 12 } as const

// Ancho medio de un carácter de Archivo, con margen para no desbordar el nodo.
const NODE_CHAR = 8
const LABEL_CHAR = 6.8

const GRID = { width: 840, pad: 24, boundaryPad: 40, colGap: 56, rowGap: 64, padX: 12, padY: 14, minNodeH: 48 }
const VERTICAL = { width: 360, pad: 16, gap: 40, laneOffset: 14, laneGap: 10, padX: 12, padY: 12, minNodeH: 44 }

/** Parte una etiqueta en líneas de `maxChars` como máximo, sin cortar palabras. */
export function wrapLabel(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (!line || next.length <= maxChars) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function labelAt(x: number, y: number, anchor: PlacedLabel['anchor'], text: string): PlacedLabel {
  const w = text.length * LABEL_CHAR + 8
  const left = anchor === 'start' ? x - 4 : anchor === 'middle' ? x - w / 2 : x - w + 4
  return { x, y, anchor, text, box: { x: left, y: y - TYPE.label, w, h: TYPE.label + 5 } }
}

/** Orden de la variante vertical: el explícito o la grilla fila por fila. */
export function verticalOrder(source: LayoutSource): string[] {
  if (source.vertical) return [...source.vertical]
  const seen = new Set<string>()
  for (const row of source.grid) for (const id of row) if (id) seen.add(id)
  return [...seen]
}

// -----------------------------------------------------------------------------------------------
// Escritorio

type Side = 'top' | 'bottom' | 'left' | 'right'

interface End {
  edge: number
  side: Side
  /** Posición a lo largo del lado: x en top/bottom, y en left/right. */
  pos: number
}

const isVertical = (side: Side) => side === 'top' || side === 'bottom'

function sides(a: Rect, b: Rect): [Side, Side] {
  if (b.y >= a.y + a.h) return ['bottom', 'top']
  if (b.y + b.h <= a.y) return ['top', 'bottom']
  return b.x >= a.x + a.w ? ['right', 'left'] : ['left', 'right']
}

const range = (rect: Rect, side: Side): [number, number] =>
  isVertical(side) ? [rect.x, rect.x + rect.w] : [rect.y, rect.y + rect.h]

const center = (rect: Rect, side: Side) => (isVertical(side) ? rect.x + rect.w / 2 : rect.y + rect.h / 2)

const within = (value: number, [start, end]: [number, number]) => value >= start + 10 && value <= end - 10

export function gridLayout(source: LayoutSource): DiagramLayout {
  const { grid } = source
  const cols = Math.max(...grid.map((row) => row.length))
  const boundaries = source.boundaries ?? []
  const pad = boundaries.length > 0 ? GRID.boundaryPad : GRID.pad
  const cellW = (GRID.width - 2 * pad - (cols - 1) * GRID.colGap) / cols

  const spans = new Map<string, { r0: number; r1: number; c0: number; c1: number }>()
  grid.forEach((row, r) => {
    row.forEach((id, c) => {
      if (!id) return
      const span = spans.get(id)
      if (!span) spans.set(id, { r0: r, r1: r, c0: c, c1: c })
      else
        spans.set(id, {
          r0: Math.min(span.r0, r),
          r1: Math.max(span.r1, r),
          c0: Math.min(span.c0, c),
          c1: Math.max(span.c1, c),
        })
    })
  })
  const spanOf = (id: string) => {
    const span = spans.get(id)
    if (!span) throw new Error(`El nodo "${id}" no está en layout.grid`)
    return span
  }
  const spanWidth = (c0: number, c1: number) => (c1 - c0 + 1) * cellW + (c1 - c0) * GRID.colGap
  const maxChars = (w: number) => Math.max(4, Math.floor((w - 2 * GRID.padX) / NODE_CHAR))

  const lines = new Map(
    source.nodes.map((node) => {
      const span = spanOf(node.id)
      return [node.id, wrapLabel(node.label, maxChars(spanWidth(span.c0, span.c1)))] as const
    }),
  )
  const nodeH = Math.max(GRID.minNodeH, ...[...lines.values()].map((l) => l.length * TYPE.lineHeight + 2 * GRID.padY))
  // Espacio para la etiqueta de una frontera que empieza en la primera fila.
  const top = pad + (boundaries.length > 0 ? 8 : 0)
  const rowY = (r: number) => top + r * (nodeH + GRID.rowGap)

  const nodes: PlacedNode[] = source.nodes.map((node) => {
    const span = spanOf(node.id)
    return {
      id: node.id,
      lines: lines.get(node.id) ?? [],
      rect: {
        x: pad + span.c0 * (cellW + GRID.colGap),
        y: rowY(span.r0),
        w: spanWidth(span.c0, span.c1),
        h: (span.r1 - span.r0 + 1) * nodeH + (span.r1 - span.r0) * GRID.rowGap,
      },
    }
  })
  const rects = new Map(nodes.map((node) => [node.id, node.rect]))
  const rectOf = (id: string) => {
    const rect = rects.get(id)
    if (!rect) throw new Error(`Arista hacia un nodo que no existe: "${id}"`)
    return rect
  }

  // Extremos de cada arista, agrupados por nodo y lado, repartidos a lo largo del lado.
  const ends = source.edges.map((edge, index) => {
    const [a, b] = sides(rectOf(edge.from), rectOf(edge.to))
    const from: End = { edge: index, side: a, pos: 0 }
    const to: End = { edge: index, side: b, pos: 0 }
    return { from, to }
  })
  const groups = new Map<string, { node: string; side: Side; items: Array<{ end: End; other: string }> }>()
  const push = (node: string, end: End, other: string) => {
    const key = `${node}|${end.side}`
    const group = groups.get(key) ?? { node, side: end.side, items: [] }
    group.items.push({ end, other })
    groups.set(key, group)
  }
  source.edges.forEach((edge, i) => {
    const pair = ends[i]
    if (!pair) return
    push(edge.from, pair.from, edge.to)
    push(edge.to, pair.to, edge.from)
  })
  for (const { node, side, items } of groups.values()) {
    const [start, end] = range(rectOf(node), side)
    items
      .sort((p, q) => center(rectOf(p.other), side) - center(rectOf(q.other), side) || p.end.edge - q.end.edge)
      .forEach((item, k) => {
        item.end.pos = start + ((end - start) * (k + 1)) / (items.length + 1)
      })
  }
  const groupSize = (node: string, side: Side) => groups.get(`${node}|${side}`)?.items.length ?? 0
  const length = ([start, end]: [number, number]) => end - start

  const edges: PlacedEdge[] = source.edges.map((edge, index) => {
    const pair = ends[index]
    if (!pair) throw new Error('inalcanzable')
    const a = rectOf(edge.from)
    const b = rectOf(edge.to)
    const { from: ea, to: eb } = pair
    // Alinear para trazar una recta cuando los nodos se solapan en el eje: se mueve el extremo del
    // lado que tiene una sola arista o del nodo más ancho (un bloque como PostgreSQL).
    if (Math.abs(ea.pos - eb.pos) > 0.5) {
      const lenA = length(range(a, ea.side))
      const lenB = length(range(b, eb.side))
      if (within(ea.pos, range(b, eb.side)) && (groupSize(edge.to, eb.side) === 1 || lenB > lenA * 1.5)) {
        eb.pos = ea.pos
      } else if (within(eb.pos, range(a, ea.side)) && (groupSize(edge.from, ea.side) === 1 || lenA > lenB * 1.5)) {
        ea.pos = eb.pos
      }
    }
    const straight = Math.abs(ea.pos - eb.pos) <= 0.5
    let points: Point[]
    if (isVertical(ea.side)) {
      const ya = ea.side === 'bottom' ? a.y + a.h : a.y
      const yb = eb.side === 'top' ? b.y : b.y + b.h
      const ym = ea.side === 'bottom' ? ya + GRID.rowGap / 2 : ya - GRID.rowGap / 2
      points = straight
        ? [
            [ea.pos, ya],
            [ea.pos, yb],
          ]
        : [
            [ea.pos, ya],
            [ea.pos, ym],
            [eb.pos, ym],
            [eb.pos, yb],
          ]
    } else {
      const xa = ea.side === 'right' ? a.x + a.w : a.x
      const xb = eb.side === 'left' ? b.x : b.x + b.w
      const xm = ea.side === 'right' ? xa + GRID.colGap / 2 : xa - GRID.colGap / 2
      points = straight
        ? [
            [xa, ea.pos],
            [xb, ea.pos],
          ]
        : [
            [xa, ea.pos],
            [xm, ea.pos],
            [xm, eb.pos],
            [xb, eb.pos],
          ]
    }
    return { index, from: edge.from, to: edge.to, points, label: edge.label ? gridEdgeLabel(points, edge.label) : null }
  })

  return {
    width: GRID.width,
    height: rowY(grid.length - 1) + nodeH + pad,
    nodes,
    edges,
    boundaries: boundaries.map((boundary) => placeBoundary(boundary, rects, 14, 30)),
  }
}

function gridEdgeLabel(points: readonly Point[], text: string): PlacedLabel {
  const [p0, p1, p2] = points
  if (!p0 || !p1) throw new Error('arista sin puntos')
  if (points.length === 2) {
    return p0[0] === p1[0]
      ? labelAt(p0[0] + 6, (p0[1] + p1[1]) / 2 + 4, 'start', text)
      : labelAt((p0[0] + p1[0]) / 2, p0[1] - 6, 'middle', text)
  }
  if (!p2) throw new Error('codo sin tramo central')
  // Codo: la etiqueta va en el tramo central.
  return p1[1] === p2[1]
    ? labelAt((p1[0] + p2[0]) / 2, p1[1] - 6, 'middle', text)
    : labelAt(p1[0] + 6, (p1[1] + p2[1]) / 2 + 4, 'start', text)
}

function placeBoundary(
  boundary: { id: string; label: string; nodes: readonly string[] },
  rects: ReadonlyMap<string, Rect>,
  side: number,
  top: number,
): PlacedBoundary {
  const members = boundary.nodes.flatMap((id) => {
    const rect = rects.get(id)
    return rect ? [rect] : []
  })
  const x0 = Math.min(...members.map((r) => r.x)) - side
  const y0 = Math.min(...members.map((r) => r.y)) - top
  const x1 = Math.max(...members.map((r) => r.x + r.w)) + side
  const y1 = Math.max(...members.map((r) => r.y + r.h)) + side
  return {
    id: boundary.id,
    rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
    label: labelAt(x0 + 12, y0 + 18, 'start', boundary.label),
  }
}

// -----------------------------------------------------------------------------------------------
// Móvil

export function verticalLayout(source: LayoutSource): DiagramLayout {
  const order = verticalOrder(source)
  const index = new Map(order.map((id, i) => [id, i]))
  const indexOf = (id: string) => {
    const i = index.get(id)
    if (i === undefined) throw new Error(`El nodo "${id}" no está en el orden vertical`)
    return i
  }
  const labels = new Map(source.nodes.map((node) => [node.id, node.label]))

  // Carriles: cada arista entre nodos no contiguos usa uno, sin solaparse con otra en el mismo carril.
  const laneEdges = source.edges
    .map((edge, i) => ({ i, a: indexOf(edge.from), b: indexOf(edge.to) }))
    .filter(({ a, b }) => Math.abs(a - b) > 1)
    .sort((p, q) => Math.min(p.a, p.b) - Math.min(q.a, q.b) || Math.max(p.a, p.b) - Math.max(q.a, q.b))
  const lanes: Array<Array<[number, number]>> = []
  const laneOf = new Map<number, number>()
  for (const { i, a, b } of laneEdges) {
    const span: [number, number] = [Math.min(a, b), Math.max(a, b)]
    let lane = lanes.findIndex((taken) => taken.every(([s, e]) => !(span[0] < e && s < span[1])))
    if (lane === -1) {
      lane = lanes.length
      lanes.push([])
    }
    lanes[lane]?.push(span)
    laneOf.set(i, lane)
  }
  const lanesW = lanes.length > 0 ? VERTICAL.laneOffset + (lanes.length - 1) * VERTICAL.laneGap + 8 : 0
  const nodeW = VERTICAL.width - 2 * VERTICAL.pad - lanesW
  const maxChars = Math.max(4, Math.floor((nodeW - 2 * VERTICAL.padX) / NODE_CHAR))

  const boundaries = source.boundaries ?? []
  const boundaryStarts = new Set(
    boundaries.map((boundary) => Math.min(...boundary.nodes.map((id) => index.get(id) ?? Infinity))),
  )
  const nodes: PlacedNode[] = []
  let y = VERTICAL.pad + (boundaryStarts.has(0) ? 30 : 0)
  for (const id of order) {
    const lines = wrapLabel(labels.get(id) ?? id, maxChars)
    const h = Math.max(VERTICAL.minNodeH, lines.length * TYPE.lineHeight + 2 * VERTICAL.padY)
    nodes.push({ id, lines, rect: { x: VERTICAL.pad, y, w: nodeW, h } })
    y += h + VERTICAL.gap
  }
  const rects = new Map(nodes.map((node) => [node.id, node.rect]))
  const rectOf = (id: string): Rect => {
    const rect = rects.get(id)
    if (!rect) throw new Error(`Arista hacia un nodo que no existe: "${id}"`)
    return rect
  }

  // Extremos: aristas contiguas por abajo/arriba; aristas de carril por la derecha.
  interface Slot {
    edge: number
    sortKey: number
    set: (pos: number) => void
  }
  const groups = new Map<string, { node: string; side: Side; slots: Slot[] }>()
  const add = (node: string, side: Side, slot: Slot) => {
    const key = `${node}|${side}`
    const group = groups.get(key) ?? { node, side, slots: [] }
    group.slots.push(slot)
    groups.set(key, group)
  }
  const anchors = source.edges.map(() => ({ a: 0, b: 0 }))
  source.edges.forEach((edge, i) => {
    const a = indexOf(edge.from)
    const b = indexOf(edge.to)
    const anchor = anchors[i]
    if (!anchor) return
    if (Math.abs(a - b) === 1) {
      add(edge.from, a < b ? 'bottom' : 'top', {
        edge: i,
        sortKey: i,
        set: (pos) => {
          anchor.a = pos
        },
      })
      add(edge.to, a < b ? 'top' : 'bottom', {
        edge: i,
        sortKey: i,
        set: (pos) => {
          anchor.b = pos
        },
      })
    } else {
      add(edge.from, 'right', {
        edge: i,
        sortKey: b,
        set: (pos) => {
          anchor.a = pos
        },
      })
      add(edge.to, 'right', {
        edge: i,
        sortKey: a,
        set: (pos) => {
          anchor.b = pos
        },
      })
    }
  })
  for (const { node, side, slots } of groups.values()) {
    const [start, end] = range(rectOf(node), side)
    slots
      .sort((p, q) => p.sortKey - q.sortKey || p.edge - q.edge)
      .forEach((slot, k) => {
        slot.set(start + ((end - start) * (k + 1)) / (slots.length + 1))
      })
  }

  const right = VERTICAL.pad + nodeW
  const laneLabels = new Map<string, number>()
  const edges: PlacedEdge[] = source.edges.map((edge, index) => {
    const a = rectOf(edge.from)
    const b = rectOf(edge.to)
    const anchor = anchors[index] ?? { a: 0, b: 0 }
    const lane = laneOf.get(index)
    if (lane === undefined) {
      const down = a.y < b.y
      const ya = down ? a.y + a.h : a.y
      const yb = down ? b.y : b.y + b.h
      const points: Point[] = [
        [anchor.a, ya],
        [anchor.a, yb],
      ]
      const label = edge.label ? labelAt(anchor.a + 6, (ya + yb) / 2 + 4, 'start', edge.label) : null
      return { index, from: edge.from, to: edge.to, points, label }
    }
    const laneX = right + VERTICAL.laneOffset + lane * VERTICAL.laneGap
    const points: Point[] = [
      [right, anchor.a],
      [laneX, anchor.a],
      [laneX, anchor.b],
      [right, anchor.b],
    ]
    // La etiqueta va bajo el nodo de origen, alineada a la derecha, junto a donde sale la arista.
    let label: PlacedLabel | null = null
    if (edge.label) {
      const stacked = laneLabels.get(edge.from) ?? 0
      laneLabels.set(edge.from, stacked + 1)
      label = labelAt(right - 6, a.y + a.h + 16 + stacked * 18, 'end', edge.label)
    }
    return { index, from: edge.from, to: edge.to, points, label }
  })

  const last = nodes[nodes.length - 1]
  return {
    width: VERTICAL.width,
    height: (last ? last.rect.y + last.rect.h : 0) + VERTICAL.pad,
    nodes,
    edges,
    boundaries: boundaries.map((boundary) => placeBoundary(boundary, rects, 8, 30)),
  }
}

// -----------------------------------------------------------------------------------------------
// Verificación

const inset = (rect: Rect, by: number): Rect => ({
  x: rect.x + by,
  y: rect.y + by,
  w: rect.w - 2 * by,
  h: rect.h - 2 * by,
})

const overlaps = (p: Rect, q: Rect) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h

function segmentHits([x1, y1]: Point, [x2, y2]: Point, rect: Rect): boolean {
  const box: Rect = {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1) || 0.01,
    h: Math.abs(y2 - y1) || 0.01,
  }
  return overlaps(box, rect)
}

/** Problemas de legibilidad del trazado; vacío si ninguna arista ni etiqueta pisa lo que no debe. */
export function layoutProblems(layout: DiagramLayout): string[] {
  const problems: string[] = []
  for (const edge of layout.edges) {
    for (const node of layout.nodes) {
      if (node.id === edge.from || node.id === edge.to) continue
      const box = inset(node.rect, 2)
      for (let i = 1; i < edge.points.length; i++) {
        const p = edge.points[i - 1]
        const q = edge.points[i]
        if (p && q && segmentHits(p, q, box)) problems.push(`la arista ${edge.from}→${edge.to} cruza ${node.id}`)
      }
    }
  }
  const labels = [
    ...layout.edges.flatMap((edge) => (edge.label ? [{ owner: `${edge.from}→${edge.to}`, label: edge.label }] : [])),
    ...layout.boundaries.map((boundary) => ({ owner: `frontera ${boundary.id}`, label: boundary.label })),
  ]
  labels.forEach(({ owner, label }, i) => {
    for (const node of layout.nodes) {
      if (overlaps(label.box, node.rect)) problems.push(`la etiqueta de ${owner} tapa ${node.id}`)
    }
    for (const other of labels.slice(i + 1)) {
      if (overlaps(label.box, other.label.box)) problems.push(`la etiqueta de ${owner} tapa la de ${other.owner}`)
    }
    if (label.box.x < 0 || label.box.x + label.box.w > layout.width) problems.push(`la etiqueta de ${owner} se sale`)
  })
  return [...new Set(problems)]
}
