// Blueprint 11 §3 (Índice de secciones: marca la sección actual; el desplegable móvil se abre y cierra
// con teclado y con Escape), 11 §5 (el índice lleva el foco al ancla) y 03 §Componentes visuales
// (SectionIndex: resalta la sección visible, estado real del scroll).
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderAtPath } from '../../site/__tests__/render'
import { SectionIndex } from '../SectionIndex'

const items = [
  { id: 'context', label: 'Contexto' },
  { id: 'problem', label: 'Problema' },
  { id: 'lessons', label: 'Lecciones' },
]

type Entry = Pick<IntersectionObserverEntry, 'target' | 'isIntersecting'>

/** IntersectionObserver controlable: el test decide qué secciones están en la franja visible. */
class FakeObserver {
  static instances: FakeObserver[] = []
  readonly targets = new Set<Element>()
  private readonly callback: (entries: Entry[]) => void
  constructor(callback: (entries: Entry[]) => void) {
    this.callback = callback
    FakeObserver.instances.push(this)
  }
  observe(target: Element) {
    this.targets.add(target)
  }
  unobserve(target: Element) {
    this.targets.delete(target)
  }
  disconnect() {
    this.targets.clear()
  }
  takeRecords() {
    return []
  }
  emit(visible: Record<string, boolean>) {
    const entries = [...this.targets]
      .filter((target) => target.id in visible)
      .map((target): Entry => ({ target, isIntersecting: visible[target.id] === true }))
    this.callback(entries)
  }
}

function Page() {
  return (
    <>
      <SectionIndex label="En esta página" items={items} />
      {items.map((item) => (
        <section key={item.id} id={item.id} tabIndex={-1}>
          <h2>{item.label}</h2>
        </section>
      ))}
    </>
  )
}

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const emit = (visible: Record<string, boolean>) => {
  act(() => {
    for (const observer of FakeObserver.instances) observer.emit(visible)
  })
}

describe('SectionIndex', () => {
  it('es una navegación con un enlace por sección hacia su ancla', () => {
    renderAtPath('/es/work/caso/', <Page />)
    const nav = screen.getByRole('navigation', { name: 'En esta página' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Problema' })).toHaveAttribute('href', '/es/work/caso/#problem')
  })

  it('marca la primera sección visible y la mantiene si ninguna queda en la franja', () => {
    renderAtPath('/es/work/caso/', <Page />)
    const current = () => screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'location')
    expect(current()).toEqual([])

    emit({ context: true })
    expect(current().map((link) => link.textContent)).toEqual(['Contexto'])

    emit({ context: false, problem: true, lessons: true })
    expect(current().map((link) => link.textContent)).toEqual(['Problema'])

    emit({ problem: false, lessons: false })
    expect(current().map((link) => link.textContent)).toEqual(['Problema'])
  })

  it('observa también las secciones que aparecen después (prosa diferida)', async () => {
    renderAtPath('/es/work/caso/', <SectionIndex label="En esta página" items={items} />)
    const observer = FakeObserver.instances.at(-1)
    expect(observer?.targets.size).toBe(0)
    const section = document.createElement('section')
    section.id = 'lessons'
    document.body.append(section)
    // MutationObserver avisa en una microtarea.
    await act(async () => {
      await Promise.resolve()
    })
    expect(observer?.targets.has(section)).toBe(true)
    section.remove()
  })

  it('desplegable: Enter lo abre, Escape lo cierra y devuelve el foco al botón', async () => {
    const user = userEvent.setup()
    renderAtPath('/es/work/caso/', <Page />)
    const toggle = screen.getByRole('button', { name: 'En esta página' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    toggle.focus()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(toggle.getAttribute('aria-controls') ?? '')).toHaveAttribute('data-open')

    await user.tab()
    expect(screen.getByRole('link', { name: 'Contexto' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()

    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('un enlace lleva el foco a su sección y cierra el desplegable', async () => {
    const user = userEvent.setup()
    renderAtPath('/es/work/caso/', <Page />)
    const toggle = screen.getByRole('button', { name: 'En esta página' })
    await user.click(toggle)
    await user.click(screen.getByRole('link', { name: 'Lecciones' }))
    expect(document.getElementById('lessons')).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('location')).toHaveTextContent('/es/work/caso/#lessons')
  })
})
