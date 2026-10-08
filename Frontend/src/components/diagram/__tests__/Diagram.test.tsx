// Blueprint 11 §3 (Diagrama: nodo enfocable, panel con detalle, alternativa textual con los mismos datos)
// y 03 §Diagramas (cada nodo es un botón; al enfocarlo o pasar el puntero se resaltan el nodo y sus
// aristas; Escape lo cierra; la alternativa textual es desplegable).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Diagram, type DiagramGraph, type DiagramStrings } from '../Diagram'

const graph: DiagramGraph = {
  id: 'prueba',
  title: 'Diagrama de prueba',
  description: 'Un borde, un servicio y un almacén.',
  nodes: [
    {
      id: 'gw',
      label: 'Gateway',
      kind: 'edge',
      kindLabel: 'Borde',
      description: 'Único punto de entrada.',
      controls: ['Firma del token'],
    },
    { id: 'svc', label: 'Servicio', kind: 'service', kindLabel: 'Servicio', description: 'Hace el trabajo.' },
    { id: 'db', label: 'Base', kind: 'datastore', kindLabel: 'Almacén de datos', description: 'Guarda los datos.' },
  ],
  edges: [
    { from: 'gw', to: 'svc', label: 'despacho' },
    { from: 'svc', to: 'db' },
  ],
  boundaries: [{ id: 'red', label: 'Red interna', nodes: ['svc', 'db'] }],
  grid: [['gw'], ['svc'], ['db']],
}

const strings: DiagramStrings = {
  textAlternative: 'Ver el diagrama como texto',
  components: 'Componentes',
  connections: 'Conexiones',
  boundaries: 'Fronteras',
  controls: 'Controles de seguridad',
  hint: 'Enfoca un componente.',
  edge: (from, to) => `De ${from} a ${to}`,
  note: 'Redibujado.',
}

// jsdom no aplica CSS: las dos variantes están en el DOM. Las pruebas usan la de escritorio.
function setup() {
  const user = userEvent.setup()
  const view = render(<Diagram graph={graph} strings={strings} />)
  const wide = view.container.querySelector<SVGSVGElement>('svg[data-variant="wide"]')
  if (!wide) throw new Error('falta la variante de escritorio')
  const panel = view.container.querySelector<HTMLElement>(`[id$="-panel"]`)
  if (!panel) throw new Error('falta el panel')
  return { user, view, wide, panel }
}

const activeEdges = (svg: SVGSVGElement) => svg.querySelectorAll('path[data-active]').length
// within() se declara para HTMLElement, pero recorre cualquier Element: el SVG también.
const inSvg = (svg: SVGSVGElement) => within(svg as unknown as HTMLElement)

describe('Diagram', () => {
  it('es un grupo con nombre y descripción, y cada nodo es un botón con su descripción', () => {
    const { wide } = setup()
    expect(wide).toHaveAccessibleName('Diagrama de prueba')
    expect(wide).toHaveAccessibleDescription('Un borde, un servicio y un almacén.')
    const gateway = inSvg(wide).getByRole('button', { name: 'Gateway' })
    expect(gateway).toHaveAccessibleDescription('Único punto de entrada. Controles de seguridad: Firma del token.')
    expect(inSvg(wide).getAllByRole('button')).toHaveLength(3)
  })

  it('con teclado: Tab enfoca un nodo, el panel muestra su detalle y se resaltan sus aristas; Escape lo cierra', async () => {
    const { user, wide, panel } = setup()
    expect(panel).toHaveTextContent('Enfoca un componente.')
    expect(activeEdges(wide)).toBe(0)

    await user.tab()
    const gateway = inSvg(wide).getByRole('button', { name: 'Gateway' })
    expect(gateway).toHaveFocus()
    expect(panel).toHaveTextContent('Gateway')
    expect(panel).toHaveTextContent('Único punto de entrada.')
    expect(within(panel).getByRole('listitem')).toHaveTextContent('Firma del token')
    expect(activeEdges(wide)).toBe(1)

    await user.tab()
    expect(inSvg(wide).getByRole('button', { name: 'Servicio' })).toHaveFocus()
    expect(panel).toHaveTextContent('Hace el trabajo.')
    // El servicio tiene dos aristas: la que llega del gateway y la que va a la base.
    expect(activeEdges(wide)).toBe(2)

    await user.keyboard('{Escape}')
    expect(panel).toHaveTextContent('Enfoca un componente.')
    expect(activeEdges(wide)).toBe(0)

    await user.keyboard('{Enter}')
    expect(panel).toHaveTextContent('Hace el trabajo.')
  })

  it('con el puntero: pasar sobre un nodo lo activa y el panel no desaparece al salir', async () => {
    const { user, wide, panel } = setup()
    const base = inSvg(wide).getByRole('button', { name: 'Base' })
    await user.hover(base)
    expect(panel).toHaveTextContent('Guarda los datos.')
    expect(panel).toHaveTextContent('Almacén de datos')
    await user.unhover(base)
    expect(panel).toHaveTextContent('Guarda los datos.')
  })

  it('la alternativa textual lista componentes, conexiones y fronteras desde los mismos datos', async () => {
    const { user, view } = setup()
    const details = view.container.querySelector('details')
    if (!details) throw new Error('falta la alternativa textual')
    expect(details).not.toHaveAttribute('open')
    await user.click(screen.getByText('Ver el diagrama como texto'))
    expect(details).toHaveAttribute('open')
    for (const node of graph.nodes) {
      expect(details).toHaveTextContent(`${node.label} (${node.kindLabel}). ${node.description}`)
    }
    expect(details).toHaveTextContent('De Gateway a Servicio: despacho')
    expect(details).toHaveTextContent('De Servicio a Base')
    expect(details).toHaveTextContent('Red interna: Servicio, Base')
  })

  it('dibuja la variante vertical con los mismos nodos', () => {
    const { view } = setup()
    const narrow = view.container.querySelector<SVGSVGElement>('svg[data-variant="narrow"]')
    if (!narrow) throw new Error('falta la variante vertical')
    expect(
      inSvg(narrow)
        .getAllByRole('button')
        .map((node) => node.getAttribute('aria-label')),
    ).toEqual(['Gateway', 'Servicio', 'Base'])
  })
})
