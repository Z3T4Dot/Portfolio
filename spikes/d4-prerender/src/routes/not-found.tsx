import { useLocation } from "react-router";
import type { Route } from "./+types/not-found";
import { NotFoundContent } from "../components/NotFoundContent";
import { SiteShell } from "../components/SiteShell";
import { DEFAULT_LANG, langFromPath, messages } from "../lib/i18n";
import { notFoundMeta } from "../lib/seo";

// Sin loader: el contenido depende solo del prefijo de la URL. Así el HTML prerenderizado en
// /es/404/ hidrata igual cuando el host lo sirve como 404.html en /es/cualquier-cosa.
export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  const lang = langFromPath(location.pathname) ?? DEFAULT_LANG;
  return notFoundMeta(messages[lang].notFoundTitle);
}

export default function NotFound() {
  const { pathname } = useLocation();
  const lang = langFromPath(pathname) ?? DEFAULT_LANG;
  return (
    <SiteShell lang={lang} notFound>
      <NotFoundContent lang={lang} />
    </SiteShell>
  );
}
