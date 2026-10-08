// Blueprint 11 §5 (E2E con Playwright) y 13 §Entornos: el E2E corre contra
// `wrangler pages dev build/client`, que aplica los mismos _headers que producción.
// Chromium basta para este smoke; WebKit móvil y Firefox entran con el CI de 11 §11.
import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:8788'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  use: { baseURL: BASE_URL, trace: 'retain-on-failure', locale: 'en-US' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run serve:dist',
    url: `${BASE_URL}/es/`,
    reuseExistingServer: true,
    timeout: 120_000,
    // Sin telemetría de wrangler (11: sin terceros que no aporten).
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
})
