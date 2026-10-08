// Blueprint 11 §3 (selector de tema: alterna y persiste; con localStorage bloqueado sigue
// funcionando) y 03 (aria-label que nombra la acción; script inline sin parpadeo).
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../../i18n'
import { THEME_SCRIPT, THEME_STORAGE_KEY } from '../theme'
import { ThemeToggle } from '../ThemeToggle'

function renderToggle() {
  return render(
    <LocaleProvider locale="es">
      <ThemeToggle />
    </LocaleProvider>,
  )
}

describe('ThemeToggle', () => {
  it('nombra la acción según el tema efectivo (sistema claro → "oscuro")', () => {
    renderToggle()
    expect(screen.getByRole('button', { name: 'Cambiar a tema oscuro' })).toBeInTheDocument()
  })

  it('alterna data-theme y guarda la preferencia', async () => {
    const user = userEvent.setup()
    renderToggle()
    await user.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    await user.click(await screen.findByRole('button', { name: 'Cambiar a tema claro' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('con localStorage bloqueado el tema cambia igual', async () => {
    const user = userEvent.setup()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })
    renderToggle()
    await user.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    setItem.mockRestore()
  })

  it('refleja un cambio de data-theme hecho fuera del componente (otro selector en la página)', async () => {
    renderToggle()
    await act(async () => {
      document.documentElement.dataset.theme = 'dark'
      await Promise.resolve()
    })
    expect(await screen.findByRole('button', { name: 'Cambiar a tema claro' })).toBeInTheDocument()
  })
})

describe('THEME_SCRIPT', () => {
  // El script es código propio generado en el build; ejecutarlo así es la forma de probarlo tal cual.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const script = new Function(THEME_SCRIPT) as () => void
  const run = () => {
    script()
  }

  it('aplica la preferencia guardada antes de hidratar', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    run()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('sin preferencia válida no fija nada: manda el sistema', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    run()
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })

  it('no lanza con localStorage bloqueado', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })
    expect(run).not.toThrow()
    getItem.mockRestore()
  })
})
