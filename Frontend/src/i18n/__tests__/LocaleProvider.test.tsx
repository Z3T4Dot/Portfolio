import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider, useLocale } from '..'

function Probe() {
  const { locale, t } = useLocale()
  return (
    <nav aria-label={t('nav.label')} lang={locale}>
      <a href={`/${locale}/work/`}>{t('nav.work')}</a>
    </nav>
  )
}

describe('LocaleProvider', () => {
  it('expone el idioma y sus textos sin necesitar el router', () => {
    render(
      <LocaleProvider locale="es">
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'Principal' })).toHaveAttribute('lang', 'es')
    expect(screen.getByRole('link', { name: 'Trabajo' })).toHaveAttribute('href', '/es/work/')
  })

  it('cambia de idioma cuando cambia la prop', () => {
    const { rerender } = render(
      <LocaleProvider locale="es">
        <Probe />
      </LocaleProvider>,
    )
    rerender(
      <LocaleProvider locale="en">
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('link', { name: 'Work' })).toBeInTheDocument()
  })

  it('useLocale fuera del provider es un error de composición', () => {
    // React registra el error del render en consola; aquí se espera.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Probe />)).toThrow(/LocaleProvider/)
    consoleError.mockRestore()
  })
})
