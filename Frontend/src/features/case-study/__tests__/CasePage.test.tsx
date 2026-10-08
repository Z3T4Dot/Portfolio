// Blueprint 06 (cabecera de metadatos, "En 30 segundos", formato de una decisión y de failure modes, cierre),
// 03 §Componentes visuales (MetaList, DecisionBlock, FailureModeTable, Metric) y 12 §HTML semántico
// (<article>, <section> con título, <dl>, <table> con <th scope>). Los componentes del MDX se montan
// como lo hace el MDX compilado: con los mismos nombres y atributos de texto.
import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAtPath } from '../../site/__tests__/render'
import { CasePage } from '../CasePage'
import type { CaseData } from '../data'
import { caseMdxComponents } from '../mdx'

const { Section, Decision, FailureModes, Metric } = caseMdxComponents

const data: CaseData = {
  locale: 'es',
  slug: 'caso',
  draft: true,
  title: 'Caso de prueba',
  kind: 'Plataforma de prueba',
  description: 'Descripción.',
  summary: 'Resumen en treinta segundos.',
  existence: 'real',
  projectKind: 'product',
  confidentiality: 'sanitized',
  role: 'Diseñé la arquitectura.',
  team: 'Tres personas.',
  stack: ['Java 21', 'PostgreSQL 16'],
  period: { dateTime: '2026-04', text: 'Abril–septiembre de 2026' },
  readingMinutes: 12,
  updatedAt: { dateTime: '2026-10-07', text: '7 de octubre de 2026' },
  sections: [
    { id: 'decisions', label: 'Decisiones técnicas' },
    { id: 'failure-modes', label: 'Failure modes' },
    { id: 'result', label: 'Resultado' },
  ],
  decisions: {
    sola: {
      id: 'sola',
      title: 'Una decisión sin respuesta de César',
      context: 'El contexto.',
      options: ['Opción A.', 'Opción B.'],
      choice: 'La elección.',
      cost: 'El costo.',
      repeat: null,
      adr: null,
    },
    repetida: {
      id: 'repetida',
      title: 'Una decisión con respuesta',
      context: 'Otro contexto.',
      options: ['A.', 'B.'],
      choice: 'B.',
      cost: 'Costó.',
      repeat: { answer: 'nuanced', reason: 'No exactamente.' },
      adr: null,
    },
  },
  failureModes: [
    {
      id: 'f',
      failure: 'El PDP no responde',
      detection: 'Timeout.',
      impact: 'No se ejecuta.',
      mitigation: 'Se deniega.',
      residual: 'Nada funciona.',
    },
  ],
  metrics: {
    uno: {
      id: 'uno',
      value: '15',
      label: 'servicios',
      kind: 'repository',
      source: 'contado el 5 de octubre de 2026. Cómo.',
    },
    dos: {
      id: 'dos',
      value: '4',
      label: 'librerías',
      kind: 'repository',
      source: 'contado el 5 de octubre de 2026. Cómo.',
    },
  },
  diagrams: {},
  next: null,
}

function renderCase() {
  return renderAtPath(
    '/es/work/caso/',
    <CasePage data={data}>
      <Section id="decisions">
        <Decision id="sola" />
        <Decision id="repetida" />
      </Section>
      <Section id="failure-modes">
        <FailureModes />
      </Section>
      <Section id="result">
        {'\n'}
        <Metric id="uno" />
        {'\n'}
        <Metric id="dos" />
        {'\n'}
      </Section>
    </CasePage>,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('CasePage', () => {
  it('cabecera: un h1, tipo, etiquetas visibles, metadatos en <dl> y "En 30 segundos"', () => {
    renderCase()
    const article = screen.getByRole('article')
    expect(within(article).getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Caso de prueba')
    expect(screen.getByText('Plataforma de prueba')).toBeInTheDocument()
    for (const tag of ['Real', 'Producto', 'Sanitizado']) expect(screen.getByText(tag)).toBeInTheDocument()
    const terms = screen.getAllByRole('term').map((term) => term.textContent)
    expect(terms.slice(0, 5)).toEqual(['Rol', 'Periodo', 'Equipo', 'Stack', 'Lectura'])
    expect(screen.getByText('Abril–septiembre de 2026')).toHaveAttribute('datetime', '2026-04')
    expect(screen.getByText('Java 21, PostgreSQL 16')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'En 30 segundos' })).toHaveTextContent('Resumen en treinta segundos.')
  })

  it('un borrador se marca BORRADOR solo en desarrollo', () => {
    renderCase()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Caso de prueba BORRADOR')
    vi.stubEnv('DEV', false)
    renderCase()
    expect(screen.getAllByRole('heading', { level: 1 }).at(-1)).toHaveTextContent(/^Caso de prueba$/)
  })

  it('cada sección del MDX es un <section> con su h2 y tabIndex para recibir el foco del índice', () => {
    renderCase()
    const section = screen.getByRole('region', { name: 'Decisiones técnicas' })
    expect(section).toHaveAttribute('id', 'decisions')
    expect(section).toHaveAttribute('tabindex', '-1')
    expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent('Decisiones técnicas')
  })

  it('decisión: h3 y lista de definición; "¿Lo repetiría?" solo si hay respuesta', () => {
    renderCase()
    const sola = screen.getByRole('heading', { level: 3, name: 'Una decisión sin respuesta de César' }).parentElement
    if (!sola) throw new Error('falta el bloque')
    expect(
      within(sola)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Contexto', 'Opciones', 'Elección', 'Costo'])
    expect(
      within(sola)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Opción A.', 'Opción B.'])
    const repetida = screen.getByRole('heading', { level: 3, name: 'Una decisión con respuesta' }).parentElement
    if (!repetida) throw new Error('falta el bloque')
    expect(within(repetida).getByText('¿Lo repetiría?').nextElementSibling).toHaveTextContent(
      'Con matices. No exactamente.',
    )
  })

  it('failure modes: tabla con encabezados de columna y de fila, y la versión apilada con los mismos datos', () => {
    renderCase()
    const table = screen.getByRole('table')
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Falla', 'Cómo se detecta', 'Impacto', 'Mitigación implementada', 'Riesgo residual'])
    expect(within(table).getByRole('rowheader')).toHaveTextContent('El PDP no responde')
    const stacked = screen.getByRole('list', { name: /Fallas con mitigación/ })
    expect(within(stacked).getByText('Se deniega.')).toBeInTheDocument()
  })

  it('métricas seguidas forman una fila; cada una con su valor, su clase de fuente y la fuente', () => {
    renderCase()
    const result = screen.getByRole('region', { name: 'Resultado' })
    const row = within(result).getByText('15').closest('div')
    expect(row).toHaveTextContent('15 servicios Del repositorio, contado el 5 de octubre de 2026. Cómo.')
    expect(row).toHaveTextContent('4 librerías')
  })

  it('cierre: sin siguiente caso, lleva al índice de casos y a contacto', () => {
    renderCase()
    const closing = screen.getByRole('navigation', { name: 'Siguiente paso' })
    expect(within(closing).getByRole('link', { name: 'Ver todos los casos' })).toHaveAttribute('href', '/es/work/')
    expect(within(closing).getByRole('link', { name: 'Contactar' })).toHaveAttribute('href', '/es/contact/')
  })

  it('un MDX que pide un dato que no está en meta.ts falla en voz alta (llega al error boundary)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    renderAtPath(
      '/es/work/caso/',
      <CasePage data={data}>
        <Decision id="no-existe" />
      </CasePage>,
    )
    expect((await screen.findAllByText(/la decisión "no-existe"/)).length).toBeGreaterThan(0)
    vi.restoreAllMocks()
  })
})
