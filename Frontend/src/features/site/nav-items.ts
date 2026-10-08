// Blueprint 02 §Navegación: enlaces del header (sin Cyber Ops, D11) y del footer.
import type { Messages, PageId } from '../../i18n'

/** Etiquetas de destino de `nav.*` (sin parámetros): no incluye la del landmark ni la del botón. */
export type NavLabel = `nav.${Exclude<keyof Messages['nav'], 'label' | 'menu'>}`

export interface NavItem {
  page: PageId
  label: NavLabel
}

/** Header en todas las páginas: el nombre lleva a Home y no está en esta lista. */
export const HEADER_ITEMS: readonly NavItem[] = [
  { page: 'work', label: 'nav.work' },
  { page: 'securityHub', label: 'nav.security' },
  { page: 'judgment', label: 'nav.judgment' },
  { page: 'about', label: 'nav.about' },
  { page: 'contact', label: 'nav.contact' },
]

/**
 * Footer. GitHub, LinkedIn y el CV (ES/EN) también van aquí según 02, pero sus URL y archivos
 * dependen de César (C4 en 15): se agregan cuando existan, no antes.
 */
export const FOOTER_ITEMS: readonly NavItem[] = [
  { page: 'contact', label: 'nav.contact' },
  { page: 'cyberOpsHub', label: 'nav.cyberOps' },
  { page: 'architecture', label: 'nav.architecture' },
]

/**
 * `aria-current` de un enlace de navegación: "page" en la página exacta y "true" dentro de su
 * sección (`/es/work/x/` marca Trabajo). Home solo cuenta como exacta.
 */
export function currentState(pathname: string, target: string): 'page' | 'true' | undefined {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`
  if (path === target) return 'page'
  const isHome = target.split('/').filter(Boolean).length === 1
  return !isHome && path.startsWith(target) ? 'true' : undefined
}
