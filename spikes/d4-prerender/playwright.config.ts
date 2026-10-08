import { defineConfig, devices } from "@playwright/test";

// BASE_URL apunta a `wrangler pages dev build/client` (aplica _headers como Pages) o al dev server
// de React Router (DEV=1) para los criterios que se miden en desarrollo (A3 en dev, A6 HMR).
const dev = process.env.DEV === "1";
const baseURL = process.env.BASE_URL ?? (dev ? "http://localhost:5199" : "http://localhost:8788");
const browsers = (process.env.BROWSERS ?? "chromium").split(",");

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: dev ? /dev\..*\.spec\.ts/ : /build\..*\.spec\.ts/,
  // Cada modo limpia solo su carpeta de artefactos; los JSON de resultados quedan en test-results/.
  outputDir: `test-results/artifacts-${dev ? "dev" : "build"}`,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: `test-results/${dev ? "dev" : "build"}.json` }]],
  use: { baseURL, trace: "retain-on-failure", locale: "en-US" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ].filter((p) => browsers.includes(p.name)),
  webServer: process.env.BASE_URL
    ? undefined
    : dev
      ? { command: "npx react-router dev --port 5199 --strictPort", url: "http://localhost:5199/es/", reuseExistingServer: true }
      : { command: "npm run serve:dist", url: "http://localhost:8788/es/", reuseExistingServer: true },
});
