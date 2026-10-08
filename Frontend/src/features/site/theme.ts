// Blueprint 03 §Color (tema): por defecto el del sistema; el selector guarda la preferencia y un
// script inline (con hash en la CSP) la aplica antes del primer pintado para evitar el parpadeo.
import { safeLocal, type SafeStorage } from '../../lib/storage'

export type Theme = 'light' | 'dark'

/** Clave de la preferencia en localStorage. El script inline lee la misma. */
export const THEME_STORAGE_KEY = 'theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/**
 * Script inline del <head> (root.tsx). Solo fija `data-theme` si hay una preferencia guardada; sin
 * ella manda el sistema vía la media query de tokens.css, también si cambia con la página abierta.
 */
export const THEME_SCRIPT =
  `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
  `if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})();`

/** Tema efectivo: el elegido (`data-theme`) o, si no hay, el del sistema. */
export function readTheme(): Theme {
  const chosen = document.documentElement.dataset.theme
  if (isTheme(chosen)) return chosen
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/** Avisa cuando cambia el tema elegido o el del sistema. */
export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY)
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  media.addEventListener('change', onChange)
  return () => {
    observer.disconnect()
    media.removeEventListener('change', onChange)
  }
}

/** Aplica y recuerda la elección. Con storage bloqueado el tema cambia igual; solo no se recuerda. */
export function chooseTheme(theme: Theme, storage: SafeStorage = safeLocal): void {
  document.documentElement.dataset.theme = theme
  storage.write(THEME_STORAGE_KEY, theme)
}
