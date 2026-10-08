// Blueprint 12 §hreflang y 02 §Sitemap V1: `/` es una página estática mínima y bilingüe, con enlaces
// a /es/ y /en/, sus propios hreflang y un script inline (hash en la CSP) que redirige con
// location.replace según la preferencia guardada → idioma del navegador → en.
import { site } from '../content/site'
import { LOCALES, createT, href, localeRedirectScript } from '../i18n'
import { rootIndexMeta } from '../seo/meta'
import styles from './root-index.module.css'

const REDIRECT_SCRIPT = localeRedirectScript()

export function meta() {
  return rootIndexMeta()
}

export default function RootIndex() {
  return (
    <main id="main" className={styles.main}>
      <script dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />
      <h1>{site.name}</h1>
      <ul className={styles.choices}>
        {LOCALES.map((locale) => (
          <li key={locale} lang={locale}>
            <a href={href('home', locale)} hrefLang={locale}>
              {createT(locale)(`language.${locale}`)}
            </a>
            <p className={styles.role}>{site.role[locale]}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
