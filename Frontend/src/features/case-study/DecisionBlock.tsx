// Blueprint 06 §Formato de una decisión (contexto, opciones, elección, costo, ¿lo repetiría?, ADR) y 03
// §Componentes visuales (DecisionBlock: sin caja; título h3 y lista de definición). "¿Lo repetiría?"
// solo aparece si César respondió: sin material validado el bloque queda más corto.
import type { ReactNode } from 'react'
import { useLocale } from '../../i18n'
import type { DecisionView } from './data'
import styles from './DecisionBlock.module.css'

export function DecisionBlock({ decision, children }: { decision: DecisionView; children?: ReactNode }) {
  const { t } = useLocale()
  return (
    <div className={styles.decision} id={`decision-${decision.id}`}>
      <h3 className={styles.title}>{decision.title}</h3>
      <dl className={styles.fields}>
        <div className={styles.field}>
          <dt>{t('caseStudy.decision.context')}</dt>
          <dd>{decision.context}</dd>
        </div>
        <div className={styles.field}>
          <dt>{t('caseStudy.decision.options')}</dt>
          <dd>
            <ul className={styles.options}>
              {decision.options.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div className={styles.field}>
          <dt>{t('caseStudy.decision.choice')}</dt>
          <dd>{decision.choice}</dd>
        </div>
        <div className={styles.field}>
          <dt>{t('caseStudy.decision.cost')}</dt>
          <dd>{decision.cost}</dd>
        </div>
        {decision.repeat ? (
          <div className={styles.field}>
            <dt>{t('caseStudy.decision.repeat')}</dt>
            <dd>
              <strong>{t(`caseStudy.repeat.${decision.repeat.answer}`)}.</strong> {decision.repeat.reason}
            </dd>
          </div>
        ) : null}
        {decision.adr ? (
          <div className={styles.field}>
            <dt>{t('caseStudy.decision.adr')}</dt>
            <dd>{decision.adr}</dd>
          </div>
        ) : null}
      </dl>
      {children}
    </div>
  )
}
