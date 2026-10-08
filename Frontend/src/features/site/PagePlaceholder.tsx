// Blueprint 03 §Componentes visuales (PageHeader) y 15 F1: el shell publica cada página con su
// título, su lede y un aviso de construcción. Cada feature lo reemplaza con su contenido (F3–F8).
import { PageHeader } from '../../components/ui/PageHeader'
import { useLocale, type PageId } from '../../i18n'
import styles from './PagePlaceholder.module.css'

interface PagePlaceholderProps {
  title: string
  lede: string
}

export function PagePlaceholder({ title, lede }: PagePlaceholderProps) {
  const { t } = useLocale()
  return (
    <>
      <PageHeader title={title} lede={lede} />
      <p className={styles.note}>{t('page.underConstruction')}</p>
    </>
  )
}

/** Página fija con el título y la descripción de `pages.<id>` (los mismos de su `meta`). */
export function FixedPagePlaceholder({ page }: { page: Exclude<PageId, 'home'> }) {
  const { t } = useLocale()
  return <PagePlaceholder title={t(`pages.${page}.title`)} lede={t(`pages.${page}.description`)} />
}
