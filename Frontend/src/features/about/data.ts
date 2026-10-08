// Blueprint 02 §About (introducción, pilares con habilidades y enlaces a evidencia, Engineering
// Timeline donde cada etapa abre proyectos reales, cómo trabajo, formación), 04 §Flujo de datos y 05
// verificación 10. Solo lo importa el loader de routes/about.tsx (build o servidor de desarrollo): el
// contenido completo, con sus `draft`, nunca viaja al cliente.
import { en } from '../../content/about/en'
import { es } from '../../content/about/es'
import { aboutMeta } from '../../content/about/meta'
import { allProjects } from '../../content/projects'
import { isPublished, visibleOnly } from '../../content/publication'
import type { AboutMeta, AboutProse, CaseStudyMeta, Pillar, SelectedWorkMeta } from '../../content/schema'
import { allSelectedWork } from '../../content/selected-work'
import { caseHref, createT, type Locale } from '../../i18n'
import { formatStagePeriod } from '../../lib/date'

/** Enlace a un caso visible. Un borrador solo es visible en la vista previa, donde su página existe. */
export interface CaseLink {
  slug: string
  title: string
  href: string
  draft: boolean
}

export interface AboutData {
  intro: string[]
  formalTitle: string
  responsibilities: string[]
  pillars: Array<{ id: Pillar; skills: string[]; evidence: CaseLink[] }>
  timeline: Array<{
    slug: string
    dateTime: string
    period: string
    title: string
    summary: string | null
    projects: CaseLink[]
    draft: boolean
  }>
  principles: AboutProse['principles']
  education: string
  /** Hay fichas de Selected Work visibles en /work (02): solo entonces se enlazan. */
  hasSelectedWork: boolean
}

export interface AboutSources {
  meta: AboutMeta
  prose: Record<Locale, AboutProse>
  projects: readonly CaseStudyMeta[]
  selectedWork: readonly SelectedWorkMeta[]
}

const SOURCES: AboutSources = {
  meta: aboutMeta,
  prose: { es, en },
  projects: allProjects,
  selectedWork: allSelectedWork,
}

interface Options {
  /** SHOW_DRAFTS de src/env.ts: solo en desarrollo, activo por defecto. */
  includeDrafts: boolean
}

export function aboutData(locale: Locale, { includeDrafts }: Options, sources: AboutSources = SOURCES): AboutData {
  const t = createT(locale)
  const { meta } = sources
  const prose = sources.prose[locale]
  const cases = visibleOnly(sources.projects, includeDrafts)
  const link = (entry: CaseStudyMeta): CaseLink => {
    const draft = !isPublished(entry)
    return { slug: entry.slug, title: entry.title[locale], href: caseHref(locale, entry), draft }
  }

  return {
    intro: prose.intro,
    formalTitle: meta.formalTitle[locale],
    responsibilities: meta.responsibilities[locale],
    pillars: meta.pillars.map((pillar) => ({
      id: pillar.id,
      skills: pillar.skills[locale],
      evidence: cases.filter((entry) => entry.pillars.includes(pillar.id)).map(link),
    })),
    timeline: visibleOnly(meta.timeline, includeDrafts).map((stage) => ({
      slug: stage.slug,
      dateTime: stage.start,
      period: formatStagePeriod(stage.start, stage.end, locale, (date) => t('timeline.since', { date })),
      title: stage.title[locale],
      summary: stage.summary?.[locale] ?? null,
      // Solo los casos visibles: un draft no se enlaza en producción (05, verificación 10).
      projects: (stage.projects ?? []).flatMap((slug) => cases.filter((entry) => entry.slug === slug)).map(link),
      draft: !isPublished(stage),
    })),
    principles: prose.principles,
    education: meta.education[locale],
    hasSelectedWork: visibleOnly(sources.selectedWork, includeDrafts).length > 0,
  }
}
