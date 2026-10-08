import type { CaseStudyMeta } from '../../../schema'

// FIXTURE. Entidad ficticia para probar la verificación de integridad de content.test.ts.
// No describe ningún proyecto real, no está en ningún índice publicado y el lint impide importarla
// desde código que no sea de tests. Sigue la misma forma que content/projects/<slug>/.
export const meta = {
  slug: 'fixture-case',
  existence: 'experiment',
  // draft: además sirve para probar que un borrador nunca llega a rutas, sitemap ni enlaces (05, 10).
  publication: 'draft',
  projectKind: 'spike',
  confidentiality: 'public',
  title: { es: 'Caso ficticio de prueba', en: 'Fictional test case' },
  kind: { es: 'Fixture de pruebas', en: 'Test fixture' },
  problem: { es: 'Problema ficticio en una línea.', en: 'Fictional one-line problem.' },
  highlight: { es: 'Decisión ficticia en una línea.', en: 'Fictional one-line decision.' },
  summary: {
    es: 'Entidad inventada para comprobar que la verificación de contenido detecta errores. No se publica.',
    en: 'Made-up entity used to check that content verification catches errors. Never published.',
  },
  description: {
    es: 'Caso ficticio para las pruebas: comprueba que la verificación de contenido detecta cada error antes de que llegue al build.',
    en: 'Fictional case for the tests: it checks that content verification catches every error before it reaches the build.',
  },
  role: { es: 'Ninguno: es un fixture', en: 'None: this is a fixture' },
  period: { start: '2026-01', end: '2026-02' },
  stack: ['TypeScript'],
  pillars: ['engineering'],
  sections: ['context', 'problem', 'decisions', 'result', 'lessons'],
  decisions: [
    {
      id: 'fixture-decision',
      title: { es: 'Decisión ficticia', en: 'Fictional decision' },
      context: { es: 'Hacía falta probar la paridad.', en: 'Parity had to be tested.' },
      options: { es: ['Un fixture mínimo.', 'Un caso real.'], en: ['A minimal fixture.', 'A real case.'] },
      choice: { es: 'Un fixture mínimo.', en: 'A minimal fixture.' },
      cost: { es: 'No cubre todas las secciones.', en: 'It does not cover every section.' },
    },
  ],
  metrics: [
    {
      id: 'fixture-number',
      value: '42',
      label: { es: 'Número de prueba', en: 'Test number' },
      source: {
        type: 'simulated',
        note: { es: 'Valor inventado para el fixture.', en: 'Value made up for the fixture.' },
      },
    },
  ],
  evidence: [
    {
      kind: 'diagram',
      alt: { es: 'Diagrama ficticio con dos nodos.', en: 'Fictional diagram with two nodes.' },
      caption: { es: 'Diagrama del fixture.', en: 'Fixture diagram.' },
      confidentiality: 'public',
    },
  ],
  updatedAt: '2026-10-06',
} satisfies CaseStudyMeta
