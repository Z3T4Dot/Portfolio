// Blueprint 11 §5 (smoke del shell contra el build servido por wrangler) y 12/13: cada ruta responde
// 200 con su <html lang> y su head, las URL inexistentes dan 404 localizada, sin errores de consola
// ni violaciones de CSP, y la navegación funciona con teclado.
import { LOCALIZED_PAGES, expect, test, waitForHydration, withoutDocument404 } from './fixtures'

test.describe('cada ruta en ES y EN', () => {
  for (const path of LOCALIZED_PAGES) {
    test(`${path}: 200, idioma, head, una sola CSP y sin errores`, async ({ page, problems, baseURL }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      const csp = (await response?.headerValues('content-security-policy')) ?? []
      expect(csp).toHaveLength(1)
      expect(csp[0]).not.toContain('unsafe-inline')
      // Hasta el lanzamiento nada se indexa (12): cabecera y meta.
      expect(response?.headers()['x-robots-tag']).toBe('noindex')
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex')

      await expect(page.locator('html')).toHaveAttribute('lang', path.split('/')[1] ?? '')
      await expect(page.locator('main h1')).toHaveCount(1)
      await expect(page).toHaveTitle(/Cesar Acosta/)
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${baseURL ?? ''}${path}`)
      await expect(page.locator('head link[rel="alternate"]')).toHaveCount(3)

      await waitForHydration(page)
      expect(problems).toEqual([])
    })
  }
})

test.describe('`/` elige idioma (12)', () => {
  test('sin preferencia, con navegador en inglés → /en/', async ({ page, problems }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await page.waitForURL(/\/en\/$/)
    await waitForHydration(page)
    expect(problems).toEqual([])
  })

  test.describe('con navegador en español', () => {
    test.use({ locale: 'es-CO' })

    test('→ /es/', async ({ page, problems }) => {
      await page.goto('/')
      await page.waitForURL(/\/es\/$/)
      expect(problems).toEqual([])
    })

    test('la preferencia guardada gana sobre el navegador', async ({ page, problems }) => {
      await page.addInitScript(() => {
        localStorage.setItem('locale', 'en')
      })
      await page.goto('/')
      await page.waitForURL(/\/en\/$/)
      expect(problems).toEqual([])
    })
  })
})

test.describe('404 estática y localizada', () => {
  const cases = [
    { path: '/es/no-existe', lang: 'es', title: 'Página no encontrada' },
    { path: '/en/does-not-exist/', lang: 'en', title: 'Page not found' },
    { path: '/no-existe', lang: 'en', title: 'Page not found' },
    { path: '/xx/', lang: 'en', title: 'Page not found' },
    { path: '/es/work/no-existe/', lang: 'es', title: 'Página no encontrada' },
    // Un caso `draft` no es alcanzable en producción (05, verificación 10): igual que uno inexistente.
    { path: '/es/work/quantum/', lang: 'es', title: 'Página no encontrada' },
    { path: '/en/work/quantum/', lang: 'en', title: 'Page not found' },
    { path: '/a/b/c', lang: 'en', title: 'Page not found' },
  ]

  for (const { path, lang, title } of cases) {
    test(`${path} → 404 en ${lang}, sin hidratar y sin errores`, async ({ page, problems }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      expect((await response?.headerValues('content-security-policy')) ?? []).toHaveLength(1)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('main h1')).toHaveText(title)
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex')
      await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0)
      // Sin runtime de React Router (sorpresa 5 del spike) y sin selector de tema.
      await expect(page.locator('script[src], link[rel="modulepreload"]')).toHaveCount(0)
      await expect(page.getByRole('button', { name: /theme|tema/i })).toHaveCount(0)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => '__reactRouterContext' in window)).toBe(false)
      expect(withoutDocument404(problems)).toEqual([])
    })
  }

  test('el menú móvil funciona sin JavaScript (<details>)', async ({ page, problems }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/es/no-existe')
    const menu = page.locator('details', { has: page.locator('summary', { hasText: 'Menú' }) })
    await menu.locator('summary').click()
    await expect(menu).toHaveAttribute('open', '')
    await menu.getByRole('link', { name: 'Trabajo' }).click()
    await expect(page).toHaveURL(/\/es\/work\/$/)
    await expect(page.locator('main h1')).toHaveText('Casos de estudio')
    expect(withoutDocument404(problems)).toEqual([])
  })
})

test.describe('teclado', () => {
  test('header: skip link, nombre y navegación con Enter', async ({ page, problems }) => {
    await page.goto('/es/')
    await waitForHydration(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Cesar Acosta' })).toBeFocused()
    await page.keyboard.press('Tab')
    const work = page.getByRole('banner').getByRole('link', { name: 'Trabajo' })
    await expect(work).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/es\/work\/$/)
    await expect(page.locator('main h1')).toHaveText('Casos de estudio')
    await expect(page).toHaveTitle('Casos de estudio | Cesar Acosta')
    await expect(work).toHaveAttribute('aria-current', 'page')
    expect(problems).toEqual([])
  })

  test('skip link lleva el foco a <main>', async ({ page, problems }) => {
    await page.goto('/en/about/')
    await waitForHydration(page)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()
    expect(problems).toEqual([])
  })

  test('menú móvil (360px): abre, recorre, Escape devuelve el foco y Enter navega', async ({ page, problems }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/en/')
    await waitForHydration(page)
    const menu = page.getByRole('button', { name: 'Menu' })
    await menu.focus()
    await page.keyboard.press('Enter')
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Work' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeFocused()

    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    // exact: la Home también tiene "Explore the Security Lab".
    await expect(page.getByRole('link', { name: 'Security', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/en\/security\/$/)
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(problems).toEqual([])
  })
})

test.describe('idioma y tema', () => {
  test('el selector conserva la ruta, actualiza <html lang> y recuerda la preferencia', async ({ page, problems }) => {
    await page.goto('/es/security/wazuh-soc-lab/')
    await waitForHydration(page)
    await page.getByRole('banner').getByRole('link', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en\/security\/wazuh-soc-lab\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    expect(await page.evaluate(() => localStorage.getItem('locale'))).toBe('en')
    expect(problems).toEqual([])
  })

  test('el tema guardado se aplica antes del primer pintado y el selector lo cambia', async ({ page, problems }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('theme', 'dark')
        sessionStorage.setItem('seeded', '1')
      }
    })
    await page.goto('/en/', { waitUntil: 'commit' })
    await page.waitForFunction(() => document.readyState !== 'loading')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await waitForHydration(page)
    await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(problems).toEqual([])
  })
})

test.describe('responsive (03): sin scroll horizontal', () => {
  for (const width of [360, 768, 1024, 1440]) {
    test(`${String(width)}px`, async ({ page, problems }) => {
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/es/', '/es/about/', '/en/contact/', '/es/cyber-ops/recovery/', '/en/architecture/']) {
        await page.goto(path)
        await waitForHydration(page)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, path).toBeLessThanOrEqual(0)
      }
      expect(problems).toEqual([])
    })
  }
})

// 15 F3 (Home, About y Contact) sobre el build de producción: 05 verificación 10 (ningún borrador) y
// 16 §Contenido (sin PENDIENTE visible). La navegación cliente trae los datos del loader (_.data).
test.describe('F3: Home, About y Contact', () => {
  const DEV_ONLY = /BORRADOR|PENDIENTE|Quantum|KeepMe|ConnectMe/

  test('Home: nombre, rol, posicionamiento y CTAs; sin borradores ni pendientes', async ({ page, problems }) => {
    await page.goto('/es/')
    await waitForHydration(page)
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Cesar Acosta')
    await expect(main).toContainText('Desarrollador de software')
    await expect(main.getByRole('link', { name: 'Ver casos' })).toHaveAttribute('href', '/es/work/')
    await expect(main.getByRole('link', { name: 'Explorar el Security Lab' })).toHaveAttribute(
      'href',
      '/es/security/wazuh-soc-lab/',
    )
    await expect(page.locator('body')).not.toContainText(DEV_ONLY)
    expect(problems).toEqual([])
  })

  test('del timeline de Home al de About por navegación cliente', async ({ page, problems }) => {
    await page.goto('/es/')
    await waitForHydration(page)
    await page.getByRole('link', { name: 'Ver la trayectoria completa' }).click()
    await expect(page).toHaveURL(/\/es\/about\/#timeline$/)
    await expect(page.locator('main h1')).toHaveText('Sobre mí')
    const timeline = page.locator('#timeline')
    await expect(timeline.getByRole('heading', { name: 'Desarrollador Junior en Brandex' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(DEV_ONLY)
    expect(problems).toEqual([])
  })

  test('Contact: los datos pendientes no se publican', async ({ page, problems }) => {
    await page.goto('/en/contact/')
    await waitForHydration(page)
    await expect(page.locator('main h1')).toHaveText('Contact')
    await expect(page.locator('main dl')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(DEV_ONLY)
    expect(problems).toEqual([])
  })

  // 15 F4 (índice de casos): solo casos publicados. Hoy todos son draft, así que no hay filas ni
  // enlaces a casos, ni en el HTML ni tras navegar en el cliente (datos del loader, _.data).
  test('Work: sin casos publicados no hay filas ni enlaces a borradores', async ({ page, problems }) => {
    await page.goto('/es/')
    await waitForHydration(page)
    await page.getByRole('main').getByRole('link', { name: 'Ver casos' }).click()
    await expect(page).toHaveURL(/\/es\/work\/$/)
    await expect(page.locator('main h1')).toHaveText('Casos de estudio')
    await expect(page.locator('main a[href*="/work/"]')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(DEV_ONLY)
    expect(problems).toEqual([])
  })
})
