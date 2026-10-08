// Mediciones del spike sobre build/client (criterios A5, A7 y B1). No modifica el build.
// Uso: node scripts/measure.mjs  → imprime un resumen y escribe build/reports/measure.json
// Método de A7: se suman los bytes gzip (zlib nivel 9) de cada JS que la página pide al cargar:
// <script src> + <link rel="modulepreload">, cerrando además los imports estáticos de esos chunks
// por si alguno no estuviera en la lista. Los scripts inline se informan aparte.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { parse } from "parse5";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "build", "client");

const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const br = (buf) => brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}
function* elements(node) {
  if (node.tagName) yield node;
  for (const c of node.childNodes ?? []) yield* elements(c);
}
const attrsOf = (el) => Object.fromEntries(el.attrs.map((a) => [a.name, a.value]));

const fileCache = new Map();
async function asset(urlPath) {
  if (!fileCache.has(urlPath)) fileCache.set(urlPath, await readFile(path.join(out, ...urlPath.split("/").filter(Boolean))));
  return fileCache.get(urlPath);
}

// imports estáticos de un chunk ESM de Vite: import"./x.js" / from"./x.js"
async function staticClosure(start) {
  const seen = new Set();
  const queue = [...start];
  while (queue.length) {
    const u = queue.shift();
    if (seen.has(u)) continue;
    seen.add(u);
    const code = (await asset(u)).toString("utf8");
    for (const m of code.matchAll(/(?:^|[;\s}])import\s*(?:[\w${}*,\s]+from\s*)?["'](\.\/[^"']+\.js)["']/g)) {
      queue.push(path.posix.join(path.posix.dirname(u), m[1]));
    }
  }
  return [...seen];
}

const pages = [];
for await (const file of walk(out)) {
  if (!file.endsWith(".html")) continue;
  const rel = path.relative(out, file).split(path.sep).join("/");
  const doc = parse(await readFile(file, "utf8"));
  const js = new Set();
  const css = new Set();
  const inline = [];
  for (const el of elements(doc)) {
    const a = attrsOf(el);
    if (el.tagName === "script" && a.src) js.add(a.src);
    if (el.tagName === "link" && a.rel === "modulepreload") js.add(a.href);
    if (el.tagName === "link" && a.rel === "stylesheet") css.add(a.href);
    if (el.tagName === "script" && !a.src) inline.push({ type: a.type ?? "classic", text: el.childNodes.map((n) => n.value ?? "").join("") });
  }
  const closure = await staticClosure([...js]);
  const extra = closure.filter((u) => !js.has(u));
  const jsBufs = await Promise.all(closure.map(asset));
  const cssBufs = await Promise.all([...css].map(asset));
  const inlineExec = inline.filter((s) => s.type !== "application/ld+json");
  pages.push({
    page: rel,
    jsFiles: closure.length,
    jsNotPreloaded: extra,
    jsRawBytes: jsBufs.reduce((n, b) => n + b.length, 0),
    jsGzipBytes: jsBufs.reduce((n, b) => n + gz(b), 0),
    jsBrotliBytes: jsBufs.reduce((n, b) => n + br(b), 0),
    cssGzipBytes: cssBufs.reduce((n, b) => n + gz(b), 0),
    inlineScripts: inlineExec.length,
    inlineRawBytes: inlineExec.reduce((n, s) => n + Buffer.byteLength(s.text), 0),
    htmlGzipBytes: gz(await readFile(file)),
    js: closure,
  });
}
pages.sort((a, b) => a.page.localeCompare(b.page));

// A5: chunk del juego
const assets = (await readdir(path.join(out, "assets"))).filter((f) => f.endsWith(".js"));
const gameChunks = [];
for (const f of assets) {
  if ((await readFile(path.join(out, "assets", f), "utf8")).includes("CYBER_OPS_GAME_CHUNK_v1")) gameChunks.push(`/assets/${f}`);
}
const pagesLoadingGame = pages.filter((p) => p.js.some((u) => gameChunks.includes(u))).map((p) => p.page);
const manifestFile = assets.find((f) => f.startsWith("manifest-"));
// El manifest de rutas (en todas las páginas) nombra el chunk como dato para la navegación cliente.
const manifestCode = manifestFile ? await readFile(path.join(out, "assets", manifestFile), "utf8") : "";
const manifestMentionsGame = gameChunks.some((u) => manifestCode.includes(u.split("/").pop()));
const gameBufs = await Promise.all(gameChunks.map(asset));

// B1: qué scripts inline cambian por ruta
const inlineByIndex = new Map();
for await (const file of walk(out)) {
  if (!file.endsWith(".html")) continue;
  const doc = parse(await readFile(file, "utf8"));
  let i = 0;
  for (const el of elements(doc)) {
    const a = attrsOf(el);
    if (el.tagName !== "script" || a.src || a.type === "application/ld+json") continue;
    const text = el.childNodes.map((n) => n.value ?? "").join("");
    const label = text.includes("dataset.theme")
      ? "tema (root.tsx)"
      : text.includes("location.replace")
        ? "redirección de / (root-index.tsx)"
        : text.includes("react-router-scroll-positions")
          ? "<ScrollRestoration>"
          : text.startsWith("window.__reactRouterContext =")
            ? "<Scripts>: contexto"
            : text.includes("__reactRouterRouteModules")
              ? "<Scripts>: imports de módulos de ruta"
              : text.includes("streamController.enqueue")
                ? "<Scripts>: datos (turbo-stream)"
                : text.includes("streamController.close")
                  ? "<Scripts>: cierre del stream"
                  : `otro #${i}`;
    if (!inlineByIndex.has(label)) inlineByIndex.set(label, { pages: 0, distinct: new Set() });
    const entry = inlineByIndex.get(label);
    entry.pages++;
    entry.distinct.add(text);
    i++;
  }
}
const b1 = [...inlineByIndex.entries()].map(([label, v]) => ({ script: label, pages: v.pages, distinctContents: v.distinct.size }));

const home = pages.find((p) => p.page === "es/index.html");
const report = {
  date: new Date().toISOString(),
  method: "gzip nivel 9 (zlib de Node) y brotli calidad 11 sobre los archivos de build/client",
  homeEs: home && {
    jsFiles: home.jsFiles,
    jsRawBytes: home.jsRawBytes,
    jsGzipBytes: home.jsGzipBytes,
    jsBrotliBytes: home.jsBrotliBytes,
    cssGzipBytes: home.cssGzipBytes,
    inlineScripts: home.inlineScripts,
    inlineRawBytes: home.inlineRawBytes,
    htmlGzipBytes: home.htmlGzipBytes,
    jsNotPreloaded: home.jsNotPreloaded,
  },
  gameChunk: {
    files: gameChunks,
    gzipBytes: gameBufs.reduce((n, b) => n + gz(b), 0),
    pagesThatLoadIt: pagesLoadingGame,
    manifestMentionsIt: manifestMentionsGame,
  },
  inlineScripts: b1,
  pages: pages.map((p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== "js"))),
};
await mkdir(path.join(root, "build", "reports"), { recursive: true });
await writeFile(path.join(root, "build", "reports", "measure.json"), JSON.stringify(report, null, 2));

const kb = (n) => `${(n / 1024).toFixed(2)} KB`;
console.log(`Home /es/: ${home.jsFiles} JS, ${kb(home.jsRawBytes)} sin comprimir, ${kb(home.jsGzipBytes)} gzip-9, ${kb(home.jsBrotliBytes)} brotli-11; CSS ${kb(home.cssGzipBytes)} gzip; ${home.inlineScripts} scripts inline (${home.inlineRawBytes} B); HTML ${kb(home.htmlGzipBytes)} gzip`);
console.log(`JS no listado en modulepreload (Home): ${home.jsNotPreloaded.length ? home.jsNotPreloaded.join(", ") : "ninguno"}`);
console.log(`Chunk del juego: ${gameChunks.join(", ")} (${kb(report.gameChunk.gzipBytes)} gzip); lo cargan: ${pagesLoadingGame.join(", ")}; aparece en el manifest: ${manifestMentionsGame}`);
console.log("Scripts inline (B1):");
for (const r of b1) console.log(`  ${r.script.padEnd(40)} en ${String(r.pages).padStart(2)} páginas, ${r.distinctContents} contenido(s) distinto(s)`);
console.log("Por página (JS gzip-9 / CSS gzip / inline):");
for (const p of report.pages) console.log(`  ${p.page.padEnd(26)} ${kb(p.jsGzipBytes).padStart(10)} ${kb(p.cssGzipBytes).padStart(9)}  ${p.inlineScripts}`);
