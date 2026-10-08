// Compara el modo framework (build/client en :8788) con la línea base SPA (build-spa en :8789),
// los dos servidos con `wrangler pages dev`. Requiere ambos servidores levantados:
//   npm run serve:dist   y   npm run serve:spa
// Mide, con Chromium de Playwright:
//   - JS que el navegador descarga al abrir /es/ hasta networkidle (gzip nivel 9 sobre el cuerpo).
//   - Lo que recibe un crawler sin JS (user-agent de LinkedInBot) en una página de caso.
//   - Lo que ve un navegador con JS desactivado.
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

const TARGETS = { framework: "http://localhost:8788", spa: "http://localhost:8789" };
const LINKEDIN_UA = "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)";
const PAGES = ["/es/", "/en/work/alpha/", "/es/cyber-ops/"];

const browser = await chromium.launch();
const result = { date: new Date().toISOString(), chromium: browser.version(), targets: {} };

for (const [name, base] of Object.entries(TARGETS)) {
  const t = (result.targets[name] = { initialJs: {}, crawler: {}, noJs: {} });

  for (const p of PAGES) {
    const page = await browser.newPage();
    const js = [];
    page.on("response", async (res) => {
      if (res.request().resourceType() === "script" && res.ok()) {
        try {
          const body = await res.body();
          js.push({ url: new URL(res.url()).pathname, raw: body.length, gzip: gzipSync(body, { level: 9 }).length });
        } catch {
          /* respuesta sin cuerpo */
        }
      }
    });
    await page.goto(base + p, { waitUntil: "networkidle" });
    t.initialJs[p] = {
      files: js.length,
      rawBytes: js.reduce((n, f) => n + f.raw, 0),
      gzipBytes: js.reduce((n, f) => n + f.gzip, 0),
      list: js.map((f) => `${f.url} ${f.gzip}`),
    };
    await page.close();
  }

  for (const p of ["/en/work/alpha/", "/es/work/beta/"]) {
    const res = await fetch(base + p, { headers: { "user-agent": LINKEDIN_UA }, redirect: "manual" });
    const html = await res.text();
    const pick = (re) => html.match(re)?.[1] ?? null;
    t.crawler[p] = {
      status: res.status,
      htmlLang: pick(/<html[^>]*\blang="([^"]+)"/),
      title: pick(/<title>([^<]*)<\/title>/),
      description: pick(/<meta name="description" content="([^"]*)"/),
      ogTitle: pick(/<meta property="og:title" content="([^"]*)"/),
      canonical: pick(/<link rel="canonical" href="([^"]*)"/),
      hasH1: /<h1[\s>]/.test(html),
    };
  }

  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + "/es/work/alpha/");
  t.noJs["/es/work/alpha/"] = {
    title: await page.title(),
    h1: await page.locator("h1").count(),
    mainTextLength: (await page.locator("body").innerText()).trim().length,
  };
  await ctx.close();
}
await browser.close();

await mkdir("build/reports", { recursive: true });
await writeFile("build/reports/compare-spa.json", JSON.stringify(result, null, 2));
const kb = (n) => `${(n / 1024).toFixed(2)} KB`;
for (const [name, t] of Object.entries(result.targets)) {
  console.log(`\n== ${name}`);
  for (const [p, v] of Object.entries(t.initialJs)) console.log(`  JS al abrir ${p}: ${v.files} archivos, ${kb(v.rawBytes)} sin comprimir, ${kb(v.gzipBytes)} gzip-9`);
  for (const [p, v] of Object.entries(t.crawler)) console.log(`  crawler ${p}: ${JSON.stringify(v)}`);
  for (const [p, v] of Object.entries(t.noJs)) console.log(`  sin JS ${p}: ${JSON.stringify(v)}`);
}
