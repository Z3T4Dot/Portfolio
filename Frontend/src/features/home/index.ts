// Blueprint 04 §Estructura de carpetas (features/home) y 02 §Home. API pública de la feature para el
// componente de la ruta. El loader importa ./data directamente: así el índice completo de contenido
// (con los `draft`) nunca entra en el grafo del cliente.
export { HomePage } from './HomePage'
export type { HomeData } from './data'
