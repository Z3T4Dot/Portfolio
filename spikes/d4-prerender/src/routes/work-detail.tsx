import { Suspense, lazy, type ComponentType } from "react";
import type { MDXComponents, MDXProps } from "mdx/types";
import { data, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/work-detail";
import { NotFoundContent } from "../components/NotFoundContent";
import { Section } from "../components/Section";
import { getProject, localizeProject } from "../content/projects/index";
import { DEFAULT_LANG, isLang } from "../lib/i18n";
import { buildMeta } from "../lib/seo";

// Prosa MDX por idioma, cargada de forma diferida (04 "Flujo de datos" punto 4): cada archivo es
// su propio chunk y solo se pide el del slug e idioma de la página.
const bodies = import.meta.glob<{ default: ComponentType<MDXProps> }>("../content/projects/*/*.mdx");
const lazyBodies = new Map(Object.entries(bodies).map(([key, load]) => [key, lazy(load)]));
const mdxComponents: MDXComponents = { Section };

export function loader({ params }: Route.LoaderArgs) {
  const lang = params.lang;
  const project = getProject(params.slug);
  if (!isLang(lang) || !project) throw data(null, { status: 404 });
  return { lang, project: localizeProject(project, lang) };
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  if (!loaderData) return [];
  const { lang, project } = loaderData;
  return buildMeta({
    lang,
    path: `/work/${project.slug}/`,
    title: project.title,
    description: project.summary,
    ogType: "article",
  });
}

export default function WorkDetail({ loaderData }: Route.ComponentProps) {
  const { lang, project } = loaderData;
  const Body = lazyBodies.get(`../content/projects/${project.slug}/${lang}.mdx`);
  return (
    <article>
      <h1>{project.title}</h1>
      <p>{project.summary}</p>
      <p>
        <time dateTime={project.updatedAt}>{project.updatedAt}</time>
      </p>
      {Body ? (
        <Suspense fallback={null}>
          {/* Los lazy() se crean una sola vez a nivel de módulo (lazyBodies); aquí solo se elige uno.
              eslint-plugin-react-hooks 7 no lo distingue de crear un componente en el render. */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Body components={mdxComponents} />
        </Suspense>
      ) : null}
    </article>
  );
}

export function ErrorBoundary({ error, params }: Route.ErrorBoundaryProps) {
  const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundContent lang={lang} />;
  return <h1>Error</h1>;
}
