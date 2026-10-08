import type { Route } from "./+types/root-index";
import { messages } from "../lib/i18n";
import { SITE_NAME, absoluteUrl } from "../lib/seo";

// Redirección por preferencia guardada → idioma del navegador → inglés (12). Es un script inline
// propio de esta página: su hash solo aparece en la regla CSP de "/".
const REDIRECT_SCRIPT =
  '(function(){var l;try{l=localStorage.getItem("lang")}catch(e){}' +
  'if(l!=="es"&&l!=="en"){l=(navigator.language||"").toLowerCase().indexOf("es")===0?"es":"en"}' +
  'location.replace("/"+l+"/")})();';

export function meta(): Route.MetaDescriptors {
  const description = "Cesar Acosta: ingeniero de software / software engineer. Elige idioma · Choose a language.";
  return [
    { title: `${SITE_NAME} | ${messages.en.role} · ${messages.es.role}` },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: absoluteUrl("/") },
    { tagName: "link", rel: "alternate", hrefLang: "es", href: absoluteUrl("/es/") },
    { tagName: "link", rel: "alternate", hrefLang: "en", href: absoluteUrl("/en/") },
    { tagName: "link", rel: "alternate", hrefLang: "x-default", href: absoluteUrl("/") },
    { property: "og:type", content: "website" },
    { property: "og:title", content: SITE_NAME },
    { property: "og:description", content: description },
    { property: "og:url", content: absoluteUrl("/") },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

export default function RootIndex() {
  return (
    <main id="main">
      <script dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />
      <h1>Cesar Acosta</h1>
      <p>
        <a href="/es/" hrefLang="es" lang="es">
          Español: {messages.es.role}
        </a>
      </p>
      <p>
        <a href="/en/" hrefLang="en" lang="en">
          English: {messages.en.role}
        </a>
      </p>
    </main>
  );
}
