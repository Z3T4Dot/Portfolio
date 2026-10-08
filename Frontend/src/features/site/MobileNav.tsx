// Blueprint 02 §Navegación (móvil < 768px: botón "Menú" con los mismos enlaces, idioma y tema
// dentro) y 03 §Componentes visuales (MobileNav: menú desplegable con focus trap).
import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useLocale } from '../../i18n'
import { LanguageSwitch } from './LanguageSwitch'
import styles from './MobileNav.module.css'
import { HEADER_ITEMS } from './nav-items'
import { NavLinks } from './NavLinks'
import { ThemeToggle } from './ThemeToggle'

interface MobileNavProps {
  /** 404 estática, sin JS: el menú es un <details> nativo y no hay selector de tema. */
  staticPage: boolean
}

export function MobileNav({ staticPage }: MobileNavProps) {
  return staticPage ? <StaticMenu /> : <MenuDisclosure />
}

function MenuIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Sin JavaScript (la 404 no se hidrata): <details>/<summary> abre y cierra solo. */
function StaticMenu() {
  const { t } = useLocale()
  return (
    <details className={styles.menu}>
      <summary className={styles.button}>
        <MenuIcon />
        {t('nav.menu')}
      </summary>
      <div className={styles.panel}>
        <nav aria-label={t('nav.label')}>
          <NavLinks items={HEADER_ITEMS} className={styles.list} linkClassName={styles.link} />
        </nav>
        <div className={styles.controls}>
          <LanguageSwitch toHome />
        </div>
      </div>
    </details>
  )
}

/**
 * Páginas hidratadas: botón con aria-expanded. Abierto, Tab y Shift+Tab no salen del menú y Escape
 * lo cierra y devuelve el foco al botón. Se cierra solo al navegar.
 */
function MenuDisclosure() {
  const { t } = useLocale()
  const location = useLocation()
  // El menú queda abierto solo en la entrada del historial donde se abrió: al navegar, se cierra
  // sin un efecto que sincronice estado.
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === location.key
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    const button = buttonRef.current
    const panel = panelRef.current
    if (!open || !button || !panel) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenAt(null)
        button.focus()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [button, ...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={styles.menu}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpenAt(open ? null : location.key)
        }}
      >
        <MenuIcon />
        {t('nav.menu')}
      </button>
      <div ref={panelRef} id={panelId} className={styles.panel} hidden={!open}>
        <nav aria-label={t('nav.label')}>
          <NavLinks
            items={HEADER_ITEMS}
            className={styles.list}
            linkClassName={styles.link}
            onNavigate={() => {
              setOpenAt(null)
            }}
          />
        </nav>
        <div className={styles.controls}>
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
