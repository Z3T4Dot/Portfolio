// docs/spikes/d4-prerender.md, sorpresa 13: el postbuild importa TypeScript con `runnerImport` de
// Vite, sin dependencias extra. Este módulo junta en una sola importación lo que necesita, así el
// sitemap, la CSP y las verificaciones de drafts y de lanzamiento salen de las mismas fuentes que el
// prerender.
import { aboutMeta } from '../../src/content/about/meta'
import { allEssays } from '../../src/content/judgment'
import { allProjects } from '../../src/content/projects'
import { isPublished } from '../../src/content/publication'
import type { CaseStudyMeta, EssayMeta, Publication, SelectedWorkMeta, TimelineStage } from '../../src/content/schema'
import { allSelectedWork } from '../../src/content/selected-work'
import { site } from '../../src/content/site'
import { LOCALES } from '../../src/i18n/locales'
import { href } from '../../src/i18n/paths'
import { parseSiteUrl } from '../../src/lib/env'
import { INDEXABLE } from '../../src/seo/indexing'
import { NOT_FOUND_PATHS, sitePages } from '../../src/seo/site-pages'
import type { DraftEntity } from './draft-leaks'

export { executableHashes, inlineScripts } from './csp'
export { findDraftLeaks } from './draft-leaks'
export { headerLimitProblems, renderHeaders } from './headers'
export { devMarkerLeaks, isLaunchBuild, launchProblems } from './launch'
export { renderRobots, renderSitemap, sitemapEntries } from '../../src/seo/sitemap'
export { INDEXABLE, NOT_FOUND_PATHS, parseSiteUrl, sitePages }

/** Contacto del sitio (02): el chequeo de lanzamiento lo recorre buscando valores `pending`. */
export const contact = site.contact

export interface DraftSources {
  projects: readonly CaseStudyMeta[]
  selectedWork: readonly SelectedWorkMeta[]
  essays: readonly EssayMeta[]
  timeline: readonly TimelineStage[]
}

const SOURCES: DraftSources = {
  projects: allProjects,
  selectedWork: allSelectedWork,
  essays: allEssays,
  timeline: aboutMeta.timeline,
}

/** Los textos de cada idioma, sin repetir ("Quantum" es igual en ES y EN). */
const texts = (...values: Array<Readonly<Record<string, string>> | undefined>) => [
  ...new Set(values.flatMap((value) => (value ? LOCALES.map((locale) => value[locale] ?? '') : []))),
]

const drafts = <T extends { slug: string; publication: Publication }>(entries: readonly T[]) =>
  entries.filter((entry) => !isPublished(entry))

/**
 * Cada entidad `draft` del contenido, con las rutas y los textos que no pueden aparecer en el build
 * (05, verificación 10): casos (ruta, título y sus textos de cabecera, que también delatarían su
 * `.data` o su prosa), fichas de Selected Work, ensayos y etapas del timeline (título y resumen; no
 * tienen ruta propia).
 */
export function draftEntities(sources: DraftSources = SOURCES): DraftEntity[] {
  return [
    ...drafts(sources.projects).map((entry) => ({
      label: `case ${entry.slug}`,
      paths: LOCALES.map((locale) => href('case', locale, { slug: entry.slug })),
      markers: texts(entry.title, entry.kind, entry.problem, entry.highlight, entry.summary, entry.description),
    })),
    ...drafts(sources.selectedWork).map((entry) => ({
      label: `selected-work ${entry.slug}`,
      paths: [],
      markers: texts(entry.what),
    })),
    ...drafts(sources.essays).map((entry) => ({
      label: `essay ${entry.slug}`,
      paths: [],
      markers: texts(entry.title),
    })),
    ...drafts(sources.timeline).map((stage) => ({
      label: `timeline ${stage.slug}`,
      paths: [],
      markers: texts(stage.title, stage.summary),
    })),
  ]
}
