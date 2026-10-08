// A1 (HTML por ruta), A2 (head en el HTML estático) y A4 (<html lang>) sin ejecutar JavaScript.
import { LANGS, NOT_FOUND, PAGES, expect, test } from "./fixtures";

test.use({ javaScriptEnabled: false });

const titles = new Map<string, string>();

for (const path of ["/", ...PAGES]) {
  test(`sin JS: contenido y head de ${path}`, async ({ page, baseURL }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    const lang = path.split("/")[1] || "en";

    // A4
    await expect(page.locator("html")).toHaveAttribute("lang", lang);

    // A1: h1 y texto principal dentro de <main>
    await expect(page.locator("main h1")).toHaveCount(1);
    const mainText = (await page.locator("main").innerText()).trim();
    expect(mainText.length).toBeGreaterThan(40);
    if (path.includes("/work/") && path.split("/").length > 4) {
      // prosa MDX diferida: tiene que estar en el HTML estático, dentro de <main> y visible
      await expect(page.locator("main section#problem p")).toBeVisible();
    }

    // A2: todo en el <head> estático
    const head = page.locator("head");
    const title = await page.title();
    expect(title).toMatch(/Cesar Acosta/);
    titles.set(path, title);
    await expect(head.locator('meta[name="description"]')).toHaveAttribute("content", /.{20,}/);
    const canonical = await head.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe(`${baseURL}${path}`);
    await expect(head.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical!);
    for (const hl of [...LANGS, "x-default"]) {
      await expect(head.locator(`link[rel="alternate"][hreflang="${hl}"]`)).toHaveCount(1);
    }
    for (const prop of ["og:type", "og:title", "og:description"]) {
      await expect(head.locator(`meta[property="${prop}"]`)).toHaveAttribute("content", /.+/);
    }
    await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

    const ld = head.locator('script[type="application/ld+json"]');
    if (/^\/(es|en)\/$/.test(path)) {
      await expect(ld).toHaveCount(1);
      const json = JSON.parse((await ld.textContent()) ?? "") as { "@graph": Array<{ "@type": string }> };
      expect(json["@graph"].map((n) => n["@type"])).toEqual(["WebSite", "Person"]);
    } else {
      await expect(ld).toHaveCount(0);
    }
  });
}

test("A2: los títulos son distintos por ruta", () => {
  const values = [...titles.values()];
  expect(values.length).toBe(PAGES.length + 1);
  expect(new Set(values).size).toBe(values.length);
});

for (const path of NOT_FOUND) {
  test(`sin JS: 404 útil en ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    const lang = path.startsWith("/es/") ? "es" : "en";
    // El HTML de la 404 no lleva el runtime de React Router (no se hidrata).
    await expect(page.locator("script[src], link[rel=modulepreload]")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("main h1")).toHaveText(lang === "es" ? "Página no encontrada" : "Page not found");
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
  });
}
