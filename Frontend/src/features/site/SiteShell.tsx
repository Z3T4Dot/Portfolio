// Blueprint 03 §Accesibilidad (landmarks header, nav, main y footer; skip link) y 02 §Navegación:
// estructura global de cada página.
import type { ReactNode } from 'react'
import { SkipLink } from '../../components/ui/SkipLink'
import { useLocale } from '../../i18n'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import styles from './SiteShell.module.css'

export const MAIN_ID = 'main'

interface SiteShellProps {
  /**
   * 404 estática: se publica sin <Scripts> (sorpresa 5 del spike), así que nada que dependa de JS
   * puede aparecer (sin selector de tema; menú móvil nativo; idiomas → inicio).
   */
  staticPage?: boolean
  children: ReactNode
}

export function SiteShell({ staticPage = false, children }: SiteShellProps) {
  const { t } = useLocale()
  return (
    <>
      <SkipLink target={MAIN_ID}>{t('a11y.skipToContent')}</SkipLink>
      <SiteHeader staticPage={staticPage} />
      <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <SiteFooter staticPage={staticPage} />
    </>
  )
}
