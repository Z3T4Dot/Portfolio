// Postbuild del spike (12 "Spike de Fase 0", 11 §8, 13 "_headers"):
//   1. Mueve las 404 prerenderizadas a 404.html (Pages sirve la más cercana con status 404).
//   2. Elimina __spa-fallback.html: todas las rutas están prerenderizadas.
//   3. Calcula sha256 de cada <script> inline ejecutable de cada HTML (con parser, no regex).
//   4. Escribe _headers: cabeceras de seguridad en /*, CSP por ruta con `! Content-Security-Policy`.
//   5. Escribe sitemap.xml (desde la misma tabla que el prerender) y robots.txt.
//   6. Escribe build/reports/csp.json con el inventario de scripts inline (criterio B1).
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";
import { runnerImport } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "build", "client");
const reports = path.join(root, "build", "reports");
const SITE_URL = (process.env.VITE_SITE_URL ?? "http://localhost:8788").replace(/\/$/, "");
const TRUSTED_TYPES = process.env.CSP_TRUSTED_TYPES === "1";

const { module: paths } = await runnerImport(path.join(root, "src/content/paths.ts"));
const { module: i18n } = await runnerImport(path.join(root, "src/lib/i18n.ts"));

// 1. 404 por idioma -----------------------------------------------------------------------------
for (const p of paths.notFoundPaths) {
  const dir = path.join(out, ...p.split("/").filter(Boolean));
  const target = path.join(path.dirname(dir), "404.html");
  await rename(path.join(dir, "index.html"), target);
  await rm(dir, { recursive: true, force: true });
}

// 2. Sin SPA fallback -----------------------------------------------------------------------------
await rm(path.join(out, "__spa-fallback.html"), { force: true });

// 3. Hashes de scripts inline ---------------------------------------------------------------------
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function* elements(node) {
  if (node.tagName) yield node;
  for (const child of node.childNodes ?? []) yield* elements(child);
  if (node.content) yield* elements(node.content); // <template>
}

const EXECUTABLE = new Set(["", "text/javascript", "module", "application/javascript"]);

function inlineScripts(html) {
  const doc = parse(html);
  const found = [];
  for (const el of elements(doc)) {
    if (el.tagName !== "script") continue;
    const attrs = Object.fromEntries(el.attrs.map((a) => [a.name, a.value]));
    if ("src" in attrs) continue;
    const type = (attrs.type ?? "").trim().toLowerCase();
    const text = el.childNodes.map((n) => n.value ?? "").join("");
    if (!EXECUTABLE.has(type)) {
      found.push({ type, executable: false, bytes: Buffer.byteLength(text) });
      continue;
    }
    const hash = `sha256-${createHash("sha256").update(text, "utf8").digest("base64")}`;
    found.push({ type: type || "classic", executable: true, hash, bytes: Buffer.byteLength(text), preview: text.slice(0, 60) });
  }
  return found;
}

function urlFor(file) {
  const rel = path.relative(out, file).split(path.sep).join("/");
  if (rel.endsWith("404.html")) return null; // se sirve en cualquier URL inexistente
  return "/" + rel.replace(/index\.html$/, "");
}

const pages = [];
for await (const file of walk(out)) {
  if (!file.endsWith(".html")) continue;
  const html = await readFile(file, "utf8");
  pages.push({ file: path.relative(out, file).split(path.sep).join("/"), url: urlFor(file), scripts: inlineScripts(html) });
}
pages.sort((a, b) => a.file.localeCompare(b.file));

// 4. _headers --------------------------------------------------------------------------------------
function csp(hashes) {
  const directives = [
    // default-src 'self' y no 'none': en CSP3 las peticiones con iniciador "prefetch" se rigen por
    // default-src, y Firefox bloquea el <link rel="prefetch" as="fetch" href="…/_.data"> que inserta
    // <Link prefetch="intent">. Lo demás se cierra con directivas explícitas.
    "default-src 'self'",
    `script-src 'self' ${[...new Set(hashes)].map((h) => `'${h}'`).join(" ")}`.trim(),
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ];
  if (TRUSTED_TYPES) directives.push("require-trusted-types-for 'script'");
  // En http://localhost, upgrade-insecure-requests haría que WebKit pida los assets por https.
  if (SITE_URL.startsWith("https://")) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

const hashesOf = (page) => page.scripts.filter((s) => s.executable).map((s) => s.hash);
const fallbackHashes = pages.filter((p) => p.url === null).flatMap(hashesOf);

const lines = [
  "# Generado por scripts/postbuild.mjs. No editar.",
  "/*",
  "  Strict-Transport-Security: max-age=86400",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()",
  "  Cross-Origin-Opener-Policy: same-origin",
  "  Cross-Origin-Resource-Policy: same-origin",
  "  X-Frame-Options: DENY",
  `  Content-Security-Policy: ${csp(fallbackHashes)}`,
  "",
];
let rules = 1;
for (const page of pages.filter((p) => p.url !== null)) {
  lines.push(page.url, "  ! Content-Security-Policy", `  Content-Security-Policy: ${csp(hashesOf(page))}`, "");
  rules++;
}
lines.push("/assets/*", "  Cache-Control: public, max-age=31536000, immutable", "");
rules++;
const headers = lines.join("\n");
await writeFile(path.join(out, "_headers"), headers);
const longest = Math.max(...lines.map((l) => l.length));
if (rules > 90) throw new Error(`_headers: ${rules} reglas (> 90)`);
if (longest > 2000) throw new Error(`_headers: línea de ${longest} caracteres (> 2000)`);

// 5. sitemap.xml y robots.txt ----------------------------------------------------------------------
const abs = (p) => `${SITE_URL}${p}`;
const urlEntries = [];
const rootAlternates = [
  ...i18n.LANGS.map((l) => ({ hreflang: l, href: abs(`/${l}/`) })),
  { hreflang: "x-default", href: abs("/") },
];
urlEntries.push({ loc: abs("/"), alternates: rootAlternates });
for (const page of paths.localizedPages()) {
  const alternates = [
    ...i18n.LANGS.map((l) => ({ hreflang: l, href: abs(`/${l}${page.path}`) })),
    { hreflang: "x-default", href: abs(`/en${page.path}`) },
  ];
  for (const lang of i18n.LANGS) urlEntries.push({ loc: abs(`/${lang}${page.path}`), lastmod: page.lastmod, alternates });
}
for (const entry of urlEntries) {
  const file = path.join(out, ...entry.loc.slice(SITE_URL.length).split("/").filter(Boolean), "index.html");
  if (!existsSync(file)) throw new Error(`sitemap: ${entry.loc} no tiene HTML generado`);
}
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...urlEntries.map((e) =>
    [
      "  <url>",
      `    <loc>${e.loc}</loc>`,
      ...(e.lastmod ? [`    <lastmod>${e.lastmod}</lastmod>`] : []),
      ...e.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`),
      "  </url>",
    ].join("\n"),
  ),
  "</urlset>",
  "",
].join("\n");
await writeFile(path.join(out, "sitemap.xml"), sitemap);
await writeFile(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// 6. Reporte ---------------------------------------------------------------------------------------
await mkdir(reports, { recursive: true });
const report = {
  siteUrl: SITE_URL,
  trustedTypes: TRUSTED_TYPES,
  rules,
  longestHeaderLine: longest,
  pages: pages.map((p) => ({
    file: p.file,
    url: p.url,
    inlineExecutable: p.scripts.filter((s) => s.executable).length,
    inlineData: p.scripts.filter((s) => !s.executable).length,
    scripts: p.scripts,
  })),
};
await writeFile(path.join(reports, "csp.json"), JSON.stringify(report, null, 2));

console.log(`postbuild: ${pages.length} HTML, ${rules} reglas en _headers (línea más larga: ${longest}), ${urlEntries.length} URLs en sitemap`);
for (const p of report.pages) console.log(`  ${p.file.padEnd(28)} inline ejecutables: ${p.inlineExecutable}  ld+json/datos: ${p.inlineData}`);
