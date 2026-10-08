// Blueprint 04 §Estructura de carpetas (features/about: pilares, timeline) y 02 §About. API pública
// para el componente de la ruta. El loader importa ./data directamente: el contenido completo (con los
// `draft`) nunca entra en el grafo del cliente.
export { AboutPage } from './AboutPage'
export type { AboutData } from './data'
