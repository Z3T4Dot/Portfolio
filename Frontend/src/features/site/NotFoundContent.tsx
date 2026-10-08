// Blueprint 02 §404 (explica que la página no existe y ofrece Home, Trabajo y Contacto) y 11 §9.
// Funciona sin JS: la 404 prerenderizada no se hidrata (sorpresa 5 del spike).
import { Link } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { href, useLocale } from '../../i18n'
import type { NavItem } from './nav-items'
import styles from './NotFoundContent.module.css'

const EXITS: readonly NavItem[] = [
  { page: 'home', label: 'nav.home' },
  { page: 'work', label: 'nav.work' },
  { page: 'contact', label: 'nav.contact' },
]

export function NotFoundContent() {
  const { locale, t } = useLocale()
  return (
    <>
      <PageHeader title={t('notFound.title')} lede={t('notFound.body')} />
      <nav aria-label={t('notFound.exits')}>
        <ul className={styles.exits}>
          {EXITS.map((exit) => (
            <li key={exit.page}>
              <Link className={styles.link} to={href(exit.page, locale)}>
                {t(exit.label)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
