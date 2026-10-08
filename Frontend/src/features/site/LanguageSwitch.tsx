// Blueprint 03 §Componentes visuales (LanguageSwitch: dos enlaces, el activo con aria-current) y
// 02 §Navegación (cambia a la misma ruta en el otro idioma y recuerda la preferencia).
import { Link, useLocation } from 'react-router'
import { LOCALES, href, localizedPath, rememberLocale, useLocale } from '../../i18n'
import styles from './LanguageSwitch.module.css'

interface LanguageSwitchProps {
  /**
   * En la 404 estática (sin JS) la ruta actual no existe en ningún idioma: los enlaces llevan al
   * inicio de cada idioma.
   */
  toHome?: boolean
}

export function LanguageSwitch({ toHome = false }: LanguageSwitchProps) {
  const { locale, t } = useLocale()
  const location = useLocation()
  return (
    <div className={styles.switch} role="group" aria-label={t('language.label')}>
      {LOCALES.map((target) => {
        const isCurrent = target === locale
        return (
          // 12: enlace real con hreflang y lang; el nombre accesible es el del idioma en su idioma.
          <Link
            key={target}
            className={styles.link}
            to={toHome ? href('home', target) : localizedPath(location, target)}
            hrefLang={target}
            lang={target}
            aria-label={t(`language.${target}`)}
            aria-current={isCurrent ? 'true' : undefined}
            onClick={() => {
              rememberLocale(target)
            }}
          >
            {target.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}
