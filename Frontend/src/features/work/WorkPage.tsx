// Blueprint 02 §Work (índice en lista, no rejilla de tarjetas; sin filtros) y 03 §Componentes visuales
// (PageHeader; CaseRow: toda la fila es un enlace y el hover cambia el fondo a --surface-2). Selected
// Work (02, bloque 2) entra con su primera ficha publicada (05: content/selected-work).
import { Link } from 'react-router'
import { DraftTag } from '../../components/ui/DevMarks'
import { PageHeader } from '../../components/ui/PageHeader'
import { ClassificationTag, StatusTag } from '../../components/ui/Tag'
import { useLocale } from '../../i18n'
import type { WorkData, WorkItem } from './data'
import styles from './WorkPage.module.css'

export function WorkPage({ data }: { data: WorkData }) {
  const { t } = useLocale()
  return (
    <div className={styles.page}>
      <PageHeader title={t('pages.work.title')} lede={t('pages.work.description')} />
      {data.cases.length > 0 ? (
        <section className={styles.section} aria-labelledby="work-cases">
          <h2 id="work-cases">{t('work.cases')}</h2>
          <ul className={styles.rows}>
            {data.cases.map((item) => (
              <CaseRow key={item.slug} item={item} />
            ))}
          </ul>
        </section>
      ) : (
        <p className={styles.note}>{t('page.underConstruction')}</p>
      )}
    </div>
  )
}

function CaseRow({ item }: { item: WorkItem }) {
  const { t } = useLocale()
  return (
    <li className={styles.row}>
      <h3 className={styles.rowTitle}>
        <Link className={styles.rowLink} to={item.href} prefetch="intent" viewTransition>
          {item.title}
        </Link>
        {item.draft ? <DraftTag /> : null}
      </h3>
      <p className={styles.kind}>{item.kind}</p>
      <p className={styles.problem}>{item.problem}</p>
      <dl className={styles.meta}>
        <div>
          <dt>{t('work.role')}</dt>
          <dd>{item.role}</dd>
        </div>
        <div>
          <dt>{t('work.period')}</dt>
          <dd>
            <time dateTime={item.period.dateTime}>{item.period.text}</time>
          </dd>
        </div>
      </dl>
      <div className={styles.tags}>
        <StatusTag state={item.existence}>{t(`existence.${item.existence}`)}</StatusTag>
        <ClassificationTag>{t(`confidentiality.${item.confidentiality}`)}</ClassificationTag>
      </div>
    </li>
  )
}
