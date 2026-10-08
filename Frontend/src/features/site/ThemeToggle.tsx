// Blueprint 03 §Componentes visuales: ThemeToggle, botón con ícono y aria-label que nombra la acción.
import { useSyncExternalStore } from 'react'
import { useLocale } from '../../i18n'
import { chooseTheme, readTheme, subscribeTheme, type Theme } from './theme'
import styles from './ThemeToggle.module.css'

// En el prerender no se conoce el tema: el primer render del cliente usa el mismo valor (`null`) y
// después React vuelve a renderizar con el real, sin diferencias de hidratación.
const serverTheme = (): Theme | null => null

export function ThemeToggle() {
  const { t } = useLocale()
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={t(next === 'dark' ? 'theme.toDark' : 'theme.toLight')}
      onClick={() => {
        chooseTheme(next)
      }}
    >
      {/* Medio círculo: el mismo ícono en ambos temas; la acción la nombra el aria-label. */}
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3.75a8.25 8.25 0 0 1 0 16.5z" fill="currentColor" />
      </svg>
    </button>
  )
}
