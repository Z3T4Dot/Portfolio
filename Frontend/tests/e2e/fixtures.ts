// Blueprint 11 §5 (aserciones transversales): cada test registra errores de consola, errores de
// página y violaciones de CSP. Adaptado de spikes/d4-prerender/tests/e2e/fixtures.ts.
import { test as base, expect, type Page } from '@playwright/test'
import { LOCALES } from '../../src/i18n/locales'
import { sitePages } from '../../src/seo/site-pages'

/** Todas las páginas prerenderizadas por idioma, desde la misma tabla que el prerender y el sitemap. */
export const LOCALIZED_PAGES = sitePages().flatMap((page) => LOCALES.map((locale) => page.paths[locale]))

export interface Problem {
  kind: 'console.error' | 'console.warning' | 'pageerror' | 'csp'
  text: string
  url: string
}

export const test = base.extend<{ problems: Problem[] }>({
  problems: async ({ page }, provide) => {
    const problems: Problem[] = []
    page.on('console', (message) => {
      const text = message.text()
      if (text.startsWith('CSP violation:')) problems.push({ kind: 'csp', text, url: page.url() })
      else if (message.type() === 'error') problems.push({ kind: 'console.error', text, url: page.url() })
      else if (message.type() === 'warning') problems.push({ kind: 'console.warning', text, url: page.url() })
    })
    page.on('pageerror', (error) => problems.push({ kind: 'pageerror', text: error.message, url: page.url() }))
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI} ${event.sample}`)
      })
    })
    await provide(problems)
  },
})

/** Espera a que React Router haya hidratado y a que no queden peticiones pendientes. */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const w = window as unknown as { __reactRouterDataRouter?: { state: { initialized: boolean } } }
    return w.__reactRouterDataRouter?.state.initialized === true
  })
  await page.waitForLoadState('networkidle')
}

/** Chromium registra el propio documento 404 como "Failed to load resource": no es un error de la página. */
export function withoutDocument404(problems: readonly Problem[]): Problem[] {
  return problems.filter((problem) => !(problem.kind === 'console.error' && problem.text.includes('status of 404')))
}

export { expect }
