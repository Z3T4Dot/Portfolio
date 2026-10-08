// B4: el bloque ld+json no produce violaciones con la CSP generada (ya lo cubre build.hydration).
// Aquí se agrega `require-trusted-types-for 'script'` a la CSP servida (interceptando la respuesta)
// y se anotan las violaciones, para decidir si Trusted Types entra en V1. Este test no falla:
// escribe lo que encontró en test-results/trusted-types.json.
import { writeFile, mkdir } from "node:fs/promises";
import { PAGES, test, waitForHydration, type Problem } from "./fixtures";

test("Trusted Types: inventario de violaciones (carga + navegación cliente)", async ({ page, problems, browserName }) => {
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    if (headers["content-security-policy"]) {
      headers["content-security-policy"] += "; require-trusted-types-for 'script'";
    }
    await route.fulfill({ response, headers });
  });

  const steps: Array<{ step: string; ok: boolean; error?: string }> = [];
  async function step(name: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      steps.push({ step: name, ok: true });
    } catch (e) {
      steps.push({ step: name, ok: false, error: String(e).split("\n")[0] });
    }
  }

  for (const path of PAGES) {
    await step(`carga ${path}`, async () => {
      await page.goto(path);
      await waitForHydration(page);
    });
  }
  // navegación cliente que vuelve a renderizar <Meta> (ld+json en Home) y monta componentes nuevos
  await step("carga /es/work/alpha/", async () => {
    await page.goto("/es/work/alpha/");
    await waitForHydration(page);
  });
  await step("clic a Inicio (ld+json en cliente)", async () => {
    await page.getByRole("navigation").getByRole("link", { name: "Inicio" }).click({ timeout: 5000 });
    await page.waitForURL(/\/es\/$/, { timeout: 5000 });
  });
  await step("clic a Cyber Ops", async () => {
    await page.getByRole("navigation").getByRole("link", { name: "Cyber Ops" }).click({ timeout: 5000 });
    await page.waitForURL(/\/es\/cyber-ops\/$/, { timeout: 5000 });
  });
  await step("carga /es/ y clic a Casos (sin ld+json en destino)", async () => {
    await page.goto("/es/");
    await waitForHydration(page);
    await page.getByRole("navigation").getByRole("link", { name: "Casos de estudio" }).click({ timeout: 5000 });
    await page.waitForURL(/\/es\/work\/$/, { timeout: 5000 });
  });

  // Que ninguna petición en vuelo llegue al handler después de cerrar la página.
  await page.unrouteAll({ behavior: "ignoreErrors" });

  const summary = {
    date: new Date().toISOString(),
    browser: browserName,
    steps,
    total: problems.length,
    csp: problems.filter((p: Problem) => p.kind === "csp"),
    other: problems.filter((p: Problem) => p.kind !== "csp"),
  };
  await mkdir("test-results", { recursive: true });
  await writeFile(`test-results/trusted-types-${browserName}.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
});
