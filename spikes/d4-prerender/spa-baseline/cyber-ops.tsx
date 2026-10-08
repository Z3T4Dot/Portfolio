import { useParams } from "react-router";
import { Game } from "../src/game/Game";
import { DEFAULT_LANG, isLang, messages } from "../src/lib/i18n";

export function CyberOps() {
  const { lang: raw } = useParams();
  const lang = isLang(raw) ? raw : DEFAULT_LANG;
  const t = messages[lang];
  return (
    <>
      <title>{`${t.cyberTitle} | Cesar Acosta`}</title>
      <h1>{t.cyberTitle}</h1>
      <p>{t.cyberIntro}</p>
      <Game labels={lang === "es" ? { attack: "Simular ataque", reset: "Reiniciar" } : { attack: "Simulate attack", reset: "Reset" }} />
    </>
  );
}
