// Blueprint 13 §Pipeline (postbuild: sitemap → 404 por idioma → hashes CSP → _headers), 12 §sitemap.xml
// y §robots.txt, 11 §8, 05 verificación 10 y 16 §Contenido ("Sin PENDIENTE visible"). Adaptado de
// spikes/d4-prerender/scripts/postbuild.mjs.
//   1. Mueve las 404 prerenderizadas a 404.html (Pages sirve la más cercana con status 404).
//   2. Elimina __spa-fallback.html: todas las rutas están prerenderizadas.
//   3. Calcula el sha256 de cada <script> inline ejecutable de cada HTML (con parser, no regex).
//   4. Escribe _headers: cabeceras de seguridad y noindex en /*, CSP por ruta con `! Content-Security-Policy`.
//   5. Escribe sitemap.xml (desde la misma tabla que el prerender) y robots.txt.
//   6. Verifica que ningún draft sea alcanzable (ruta, sitemap, enlace o texto). Si lo es, falla.
//   7. Verifica que ninguna marca de desarrollo (BORRADOR, PENDIENTE) llegue al build y, en un build
//      de lanzamiento (INDEXABLE o LAUNCH=true), que no quede contacto pendiente. Si no, falla.
//   8. Escribe build/reports/csp.json con el inventario de scripts inline.
// La lógica vive en scripts/lib/*.ts (con tests); aquí solo hay lectura y escritura de archivos.
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'build', 'client')
const reports = path.join(root, 'build', 'reports')

const { module: api } = await runnerImport(path.join(root, 'scripts', 'lib', 'build-api.ts'))
const SITE_URL = api.parseSiteUrl(process.env.VITE_SITE_URL, 'http://localhost:8788')
const HTTPS = SITE_URL.startsWith('https://')

const fail = (problems) => {
  for (const problem of problems) console.error(`postbuild: ${problem}`)
  process.exit(1)
}

// 1. 404 por idioma --------------------------------------------------------------------------------
for (const p of api.NOT_FOUND_PATHS) {
  const dir = path.join(out, ...p.split('/').filter(Boolean))
  const target = path.join(path.dirname(dir), '404.html')
  const source = path.join(dir, 'index.html')
  if (!existsSync(source)) {
    if (existsSync(target)) continue // el postbuild ya corrió sobre este build
    fail([`falta ${path.relative(out, source)}`])
  }
  await rename(source, target)
  await rm(dir, { recursive: true, force: true })
}

// 2. Sin SPA fallback --------------------------------------------------------------------------------
await rm(path.join(out, '__spa-fallback.html'), { force: true })

// 3. Inventario y hashes de scripts inline -----------------------------------------------------------
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

const TEXT = /\.(html|data|js|css|xml|txt|json|svg)$/
const files = []
const texts = new Map()
for await (const file of walk(out)) {
  const rel = path.relative(out, file).split(path.sep).join('/')
  if (rel === '_headers') continue
  files.push(rel)
  if (TEXT.test(rel)) texts.set(rel, await readFile(file, 'utf8'))
}
files.sort()

/** URL de la regla de _headers; `null` en las 404, que se sirven en cualquier URL inexistente. */
const urlFor = (rel) => (rel.endsWith('404.html') ? null : `/${rel.replace(/index\.html$/, '')}`)

const pages = []
for (const rel of files.filter((file) => file.endsWith('.html'))) {
  const scripts = await api.inlineScripts(texts.get(rel))
  pages.push({ file: rel, url: urlFor(rel), scripts, hashes: api.executableHashes(scripts) })
}

// 4. _headers ------------------------------------------------------------------------------------------
const headers = api.renderHeaders({ pages, https: HTTPS, indexable: api.INDEXABLE })
const headerProblems = api.headerLimitProblems(headers)
if (headerProblems.length > 0) fail(headerProblems)
await writeFile(path.join(out, '_headers'), headers.text)

// 5. sitemap.xml y robots.txt ----------------------------------------------------------------------
const entries = api.sitemapEntries(api.sitePages(), SITE_URL)
const missing = entries
  .map((entry) => entry.loc.slice(SITE_URL.length))
  .filter((loc) => !files.includes(`${loc.replace(/^\//, '')}index.html`))
if (missing.length > 0) fail(missing.map((loc) => `sitemap: ${loc} no tiene HTML generado`))
const sitemap = api.renderSitemap(entries)
await writeFile(path.join(out, 'sitemap.xml'), sitemap)
await writeFile(path.join(out, 'robots.txt'), api.renderRobots(SITE_URL))
texts.set('sitemap.xml', sitemap)
files.push('sitemap.xml', 'robots.txt')

// 6. Ningún draft alcanzable (05, verificación 10) --------------------------------------------------
const drafts = api.draftEntities()
const leaks = api.findDraftLeaks(drafts, { files, texts })
if (leaks.length > 0) fail(leaks)

// 7. Sin marcas de desarrollo; contacto completo al lanzar (16, scripts/lib/launch.ts) -----------------
// Lanzamiento = INDEXABLE (src/seo/indexing.ts, F10) o el ensayo explícito `LAUNCH=true npm run build`.
const launch = api.isLaunchBuild(api.INDEXABLE, process.env)
const contentProblems = [...api.devMarkerLeaks(texts), ...api.launchProblems(api.contact, files, launch)]
if (contentProblems.length > 0) fail(contentProblems)

// 8. Reporte -----------------------------------------------------------------------------------------
await mkdir(reports, { recursive: true })
const report = {
  siteUrl: SITE_URL,
  indexable: api.INDEXABLE,
  launch,
  rules: headers.rules,
  longestHeaderLine: headers.longestLine,
  draftsChecked: drafts.map((draft) => draft.label),
  pages: pages.map((page) => ({
    file: page.file,
    url: page.url,
    inlineExecutable: page.scripts.filter((script) => script.executable).length,
    inlineData: page.scripts.filter((script) => !script.executable).length,
    scripts: page.scripts,
  })),
}
await writeFile(path.join(reports, 'csp.json'), JSON.stringify(report, null, 2))

console.log(
  `postbuild: ${String(pages.length)} HTML, ${String(headers.rules)} reglas en _headers (línea más larga: ${String(headers.longestLine)}), ` +
    `${String(entries.length)} URL en el sitemap, ${String(drafts.length)} draft(s) verificados, origen ${SITE_URL}` +
    (launch ? ', build de lanzamiento' : ''),
)
