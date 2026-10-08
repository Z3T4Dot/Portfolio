// Blueprint 03 §Componentes visuales (Metric: número + etiqueta + fuente obligatoria; "si aparece un
// número, es real o dice 'simulado'"), 05 (Metric sin `source` no compila) y 06 §Resultado sin métricas
// inventadas (fuente visible). La clase de la fuente siempre se ve como texto, nunca solo como color.
// En línea (<span>) para que varias métricas seguidas compartan una fila dentro de un párrafo del MDX.
import styles from './Metric.module.css'

/** Igual que MetricSource['type'] de content/schema.ts; components/ no importa content (04). */
export type MetricKind = 'measured' | 'repository' | 'simulated'

interface MetricProps {
  value: string
  label: string
  kind: MetricKind
  /** Nombre visible de la clase ("Del repositorio", "Simulado"). */
  kindLabel: string
  /** Fuente en una frase: fecha, herramienta o método, y cómo se obtuvo. */
  source: string
}

export function Metric({ value, label, kind, kindLabel, source }: MetricProps) {
  return (
    <span className={styles.metric} data-kind={kind}>
      <span className={styles.value}>{value}</span> <span className={styles.label}>{label}</span>{' '}
      <span className={styles.source}>
        <span className={styles.kind}>{kindLabel}</span>, {source}
      </span>
    </span>
  )
}
