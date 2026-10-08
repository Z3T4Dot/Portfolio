// Blueprint 05 §Estructura (content/site.ts: nombre, posicionamiento, enlaces, contacto), 12 §Patrones
// de título, 01 §Perfil profesional (rol y posicionamiento) y 02 §Contact.
import type { ContactMeta, SiteMeta } from './schema'

// Tarea C4 (15): nada de esto existe todavía. Cada valor `pending` se ve como aviso solo en
// desarrollo, no se renderiza en producción y hace fallar el build de lanzamiento
// (`LAUNCH=true npm run build`, o INDEXABLE en seo/indexing.ts; ver scripts/lib/launch.ts).
// Anotado con el tipo (no `satisfies`) para que cada campo siga siendo "real o pendiente".
const contact: ContactMeta = {
  email: { pending: 'correo de contacto (C4)' },
  linkedin: { pending: 'URL del perfil de LinkedIn (C4)' },
  // El usuario de GitHub no está confirmado como enlace público: se trata como pendiente.
  github: { pending: 'URL del perfil de GitHub, confirmada como pública (C4)' },
  cv: {
    es: { pending: 'CV en PDF en español, en public/cv/ (C4)' },
    en: { pending: 'CV en PDF en inglés, en public/cv/ (C4)' },
  },
  location: { pending: 'ubicación (C4)' },
  timezone: { pending: 'zona horaria (C4)' },
  availability: { pending: 'disponibilidad (02: confirmar con César)' },
  roleSought: { pending: 'tipo de rol que busca (02: confirmar con César)' },
}

export const site = {
  name: 'Cesar Acosta',
  givenName: 'Cesar',
  familyName: 'Acosta',
  // Decidido por César el 2026-10-07 (01): nunca "ingeniero" en español.
  role: { es: 'Desarrollador de software', en: 'Software engineer' },
  // Borrador de 01 adaptado al rol decidido; lo aprueba César (C5).
  positioning: {
    es: 'Construyo sistemas empresariales y me ocupo de cómo se protegen y de cómo fallan.',
    en: 'I build business systems and care about how they are secured and how they fail.',
  },
  contact,
} satisfies SiteMeta
