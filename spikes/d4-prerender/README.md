# Spike D4: prerender en build

Evidencia del spike de Fase 0 (D4 + CSP + hosting) descrito en
`docs/blueprint/12-seo.md`. El informe con resultados y recomendación está en
`docs/spikes/d4-prerender.md`. Este proyecto es independiente de `Frontend/` y no se despliega.

Qué contiene:

- `src/`: app mínima en React Router 8 modo framework (`appDirectory: "src"`, `ssr: false`,
  `prerender`). Rutas `/`, `/:lang/`, `/:lang/work/`, `/:lang/work/:slug/` (MDX diferido),
  `/:lang/cyber-ops/` (chunk propio) y catch-all 404. Contenido ficticio.
- `src/entry.server.tsx`: entry propio (espera `allReady`; ver el comentario del archivo).
- `scripts/postbuild.mjs`: 404 por idioma, hashes CSP → `build/client/_headers`, `sitemap.xml`,
  `robots.txt` y `build/reports/csp.json`.
- `scripts/measure.mjs`: peso de JS por página, chunk del juego y scripts inline.
- `spa-baseline/` + `scripts/compare-spa.mjs`: la misma app como Vite SPA, solo para comparar.
- `tests/e2e/`: Playwright. `build.*` corre contra `wrangler pages dev`; `dev.*` contra
  `react-router dev`.

## Cómo correrlo

Requiere Node ≥ 22.22 (se usó 24.14.0).

```sh
npm ci
npx playwright install chromium firefox webkit

npm run build            # react-router build + postbuild
npm run measure          # A5, A7, B1
npm run typecheck        # react-router typegen && tsc
npm run lint

npx playwright test                                   # build, Chromium (levanta wrangler en :8788)
BROWSERS=chromium,firefox,webkit npx playwright test  # build, tres motores
DEV=1 npx playwright test                             # dev (levanta react-router dev en :5199)

# Comparación con la SPA (dos terminales con los servidores, luego el script)
npm run build:spa
npm run serve:dist
npm run serve:spa
npm run compare
```

Los resultados quedan en `build/reports/` y `test-results/` (ignorados por git).

Notas:

- No pongas `isbot` en `dependencies` ni borres `src/entry.server.tsx`: sin entry propio,
  `react-router build` ejecuta `npm install` con `NODE_ENV=production` y borra las
  devDependencies de `node_modules`.
- `postbuild.mjs` no es idempotente (mueve las 404). Se corre una vez después de cada build.
- `VITE_SITE_URL` (por defecto `http://localhost:8788`) define canonicals, sitemap y si la CSP
  lleva `upgrade-insecure-requests` (solo con https).
