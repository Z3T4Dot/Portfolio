// Setup del proyecto `dom` de Vitest: matchers de jest-dom (toBeInTheDocument, toHaveAttribute…)
// y limpieza del DOM entre tests (sin `globals`, Testing Library no la registra sola).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom no implementa matchMedia. Por defecto el "sistema" está en tema claro y nunca cambia; un test
// que necesite otro valor lo reemplaza con vi.stubGlobal.
window.matchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
})

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('data-theme')
  localStorage.clear()
})
