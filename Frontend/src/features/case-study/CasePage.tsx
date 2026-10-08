// Blueprint 06 §Anatomía de la página (título, tipo, etiquetas, rol, periodo, equipo, stack, "En 30
// segundos", las doce secciones con índice fijo, cierre), 03 §Grid y layout (índice en columnas 1–3;
// prosa en 4–11, figuras en 4–12, desde 1024px), 02 §CTAs (fin de un caso: siguiente caso, contactar)
// y 12 §HTML semántico (<article>, <section> con título, <dl>, <time>).
import type { ReactNode } from 'react'
import { ButtonLink } from '../../components/ui/Button'
import { DraftTag } from '../../components/ui/DevMarks'
import { ClassificationTag, StatusTag } from '../../components/ui/Tag'
import { href, useLocale } from '../../i18n'
import type { CaseData } from './data'
import { MetaList, type MetaItem } from './MetaList'
import { CaseContext } from './mdx'
import { SectionIndex } from './SectionIndex'
import styles from './CasePage.module.css'

interface CasePageProps {
  data: CaseData
  /** La prosa MDX del caso (diferida). Sus componentes leen `data` desde CaseContext. */
  children: ReactNode
}

export function CasePage({ data, children }: CasePageProps) {
  const { locale, t } = useLocale()
  const projectKind = t(`projectKind.${data.projectKind}`)
  const meta: MetaItem[] = [
    { term: t('caseStudy.meta.role'), detail: data.role },
    { term: t('caseStudy.meta.period'), detail: <time dateTime={data.period.dateTime}>{data.period.text}</time> },
    ...(data.team ? [{ term: t('caseStudy.meta.team'), detail: data.team }] : []),
    { term: t('caseStudy.meta.stack'), detail: data.stack.join(', ') },
    { term: t('caseStudy.meta.reading'), detail: t('caseStudy.readingTime', { minutes: data.readingMinutes }) },
  ]

  return (
    <CaseContext value={data}>
      <article className={styles.case}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {data.title}
            {data.draft ? <DraftTag /> : null}
          </h1>
          <p className={styles.kind}>{data.kind}</p>
          <div className={styles.tags}>
            <StatusTag state={data.existence}>{t(`existence.${data.existence}`)}</StatusTag>
            <span className={styles.kindTag}>
              {projectKind.charAt(0).toLocaleUpperCase(locale)}
              {projectKind.slice(1)}
            </span>
            <ClassificationTag>{t(`confidentiality.${data.confidentiality}`)}</ClassificationTag>
          </div>
          {data.confidentiality === 'sanitized' ? <p className={styles.note}>{t('caseStudy.sanitizedNote')}</p> : null}
          <MetaList items={meta} />
          <section className={styles.summary} aria-labelledby="case-summary">
            <h2 id="case-summary" className={styles.summaryTitle}>
              {t('caseStudy.inThirtySeconds')}
            </h2>
            <p>{data.summary}</p>
          </section>
        </header>

        <div className={styles.index}>
          <SectionIndex label={t('caseStudy.onThisPage')} items={data.sections} />
        </div>

        <div className={styles.body}>{children}</div>

        <nav className={styles.closing} aria-label={t('caseStudy.closing')}>
          {data.next ? (
            <ButtonLink to={data.next.href}>{t('caseStudy.next', { title: data.next.title })}</ButtonLink>
          ) : (
            <ButtonLink to={href('work', locale)}>{t('caseStudy.allCases')}</ButtonLink>
          )}
          <ButtonLink to={href('contact', locale)} variant="secondary">
            {t('caseStudy.contact')}
          </ButtonLink>
        </nav>
      </article>
    </CaseContext>
  )
}
