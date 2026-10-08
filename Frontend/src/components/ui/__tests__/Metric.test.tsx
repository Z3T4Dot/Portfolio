// Blueprint 11 §3 (Metric: muestra valor + fuente + clase; con source.type 'simulated' muestra la
// etiqueta) y 03 (si aparece un número, es real o dice "simulado"; el color nunca es la única señal).
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Metric } from '../Metric'

describe('Metric', () => {
  it('muestra el valor, la etiqueta, la clase de la fuente como texto y la fuente', () => {
    const { container } = render(
      <Metric
        value="15"
        label="servicios desplegables"
        kind="repository"
        kindLabel="Del repositorio"
        source="contado el 5 de octubre de 2026."
      />,
    )
    expect(container).toHaveTextContent('15 servicios desplegables Del repositorio, contado el 5 de octubre de 2026.')
    expect(screen.getByText('Del repositorio')).toBeVisible()
  })

  it('un dato simulado lo dice', () => {
    const { container } = render(
      <Metric
        value="42"
        label="intentos"
        kind="simulated"
        kindLabel="Simulado"
        source="Valor del juego, no del sistema."
      />,
    )
    expect(screen.getByText('Simulado')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute('data-kind', 'simulated')
  })
})
