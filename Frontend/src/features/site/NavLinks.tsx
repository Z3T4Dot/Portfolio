// Blueprint 02 §Navegación y 11 §7 (Navegación: prefetch="intent"; sin prefetch="render").
import { Link, useLocation } from 'react-router'
import { href, useLocale } from '../../i18n'
import { currentState, type NavItem } from './nav-items'

interface NavLinksProps {
  items: readonly NavItem[]
  className?: string | undefined
  linkClassName?: string | undefined
  onNavigate?: (() => void) | undefined
}

export function NavLinks({ items, className, linkClassName, onNavigate }: NavLinksProps) {
  const { locale, t } = useLocale()
  const { pathname } = useLocation()
  return (
    <ul className={className}>
      {items.map((item) => {
        const to = href(item.page, locale)
        return (
          <li key={item.page}>
            <Link
              className={linkClassName}
              to={to}
              prefetch="intent"
              // 03 §Microinteracciones: crossfade con View Transitions donde haya soporte.
              viewTransition
              aria-current={currentState(pathname, to)}
              onClick={onNavigate}
            >
              {t(item.label)}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
