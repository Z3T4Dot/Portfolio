import { Link, data } from "react-router";
import type { Route } from "./+types/work-index";
import { localizeProject, projects } from "../content/projects/index";
import { isLang, messages } from "../lib/i18n";
import { buildMeta, href } from "../lib/seo";

// Con ssr:false este loader solo corre en el build; la navegación cliente lee el .data generado.
export function loader({ params }: Route.LoaderArgs) {
  const lang = params.lang;
  if (!isLang(lang)) throw data(null, { status: 404 });
  return { lang, items: projects.map((p) => localizeProject(p, lang)) };
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  const t = messages[loaderData.lang];
  return buildMeta({ lang: loaderData.lang, path: "/work/", title: t.workTitle, description: t.workIntro });
}

export default function WorkIndex({ loaderData }: Route.ComponentProps) {
  const { lang, items } = loaderData;
  const t = messages[lang];
  return (
    <>
      <h1>{t.workTitle}</h1>
      <p>{t.workIntro}</p>
      <ul>
        {items.map((item) => (
          <li key={item.slug}>
            <Link to={href(lang, `/work/${item.slug}/`)} prefetch="intent">
              {t.readCase(item.title)}
            </Link>
            <p>{item.summary}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
