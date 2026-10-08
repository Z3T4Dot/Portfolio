// Blueprint 02 §About (introducción de hasta 3 párrafos, los cuatro pilares con habilidades en lista
// simple y enlaces a evidencia, Engineering Timeline, cómo trabajo, formación y descarga del CV; CTAs
// "Descargar CV" y "Contactar"), 01 §Perfil profesional y 03 §Componentes visuales (PageHeader,
// Timeline). El cargo formal se muestra separado de las responsabilidades reales.
import { Link } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { ButtonAnchor, ButtonLink } from '../../components/ui/Button'
import { DraftTag, PendingNotice } from '../../components/ui/DevMarks'
import { Timeline } from '../../components/ui/Timeline'
import { isPending } from '../../content/pending'
import { site } from '../../content/site'
import { href, useLocale } from '../../i18n'
import type { AboutData, CaseLink } from './data'
import styles from './AboutPage.module.css'

export function AboutPage({ data }: { data: AboutData }) {
  const { locale, t } = useLocale()
  const [lede, ...paragraphs] = data.intro
  return (
    <div className={styles.page}>
      <PageHeader title={t('pages.about.title')} lede={lede} />
      {paragraphs.length > 0 ? (
        <div className="prose">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="about-role">
        <h2 id="about-role">{t('about.role')}</h2>
        <dl className={styles.facts}>
          <div>
            <dt>{t('about.formalTitle')}</dt>
            <dd>{data.formalTitle}</dd>
          </div>
          <div>
            <dt>{t('about.responsibilities')}</dt>
            <dd>
              <ul className={styles.list}>
                {data.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="about-pillars">
        <h2 id="about-pillars">{t('about.pillars')}</h2>
        <div className={styles.pillars}>
          {data.pillars.map((pillar) => (
            <section key={pillar.id} className={styles.pillar} aria-labelledby={`pillar-${pillar.id}`}>
              <h3 id={`pillar-${pillar.id}`}>{t(`pillars.${pillar.id}`)}</h3>
              <ul className={styles.list}>
                {pillar.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
              {pillar.evidence.length > 0 ? (
                <p className={styles.evidence}>
                  <span className={styles.label}>{t('about.evidence')}</span>
                  <CaseLinks links={pillar.evidence} />
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      {data.timeline.length > 0 ? (
        <section id="timeline" className={styles.section} aria-labelledby="about-timeline">
          <h2 id="about-timeline">{t('timeline.title')}</h2>
          <Timeline
            items={data.timeline.map((stage) => ({
              id: stage.slug,
              dateTime: stage.dateTime,
              period: stage.period,
              title: stage.title,
              mark: stage.draft ? <DraftTag /> : null,
              summary: stage.summary ?? undefined,
              children:
                stage.projects.length > 0 ? (
                  <p className={styles.evidence}>
                    <CaseLinks links={stage.projects} />
                  </p>
                ) : null,
            }))}
          />
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="about-principles">
        <h2 id="about-principles">{t('about.principles')}</h2>
        <ul className={styles.principles}>
          {data.principles.map((principle) => (
            <li key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="about-education">
        <h2 id="about-education">{t('about.education')}</h2>
        <p>{data.education}</p>
      </section>

      {data.hasSelectedWork ? (
        <p>
          <Link to={`${href('work', locale)}#selected-work`} prefetch="intent" viewTransition>
            {t('about.selectedWork')}
          </Link>
        </p>
      ) : null}

      <div className={styles.actions}>
        <CvLink />
        <ButtonLink to={href('contact', locale)} variant="secondary">
          {t('about.contact')}
        </ButtonLink>
      </div>
    </div>
  )
}

/** Enlaces a casos visibles; un borrador (solo en la vista previa) va marcado. */
function CaseLinks({ links }: { links: readonly CaseLink[] }) {
  return (
    <span className={styles.links}>
      {links.map((link) => (
        <span key={link.slug}>
          <Link to={link.href} prefetch="intent" viewTransition>
            {link.title}
          </Link>
          {link.draft ? <DraftTag /> : null}
        </span>
      ))}
    </span>
  )
}

/** CTA principal de About (02): el CV en el idioma de la página, cuando exista (C4). */
function CvLink() {
  const { locale, t } = useLocale()
  const cv = site.contact.cv[locale]
  if (isPending(cv)) return <PendingNotice>{cv.pending}</PendingNotice>
  return (
    <ButtonAnchor href={cv} download>
      {t('about.cv')}
    </ButtonAnchor>
  )
}
