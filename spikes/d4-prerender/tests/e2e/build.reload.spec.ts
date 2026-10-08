// B5: tras un deploy, el HTML viejo apunta a chunks que ya no existen. Se simula respondiendo 404
// a la primera petición del módulo de la ruta work-detail (el hover del Link con prefetch="intent"
// ya la dispara). Se registra qué hace React Router: cuántas veces recarga, qué URL recarga y si
// la navegación siguiente funciona. El resultado por navegador queda en test-results/b5-*.json.
import { mkdir, writeFile } from "node:fs/promises";
import { expect, test, waitForHydration } from "./fixtures";

test("chunk de ruta borrado: recarga sin bucle y recuperación", async ({ page, problems, browserName }) => {
  const chunkRequests: number[] = [];
  let failed = 0;
  await page.route(/\/assets\/work-detail-[\w-]+\.js$/, async (route) => {
    if (failed === 0) {
      failed++;
      chunkRequests.push(404);
      await route.fulfill({ status: 404, body: "gone" });
    } else {
      chunkRequests.push(200);
      await route.continue();
    }
  });

  const documentLoads: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "document") documentLoads.push(new URL(r.url()).pathname);
  });

  await page.goto("/es/work/");
  await waitForHydration(page);
  const link = page.getByRole("link", { name: "Leer el caso Caso de prueba Alfa" });

  // 1er clic: el import del módulo falla → React Router recarga la página ACTUAL (no la de destino).
  await Promise.all([page.waitForEvent("load"), link.click()]);
  await waitForHydration(page);
  const urlAfterFirstClick = new URL(page.url()).pathname;
  const documentsAfterFirstClick = [...documentLoads];

  // 2º clic: con el HTML recargado la navegación cliente funciona.
  let secondNavigation = "ok";
  try {
    await link.click();
    await expect(page).toHaveURL(/\/es\/work\/alpha\/$/);
    await expect(page.locator("main h1")).toHaveText("Caso de prueba Alfa");
    await page.waitForLoadState("networkidle");
  } catch (e) {
    const h1 = await page.locator("main h1").textContent();
    secondNavigation = `${String(e).split("\n")[0]} · h1="${h1}" url=${page.url()}`;
  }

  const result = {
    browser: browserName,
    date: new Date().toISOString(),
    urlAfterFirstClick,
    secondNavigation,
    documentsAfterFirstClick,
    documentsAtEnd: documentLoads,
    chunkRequests,
    console: problems.map((p) => `${p.kind}: ${p.text.split("\n")[0]}`),
  };
  await mkdir("test-results", { recursive: true });
  await writeFile(`test-results/b5-${browserName}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  expect(secondNavigation).toBe("ok");
  expect(urlAfterFirstClick).toBe("/es/work/");
  // sin bucle: como mucho dos recargas, y el segundo clic no recarga
  expect(documentsAfterFirstClick.length).toBeLessThanOrEqual(3);
  expect(documentLoads).toEqual(documentsAfterFirstClick);
  expect(chunkRequests[0]).toBe(404);
});
