// Blueprint 02 §Contact (email con mailto, LinkedIn, GitHub, CV ES/EN, ubicación y zona horaria,
// disponibilidad y tipo de rol; sin formulario en V1) y 16 §Contenido ("Sin PENDIENTE visible"). Cada
// dato sale de content/site.ts: si es `Pending`, en desarrollo se ve el aviso y en producción no se
// renderiza nada, ni su etiqueta. El build de lanzamiento falla si queda alguno (scripts/lib/launch.ts).
import type { ReactNode } from 'react'
import { PendingNotice } from '../../components/ui/DevMarks'
import { PageHeader } from '../../components/ui/PageHeader'
import { isPending } from '../../content/pending'
import type { OrPending } from '../../content/schema'
import { site } from '../../content/site'
import { useLocale } from '../../i18n'
import styles from './ContactPage.module.css'

interface Field {
  key: string
  label: string
  /** Un `dd` por valor, en orden. */
  values: Array<{ id: string; value: OrPending<ReactNode> }>
}

export function ContactPage() {
  const { locale, t } = useLocale()
  const { email, linkedin, github, cv, location, timezone, availability, roleSought } = site.contact
  const fields: Field[] = [
    {
      key: 'email',
      label: t('contact.email'),
      values: [{ id: 'email', value: render(email, (address) => <a href={`mailto:${address}`}>{address}</a>) }],
    },
    {
      key: 'profiles',
      label: t('contact.profiles'),
      values: [
        { id: 'linkedin', value: render(linkedin, (url) => <a href={url}>LinkedIn</a>) },
        { id: 'github', value: render(github, (url) => <a href={url}>GitHub</a>) },
      ],
    },
    {
      key: 'cv',
      label: t('contact.cv'),
      values: [
        { id: 'cv-es', value: render(cv.es, (path) => <CvLink path={path} lang="es" label={t('contact.cvEs')} />) },
        { id: 'cv-en', value: render(cv.en, (path) => <CvLink path={path} lang="en" label={t('contact.cvEn')} />) },
      ],
    },
    {
      key: 'location',
      label: t('contact.location'),
      values: [
        { id: 'location', value: render(location, (text) => text[locale]) },
        { id: 'timezone', value: timezone },
      ],
    },
    {
      key: 'availability',
      label: t('contact.availability'),
      values: [{ id: 'availability', value: render(availability, (text) => text[locale]) }],
    },
    {
      key: 'role',
      label: t('contact.roleSought'),
      values: [{ id: 'role', value: render(roleSought, (text) => text[locale]) }],
    },
  ]
  // En producción un dato pendiente no deja rastro: ni su valor ni, si no queda ninguno, su etiqueta.
  const shown = fields
    .map((field) => ({
      ...field,
      values: import.meta.env.DEV ? field.values : field.values.filter(({ value }) => !isPending(value)),
    }))
    .filter((field) => field.values.length > 0)

  return (
    <div className={styles.page}>
      <PageHeader title={t('pages.contact.title')} lede={t('pages.contact.description')} />
      {shown.length > 0 ? (
        <dl className={styles.fields}>
          {shown.map((field) => (
            <div key={field.key} className={styles.field}>
              <dt>{field.label}</dt>
              {field.values.map(({ id, value }) => (
                <dd key={id}>{isPending(value) ? <PendingNotice>{value.pending}</PendingNotice> : value}</dd>
              ))}
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

function render<T>(value: OrPending<T>, show: (value: T) => ReactNode): OrPending<ReactNode> {
  return isPending(value) ? value : show(value)
}

function CvLink({ path, lang, label }: { path: string; lang: string; label: string }) {
  return (
    <a href={path} download hrefLang={lang}>
      {label}
    </a>
  )
}
