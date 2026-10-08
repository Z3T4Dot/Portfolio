// Blueprint 02 §Navegación (header: nombre → Home · Trabajo · Seguridad · Criterio · Sobre mí ·
// Contacto · idioma · tema) y 03 §Componentes visuales (SiteHeader fijo con fondo al 90 % y blur).
import { Link, useLocation } from 'react-router'
import { site } from '../../content/site'
import { href, useLocale } from '../../i18n'
import { LanguageSwitch } from './LanguageSwitch'
import { MobileNav } from './MobileNav'
import { HEADER_ITEMS, currentState } from './nav-items'
import { NavLinks } from './NavLinks'
import styles from './SiteHeader.module.css'
import { ThemeToggle } from './ThemeToggle'

interface SiteHeaderProps {
  /** 404 estática (sin JS): sin selector de tema y con el menú móvil nativo. */
  staticPage: boolean
}

export function SiteHeader({ staticPage }: SiteHeaderProps) {
  const { locale, t } = useLocale()
  const { pathname } = useLocation()
  const home = href('home', locale)
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link
          className={styles.name}
          to={home}
          prefetch="intent"
          viewTransition
          aria-current={currentState(pathname, home)}
        >
          {site.name}
        </Link>
        <nav className={styles.nav} aria-label={t('nav.label')}>
          <NavLinks items={HEADER_ITEMS} className={styles.list} linkClassName={styles.link} />
        </nav>
        <div className={styles.controls}>
          <LanguageSwitch toHome={staticPage} />
          {staticPage ? null : <ThemeToggle />}
        </div>
        <MobileNav staticPage={staticPage} />
      </div>
    </header>
  )
}
