// Blueprint 02 §Work (índice): cada fila con nombre, tipo de sistema, rol, periodo, etiquetas
// (existencia y confidencialidad) y el problema en una línea. 04 §Flujo de datos y 05 verificación 10:
// solo lo importa el loader de routes/work.tsx; sin la vista previa nunca hay un draft.
import { allProjects } from '../../content/projects'
import { isPublished, visibleOnly } from '../../content/publication'
import type { CaseStudyMeta, Confidentiality, Existence } from '../../content/schema'
import { caseHref, type Locale } from '../../i18n'
import { formatMonthPeriod } from '../../lib/date'

export interface WorkItem {
  slug: string
  title: string
  kind: string
  role: string
  period: { dateTime: string; text: string }
  problem: string
  existence: Existence
  confidentiality: Exclude<Confidentiality, 'confidential'>
  href: string
  /** Solo en la vista previa de desarrollo, donde la página del borrador existe. */
  draft: boolean
}

export interface WorkData {
  cases: WorkItem[]
}

interface Options {
  /** SHOW_DRAFTS de src/env.ts: solo en desarrollo, activo por defecto. */
  includeDrafts: boolean
}

export function workData(
  locale: Locale,
  { includeDrafts }: Options,
  projects: readonly CaseStudyMeta[] = allProjects,
): WorkData {
  return {
    cases: visibleOnly(projects, includeDrafts).map((entry) => {
      const period = formatMonthPeriod(entry.period.start, entry.period.end, locale)
      return {
        slug: entry.slug,
        title: entry.title[locale],
        kind: entry.kind[locale],
        role: entry.role[locale],
        period: {
          dateTime: entry.period.start,
          text: `${period.charAt(0).toLocaleUpperCase(locale)}${period.slice(1)}`,
        },
        problem: entry.problem[locale],
        existence: entry.existence,
        confidentiality: entry.confidentiality,
        href: caseHref(locale, entry),
        draft: !isPublished(entry),
      }
    }),
  }
}
