import { Suspense, lazy, type ComponentType } from "react";
import type { MDXComponents, MDXProps } from "mdx/types";
import { Link, useLocation, useParams } from "react-router";
import { NotFoundContent } from "../src/components/NotFoundContent";
import { Section } from "../src/components/Section";
import { SiteShell } from "../src/components/SiteShell";
import { getProject, localizeProject, projects } from "../src/content/projects/index";
import { DEFAULT_LANG, isLang, langFromPath, messages, type Lang } from "../src/lib/i18n";
import { href } from "../src/lib/seo";

// En una SPA el <head> por ruta solo existe después de ejecutar JS (React 19 sube <title>/<meta>).
function Head({ title, description }: { title: string; description: string }) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
}

function useLang(): Lang {
  const { lang } = useParams();
  return isLang(lang) ? lang : DEFAULT_LANG;
}

export function RootIndex() {
  return (
    <main id="main">
      <h1>Cesar Acosta</h1>
      <p>
        <a href="/es/">Español</a> · <a href="/en/">English</a>
      </p>
    </main>
  );
}

export function Home() {
  const lang = useLang();
  const t = messages[lang];
  return (
    <>
      <Head title={`Cesar Acosta | ${t.role}`} description={t.homeIntro} />
      <h1>Cesar Acosta</h1>
      <p>{t.role}</p>
      <p>{t.homeIntro}</p>
      <p>
        <Link to={href(lang, "/work/")}>{t.workTitle}</Link> ·{" "}
        <Link to={href(lang, "/work/alpha/")}>{t.readCase("Alfa")}</Link> ·{" "}
        <Link to={href(lang, "/cyber-ops/")}>{t.cyberTitle}</Link>
      </p>
    </>
  );
}

export function WorkIndex() {
  const lang = useLang();
  const t = messages[lang];
  return (
    <>
      <Head title={`${t.workTitle} | Cesar Acosta`} description={t.workIntro} />
      <h1>{t.workTitle}</h1>
      <ul>
        {projects.map((p) => (
          <li key={p.slug}>
            <Link to={href(lang, `/work/${p.slug}/`)}>{t.readCase(p.title[lang])}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

const bodies = import.meta.glob<{ default: ComponentType<MDXProps> }>("../src/content/projects/*/*.mdx");
const lazyBodies = new Map(Object.entries(bodies).map(([k, load]) => [k, lazy(load)]));
const mdxComponents: MDXComponents = { Section };

export function WorkDetail() {
  const lang = useLang();
  const { slug } = useParams();
  const project = getProject(slug);
  if (!project) return <NotFoundContent lang={lang} />;
  const p = localizeProject(project, lang);
  const Body = lazyBodies.get(`../src/content/projects/${p.slug}/${lang}.mdx`);
  return (
    <article>
      <Head title={`${p.title} | Cesar Acosta`} description={p.summary} />
      <h1>{p.title}</h1>
      <p>{p.summary}</p>
      {Body ? (
        <Suspense fallback={null}>
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Body components={mdxComponents} />
        </Suspense>
      ) : null}
    </article>
  );
}

export function NotFound() {
  const { pathname } = useLocation();
  const lang = langFromPath(pathname) ?? DEFAULT_LANG;
  return (
    <SiteShell lang={lang} notFound>
      <NotFoundContent lang={lang} />
    </SiteShell>
  );
}
