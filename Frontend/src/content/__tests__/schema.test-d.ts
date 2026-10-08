// Tests de tipos (11 §1): no se ejecutan, los verifica `npm run typecheck`. Si una garantía del
// compilador se pierde, tsc falla aquí.
import { expectTypeOf } from 'vitest'
import type { Locale as UiLocale, Messages } from '../../i18n'
import type { DiagramNodeKind as ComponentNodeKind } from '../../components/diagram/Diagram'
import type { MetricKind } from '../../components/ui/Metric'
import type { StatusTagState } from '../../components/ui/Tag'
import type {
  AboutProse,
  CaseDecision,
  CaseMetric,
  CaseSectionId,
  CaseStudyMeta,
  ContactMeta,
  DiagramNodeKind,
  Evidence,
  Existence,
  Locale,
  Localized,
  Metric,
  MetricSource,
  Pillar,
  RepeatAnswer,
  SelectedWorkMeta,
} from '../schema'

// content/ e i18n/ no pueden importarse entre sí (04), así que cada uno declara su Locale.
expectTypeOf<Locale>().toEqualTypeOf<UiLocale>()

// Cada sección del caso tiene su etiqueta de interfaz, y ninguna etiqueta sobra.
expectTypeOf<keyof Messages['caseStudy']['sections']>().toEqualTypeOf<CaseSectionId>()
// Lo mismo con los pilares (01) y con los estados de StatusTag (components/ no importa content).
expectTypeOf<keyof Messages['pillars']>().toEqualTypeOf<Pillar>()
expectTypeOf<StatusTagState>().toEqualTypeOf<Existence>()
// Diagramas, decisiones y métricas: cada valor del contenido tiene su etiqueta, y los tipos que
// declaran components/ (que no importa content) son los mismos.
expectTypeOf<keyof Messages['diagram']['kinds']>().toEqualTypeOf<DiagramNodeKind>()
expectTypeOf<ComponentNodeKind>().toEqualTypeOf<DiagramNodeKind>()
expectTypeOf<keyof Messages['caseStudy']['repeat']>().toEqualTypeOf<RepeatAnswer>()
expectTypeOf<keyof Messages['metricSource']>().toEqualTypeOf<MetricSource['type']>()
expectTypeOf<MetricKind>().toEqualTypeOf<MetricSource['type']>()
// Una métrica que el MDX referencia sigue necesitando fuente.
expectTypeOf<{ id: string; value: string; label: Localized }>().not.toExtend<CaseMetric>()
// Una decisión sin costo no compila (06: "Cada decisión, con su porqué y su costo").
expectTypeOf<Omit<CaseDecision, 'cost'>>().not.toExtend<CaseDecision>()

// Un dato de contacto o es real o es `Pending` (15 C4): no se puede omitir sin marcarlo.
expectTypeOf<undefined>().not.toExtend<ContactMeta['email']>()
expectTypeOf<{ pending: string }>().toExtend<ContactMeta['cv']['en']>()
// La prosa de About en inglés debe tener la misma forma que la española.
expectTypeOf<{ intro: string[] }>().not.toExtend<AboutProse>()

// Contrato de autenticidad en el compilador (00, 05)
expectTypeOf<{ value: string; label: Localized }>().not.toExtend<Metric>() // una métrica sin fuente no compila
expectTypeOf<'planned'>().not.toExtend<CaseStudyMeta['existence']>() // lo planeado no es un caso
expectTypeOf<'confidential'>().not.toExtend<CaseStudyMeta['confidentiality']>()
expectTypeOf<'confidential'>().not.toExtend<Evidence['confidentiality']>()
expectTypeOf<SelectedWorkMeta['confidentiality']>().toEqualTypeOf<'sanitized'>() // el cliente nunca se nombra
expectTypeOf<{ es: string }>().not.toExtend<Localized>() // un texto sin inglés no compila
