// A3 (hidratación limpia + navegación cliente con .data), A5 (chunk diferido), B2 (CSP por hashes
// sin violaciones) y la parte local de H1 (404 con JS), contra `wrangler pages dev`.
import { NOT_FOUND, PAGES, expect, test, waitForHydration } from "./fixtures";

for (const path of PAGES) {
  test(`hidrata sin errores ni violaciones de CSP: ${path}`, async ({ page, problems }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    // exactamente una cabecera CSP y sin unsafe-inline
    const csp = (await res!.headerValues("content-security-policy"));
    expect(csp).toHaveLength(1);
    expect(csp[0]).not.toContain("unsafe-inline");
    await waitForHydration(page);
    // prueba de interactividad: el botón de tema solo funciona si React hidrató
    const before = await page.locator("html").getAttribute("data-theme");
    await page.getByRole("button", { name: /tema|theme/i }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", before ?? "");
    expect(problems).toEqual([]);
  });
}

// H1 (parte local): la 404 es HTML estático sin <Scripts> (ver root.tsx). Con JS activo no hay
// hidratación que pueda fallar y la CSP de /* permite el script de tema.
for (const path of NOT_FOUND) {
  test(`404 con JS: sin hidratación, sin errores ni violaciones: ${path}`, async ({ page, problems }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    const csp = await res!.headerValues("content-security-policy");
    expect(csp).toHaveLength(1);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => "__reactRouterContext" in window)).toBe(false);
    await expect(page.locator("html")).toHaveAttribute("data-theme", /light|dark/);
    await expect(page.locator("main h1")).toHaveText(/Página no encontrada|Page not found/);
    // Chromium registra el propio documento 404 como "Failed to load resource": no es un error de la página.
    const real = problems.filter((p) => !(p.kind === "console.error" && /status of 404/.test(p.text)));
    expect(real).toEqual([]);
  });
}

test("/ redirige con el script inline permitido por la CSP", async ({ page, problems }) => {
  await page.goto("/");
  await page.waitForURL(/\/en\/$/);
  await waitForHydration(page);
  expect(problems).toEqual([]);
});

test("navegación cliente: pide .data, no recarga el documento y carga el chunk del juego solo al final", async ({
  page,
  problems,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.resourceType()} ${new URL(r.url()).pathname}`));
  await page.goto("/es/");
  await waitForHydration(page);
  const gameChunk = (p: string) => /\/assets\/cyber-ops-[\w-]+\.js$/.test(p);
  expect(requests.filter(gameChunk)).toEqual([]);

  const documentsBefore = requests.filter((r) => r.startsWith("document ")).length;

  await page.getByRole("navigation").getByRole("link", { name: "Casos de estudio" }).click();
  await expect(page).toHaveURL(/\/es\/work\/$/);
  await expect(page.locator("main h1")).toHaveText("Casos de estudio");
  expect(requests).toContain("fetch /es/work/_.data");

  await page.getByRole("link", { name: "Leer el caso Caso de prueba Beta" }).click();
  await expect(page).toHaveURL(/\/es\/work\/beta\/$/);
  await expect(page.locator("main h1")).toHaveText("Caso de prueba Beta");
  await expect(page.locator("main section#problem p")).toContainText("caso beta");
  expect(requests).toContain("fetch /es/work/beta/_.data");
  await expect(page).toHaveTitle("Caso de prueba Beta | Cesar Acosta");
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute("href", /\/es\/work\/beta\/$/);

  expect(requests.filter((r) => r.startsWith("script") && gameChunk(r.split(" ")[1]!))).toEqual([]);
  await page.getByRole("navigation").getByRole("link", { name: "Cyber Ops" }).click();
  await expect(page).toHaveURL(/\/es\/cyber-ops\/$/);
  await expect(page.getByTestId("game")).toBeVisible();
  expect(requests.some((r) => gameChunk(r.split(" ")[1]!))).toBe(true);

  // ninguna navegación anterior pidió un documento nuevo
  expect(requests.filter((r) => r.startsWith("document ")).length).toBe(documentsBefore);
  expect(problems).toEqual([]);
});

test("navegación cliente a Home renderiza el JSON-LD y cambia el head", async ({ page, problems }) => {
  await page.goto("/en/work/alpha/");
  await waitForHydration(page);
  await page.getByRole("navigation").getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('head script[type="application/ld+json"]')).toHaveCount(1);
  await expect(page).toHaveTitle("Cesar Acosta | Software engineer");
  expect(problems).toEqual([]);
});
