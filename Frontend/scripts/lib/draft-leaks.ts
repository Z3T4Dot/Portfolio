// Blueprint 05 §Verificación de integridad, punto 10: "un test sobre el build de producción falla si
// aparece la ruta, la entrada del sitemap o un enlace hacia un draft". Esconderlo en la interfaz no
// cuenta. El postbuild lo ejecuta sobre build/client y el build falla si encuentra algo.
import { attrs, elements, parseHtml } from './html'

export interface DraftEntity {
  /** Para el mensaje: "case quantum". */
  label: string
  /** Rutas canónicas que tendría en cada idioma ("/es/work/quantum/"). */
  paths: readonly string[]
  /** Textos propios del draft (títulos por idioma): no pueden viajar en el HTML, los datos ni el JS. */
  markers: readonly string[]
}

export interface BuiltSite {
  /** Todos los archivos de build/client, relativos y con "/" (`es/work/index.html`). */
  files: readonly string[]
  /** Contenido de los archivos de texto (html, data, js, css, xml, txt), por la misma ruta. */
  texts: ReadonlyMap<string, string>
}

const LINK_ATTRS = ['href', 'src', 'action', 'content']

/** Problemas encontrados; vacío si ningún draft es alcanzable. */
export function findDraftLeaks(drafts: readonly DraftEntity[], site: BuiltSite): string[] {
  const problems: string[] = []
  const sitemap = site.texts.get('sitemap.xml') ?? ''
  const sitemapPaths = [...sitemap.matchAll(/<(?:loc)>([^<]+)<\/loc>|href="([^"]+)"/g)].map((match) =>
    pathnameOf(match[1] ?? match[2] ?? ''),
  )
  const htmlLinks = [...site.texts].flatMap(([file, text]) =>
    file.endsWith('.html') ? linksIn(text).map((link) => ({ file, path: pathnameOf(link) })) : [],
  )

  for (const draft of drafts) {
    for (const path of draft.paths) {
      const dir = path.replace(/^\//, '')
      const generated = site.files.filter((file) => file.startsWith(dir))
      if (generated.length > 0) problems.push(`${draft.label}: el build generó su ruta (${generated.join(', ')})`)
      if (sitemapPaths.includes(path)) problems.push(`${draft.label}: aparece en sitemap.xml (${path})`)
      for (const link of htmlLinks.filter((candidate) => candidate.path === path)) {
        problems.push(`${draft.label}: ${link.file} enlaza a ${path}`)
      }
    }
    for (const [file, text] of site.texts) {
      if (file === 'sitemap.xml') continue
      const mentioned = [...draft.paths, ...draft.markers].filter((needle) => needle && text.includes(needle))
      if (mentioned.length > 0)
        problems.push(`${draft.label}: ${file} contiene ${mentioned.map((m) => `"${m}"`).join(', ')}`)
    }
  }
  return [...new Set(problems)]
}

function linksIn(html: string): string[] {
  const found: string[] = []
  for (const element of elements(parseHtml(html))) {
    const attributes = attrs(element)
    for (const name of LINK_ATTRS) {
      const value = attributes.get(name)
      if (value?.includes('/')) found.push(value)
    }
  }
  return found
}

/** Ruta de una URL absoluta o relativa al origen, con barra final ("/es/work/x/"). */
function pathnameOf(value: string): string {
  let pathname: string
  try {
    pathname = new URL(value, 'http://origin.invalid').pathname
  } catch {
    return value
  }
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}
