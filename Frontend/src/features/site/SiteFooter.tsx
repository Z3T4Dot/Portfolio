// Blueprint 02 §Navegación (footer: Contacto, Cyber Ops, Cómo está hecho este sitio, idioma y
// fecha de la última actualización).
import { BUILD_DATE } from '../../env'
import { useLocale } from '../../i18n'
import { formatDate } from '../../lib/date'
import { LanguageSwitch } from './LanguageSwitch'
import { FOOTER_ITEMS } from './nav-items'
import { NavLinks } from './NavLinks'
import styles from './SiteFooter.module.css'

interface SiteFooterProps {
  staticPage: boolean
}

export function SiteFooter({ staticPage }: SiteFooterProps) {
  const { locale, t } = useLocale()
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav aria-label={t('footer.label')}>
          <NavLinks items={FOOTER_ITEMS} className={styles.list} linkClassName={styles.link} />
        </nav>
        <LanguageSwitch toHome={staticPage} />
        {/* Fecha del commit desplegado (13: VITE_BUILD_DATE). Sin ella no se muestra ninguna. */}
        {BUILD_DATE ? (
          <p className={styles.updated}>
            <time dateTime={BUILD_DATE}>{t('footer.updated', { date: formatDate(BUILD_DATE, locale) })}</time>
          </p>
        ) : null}
      </div>
    </footer>
  )
}
