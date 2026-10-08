// Blueprint 05 §Verificación de integridad (textos en ambos idiomas, fechas válidas, slugs únicos,
// enlaces a entidades que existen) aplicada a content/about, y 02 §About (máximo 3 párrafos de
// introducción, 4–5 principios, los cuatro pilares). La paridad de forma ES/EN la garantiza el tipo
// AboutProse; aquí se verifica la de cantidad.
import { describe, expect, it } from 'vitest'
import { en } from '../about/en'
import { es } from '../about/es'
import { aboutMeta } from '../about/meta'
import { allProjects } from '../projects'
import type { Pillar, TimelineStage } from '../schema'
import { SLUG_PATTERN, emptyLocalized, isYearMonth } from './integrity'

const PILLARS: readonly Pillar[] = ['engineering', 'security', 'leadership', 'business-systems']

describe('about: prosa', () => {
  it('introducción de 1 a 3 párrafos y 4–5 principios, igual en ambos idiomas', () => {
    for (const prose of [es, en]) {
      expect(prose.intro.length).toBeGreaterThanOrEqual(1)
      expect(prose.intro.length).toBeLessThanOrEqual(3)
      expect(prose.principles.length).toBeGreaterThanOrEqual(4)
      expect(prose.principles.length).toBeLessThanOrEqual(5)
    }
    expect(en.intro).toHaveLength(es.intro.length)
    expect(en.principles).toHaveLength(es.principles.length)
  })

  it('ningún texto vacío', () => {
    const texts = [es, en].flatMap((prose) => [...prose.intro, ...prose.principles.flatMap((p) => [p.title, p.body])])
    expect(texts.filter((text) => text.trim() === '')).toEqual([])
  })

  it('declara la asistencia de IA (D9) en ambos idiomas', () => {
    expect(es.principles.some((p) => p.body.includes('asistencia de IA'))).toBe(true)
    expect(en.principles.some((p) => p.body.includes('AI assistance'))).toBe(true)
  })
})

describe('about: meta', () => {
  it('textos no vacíos en ambos idiomas, a cualquier profundidad', () => {
    expect(emptyLocalized(aboutMeta)).toEqual([])
  })

  it('los cuatro pilares de 01, en orden, con la misma cantidad de habilidades en ES y EN', () => {
    expect(aboutMeta.pillars.map((pillar) => pillar.id)).toEqual(PILLARS)
    for (const pillar of aboutMeta.pillars) expect(pillar.skills.en).toHaveLength(pillar.skills.es.length)
    expect(aboutMeta.responsibilities.en).toHaveLength(aboutMeta.responsibilities.es.length)
  })

  it('en español el rol nunca es "ingeniero" (título regulado; decisión del 2026-10-07)', () => {
    const spanish = JSON.stringify([aboutMeta.formalTitle.es, aboutMeta.responsibilities.es, es])
    expect(spanish).not.toMatch(/ingenier[oa]/i)
  })
})

describe('about: timeline', () => {
  const stages: readonly TimelineStage[] = aboutMeta.timeline

  it('slugs válidos y únicos', () => {
    const slugs = stages.map((stage) => stage.slug)
    expect(slugs.filter((slug) => !SLUG_PATTERN.test(slug))).toEqual([])
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('periodos AAAA-MM válidos, fin posterior al inicio y orden cronológico', () => {
    for (const stage of stages) {
      expect(isYearMonth(stage.start), stage.slug).toBe(true)
      if (stage.end !== null) {
        expect(isYearMonth(stage.end), stage.slug).toBe(true)
        expect(stage.end >= stage.start, stage.slug).toBe(true)
      }
    }
    const starts = stages.map((stage) => stage.start)
    expect(starts).toEqual([...starts].sort())
  })

  it('empieza en el ingreso a Brandex (julio de 2025): antes no hay etapas con evidencia (07)', () => {
    expect(stages[0]?.start).toBe('2025-07')
    expect(stages[0]?.publication).toBe('published')
  })

  it('cada etapa abre casos que existen (05, verificación 7)', () => {
    const known = new Set(allProjects.map((project) => project.slug))
    const missing = stages.flatMap((stage) => (stage.projects ?? []).filter((slug) => !known.has(slug)))
    expect(missing).toEqual([])
  })
})
