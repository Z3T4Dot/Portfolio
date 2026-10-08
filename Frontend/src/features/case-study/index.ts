// Blueprint 04 §Estructura de carpetas (features/case-study: layout de caso, índice de secciones,
// decisiones, failure modes) y 06. API pública de la feature para el componente de la ruta. El loader
// importa ./data directamente: así el índice completo de contenido (con los `draft`) nunca entra en el
// grafo del cliente.
export { CasePage } from './CasePage'
export { caseMdxComponents } from './mdx'
export type { CaseData } from './data'
