// Criterios medidos en desarrollo (`react-router dev`):
//   A3 en dev: cero errores/warnings de hidratación en todas las rutas.
//   A6: HMR con MDX + plugin de React Router (y con un módulo de ruta TSX) sin recarga completa.
// Ejecutar con: DEV=1 npx playwright test
import { readFile, writeFile } from "node:fs/promises";
import { NOT_FOUND, PAGES, expect, test, waitForHydration } from "./fixtures";

for (const path of PAGES) {
  test(`dev: hidrata sin errores ni warnings: ${path}`, async ({ page, problems }) => {
    await page.goto(path);
    await waitForHydration(page);
    await page.getByRole("button", { name: /tema|theme/i }).click();
    expect(problems).toEqual([]);
  });
}

for (const path of NOT_FOUND.slice(0, 2)) {
  test(`dev: 404 sin errores: ${path}`, async ({ page, problems }) => {
    const res = await page.goto(path);
    // El dev server no conoce 404.html: renderiza la ruta catch-all. Se anota el status real.
    console.log(`dev ${path} → status ${res?.status()}`);
    await expect(page.locator("main h1")).toHaveText(/Página no encontrada|Page not found/);
    const real = problems.filter((p) => !(p.kind === "console.error" && /status of 404/.test(p.text)));
    expect(real).toEqual([]);
  });
}

async function hmrCase(
  page: import("@playwright/test").Page,
  file: string,
  from: string,
  to: string,
  path: string,
  expected = to,
) {
  const original = await readFile(file, "utf8");
  if (!original.includes(from)) throw new Error(`no encuentro "${from}" en ${file}`);
  // El websocket de HMR se conecta después de hidratar; en Firefox puede tardar más que networkidle.
  const connected = page.waitForEvent("console", { predicate: (m) => m.text().includes("[vite] connected."), timeout: 10_000 });
  await page.goto(path);
  await connected;
  await waitForHydration(page);
  await page.evaluate(() => ((window as unknown as { __hmrMarker: number }).__hmrMarker = 42));
  const t0 = Date.now();
  try {
    await writeFile(file, original.replace(from, to));
    await expect(page.locator("main")).toContainText(expected, { timeout: 10_000 });
    const ms = Date.now() - t0;
    const marker = await page.evaluate(() => (window as unknown as { __hmrMarker?: number }).__hmrMarker);
    return { ms, fullReload: marker !== 42 };
  } finally {
    await writeFile(file, original);
    // esperar a que el cambio de vuelta también llegue antes del siguiente caso
    await expect(page.locator("main")).not.toContainText(expected, { timeout: 10_000 });
  }
}

test("A6: HMR de un archivo MDX sin recarga completa", async ({ page, problems }) => {
  const r = await hmrCase(page, "src/content/projects/alpha/es.mdx", "Texto de prueba en", "Texto EDITADO en", "/es/work/alpha/");
  console.log("HMR MDX:", r);
  expect(r.fullReload).toBe(false);
  expect(problems.filter((p) => p.kind !== "console.warning")).toEqual([]);
});

test("A6: HMR de un módulo de ruta TSX sin recarga completa", async ({ page, problems }) => {
  const r = await hmrCase(page, "src/lib/i18n.ts", "Índice generado desde un loader", "Índice EDITADO desde un loader", "/es/work/");
  console.log("HMR TS (i18n usado por la ruta):", r);
  expect(r.fullReload).toBe(false);
  const r2 = await hmrCase(page, "src/routes/home.tsx", "<p>{t.role}</p>", "<p>{t.role} EDITADO</p>", "/es/", "Ingeniero de software EDITADO");
  console.log("HMR TSX (módulo de ruta):", r2);
  expect(r2.fullReload).toBe(false);
  expect(problems.filter((p) => p.kind !== "console.warning")).toEqual([]);
});
