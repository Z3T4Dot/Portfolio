import type { MetaDescriptor } from "react-router";
import { LANGS, type Lang } from "./i18n";

const RAW_SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:8788";
export const SITE_URL = RAW_SITE_URL.replace(/\/$/, "");
export const SITE_NAME = "Cesar Acosta";

/** Ruta canónica relativa al origen. `path` es la parte sin idioma, con barra final. */
export function href(lang: Lang, path: string): string {
  return `/${lang}${path}`;
}

export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname}`;
}

const OG_LOCALE: Record<Lang, string> = { es: "es_LA", en: "en_US" };

interface BuildMetaInput {
  lang: Lang;
  /** Path sin idioma, con barra final ("/work/alpha/"). */
  path: string;
  /** Título de la página sin sufijo. En Home es el rol. */
  title: string;
  description: string;
  ogType?: "website" | "article" | "profile";
  isHome?: boolean;
  jsonLd?: Record<string, unknown>;
}

/** Función pura: concentra todo el <head> de una ruta (12, "Metadata por ruta"). */
export function buildMeta(input: BuildMetaInput): MetaDescriptor[] {
  const { lang, path, title, description, ogType = "website", isHome = false, jsonLd } = input;
  const fullTitle = isHome ? `${SITE_NAME} | ${title}` : `${title} | ${SITE_NAME}`;
  const canonical = absoluteUrl(href(lang, path));
  const tags: MetaDescriptor[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    ...LANGS.map((l) => ({ tagName: "link", rel: "alternate", hrefLang: l, href: absoluteUrl(href(l, path)) })),
    { tagName: "link", rel: "alternate", hrefLang: "x-default", href: absoluteUrl(href("en", path)) },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: OG_LOCALE[lang] },
    { property: "og:locale:alternate", content: OG_LOCALE[lang === "es" ? "en" : "es"] },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (jsonLd) tags.push({ "script:ld+json": jsonLd });
  return tags;
}

/** 404: noindex, sin canonical ni hreflang (12). */
export function notFoundMeta(title: string): MetaDescriptor[] {
  return [{ title: `${title} | ${SITE_NAME}` }, { name: "robots", content: "noindex" }];
}

export function personJsonLd(jobTitle: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: [...LANGS],
        publisher: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        jobTitle,
        // Placeholders del spike: las URLs reales las define César (12).
        sameAs: ["https://github.com/example", "https://www.linkedin.com/in/example"],
      },
    ],
  };
}
