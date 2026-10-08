import { test as base, expect, type Page } from "@playwright/test";

export const LANGS = ["es", "en"] as const;
export const SLUGS = ["alpha", "beta"] as const;

/** Las páginas prerenderizadas (sin "/", que redirige con JS). */
export const PAGES = LANGS.flatMap((l) => [`/${l}/`, `/${l}/work/`, ...SLUGS.map((s) => `/${l}/work/${s}/`), `/${l}/cyber-ops/`]);
export const NOT_FOUND = ["/es/no-existe", "/en/does-not-exist", "/no-existe", "/xx/", "/es/work/nope/", "/a/b/c"];

export interface Problem {
  kind: "console.error" | "console.warning" | "pageerror" | "csp";
  text: string;
  url: string;
}

/**
 * Fixture transversal (11 §5): registra errores y warnings de consola, errores de página y
 * violaciones de CSP. Cada test decide qué hacer con la lista (normalmente: exigir que esté vacía).
 */
export const test = base.extend<{ problems: Problem[] }>({
  problems: async ({ page }, use) => {
    const problems: Problem[] = [];
    page.on("console", (m) => {
      const text = m.text();
      if (text.startsWith("CSP violation:")) problems.push({ kind: "csp", text, url: page.url() });
      else if (m.type() === "error") problems.push({ kind: "console.error", text, url: page.url() });
      else if (m.type() === "warning") problems.push({ kind: "console.warning", text, url: page.url() });
    });
    page.on("pageerror", (e) => problems.push({ kind: "pageerror", text: e.message, url: page.url() }));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI} ${e.sample ?? ""}`);
      });
    });
    await use(problems);
  },
});

/** Espera a que React Router haya hidratado y a que no queden peticiones pendientes. */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const w = window as unknown as { __reactRouterDataRouter?: { state: { initialized: boolean } } };
    return w.__reactRouterDataRouter?.state.initialized === true;
  });
  await page.waitForLoadState("networkidle");
}

export { expect };
