// Blueprint 03 §Componentes visuales: PageHeader, h1 + lede, igual en todas las páginas.
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title: string
  lede?: string | undefined
}

export function PageHeader({ title, lede }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
    </header>
  )
}
