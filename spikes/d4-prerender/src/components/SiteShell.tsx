import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { messages, otherLang, type Lang } from "../lib/i18n";
import { href } from "../lib/seo";
import styles from "./SiteShell.module.css";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // localStorage bloqueado: el tema cambia igual, solo no se recuerda.
  }
}

export function SiteShell({ lang, notFound = false, children }: { lang: Lang; notFound?: boolean; children: ReactNode }) {
  const t = messages[lang];
  const { pathname } = useLocation();
  const alt = otherLang(lang);
  // En la 404 (HTML sin JS) el selector lleva al inicio del otro idioma.
  const altPath = notFound ? href(alt, "/") : pathname.replace(/^\/(es|en)(?=\/|$)/, `/${alt}`);
  return (
    <>
      <a className={styles.skip} href="#main">
        {t.skip}
      </a>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label={lang === "es" ? "Principal" : "Main"}>
          <ul>
            <li>
              <Link to={href(lang, "/")} prefetch="intent">
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link to={href(lang, "/work/")} prefetch="intent">
                {t.nav.work}
              </Link>
            </li>
            <li>
              <Link to={href(lang, "/cyber-ops/")} prefetch="intent">
                {t.nav.cyberOps}
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <a href={altPath} hrefLang={alt} lang={alt}>
            {t.switchTo}
          </a>
          {notFound ? null : (
            <>
              {" "}
              <button type="button" onClick={toggleTheme}>
                {t.theme}
              </button>
            </>
          )}
        </div>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>Cesar Acosta · spike D4</footer>
    </>
  );
}
