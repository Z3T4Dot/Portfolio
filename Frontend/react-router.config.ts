// Blueprint 12 §D4 (adoptado) y docs/spikes/d4-prerender.md, consecuencias 1–4: modo framework con
// prerender en build, sin runtime de servidor, y la app en src/. 05 (un draft se desarrolla y se
// prueba): la vista previa de `npm run dev` agrega las páginas de los casos draft.
import type { Config } from '@react-router/dev/config'
import { allProjects } from './src/content/projects'
import { SHOW_DRAFTS } from './src/env'
import { draftPreviewPaths, prerenderPaths } from './src/seo/site-pages'

export default {
  appDirectory: 'src',
  ssr: false,
  prerender({ getStaticPaths }) {
    const table = prerenderPaths()
    // getStaticPaths() de 8.4.0 también devuelve hijas estáticas de un padre dinámico
    // ("/:lang/work"), que fallan con 404 en el prerender: se filtran (sorpresa 3 del spike).
    const unknown = getStaticPaths()
      .filter((path) => !/[:*]/.test(path))
      .map((path) => (path.endsWith('/') ? path : `${path}/`))
      .filter((path) => !table.includes(path))
    // El sitemap sale de la misma tabla (12): una página que se prerenderiza sin estar en ella
    // quedaría fuera del sitemap. Mejor que el build falle.
    if (unknown.length > 0) {
      throw new Error(`Rutas estáticas fuera de src/seo/site-pages.ts: ${unknown.join(', ')}`)
    }
    // Con ssr:false, React Router valida también en dev que la ruta de un caso (con loader) tenga
    // paths. SHOW_DRAFTS es `false` en cualquier build, así que los draft nunca se prerenderizan.
    return SHOW_DRAFTS ? [...table, ...draftPreviewPaths(allProjects)] : table
  },
} satisfies Config
