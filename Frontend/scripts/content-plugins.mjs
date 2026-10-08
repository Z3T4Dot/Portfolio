// Blueprint 04 §Contenido y §Flujo de datos (4: la prosa MDX se carga solo en el idioma pedido,
// diferida), 05 §Prosa en MDX ("No se permiten `import` dentro del MDX: lo verifica un plugin de
// remark en build"; sin HTML crudo; solo los componentes de la lista) y 05 verificación 10 (ningún
// draft es alcanzable en producción). Cableado de MDX del spike D4: @mdx-js/rollup antes del plugin
// de React Router.
//
// - remarkMdxGuard: un MDX que no cumple 05 no compila, ni en dev ni en el build.
// - virtual:case-prose: un import diferido por caso e idioma. En el build, solo de casos publicados
//   (un glob sobre todos metería en el build un chunk por cada MDX, también los de borradores); en
//   `npm run dev`, de todos (la ruta decide qué se ve con SHOW_DRAFTS). El postbuild verifica el
//   resultado (findDraftLeaks).
//
// La lista de casos y de componentes sale de src/ con `runnerImport` (como el postbuild), así
// vite.config.ts no importa TypeScript. JS para Node, sin @types/node; tipos en content-plugins.d.mts.
import mdx from '@mdx-js/rollup'
import path from 'node:path'
import { runnerImport } from 'vite'

export const CASE_PROSE_ID = 'virtual:case-prose'
const RESOLVED_ID = `\0${CASE_PROSE_ID}`

/** Carpeta de los casos, relativa a la raíz de Vite (05: content/projects/<slug>/<idioma>.mdx). */
export const CASE_PROSE_DIR = '/src/content/projects'

const COMMENT = /^\s*\/\*[\s\S]*\*\/\s*$/

const at = (node) => (node.position ? `línea ${String(node.position.start.line)}` : 'posición desconocida')

/** Problemas de un árbol mdast + MDX (mdast-util-mdx); vacío si cumple 05 §Prosa en MDX. */
export function findMdxViolations(tree, components) {
  const allowed = new Set(components)
  const problems = []
  const visit = (node) => {
    switch (node.type) {
      case 'mdxjsEsm':
        problems.push(`${at(node)}: import/export no permitido; el MDX recibe sus componentes en el render`)
        break
      case 'html':
        problems.push(`${at(node)}: HTML crudo no permitido`)
        break
      case 'mdxFlowExpression':
      case 'mdxTextExpression':
        if (!COMMENT.test(node.value ?? '')) problems.push(`${at(node)}: expresión no permitida (solo comentarios)`)
        break
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement': {
        const name = node.name ?? ''
        if (!name) problems.push(`${at(node)}: fragmento JSX no permitido`)
        else if (/^[a-z]/.test(name)) problems.push(`${at(node)}: HTML crudo no permitido (<${name}>)`)
        else if (!allowed.has(name)) problems.push(`${at(node)}: componente no permitido (<${name}>)`)
        for (const attribute of node.attributes ?? []) {
          if (attribute.type !== 'mdxJsxAttribute') {
            problems.push(`${at(node)}: atributo con spread no permitido en <${name}>`)
          } else if (attribute.value !== null && attribute.value !== undefined && typeof attribute.value !== 'string') {
            problems.push(`${at(node)}: <${name} ${attribute.name}> debe ser un texto, no una expresión`)
          }
        }
        break
      }
      default:
        break
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(tree)
  return problems
}

/** Plugin de remark: falla la compilación del archivo con todos sus problemas. */
export function remarkMdxGuard(options) {
  return (tree, file) => {
    const problems = findMdxViolations(tree, options.components)
    if (problems.length > 0) {
      throw new Error(`${file.path ?? 'MDX'} no cumple 05 §Prosa en MDX:\n  ${problems.join('\n  ')}`)
    }
  }
}

/**
 * Código de `virtual:case-prose`: `caseProse["<slug>/<idioma>"] = () => import(…)`. Un patrón de glob
 * explícito por caso visible; un idioma que todavía no existe (el `en.mdx` de un draft) simplemente no
 * aparece.
 */
export function caseProseModule(entries, { includeDrafts }) {
  const slugs = entries.filter((entry) => includeDrafts || entry.publication === 'published').map((entry) => entry.slug)
  if (slugs.length === 0) return 'export const caseProse = {}\n'
  const patterns = slugs.map((slug) => `${CASE_PROSE_DIR}/${slug}/*.mdx`)
  return [
    `const files = import.meta.glob(${JSON.stringify(patterns)})`,
    'export const caseProse = Object.fromEntries(',
    '  Object.entries(files).map(([file, load]) => [file.slice(' +
      String(CASE_PROSE_DIR.length + 1) +
      ', -".mdx".length), load]),',
    ')',
    '',
  ].join('\n')
}

/** Los plugins de contenido, en el orden que necesita vite.config.ts (antes de reactRouter()). */
export function contentPlugins() {
  // Se completan en configResolved, antes de compilar el primer MDX.
  const guard = { components: [] }
  let entries = []
  let includeDrafts = false

  const loader = {
    name: 'portfolio:content',
    async configResolved(config) {
      // Solo el servidor de desarrollo incluye borradores; cualquier build, nunca.
      includeDrafts = config.command === 'serve'
      const { module: content } = await runnerImport(path.join(config.root, 'scripts', 'lib', 'content-api.ts'))
      guard.components.splice(0, guard.components.length, ...content.MDX_COMPONENTS)
      entries = content.allProjects.map((entry) => ({ slug: entry.slug, publication: entry.publication }))
    },
    resolveId(id) {
      return id === CASE_PROSE_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      return id === RESOLVED_ID ? caseProseModule(entries, { includeDrafts }) : undefined
    },
  }

  // @mdx-js/rollup quita la query del id, así que compilaría también `?raw` (el texto que usa el
  // tiempo de lectura), que ya llega como JS. Esas importaciones no son MDX; las de HMR (`?t=`) sí.
  const compiler = mdx({ remarkPlugins: [[remarkMdxGuard, guard]] })
  const mdxPlugin = {
    ...compiler,
    enforce: 'pre',
    transform(code, id) {
      return isAssetQuery(id) ? undefined : compiler.transform.call(this, code, id)
    },
  }

  return [mdxPlugin, loader]
}

/** `?raw`, `?url` o `?inline`: el módulo es el texto o la URL del archivo, no el MDX compilado. */
export function isAssetQuery(id) {
  return /[?&](?:raw|url|inline)(?:&|=|$)/.test(id)
}
