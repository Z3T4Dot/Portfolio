// Blueprint 02 §Home (seis bloques en orden: identidad, trabajo seleccionado, cómo pienso, invitación a
// Cyber Ops, timeline compacto y contacto; CTAs de 02 §CTAs), 01 §Los primeros 30 segundos y 03 §Hero
// de la Home (tipográfico, Archivo al 125 %, sin animación ambiental: D8). Los bloques que listan
// contenido salen del loader y no se renderizan si están vacíos.
import { Link } from 'react-router'
import { ButtonLink } from '../../components/ui/Button'
import { DraftTag, PendingNotice } from '../../components/ui/DevMarks'
import { ClassificationTag, StatusTag } from '../../components/ui/Tag'
import { Timeline } from '../../components/ui/Timeline'
import { isPending } from '../../content/pending'
import { site } from '../../content/site'
import { href, useLocale } from '../../i18n'
import type { EssayItem, FeaturedItem, HomeData, StageItem } from './data'
import styles from './HomePage.module.css'

export function HomePage({ data }: { data: HomeData }) {
  return (
    <div className={styles.page}>
      <Hero />
      {data.featured.length > 0 ? <Featured items={data.featured} /> : null}
      {data.essays.length > 0 ? <Thinking items={data.essays} /> : null}
      <CyberOpsInvite />
      {data.timeline.length > 0 ? <CompactTimeline items={data.timeline} /> : null}
      <HomeContact />
    </div>
  )
}

/** Bloque 1: quién es y a dónde ir (01: nombre, rol, posicionamiento y dos CTAs). */
function Hero() {
  const { locale, t } = useLocale()
  return (
    <section className={styles.hero}>
      <h1 className={styles.name}>
        <span className={styles.line}>{site.givenName}</span> <span className={styles.line}>{site.familyName}</span>
      </h1>
      <div className={styles.intro}>
        <p className={styles.role}>{site.role[locale]}</p>
        <p className={styles.positioning}>{site.positioning[locale]}</p>
      </div>
      <div className={styles.actions}>
        <ButtonLink to={href('work', locale)}>{t('home.ctaWork')}</ButtonLink>
        <ButtonLink to={href('securityLab', locale)} variant="secondary">
          {t('home.ctaLab')}
        </ButtonLink>
      </div>
    </section>
  )
}

/** Bloque 2: casos y lab, en lista (03: sin rejilla de tarjetas). Toda la fila es el enlace. */
function Featured({ items }: { items: readonly FeaturedItem[] }) {
  const { t } = useLocale()
  return (
    <section className={styles.section} aria-labelledby="home-featured">
      <h2 id="home-featured">{t('home.featured')}</h2>
      <ul className={styles.rows}>
        {items.map((item) => (
          <li key={item.slug} className={styles.row}>
            <h3 className={styles.rowTitle}>
              <Link className={styles.rowLink} to={item.href} prefetch="intent" viewTransition>
                {item.title}
              </Link>
              {item.draft ? <DraftTag /> : null}
            </h3>
            <p className={styles.text}>{item.problem}</p>
            <p className={styles.muted}>{item.highlight}</p>
            <div className={styles.tags}>
              <StatusTag state={item.existence}>{t(`existence.${item.existence}`)}</StatusTag>
              <ClassificationTag>{t(`confidentiality.${item.confidentiality}`)}</ClassificationTag>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Bloque 3: títulos de ensayos con su tesis en una línea. */
function Thinking({ items }: { items: readonly EssayItem[] }) {
  const { locale, t } = useLocale()
  return (
    <section className={styles.section} aria-labelledby="home-thinking">
      <h2 id="home-thinking">{t('home.thinking')}</h2>
      <ul className={styles.rows}>
        {items.map((item) => (
          <li key={item.slug} className={styles.row}>
            <h3 className={styles.rowTitle}>
              {item.title}
              {item.draft ? <DraftTag /> : null}
            </h3>
            <p className={styles.muted}>{item.thesis}</p>
          </li>
        ))}
      </ul>
      <p>
        <ButtonLink to={href('judgment', locale)} variant="secondary">
          {t('home.thinkingMore')}
        </ButtonLink>
      </p>
    </section>
  )
}

/** Bloque 4: invitación secundaria, estática (09 §10.1; no va en el hero, D8). */
function CyberOpsInvite() {
  const { locale, t } = useLocale()
  return (
    <section className={styles.section} aria-labelledby="home-cyber-ops">
      <h2 id="home-cyber-ops">{t('nav.cyberOps')}</h2>
      <p className={styles.text}>{t('home.cyberOpsBody')}</p>
      <p>
        <ButtonLink to={href('cyberOpsHub', locale)} variant="secondary">
          {t('home.cyberOpsCta')}
        </ButtonLink>
      </p>
    </section>
  )
}

/** Bloque 5: etapas visibles del Engineering Timeline, con enlace al completo en About. */
function CompactTimeline({ items }: { items: readonly StageItem[] }) {
  const { locale, t } = useLocale()
  return (
    <section className={styles.section} aria-labelledby="home-timeline">
      <h2 id="home-timeline">{t('timeline.title')}</h2>
      <Timeline
        items={items.map((stage) => ({
          id: stage.slug,
          dateTime: stage.dateTime,
          period: stage.period,
          title: stage.title,
          mark: stage.draft ? <DraftTag /> : null,
        }))}
      />
      <p>
        <ButtonLink to={`${href('about', locale)}#timeline`} variant="secondary">
          {t('timeline.more')}
        </ButtonLink>
      </p>
    </section>
  )
}

/** Bloque 6: contacto. El correo aparece cuando exista (C4); mientras tanto, solo el aviso de desarrollo. */
function HomeContact() {
  const { locale, t } = useLocale()
  const { email } = site.contact
  return (
    <section className={styles.section} aria-labelledby="home-contact">
      <h2 id="home-contact">{t('nav.contact')}</h2>
      {isPending(email) ? (
        <PendingNotice>{email.pending}</PendingNotice>
      ) : (
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      )}
      <p>
        <ButtonLink to={href('contact', locale)} variant="secondary">
          {t('home.contactCta')}
        </ButtonLink>
      </p>
    </section>
  )
}
