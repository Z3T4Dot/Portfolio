// Blueprint 02 §Home (bloque 2: trabajo seleccionado; 3: "Cómo pienso"; 5: timeline compacto), 04
// §Flujo de datos (el loader obtiene el contenido; el componente lo compone) y 05 verificación 10.
//
// Solo lo importa el loader de routes/home.tsx, que corre en el build (prerender) o en el servidor
// de desarrollo. Los índices completos, con sus `draft`, nunca viajan al cliente: el cliente recibe
// únicamente lo que devuelve homeData, y en producción eso nunca incluye un draft.
import { aboutMeta } from '../../content/about/meta'
import { allEssays } from '../../content/judgment'
import { allProjects } from '../../content/projects'
import { isPublished, visibleOnly } from '../../content/publication'
import type { CaseStudyMeta, Confidentiality, EssayMeta, Existence, TimelineStage } from '../../content/schema'
import { caseHref, createT, type Locale } from '../../i18n'
import { formatStagePeriod } from '../../lib/date'

/** 02: tres entradas en Home (Quantum, KeepMe y el Wazuh SOC Lab, según 07). */
export const FEATURED_LIMIT = 3
/** 02: 2–3 títulos de ensayos. */
export const ESSAYS_LIMIT = 3

export interface FeaturedItem {
  slug: string
  title: string
  problem: string
  highlight: string
  existence: Existence
  confidentiality: Exclude<Confidentiality, 'confidential'>
  /** Un borrador solo es visible en la vista previa de desarrollo, donde su página existe. */
  href: string
  draft: boolean
}

export interface EssayItem {
  slug: string
  title: string
  thesis: string
  draft: boolean
}

export interface StageItem {
  slug: string
  dateTime: string
  period: string
  title: string
  draft: boolean
}

export interface HomeData {
  featured: FeaturedItem[]
  essays: EssayItem[]
  timeline: StageItem[]
}

export interface HomeSources {
  projects: readonly CaseStudyMeta[]
  essays: readonly EssayMeta[]
  timeline: readonly TimelineStage[]
}

const SOURCES: HomeSources = { projects: allProjects, essays: allEssays, timeline: aboutMeta.timeline }

interface Options {
  /** SHOW_DRAFTS de src/env.ts: solo en desarrollo, activo por defecto. */
  includeDrafts: boolean
}

export function homeData(locale: Locale, { includeDrafts }: Options, sources: HomeSources = SOURCES): HomeData {
  const t = createT(locale)
  return {
    featured: visibleOnly(sources.projects, includeDrafts)
      .slice(0, FEATURED_LIMIT)
      .map((entry) => {
        const draft = !isPublished(entry)
        return {
          slug: entry.slug,
          title: entry.title[locale],
          problem: entry.problem[locale],
          highlight: entry.highlight[locale],
          existence: entry.existence,
          confidentiality: entry.confidentiality,
          href: caseHref(locale, entry),
          draft,
        }
      }),
    essays: visibleOnly(sources.essays, includeDrafts)
      .slice(0, ESSAYS_LIMIT)
      .map((entry) => ({
        slug: entry.slug,
        title: entry.title[locale],
        thesis: entry.thesis[locale],
        draft: !isPublished(entry),
      })),
    timeline: visibleOnly(sources.timeline, includeDrafts).map((stage) => ({
      slug: stage.slug,
      dateTime: stage.start,
      period: formatStagePeriod(stage.start, stage.end, locale, (date) => t('timeline.since', { date })),
      title: stage.title[locale],
      draft: !isPublished(stage),
    })),
  }
}
