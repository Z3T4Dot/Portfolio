import { Outlet } from "react-router";
import type { Route } from "./+types/lang-layout";
import { SiteShell } from "../components/SiteShell";
import { NotFoundContent } from "../components/NotFoundContent";
import { DEFAULT_LANG, isLang } from "../lib/i18n";

export default function LangLayout({ params }: Route.ComponentProps) {
  // Un prefijo que no es idioma (/xx/) no se prerenderiza: el host sirve la 404. En navegación
  // cliente se muestra el mismo contenido de 404.
  if (!isLang(params.lang)) {
    return (
      <SiteShell lang={DEFAULT_LANG} notFound>
        <NotFoundContent lang={DEFAULT_LANG} />
      </SiteShell>
    );
  }
  return (
    <SiteShell lang={params.lang}>
      <Outlet />
    </SiteShell>
  );
}
