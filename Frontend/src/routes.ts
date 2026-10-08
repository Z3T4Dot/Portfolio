// Blueprint 02 §Sitemap V1 y 04 §Estructura de carpetas (routes.ts: tabla de rutas con prefijo /:lang).
// Los segmentos salen de i18n/paths.ts, la misma fuente que los enlaces y el prerender.
import { type RouteConfig, index, route } from '@react-router/dev/routes'
import { projects } from './content/projects'
import { SHOW_DRAFTS } from './env'
import { DETAIL_SEGMENTS, PAGE_SEGMENTS } from './i18n/paths'

const page = PAGE_SEGMENTS

export default [
  // "/": página mínima bilingüe que redirige por preferencia (12).
  index('routes/root-index.tsx'),
  route(':lang', 'routes/lang-layout.tsx', [
    index('routes/home.tsx'),
    route(page.work, 'routes/work.tsx'),
    // Con ssr:false, React Router rechaza el build si una ruta con `loader` no tiene ningún path
    // prerenderizado. Mientras no haya casos `published` (todos pueden ser draft, 05), la ruta de
    // detalle no se registra en el build: /:lang/work/<slug>/ cae en la 404, que es lo correcto. En la
    // vista previa de desarrollo (SHOW_DRAFTS, siempre `false` en un build) sí, para revisar los draft.
    ...(projects.length > 0 || SHOW_DRAFTS ? [route(`${DETAIL_SEGMENTS.case}/:slug`, 'routes/case.tsx')] : []),
    route(page.securityHub, 'routes/security.tsx'),
    route(page.securityLab, 'routes/security-lab.tsx'),
    route(page.judgment, 'routes/judgment.tsx'),
    route(page.cyberOpsHub, 'routes/cyber-ops.tsx'),
    route(page.cyberOpsFirewall, 'routes/cyber-ops-firewall.tsx'),
    route(page.cyberOpsDetection, 'routes/cyber-ops-detection.tsx'),
    route(page.cyberOpsRecovery, 'routes/cyber-ops-recovery.tsx'),
    route(page.cyberOpsEnding, 'routes/cyber-ops-ending.tsx'),
    route(page.about, 'routes/about.tsx'),
    route(page.contact, 'routes/contact.tsx'),
    route(page.architecture, 'routes/architecture.tsx'),
    // Pendientes de su índice de contenido (05): judgment/:slug (F8) y architecture/decisions/:id (F8).
  ]),
  // Catch-all: se prerenderiza en /404/, /es/404/ y /en/404/ y el postbuild lo mueve a 404.html.
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
