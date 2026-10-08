// Tabla única de URLs: la usan el prerender (react-router.config.ts) y el postbuild (sitemap).
// Forma canónica: prefijo de idioma y barra final (12). La barra final importa: React Router pide
// `<ruta>/_.data` en la navegación cliente cuando la URL termina en "/", y el prerender escribe
// `_.data` solo si el path de la lista también termina en "/".
import { LANGS } from "../lib/i18n";
import { projects } from "./projects/index";

export interface PageEntry {
  /** Path sin idioma, con barra final: "/", "/work/", "/work/alpha/" */
  path: string;
  lastmod?: string;
}

export function localizedPages(): PageEntry[] {
  return [
    { path: "/" },
    { path: "/work/" },
    ...projects.map((p) => ({ path: `/work/${p.slug}/`, lastmod: p.updatedAt })),
    { path: "/cyber-ops/" },
  ];
}

/** Páginas 404 que se prerenderizan y el postbuild mueve a `404.html` (la más cercana gana en Pages). */
export const notFoundPaths = ["/404/", ...LANGS.map((l) => `/${l}/404/`)];

export function prerenderPaths(): string[] {
  const pages = LANGS.flatMap((lang) => localizedPages().map((p) => `/${lang}${p.path}`));
  return ["/", ...pages, ...notFoundPaths];
}
