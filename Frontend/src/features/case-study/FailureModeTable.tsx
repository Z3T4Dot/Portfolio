// Blueprint 06 §Formato de failure modes (falla, cómo se detecta, impacto, mitigación implementada,
// riesgo residual), 03 §Componentes visuales (FailureModeTable: en móvil se apila por fila) y §Responsive
// (tablas apiladas como listas de definición; sin scroll horizontal), 12 §HTML semántico (<table> con
// <th scope> para datos tabulares reales). Las dos formas salen de los mismos datos; CSS muestra una.
import { useLocale } from '../../i18n'
import type { FailureModeView } from './data'
import styles from './FailureModeTable.module.css'

const COLUMNS = ['detection', 'impact', 'mitigation', 'residual'] as const

export function FailureModeTable({ rows }: { rows: readonly FailureModeView[] }) {
  const { t } = useLocale()
  const header = (column: (typeof COLUMNS)[number]) => t(`caseStudy.failureModes.${column}`)
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">{t('caseStudy.failureModes.caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('caseStudy.failureModes.failure')}</th>
            {COLUMNS.map((column) => (
              <th key={column} scope="col">
                {header(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.failure}</th>
              {COLUMNS.map((column) => (
                <td key={column}>{row[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={styles.stack} aria-label={t('caseStudy.failureModes.caption')}>
        {rows.map((row) => (
          <li key={row.id} className={styles.item}>
            <p className={styles.failure}>{row.failure}</p>
            <dl className={styles.fields}>
              {COLUMNS.map((column) => (
                <div key={column} className={styles.field}>
                  <dt>{header(column)}</dt>
                  <dd>{row[column]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
