// Blueprint 04 §Estructura de carpetas y 02 §Work. API pública de la feature para el componente de la
// ruta. El loader importa ./data directamente: así el índice completo de contenido (con los `draft`)
// nunca entra en el grafo del cliente.
export { WorkPage } from './WorkPage'
export type { WorkData } from './data'
