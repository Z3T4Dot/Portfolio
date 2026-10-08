// Blueprint 11 §3 (selector de idioma: mantiene la ruta, guarda la preferencia y expone
// lang/hreflang) y 03 (dos enlaces; el activo con aria-current).
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LOCALE_STORAGE_KEY } from '../../../i18n'
import { LanguageSwitch } from '../LanguageSwitch'
import { renderAtPath } from './render'

describe('LanguageSwitch', () => {
  it('lleva a la misma ruta en el otro idioma', () => {
    renderAtPath('/es/work/quantum/', <LanguageSwitch />)
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/work/quantum/')
    expect(screen.getByRole('link', { name: 'Español' })).toHaveAttribute('href', '/es/work/quantum/')
  })

  it('marca el idioma activo con aria-current y nombra cada idioma en su idioma', () => {
    renderAtPath('/en/about/', <LanguageSwitch />)
    const group = screen.getByRole('group', { name: 'Language' })
    expect(group).toBeInTheDocument()
    const english = screen.getByRole('link', { name: 'English' })
    expect(english).toHaveAttribute('aria-current', 'true')
    expect(english).toHaveAttribute('lang', 'en')
    expect(english).toHaveAttribute('hreflang', 'en')
    const spanish = screen.getByRole('link', { name: 'Español' })
    expect(spanish).not.toHaveAttribute('aria-current')
    expect(spanish).toHaveAttribute('lang', 'es')
    expect(spanish).toHaveTextContent('ES')
  })

  it('al elegir un idioma lo recuerda y navega', async () => {
    const user = userEvent.setup()
    renderAtPath('/es/security/', <LanguageSwitch />)
    await user.click(screen.getByRole('link', { name: 'English' }))
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(screen.getByTestId('location')).toHaveTextContent('/en/security/')
  })

  it('con localStorage bloqueado navega igual', async () => {
    const user = userEvent.setup()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })
    renderAtPath('/en/', <LanguageSwitch />)
    await user.click(screen.getByRole('link', { name: 'Español' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/es/')
    setItem.mockRestore()
  })

  it('en la 404 estática lleva al inicio de cada idioma', () => {
    renderAtPath('/es/no-existe/', <LanguageSwitch toHome />)
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/')
    expect(screen.getByRole('link', { name: 'Español' })).toHaveAttribute('href', '/es/')
  })
})
