import { Link } from "react-router";
import type { Route } from "./+types/home";
import { DEFAULT_LANG, isLang, messages } from "../lib/i18n";
import { buildMeta, href, notFoundMeta, personJsonLd } from "../lib/seo";

export function meta({ params }: Route.MetaArgs): Route.MetaDescriptors {
  if (!isLang(params.lang)) return notFoundMeta(messages[DEFAULT_LANG].notFoundTitle);
  const t = messages[params.lang];
  return buildMeta({
    lang: params.lang,
    path: "/",
    title: t.role,
    description: t.homeIntro,
    isHome: true,
    jsonLd: personJsonLd(t.role),
  });
}

export default function Home({ params }: Route.ComponentProps) {
  if (!isLang(params.lang)) return null;
  const lang = params.lang;
  const t = messages[lang];
  return (
    <>
      <h1>Cesar Acosta</h1>
      <p>{t.role}</p>
      <p>{t.homeIntro}</p>
      <p>
        <Link to={href(lang, "/work/")} prefetch="intent">
          {t.workTitle}
        </Link>
        {" · "}
        <Link to={href(lang, "/work/alpha/")} prefetch="intent">
          {t.readCase("Alfa")}
        </Link>
        {" · "}
        <Link to={href(lang, "/cyber-ops/")} prefetch="intent">
          {t.cyberTitle}
        </Link>
      </p>
    </>
  );
}
