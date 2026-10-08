// Índice de contenido de prueba. Los textos son ficticios: el spike solo mide el mecanismo.
import type { Lang, Localized } from "../../lib/i18n";

export interface ProjectMeta {
  slug: string;
  title: Localized;
  summary: Localized;
  /** Fecha real de la última revisión del contenido (alimenta lastmod del sitemap). */
  updatedAt: string;
}

export const projects: readonly ProjectMeta[] = [
  {
    slug: "alpha",
    title: { es: "Caso de prueba Alfa", en: "Test case Alpha" },
    summary: {
      es: "Caso ficticio para el spike: cómo se decide una arquitectura de autorización y qué costó mantenerla consistente entre servicios.",
      en: "Fictional case for the spike: how an authorization architecture was decided and what it cost to keep it consistent across services.",
    },
    updatedAt: "2026-09-30",
  },
  {
    slug: "beta",
    title: { es: "Caso de prueba Beta", en: "Test case Beta" },
    summary: {
      es: "Caso ficticio para el spike: un inventario multibodega, la decisión de modelado principal y los modos de falla que aparecieron.",
      en: "Fictional case for the spike: a multi-warehouse inventory, the main modelling decision and the failure modes that showed up.",
    },
    updatedAt: "2026-10-02",
  },
];

export function getProject(slug: string | undefined): ProjectMeta | undefined {
  return projects.find((p) => p.slug === slug);
}

export function localizeProject(p: ProjectMeta, lang: Lang) {
  return { slug: p.slug, title: p.title[lang], summary: p.summary[lang], updatedAt: p.updatedAt };
}
