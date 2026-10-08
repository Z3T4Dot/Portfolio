// Blueprint 11 §7 (presupuesto de bundle: lo que cada página pide, según su HTML) y ADR-0013
// (Home: código propio ≤ 15 KiB brotli-11; JS total ≤ 115 KiB brotli-11); 04 §Presupuestos (JS por ruta
// adicional ≤ 60 KB gzip). Adaptado de spikes/d4-prerender/scripts/measure.mjs. Solo informa: no hace
// fallar nada.
//
// Método:
//   - JS inicial de una página = cada <script src> y <link rel="modulepreload"> de su HTML, más el
//     cierre de imports estáticos de esos chunks. Los scripts inline se informan aparte.
//   - Compresión: gzip nivel 9 y brotli calidad 11 (zlib de Node) sobre cada archivo completo.
//   - Propio frente a framework: build/reports/modules.json (plugin scripts/bundle-report.mjs) da,
//     por chunk, los bytes renderizados de módulos de src/ y de node_modules. Un chunk mixto se
//     reparte en proporción a esos bytes. El manifest de rutas de React Router (manifest-*.js) se
//     cuenta como propio: describe las rutas de la app.
//   - Página de un caso (/:lang/work/<slug>/): además del total, el JS que pide de más respecto de Home
//     ("adicional") y la prosa MDX diferida del idioma, que se pide después de cargar (no va en el HTML).
// Uso: npm run build && npm run measure → imprime el resumen y escribe build/reports/measure.json.
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { parse } from 'parse5'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'build', 'client')
const reports = path.join(root, 'build', 'reports')
const modulesFile = path.join(reports, 'modules.json')
if (!existsSync(modulesFile)) throw new Error('Falta build/reports/modules.json: corre `npm run build` antes.')
const { chunks } = JSON.parse(await readFile(modulesFile, 'utf8'))

const gz = (buf) => gzipSync(buf, { level: 9 }).length
const br = (buf) => brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
const KIB = 1024
const kib = (bytes) => `${(bytes / KIB).toFixed(2)} KiB`

function* elements(node) {
  if (node.tagName) yield node
  for (const child of node.childNodes ?? []) yield* elements(child)
}
const attrsOf = (el) => Object.fromEntries(el.attrs.map((a) => [a.name, a.value]))

const cache = new Map()
async function asset(urlPath) {
  if (!cache.has(urlPath)) cache.set(urlPath, await readFile(path.join(out, ...urlPath.split('/').filter(Boolean))))
  return cache.get(urlPath)
}

// imports estáticos de un chunk ESM: import"./x.js" / from"./x.js"
async function staticClosure(start) {
  const seen = new Set()
  const queue = [...start]
  while (queue.length) {
    const url = queue.shift()
    if (seen.has(url)) continue
    seen.add(url)
    const code = (await asset(url)).toString('utf8')
    for (const match of code.matchAll(/(?:^|[;\s}])import\s*(?:[\w${}*,\s]+from\s*)?["'](\.\/[^"']+\.js)["']/g)) {
      queue.push(path.posix.join(path.posix.dirname(url), match[1]))
    }
  }
  return [...seen]
}

function ownShare(url) {
  const fileName = url.replace(/^\//, '')
  if (/^assets\/manifest-[\w-]+\.js$/.test(fileName)) return 1
  const info = chunks[fileName]
  if (!info) throw new Error(`modules.json no conoce ${fileName}: ¿el build y el reporte son del mismo build?`)
  const total = info.ownRendered + info.frameworkRendered
  return total === 0 ? 0 : info.ownRendered / total
}

async function measurePage(file) {
  const doc = parse(await readFile(path.join(out, file), 'utf8'))
  const js = new Set()
  let inline = 0
  for (const el of elements(doc)) {
    const a = attrsOf(el)
    if (el.tagName === 'script' && a.src) js.add(a.src)
    else if (el.tagName === 'script' && a.type !== 'application/ld+json') inline++
    if (el.tagName === 'link' && a.rel === 'modulepreload') js.add(a.href)
  }
  const files = await staticClosure([...js])
  const rows = []
  for (const url of files.sort()) {
    const buf = await asset(url)
    const share = ownShare(url)
    rows.push({ url, raw: buf.length, gzip: gz(buf), brotli: br(buf), ownShare: Number(share.toFixed(4)) })
  }
  const sum = (key, weight = () => 1) => Math.round(rows.reduce((n, row) => n + row[key] * weight(row), 0))
  const own = (row) => row.ownShare
  const framework = (row) => 1 - row.ownShare
  return {
    page: file,
    files: rows.length,
    notPreloaded: files.filter((url) => !js.has(url)),
    inlineScripts: inline,
    total: { raw: sum('raw'), gzip: sum('gzip'), brotli: sum('brotli') },
    own: { raw: sum('raw', own), gzip: sum('gzip', own), brotli: sum('brotli', own) },
    framework: { raw: sum('raw', framework), gzip: sum('gzip', framework), brotli: sum('brotli', framework) },
    mixedChunks: rows
      .filter((row) => row.ownShare > 0 && row.ownShare < 1)
      .map((row) => `${row.url} (${(row.ownShare * 100).toFixed(1)} % propio)`),
    chunks: rows,
  }
}

const BUDGET = { ownBrotli: 15 * KIB, totalBrotli: 115 * KIB, routeExtraGzip: 60 * 1000 } // ADR-0013 y 04
const pages = [await measurePage('es/index.html'), await measurePage('en/index.html')]
// Páginas de casos: lo que piden además de Home y su prosa diferida (chunk con su MDX).
const homeFiles = new Set(pages[0].chunks.map((row) => row.url))
const casePages = []
for (const locale of ['es', 'en']) {
  const dir = path.join(out, locale, 'work')
  if (!existsSync(dir)) continue
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !existsSync(path.join(dir, entry.name, 'index.html'))) continue
    const page = await measurePage(`${locale}/work/${entry.name}/index.html`)
    const extra = page.chunks.filter((row) => !homeFiles.has(row.url))
    const proseModule = `src/content/projects/${entry.name}/${locale}.mdx`
    const prose = Object.entries(chunks)
      .filter(([, info]) => (info.ownModules ?? []).includes(proseModule))
      .map(([fileName]) => `/${fileName}`)
    const proseRows = []
    for (const url of prose) {
      const buf = await asset(url)
      proseRows.push({ url, raw: buf.length, gzip: gz(buf), brotli: br(buf) })
    }
    const total = (rows, key) => rows.reduce((n, row) => n + row[key], 0)
    casePages.push({
      ...page,
      extra: { files: extra.map((row) => row.url), gzip: total(extra, 'gzip'), brotli: total(extra, 'brotli') },
      deferredProse: {
        files: proseRows.map((row) => row.url),
        gzip: total(proseRows, 'gzip'),
        brotli: total(proseRows, 'brotli'),
      },
    })
  }
}

const report = {
  date: new Date().toISOString(),
  method:
    'gzip-9 y brotli-11 (zlib de Node) por archivo; propio/framework en proporción a los bytes renderizados por módulo (modules.json)',
  budget: BUDGET,
  pages,
  casePages,
}
await mkdir(reports, { recursive: true })
await writeFile(path.join(reports, 'measure.json'), JSON.stringify(report, null, 2))

for (const page of pages) {
  const ok = (value, limit) => (value <= limit ? 'dentro' : 'FUERA')
  console.log(`Home ${page.page}: ${page.files} archivos JS, ${page.inlineScripts} scripts inline`)
  console.log(
    `  total      ${kib(page.total.raw).padStart(11)} sin comprimir · ${kib(page.total.gzip).padStart(10)} gzip-9 · ${kib(page.total.brotli).padStart(10)} brotli-11 (${ok(page.total.brotli, BUDGET.totalBrotli)} de 115 KiB)`,
  )
  console.log(
    `  propio     ${kib(page.own.raw).padStart(11)} sin comprimir · ${kib(page.own.gzip).padStart(10)} gzip-9 · ${kib(page.own.brotli).padStart(10)} brotli-11 (${ok(page.own.brotli, BUDGET.ownBrotli)} de 15 KiB)`,
  )
  console.log(
    `  framework  ${kib(page.framework.raw).padStart(11)} sin comprimir · ${kib(page.framework.gzip).padStart(10)} gzip-9 · ${kib(page.framework.brotli).padStart(10)} brotli-11`,
  )
  if (page.mixedChunks.length) console.log(`  chunks mixtos: ${page.mixedChunks.join(', ')}`)
  if (page.notPreloaded.length) console.log(`  JS no listado en modulepreload: ${page.notPreloaded.join(', ')}`)
}

for (const page of casePages) {
  const ok = page.extra.gzip <= BUDGET.routeExtraGzip ? 'dentro' : 'FUERA'
  console.log(`Caso ${page.page}: ${page.files} archivos JS`)
  console.log(
    `  total      ${kib(page.total.gzip).padStart(10)} gzip-9 · ${kib(page.total.brotli).padStart(10)} brotli-11`,
  )
  console.log(
    `  adicional  ${kib(page.extra.gzip).padStart(10)} gzip-9 · ${kib(page.extra.brotli).padStart(10)} brotli-11 (${ok} de 60 KB gzip) en ${page.extra.files.length} archivos`,
  )
  console.log(
    `  prosa MDX  ${kib(page.deferredProse.gzip).padStart(10)} gzip-9 · ${kib(page.deferredProse.brotli).padStart(10)} brotli-11 (diferida, ${page.deferredProse.files.length} chunk)`,
  )
}
if (casePages.length === 0) console.log('Casos: ninguna página de caso en este build (todos son draft).')
