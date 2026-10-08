// <Link prefetch="intent"> (11 §7) inserta <link rel="prefetch" as="fetch" href=".../_.data"> y
// <link rel="modulepreload"> al pasar el puntero. En CSP3 una petición con iniciador "prefetch" se
// rige por default-src (no por connect-src). Este test deja el puntero sobre los enlaces el tiempo
// suficiente para que el prefetch salga y exige cero violaciones.
import { expect, test, waitForHydration } from "./fixtures";

test("prefetch=intent no viola la CSP", async ({ page, problems }) => {
  const prefetched: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".data")) prefetched.push(new URL(r.url()).pathname);
  });
  await page.goto("/es/");
  await waitForHydration(page);
  await page.getByRole("navigation").getByRole("link", { name: "Casos de estudio" }).hover();
  await page.waitForTimeout(1000);
  await page.getByRole("link", { name: /Leer el caso/ }).hover();
  await page.waitForTimeout(1000);
  console.log("peticiones .data por prefetch:", prefetched);
  expect(problems).toEqual([]);
});
