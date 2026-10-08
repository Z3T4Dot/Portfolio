// Tests de tipos (11 §1): no se ejecutan, los verifica `npm run typecheck`.
import { expectTypeOf } from 'vitest'
import type { Locale } from '../locales'
import type { en } from '../messages/en'
import type { Messages } from '../messages/es'
import { createT, type MessageKey, type MessageParams } from '../translate'

const t = createT('es')

// Claves y parámetros se verifican al compilar.
expectTypeOf<'nav.work'>().toExtend<MessageKey>()
expectTypeOf<'caseStudy.sections.failure-modes'>().toExtend<MessageKey>()
expectTypeOf<'nav'>().not.toExtend<MessageKey>() // un grupo no es un texto
expectTypeOf<MessageParams<'footer.updated'>>().toEqualTypeOf<'date'>()
expectTypeOf<MessageParams<'nav.work'>>().toEqualTypeOf<never>()

t('nav.work')
t('footer.updated', { date: '2026-10-06' })
// @ts-expect-error: clave inexistente
t('nav.nope')
// @ts-expect-error: falta el parámetro {date}
t('footer.updated')
// @ts-expect-error: el parámetro se llama date
t('footer.updated', { fecha: '2026-10-06' })
// @ts-expect-error: nav.work no lleva parámetros
t('nav.work', { date: 'x' })

// en.ts cumple la forma de es.ts (además del `satisfies` de en.ts).
expectTypeOf<typeof en>().toExtend<Messages>()
expectTypeOf<Parameters<typeof createT>[0]>().toEqualTypeOf<Locale>()
