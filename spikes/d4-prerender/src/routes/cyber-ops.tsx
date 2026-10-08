import type { Route } from "./+types/cyber-ops";
import { Game } from "../game/Game";
import { DEFAULT_LANG, isLang, messages } from "../lib/i18n";
import { buildMeta, notFoundMeta } from "../lib/seo";

export function meta({ params }: Route.MetaArgs): Route.MetaDescriptors {
  if (!isLang(params.lang)) return notFoundMeta(messages[DEFAULT_LANG].notFoundTitle);
  const t = messages[params.lang];
  return buildMeta({ lang: params.lang, path: "/cyber-ops/", title: t.cyberTitle, description: t.cyberIntro });
}

export default function CyberOps({ params }: Route.ComponentProps) {
  if (!isLang(params.lang)) return null;
  const t = messages[params.lang];
  return (
    <>
      <h1>{t.cyberTitle}</h1>
      <p>{t.cyberIntro}</p>
      <Game labels={params.lang === "es" ? { attack: "Simular ataque", reset: "Reiniciar" } : { attack: "Simulate attack", reset: "Reset" }} />
    </>
  );
}
