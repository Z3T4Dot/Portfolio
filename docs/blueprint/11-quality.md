# 11 · Calidad de ingeniería

El repositorio es público, así que su configuración de calidad también es evidencia. Por eso aplica
la regla 2 del blueprint con más rigor: **cada herramienta tiene que detectar una clase real de
defecto en este sitio**. Lo que no cumple esa condición queda en "Fuera de V1" con su motivo.

## Principios

1. **Un gate solo cuenta si puede fallar.** Cada chequeo entra en el mismo PR que demuestra que
   falla (un commit con un error de tipos, una violación de axe o un hash de CSP roto, y luego la
   corrección). Es la lección del CI de ERP-Rental: `tsc --noEmit` con `files: []` salía con 0
   sin revisar nada. Un chequeo que siempre pasa es peor que no tenerlo.
2. **Proporcionalidad.** Es un sitio estático sin datos de usuarios. No se modelan amenazas que no
   existen ni se mide lo que nadie va a mirar.
3. **Lo manual también deja registro.** Lo que no se automatiza (lector de pantalla, previews
   sociales) se hace con un checklist y queda un registro con fecha.
4. **El CI es la fuente de verdad.** Los hooks locales son opcionales. Nada llega a `main` sin
   pasar los gates.
5. **Los resultados se publican con su método** (contrato de autenticidad, eje 2). Ver la
   sección "Política de evidencia de calidad".

## Mapa de riesgos y controles

| Riesgo real | Control | Etapa | ¿Bloquea? |
|---|---|---|---|
| Errores de tipos, contenido incompleto o mal clasificado | TS `strict` + contenido tipado + validación de contenido | PR | Sí |
| Regresiones en lógica (juego, i18n, SEO, CSP) | Vitest | PR | Sí |
| Componentes inaccesibles o rotos | Testing Library + `jsx-a11y` + axe | PR | Sí |
| Rutas rotas, HTML sin metadata, CSP incompleta | Chequeos sobre `build/client` | PR | Sí |
| Recorridos rotos por audiencia o idioma | Playwright | PR | Sí |
| Lentitud o saltos de layout | Presupuesto de bundle (PR) + Lighthouse CI (preview) | PR | Sí |
| Dependencia vulnerable o manipulada | Dependabot + dependency review + `npm audit signatures` | PR / continuo | Sí (dependency review) |
| Secreto o dato confidencial de Brandex en el repo público | Push protection + gitleaks con reglas propias | PR | Sí |
| Inyección en workflows de GitHub Actions | CodeQL (incluye workflows) + endurecimiento de Actions | PR / continuo | Sí (alertas altas) |
| Fallas tras un deploy (chunks viejos, cabeceras perdidas) | Recuperación de chunks + smoke post-deploy (13) | main | Alerta + rollback |

---

## 1. Seguridad de tipos

### Configuración

El `tsconfig.json` del spike ya tiene `strict`. Se endurece así:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,     // arr[i] es T | undefined: importa en el motor del juego
    "exactOptionalPropertyTypes": true,   // evaluar en Fase 0: puede chocar con tipos de terceros
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,           // sin enum ni namespace: los scripts .ts corren con Node 24 sin transpilar
    "isolatedModules": true,
    "skipLibCheck": true,
    "rootDirs": [".", "./.react-router/types"]   // tipos generados por `react-router typegen`
  }
}
```

- **TypeScript 6.0 fijado** (`~6.0`) porque `typescript-eslint` 8.x soporta TS < 6.1. TS 7 (7.0.2 en
  npm el 2026-10-05) queda bloqueado en Dependabot hasta que `typescript-eslint` lo soporte.
- `npm run typecheck` = `react-router typegen && tsc`. Sin `typegen`, `tsc` no conoce los tipos
  de params y `loaderData` de cada ruta.

### Política de `any` y aserciones

| Regla | Configuración |
|---|---|
| Sin `any` explícito | `@typescript-eslint/no-explicit-any: error` |
| Sin `any` implícito que se propague | `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return` (vienen en `strictTypeChecked`) |
| Aserciones acotadas | `consistent-type-assertions` con `objectLiteralTypeAssertions: 'never'`; `as` solo en bordes (DOM, `JSON.parse`), con comentario |
| `@ts-ignore` prohibido | `ban-ts-comment`: `@ts-expect-error` solo con descripción de 10 caracteres o más |
| `switch` exhaustivos | `switch-exhaustiveness-check` + `assertNever` en el motor del juego |
| Datos externos | El único dato externo en runtime es `localStorage`. Se lee como `unknown` y pasa por un type guard en `lib/storage` |

### Contenido tipado

El contenido (05) es TypeScript con `satisfies`, para que los errores aparezcan al compilar y no en
producción:

- `Record<Locale, string>` en todo texto visible: si falta el inglés, no compila.
- Uniones discriminadas para el contrato de autenticidad, por ejemplo
  `MetricSource = { type: 'measured'; tool; date; method } | { type: 'repository'; countedAt; how } | { type: 'simulated'; note }` (05).
  Un número sin clase no compila (03, componente `Metric`).
- `messages/en.ts` hace `satisfies Messages`, con el tipo derivado de `messages/es.ts`. Si falta
  una clave, no compila.
- Lo que el sistema de tipos no puede expresar (slugs únicos, enlaces internos que existen,
  `confidentiality !== 'confidential'`, texto alternativo no vacío en ambos idiomas, fechas ISO
  válidas) se valida en `content.test.ts`, que corre en el PR y también como paso previo al
  build.
- Para garantías de tipos se usan tests de tipos (`*.test-d.ts` con `expectTypeOf` y
  `@ts-expect-error`), por ejemplo "`<Metric>` sin `source` no compila".

### Lint y formato

ESLint 10 (config plana) + `typescript-eslint` 8.71 + `eslint-plugin-react-hooks` 7 + reglas de
accesibilidad + Prettier.

```js
// eslint.config.js (boceto)
import { defineConfig } from 'eslint/config'
export default defineConfig(
  { ignores: ['build', '.react-router', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } },
  reactHooks.configs.recommended,   // verificar el nombre del preset plano en v7
  jsxA11y.flatConfigs.strict,       // ver nota de compatibilidad
  {
    rules: {
      'no-restricted-syntax': ['error',
        { selector: "JSXAttribute[name.name='style']",
          message: 'Sin style inline: la CSP lo bloquea en el HTML prerenderizado. Usa clases y tokens.' },
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Prohibido. El MDX compila a JSX; no hace falta HTML crudo.' }],
      'no-restricted-imports': ['error', { patterns: [/* límites entre capas de 04 */] }],
    },
  },
)
```

- `--max-warnings 0` en CI. Un warning que nadie arregla es ruido.
- **Nota de compatibilidad (verificada el 2026-10-05 con `npm view`):** `eslint-plugin-jsx-a11y`
  6.10.2, su última versión, declara `peerDependencies.eslint` hasta `^9`. El proyecto usa ESLint
  10. En Fase 0 se prueba si funciona igual. Si no, se usa el fork `eslint-plugin-jsx-a11y-x`
  0.2.0 (peer `^9 || ^10`). No se fuerza con `--legacy-peer-deps` sin probarlo.
- `prettier --check .` en CI. Formatear no es tarea de revisión.

---

## 2. Tests unitarios (Vitest)

Vitest 5 con tres proyectos:

```ts
// vitest.config.ts (boceto)
test: {
  projects: [
    { test: { name: 'unit', environment: 'node', include: ['src/**/*.test.ts'] } },
    { test: { name: 'dom',  environment: 'jsdom', include: ['src/**/*.test.tsx'], setupFiles: ['tests/setup-dom.ts'] } },
    { test: { name: 'dist', environment: 'node', include: ['tests/dist/**/*.test.ts'] } }, // corre después del build
  ],
  coverage: {
    provider: 'v8',
    include: ['src/game/core/**', 'src/game/missions/**/*.ts', 'src/lib/**', 'src/seo/**', 'scripts/**'],
    thresholds: { lines: 90, branches: 90 },
  },
}
```

**Qué se prueba con unitarios:** lógica pura donde un error no se ve en pantalla hasta que alguien
lo sufre.

| Módulo | Casos |
|---|---|
| `game/core` y motores de `game/missions/*` (`.ts`, sin vistas) | Clasificación de payloads, puntaje, máquina de estados de cada misión, transiciones inválidas, semilla determinista |
| `i18n` | Mapeo de rutas ES↔EN, precedencia del idioma (preferencia guardada → navegador → `en`), formato de fechas por idioma |
| `seo` | `buildMeta()` (título, descripción, canonical, hreflang, OG), JSON-LD, generador de sitemap |
| `scripts/csp` | Extracción de scripts inline y cálculo de hashes con fixtures de HTML conocidos |
| `lib` | `storage` con `localStorage` que lanza excepción, utilidades de fecha |
| `content` | Validación de contenido (sección 1) |

**Cobertura:** umbral del 90 % solo en motor, `lib`, `seo` y `scripts`. No hay umbral global: un
porcentaje global sobre componentes premia tests sin aserciones útiles.

**Qué no se prueba con unitarios:** CSS, textos y markup estático. Lo cubren los chequeos de
`dist`, Playwright y axe.

## 3. Tests de componentes e integración (Testing Library)

Entorno `jsdom`, `@testing-library/react` + `user-event` + `jest-dom`. Para módulos de ruta se usa
`createRoutesStub` de React Router.

Reglas:

- Consultas por rol y nombre accesible (`getByRole('link', { name: … })`). Si un test no encuentra
  un control por su rol, probablemente un lector de pantalla tampoco.
- Interacción con `userEvent`, nunca con `fireEvent`, salvo eventos que el usuario no puede
  producir.
- Sin snapshots de markup: se rompen con cualquier cambio y nadie los revisa.

Tests mínimos:

| Componente | Comportamiento verificado |
|---|---|
| Selector de idioma | Mantiene la ruta (`/es/work/x/` → `/en/work/x/`), guarda la preferencia y expone `lang`/`hreflang` en el enlace |
| Selector de tema | Alterna y persiste; con `localStorage` bloqueado sigue funcionando |
| `Metric` | Muestra valor + fuente + clase; con `source.type: 'simulated'` muestra la etiqueta |
| Índice de secciones | Marca la sección actual; el desplegable móvil se abre y cierra con teclado y con Escape |
| Diagrama | Nodo enfocable, panel con detalle, alternativa textual con los mismos datos |
| Error boundaries | Una ruta que lanza muestra el fallback con salida a Home; la de 404 muestra el texto localizado |
| UI del juego | Un paso de misión jugado solo con teclado; anuncio en `aria-live`; reinicio de misión |

## 4. Chequeos sobre el build (`dist`)

Es la capa que más protege a un sitio prerenderizado. Corre sobre `build/client` después del build
y antes de cualquier deploy. Usa el proyecto `dist` de Vitest y un parser HTML (`parse5`, como
dependencia directa).

| Chequeo | Falla si… |
|---|---|
| Inventario | Una ruta de la tabla de rutas × idioma no tiene su `index.html`, o hay HTML que no corresponde a ninguna ruta |
| Contrato SEO (12) | Falta `<title>`, descripción, canonical absoluto, `hreflang` es/en/x-default, `og:*` o `twitter:card`; hay títulos duplicados; `<html lang>` no coincide con el prefijo |
| Contenido sin JS | `<main>` no contiene el `h1` y el texto principal de la ruta |
| Enlaces internos | Un `href` interno no resuelve a un HTML generado o no usa la forma canónica (barra final, 12) |
| CSP | Un `<script>` inline no tiene su hash en la regla de esa ruta en `_headers`; aparece `unsafe-inline`; hay atributos `style=` o elementos `<style>` en el HTML |
| `_headers` | Hay más de 90 reglas (el límite de Cloudflare Pages es 100) o alguna línea supera 2.000 caracteres |
| Imágenes sociales | Una ruta no tiene su `og:image` como archivo, o este no mide 1200×630 |
| JSON-LD | No parsea o le faltan campos requeridos (12) |
| Presupuesto de bundle | Ver la sección "Rendimiento" |
| Chunk del juego | Una ruta que no es `/cyber-ops` lo referencia con `modulepreload` |

---

## 5. E2E (Playwright)

Playwright 1.63 (`@playwright/test`) con `@axe-core/playwright` 4.13.

```ts
// playwright.config.ts (boceto)
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,  // un test que pasa solo al reintentar se reporta como flaky y se arregla
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/e2e.json' }]],
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:8788', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 15'] } },   // iOS y navegadores in-app de LinkedIn
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },    // solo en main y semanal
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run serve:dist',  // wrangler pages dev build/client: aplica _headers y _redirects (13)
    url: 'http://localhost:8788/es/',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Aserciones transversales (fixture automático en todos los tests)

```ts
export const test = base.extend<{ guard: void }>({
  guard: [async ({ page }, use) => {
    const problems: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()) })
    page.on('pageerror', (e) => problems.push(e.message))
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) =>
        console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`))
    })
    await use()
    expect(problems, 'errores de consola, de hidratación o violaciones de CSP').toEqual([])
  }, { auto: true }],
})
```

Así cada recorrido verifica también que la CSP real no bloquea nada y que no hay errores de
hidratación. Confirmado en el spike D4 (2026-10-06): B2 se midió con ese evento en los tres
motores (12).

### Recorridos críticos (cada uno en ES y en EN)

Las rutas siguen 02. Los slugs concretos dependen de 07.

| Audiencia | Recorrido | Aserciones clave |
|---|---|---|
| CTO | `/{lang}/` → caso principal `/{lang}/work/:slug/` → sección Decisiones → ensayo enlazado → `/{lang}/architecture/` → un ADR → `/{lang}/contact/` | Un `h1` por página; el índice de secciones lleva el foco al ancla; los enlaces de evidencia resuelven; `mailto:` correcto |
| Recruiter | `/{lang}/` → `/{lang}/about/` → una etapa del timeline abre un caso REAL → `/{lang}/work/` → CV | Cada fila del índice muestra rol y periodo; el CV del idioma correcto responde 200 con `application/pdf` |
| Security engineer | `/{lang}/` → `/{lang}/security/` → `/{lang}/security/wazuh-soc-lab/` → CTA misión 02 → `/{lang}/cyber-ops/detection/` | El chunk del juego se pide recién al entrar a Cyber Ops; la misión 02 arranca; los datos simulados dicen que lo son |
| Software engineer | `/{lang}/` → footer "Cómo está hecho este sitio" → `/{lang}/architecture/` → ADR → enlace al repositorio | La evidencia de calidad muestra herramienta, fecha y método, o el estado vacío honesto |
| Juego | `/{lang}/cyber-ops/`: misión 1 completa solo con teclado → resultado → reinicio; misiones 2 y 3 arrancan | Foco gestionado entre pasos; `aria-live` anuncia el resultado; con `reducedMotion: 'reduce'` no hay transiciones de posición |

### Specs transversales

- **Idioma:** `/` con `locale: 'es-CO'` va a `/es/`; con `fr-FR` va a `/en/`; la preferencia
  guardada gana sobre el navegador. El selector conserva la ruta y actualiza `<html lang>`.
- **404:** `/es/no-existe` responde **404** con texto en español y salidas útiles; lo mismo en
  inglés. La 404 no pide JS (sin `<Scripts>` ni `modulepreload`) y no tiene selector de tema.
- **Sin JavaScript** (`javaScriptEnabled: false`): cada ruta muestra su `h1` y su contenido
  principal. Es lo que ven los crawlers y los generadores de previews.
- **Responsive:** a 360, 768, 1024 y 1440 px no hay scroll horizontal
  (`scrollWidth <= innerWidth`); el menú móvil funciona con teclado.
- **Tema:** persiste entre recargas, no parpadea (el atributo `data-theme` existe antes del primer
  pintado) y funciona con `localStorage` bloqueado.
- **Chunk tras un deploy:** se intercepta el chunk del juego con `page.route` y se responde 404
  una vez: se espera una sola recarga y luego éxito. Si responde 404 siempre, se espera el
  mensaje "Hay una versión nueva. Recargar", sin bucle. **Módulo de ruta:** se responde 404 al
  primer pedido del módulo; se espera una sola recarga **de la página de origen** (no de la de
  destino) y que un segundo clic navegue bien (B5 del spike).

### Dónde corren

| Contexto | Contra qué | Navegadores | Alcance |
|---|---|---|---|
| PR | `wrangler pages dev build/client` en el runner (mismas cabeceras que producción) | Chromium + WebKit móvil | Todo |
| PR, tras el deploy de preview | URL del preview (13) | Chromium | Smoke (`@smoke`) |
| `main` | Build de `main` servido localmente antes de desplegar | Chromium, WebKit móvil y Firefox | Todo |
| Semanal | Producción | Chromium | Recorridos + smoke |

## 6. Accesibilidad

**Objetivo: WCAG 2.2 AA** (03). Se usan tres capas porque ninguna alcanza sola.

### Automática

- `jsx-a11y` en el editor y en el lint.
- **axe en CI** sobre **cada ruta × idioma × tema** (claro y oscuro) y en los estados interactivos:
  menú móvil abierto, panel de diagrama abierto, juego en curso y resultado de misión.

```ts
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  .analyze()
expect(results.violations).toEqual([])
```

- **Tolerancia cero.** Una excepción solo existe en `tests/e2e/a11y-waivers.ts` con regla, ruta,
  motivo y fecha de revisión. Una excepción vencida rompe el CI.
- Las reglas `best-practice` se reportan en el resumen del job sin bloquear.

### Manual (por fase, registrada)

axe solo detecta una parte de los problemas. El resto se revisa a mano en cada fase (15) y antes
del lanzamiento:

| Área | Criterio WCAG 2.2 | Cómo |
|---|---|---|
| Teclado completo, sin trampas | 2.1.1, 2.1.2 | Todo el sitio y las tres misiones solo con Tab, Shift+Tab, Enter, Espacio, flechas y Escape |
| Orden y visibilidad del foco | 2.4.3, 2.4.7 | Anillo de 2 px `--accent` en todo control |
| Foco no tapado | 2.4.11 | El header sticky y el índice de secciones no cubren el elemento enfocado |
| Skip link | 2.4.1 | Primer Tab; salta a `<main>` |
| Reflow y zoom | 1.4.10, 1.4.4 | 320 px CSS (zoom 400 % a 1280) y texto al 200 % |
| Espaciado de texto | 1.4.12 | Bookmarklet de text spacing |
| Contraste no textual | 1.4.11 | Bordes de controles, foco e íconos en ambos temas |
| Contenido en hover o foco | 1.4.13 | Tooltips de diagramas: se cierran con Escape y no desaparecen bajo el puntero |
| Arrastre y tamaño de objetivos | 2.5.7, 2.5.8 | El juego tiene alternativa sin arrastre; objetivos de 24 px o más |
| Mensajes de estado | 4.1.3 | `aria-live` del juego y de "Copiado" |
| Idioma de partes | 3.1.2 | "English" en el selector lleva `lang="en"` |
| Movimiento | 2.2.2 | `prefers-reduced-motion`; nada se mueve más de 5 s sin control |
| Modo de alto contraste | — | `forced-colors: active` en Windows |
| Lectores de pantalla | — | NVDA + Firefox en Windows; VoiceOver + Safari en iOS (03) |

Cada revisión queda en `docs/quality/a11y/AAAA-MM-DD.md`: quién, lector de pantalla y navegador
con versiones, páginas, hallazgos e issue de cada uno. Ese archivo es la fuente de cualquier
afirmación de accesibilidad en el sitio.

---

## 7. Rendimiento

### Presupuestos

Se usan los de 04. Son **umbrales objetivo, no mediciones**. Si los superan solo framework y
runtime, el presupuesto se corrige con un ADR, nunca en silencio.

**2026-10-06:** eso pasó con el JS inicial. El spike midió en Home `/es/` 112,55 KiB gzip-9 y
98,56 KiB brotli-11 en modo framework, y 98,14 KiB gzip-9 en una SPA mínima. El 96 % es React +
React Router; el código propio con el manifest pesa unos 4,6 KiB. El presupuesto original de JS
inicial quedó invalidado y lo reemplazan las dos primeras filas, según ADR-0013 (cifras
confirmadas por César el 2026-10-06).

| Métrica | Presupuesto | Dónde se mide | Gate |
|---|---|---|---|
| Código propio de Home (todo salvo `react`, `react-dom` y `react-router`; brotli-11) | ≤ 15 KiB | Build: script sobre el HTML | PR |
| JS total de Home (brotli-11; gzip-9 solo como referencia) | ≤ 115 KiB (98,56 KiB + 15 KiB propios + margen) | Build: script sobre el HTML | PR |
| JS adicional por ruta (gzip) | ≤ 60 KB | Build | PR |
| Chunk del juego (gzip) | ≤ 45 KB JS + ≤ 6 KB CSS (09 §14) | Build | PR |
| LCP (Lighthouse móvil) | ≤ 2.0 s | LHCI sobre el preview | PR |
| CLS | ≤ 0.05 | LHCI | PR |
| TBT (umbral inicial, se recalibra) | ≤ 200 ms | LHCI | PR |
| Fuentes precargadas | 1 archivo | Build: cuenta `rel=preload as=font` | PR |

INP no se mide en laboratorio (Lighthouse en modo navegación no lo mide). TBT es el sustituto
disponible. Sin analítica no hay datos de campo en V1 (14).

### Presupuesto de bundle (determinista, en el PR)

`scripts/check-bundle.ts` lee cada HTML prerenderizado y suma **lo que esa página pide**
(`<script src>`, `<link rel="modulepreload">` con sus imports estáticos, y CSS), en gzip-9 y en
brotli-11, como `measure.mjs` del spike. El HTML dice exactamente qué carga cada ruta, así que no
hace falta adivinar con globs. Separa los chunks de `react`, `react-dom` y `react-router` del
código propio (ADR-0013). El script escribe `build/reports/bundle.json` y una tabla en el resumen
del job (`$GITHUB_STEP_SUMMARY`), y falla si alguna ruta supera su presupuesto.

El análisis visual (`rollup-plugin-visualizer` 7.1.1, compatible con rolldown 1.x de Vite 8) es bajo
demanda (`npm run analyze`). Se adjunta como artefacto solo cuando el chequeo falla.

### Lighthouse CI sobre el preview desplegado

Se mide contra el preview porque ahí están las condiciones reales: CDN, compresión, cabeceras y
caché. `@lhci/cli` 0.15.1 trae Lighthouse 12.6.1, mientras que Lighthouse ya va por 13.5.0
(`npm view`, 2026-10-05). Ese retraso es un riesgo de mantenimiento conocido. Cada resultado
registra la versión real usada.

```js
// lighthouserc.cjs (boceto)
module.exports = {
  ci: {
    collect: {
      url: ['/es/', '/en/', '/es/work/<principal>/', '/en/security/wazuh-soc-lab/', '/es/cyber-ops/', '/en/architecture/']
        .map((p) => process.env.BASE_URL + p),
      numberOfRuns: 3,                     // mediana: los runners compartidos tienen varianza
      // preset por defecto: móvil emulado, throttling simulado
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2000, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05, aggregationMethod: 'median-run' }],
        'total-blocking-time': ['error', { maxNumericValue: 200, aggregationMethod: 'median-run' }],
        'errors-in-console': 'error',
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 1 }],
        'is-crawlable': 'off',             // el preview lleva X-Robots-Tag: noindex a propósito (13)
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },   // sin subir a terceros
  },
}
```

Los reportes HTML se suben como artefacto del job y la mediana se escribe en el resumen. Los
enlaces de `temporary-public-storage` no se usan: caducan y salen a un tercero.

### Fuentes

- Archivo (variable, ejes `wdth` y `wght`) y Fragment Mono, **autohospedadas en woff2** (03). El
  spike carga Google Fonts en runtime y eso se elimina en Fase 0.
- Subconjunto latin + latin-ext con `pyftsubset` (fonttools). Además, se recorta el rango de ejes
  al realmente usado con `fonttools varLib.instancer` (por ejemplo `wdth` 100–125 y `wght`
  400–800). El tamaño resultante se mide en Fase 0; no se estima.
- Los comandos exactos quedan en `src/styles/fonts/README.md`. Es un paso único y reproducible,
  no un paso del CI.
- Las fuentes se importan desde CSS procesado por Vite para que lleven hash en el nombre y caché
  inmutable (13). Se precarga solo Archivo.
- `font-display: swap` + fuente de respaldo con `size-adjust` / `ascent-override` calculados para
  que el swap no mueva el layout (CLS).
- Se incluye el archivo de licencia OFL junto a las fuentes, como exige la licencia.

### Imágenes

- Hay pocas imágenes (capturas sanitizadas del lab, foto opcional). Los diagramas son SVG
  generados.
- `scripts/images.ts` usa `sharp`: genera AVIF + WebP en 2–3 anchos, **elimina metadatos EXIF**
  (privacidad: GPS, dispositivo) y escribe `width`/`height`. Las salidas se commitean, así que el
  CI no procesa imágenes.
- El componente `Figure` exige `width`, `height` y alt en ES y EN (05); `loading="lazy"` bajo el
  pliegue y `fetchpriority="high"` solo en la imagen LCP, si existe.
- Si se pasa de unas 30 imágenes, se reevalúa `vite-imagetools` (futuro).

### Navegación

`<Link prefetch="intent">` en la navegación principal: precarga el módulo de ruta al pasar el
puntero o enfocar el enlace. No se usa `prefetch="render"`, que gasta datos móviles en rutas que
quizá nadie visite.

---

## 8. Seguridad del sitio estático

La superficie es pequeña (04): no hay servidor, datos de usuarios, formularios ni terceros. Los
riesgos reales son cuatro: XSS por una dependencia o un error propio, cadena de suministro,
filtración de información confidencial en el repo público y abuso del pipeline de despliegue.

### CSP estricta con hashes

**El problema concreto:** React Router en modo framework emite scripts inline. `<Scripts>` escribe
el contexto de hidratación y el import de los módulos de la ruta, y `<ScrollRestoration>` escribe
otro. A eso se suma el script de tema (03) y el de redirección de `/` (12). La guía de React
Router (`how-to/security`) resuelve la CSP con `nonce`, que se genera por petición en un servidor.
**En un sitio estático un nonce fijo no protege nada.** Por eso se usan hashes.

**Mecanismo (último paso del postbuild):**

1. `scripts/csp.ts` recorre cada HTML de `build/client` con un parser (no con regex).
2. Calcula `sha256` en base64 del contenido exacto de cada `<script>` inline ejecutable. Los
   bloques `application/ld+json` no se ejecutan y la CSP no les aplica.
3. `scripts/headers.ts` (13) escribe en `_headers` una regla por ruta con la CSP de esa página. La regla global `/*` lleva
   una CSP para las respuestas sin regla propia (404 y fallback). Cada regla por ruta la quita con
   `! Content-Security-Policy` antes de declarar la suya. Cloudflare une con coma los valores
   repetidos, y dos CSP se intersectan, así que hay que evitar duplicarla. Cada respuesta debe
   llevar **exactamente una** cabecera CSP (B3). En local, con `wrangler pages dev`, se cumplió en
   el spike; **en un preview real de Cloudflare Pages es un gate antes de producción** (ADR-0001).
4. El chequeo de `dist` vuelve a calcular todo y falla si algo no cuadra.

```text
Content-Security-Policy:
  default-src 'self';          (no 'none': ver abajo)
  script-src 'self' 'sha256-<contexto>' 'sha256-<módulos>' 'sha256-<scroll>' 'sha256-<tema>' …;
  style-src 'self';
  img-src 'self';
  font-src 'self';
  connect-src 'self';          (peticiones .data de React Router en la navegación cliente)
  manifest-src 'self';
  media-src 'none';
  object-src 'none';
  frame-src 'none';
  worker-src 'none';
  base-uri 'none';
  form-action 'none';          (no hay formularios; mailto no es un form)
  frame-ancestors 'none';
  upgrade-insecure-requests    (solo si el origen es https)
```

El spike D4 (2026-10-06) midió 6 scripts inline por página, 7 en `/` y 1 en las 404. Los de
módulos de ruta y datos (turbo-stream) cambian por ruta, así que hace falta un hash por ruta.

Decisiones dentro de la política:

- **`default-src 'self'`, no `'none'`** (cambio del 2026-10-06, sorpresa 6 del spike).
  `<Link prefetch="intent">` inserta `<link rel="prefetch" as="fetch" href="…/_.data">`. Según
  CSP3, una petición con iniciador "prefetch" se rige por `default-src`, no por `connect-src`, y
  Firefox la bloquea con `default-src 'none'`. Lo que `'self'` abriría por herencia se cierra con
  directivas explícitas: `object-src`, `frame-src`, `worker-src` y `media-src` en `'none'`.
- **`upgrade-insecure-requests` solo con https.** En `http://localhost`, WebKit pediría los assets
  por https (spike).
- **Sin `'strict-dynamic'`.** Todo el JS es del mismo origen y un sitio estático no permite subir
  archivos al origen, así que `'self'` + hashes basta y es más fácil de leer.
- **Sin `'unsafe-inline'` en estilos.** Los atributos `style=` del HTML prerenderizado quedan
  bloqueados. Lo impide la regla de ESLint de la sección 1 y lo verifica el chequeo de `dist`.
  Los valores dinámicos (posiciones en el juego) se aplican desde el cliente vía CSSOM, que la CSP
  permite.
- **`img-src 'self'` sin `data:`.** Se configura `build.assetsInlineLimit: 0` para que Vite no
  convierta assets pequeños en `data:` URIs.
- **Trusted Types** (`require-trusted-types-for 'script'`) **queda fuera de V1** (spike D4, B4,
  2026-10-06). Las cargas iniciales no dan violaciones, pero al navegar en cliente a Home, React
  asigna `innerHTML` al `<script type="application/ld+json">` de `<Meta>`: Chromium y Firefox lo
  bloquean y la app deja de responder. Solo se reconsidera si cambia la forma de emitir el JSON-LD.
- **Sin endpoint de reportes.** No hay backend que reciba `report-to`. Las violaciones se detectan
  en CI con el listener de Playwright en cada recorrido. Lo honesto es decir que en producción no
  se observan (futuro: 14).
- **Escape si B3 falla en el preview real:** CSP en `<meta http-equiv>` como primer hijo de
  `<head>` por página, más una cabecera con lo que `<meta>` no soporta (`frame-ancestors`). Escala
  sin límite de reglas, pero los escáneres de cabeceras no la ven. Por eso es plan B. Cambiar a
  esta opción no reabre D4 (ADR-0001).

### Cabeceras

Se declaran en `_headers` (13), la fuente única, y se verifican en el smoke post-deploy.

| Cabecera | Valor | Motivo |
|---|---|---|
| `Content-Security-Policy` | Por ruta, como arriba | XSS, inyección, clickjacking |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`, escalonado (13) | Evitar el downgrade a HTTP |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No enviar rutas completas a terceros |
| `Permissions-Policy` | `accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()` | Mínimo privilegio de APIs del navegador |
| `Cross-Origin-Opener-Policy` | `same-origin` | Aislar el contexto de navegación |
| `Cross-Origin-Resource-Policy` | `same-origin`; `cross-origin` solo en `/og/*` | Que nadie embeba recursos; las imágenes sociales sí deben poder cargarse |
| `X-Frame-Options` | `DENY` | Navegadores sin soporte de `frame-ancestors` |

**No se envían:** `X-XSS-Protection` y `Expect-CT`, porque están obsoletas, ni
`Cross-Origin-Embedder-Policy`, porque no hay `SharedArrayBuffer` y solo agregaría riesgo de
romper recursos.

**`Access-Control-Allow-Origin`:** en local, `wrangler pages dev` agrega
`Access-Control-Allow-Origin: *` a todas las respuestas (spike D4). Se revisa en el preview real si
Pages también la envía; si es así, se decide si se quita con `! Access-Control-Allow-Origin` (13).

### Herramientas de seguridad: cuáles aportan en un sitio estático

| Herramienta | ¿V1? | Por qué |
|---|---|---|
| **Dependabot** (alertas, security updates, version updates para `npm` y `github-actions`) | Sí | Nativo, sin instalar nada, cubre también las actions. **Renovate** ofrece más (automerge, presets), pero con un repo y un mantenedor no compensa instalar otra app |
| **`actions/dependency-review-action`** en PRs | Sí | Bloquea el PR que *introduce* una dependencia con vulnerabilidad alta o una licencia no permitida. Es el gate que le falta a Dependabot y no falla por vulnerabilidades preexistentes ajenas al PR |
| **`npm audit signatures`** | Sí | Verifica firmas del registro y attestations de procedencia de lo instalado. Detecta tarballs manipulados y cuesta segundos |
| `npm audit` como gate | No | Consulta la misma base (GitHub Advisory DB) que Dependabot y falla por vulnerabilidades ajenas al cambio. Duplica sin agregar señal |
| `osv-scanner` | No (futuro) | Agrega fuentes además de GHSA. Con un solo lockfile npm aporta poco. Vale la pena si el repo suma otro ecosistema (backend en V2) |
| **GitHub secret scanning + push protection** | Sí | Gratis en repos públicos. Bloquea el push de tokens de proveedores conocidos |
| **gitleaks** con reglas propias | Sí | El riesgo real del repo no son tokens sino **contenido confidencial**: nombres de clientes, rutas internas, IPs privadas, correos y hostnames de Brandex. Push protection no conoce esos patrones |
| **CodeQL** (default setup) | Sí | En el código de la app se esperan pocos hallazgos. Su valor real aquí es el **análisis de workflows** (inyección de expresiones en un repo con token de despliegue) y servir de red cuando llegue el backend. Lo mantiene GitHub, sin archivo propio |
| SBOM (CycloneDX/SPDX) | No | Nadie lo consume: no hay clientes ni imagen distribuida. GitHub exporta el SBOM SPDX del dependency graph si alguien lo pide. Entra con un backend en contenedor (14) |
| OpenSSF Scorecard, build provenance | No | Más vitrina que control en este tamaño. Futuro |
| `ignore-scripts=true` en `.npmrc` | A evaluar en Fase 0 | Los scripts de instalación son el vector clásico de los gusanos npm. Si ninguna dependencia los necesita (Playwright instala navegadores aparte), entra |

```yaml
# .github/dependabot.yml (boceto)
version: 2
updates:
  - package-ecosystem: npm
    directory: /Frontend
    schedule: { interval: weekly }
    cooldown: { default-days: 7 }   # no adoptar versiones recién publicadas; las security updates no esperan (verificar sintaxis vigente)
    groups:
      dev-minor-patch: { dependency-type: development, update-types: [minor, patch] }
      prod-minor-patch: { dependency-type: production, update-types: [minor, patch] }
    ignore:
      # typescript-eslint 8.x soporta TS < 6.1. Se quita cuando lo soporte.
      - dependency-name: typescript
        update-types: [version-update:semver-major, version-update:semver-minor]
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: monthly }
```

**Reglas propias de gitleaks** (`.gitleaks.toml`): rangos IPv4 privados, direcciones de correo
salvo la pública de César, hostnames `*.internal`/`*.local`/`*.lan`, rutas absolutas de perfiles
de usuario de Windows o de Unix y referencias a `.private/`. Este documento describe esos patrones
sin escribirlos literalmente, para no disparar la regla sobre sí mismo. La lista de **nombres de clientes y marcas** es en sí
misma confidencial, así que no puede vivir en el repo público. Se guarda en el secret
`SANITIZE_DENYLIST` y el job hace:

1. `::add-mask::` de cada término, para que GitHub los oculte en cualquier log.
2. Genera la regla en tiempo de ejecución.
3. Ejecuta `gitleaks git --redact` sobre el rango del PR (historia completa en el job semanal).

Los logs de un repo público son públicos, por eso los pasos 1 y 3 no son opcionales. No se sube el
reporte como artefacto. Se usa el binario oficial con versión fija y checksum verificado. Las
capturas no se analizan con OCR: las cubre la checklist de sanitización de 06.

### Endurecimiento de GitHub Actions

- `permissions: contents: read` a nivel de workflow; cada job pide solo lo que usa.
- Actions de terceros fijadas por SHA de commit; Dependabot las actualiza.
- `actions/checkout` con `persist-credentials: false`.
- **Nunca `pull_request_target`** con checkout del código del PR.
- El token de despliegue vive en GitHub Environments con restricción de rama, y los jobs de deploy
  no corren en PRs de forks (13).
- Ruleset en `main`: checks requeridos, rama al día antes de mergear, sin force push.

### Divulgación responsable

- `SECURITY.md` en el repo y reporte privado de vulnerabilidades activado en GitHub.
- `/.well-known/security.txt` (RFC 9116) con `Contact:` y `Expires:`. El job semanal falla si
  `Expires` vence en menos de 30 días. Cuesta poco y es justo lo que un security engineer busca.

---

## 9. Manejo de errores

| Caso | Comportamiento | Verificación |
|---|---|---|
| Ruta inexistente | El host sirve el 404 localizado con **status 404** (13); `noindex`; salidas a Home, Trabajo y Contacto. Es HTML estático sin hidratar: `root.tsx` no emite `<Scripts>` ni `<ScrollRestoration>` en las 404, porque el mismo `404.html` se sirve en URLs que en el cliente coincidirían con otras rutas. Funciona sin JS y no tiene selector de tema (spike D4) | E2E + smoke |
| Slug inexistente en navegación cliente | El `loader` lanza 404; `ErrorBoundary` con `isRouteErrorResponse` → componente NotFound localizado | Componente + E2E |
| Error de render en una ruta | `ErrorBoundary` de la ruta: mensaje claro y enlace a Home; header y footer siguen funcionando. En producción nunca se muestra el stack | Componente |
| Error en el layout raíz | `ErrorBoundary` de `root.tsx` con HTML mínimo bilingüe | Componente |
| Módulo de ruta que falla tras un deploy | React Router llama a `window.location.reload()` cuando no puede importar un módulo de ruta. **Recarga la página actual, no la de destino**, una sola vez y sin bucle: el usuario repite la navegación (B5 del spike D4, 2026-10-06; V1 acepta ese comportamiento). Requisito: el HTML siempre se revalida (13) | E2E "chunk tras un deploy" |
| Chunk diferido propio (juego) que falla | Listener de `vite:preloadError`: una sola recarga por build y, si persiste, boundary con "Hay una versión nueva del sitio. Recargar" | E2E |
| Error dentro del juego | Boundary propio: "Reiniciar misión" resetea el store y remonta con `key`, sin recargar el sitio. El error nunca sale del juego | Componente |
| `localStorage` bloqueado | Todo funciona; solo se pierde la preferencia o el récord | Unit + E2E |
| Error de hidratación | Falla el E2E (fixture de consola) | E2E |

```ts
// src/entry.client.tsx (boceto)
window.addEventListener('vite:preloadError', (event) => {
  const key = `chunk-reload:${import.meta.env.VITE_BUILD_SHA}`
  if (safeSession.get(key)) return          // ya se intentó en este build: que lo muestre el boundary
  safeSession.set(key, '1')
  event.preventDefault()
  window.location.reload()
})
```

**Límite honesto:** en V1 no hay telemetría de errores. Sin backend ni terceros, un error en el
navegador de un visitante no llega a ningún lado. Lo mitigan los E2E, el smoke post-deploy y el job
semanal. El reporte de errores llega con el backend (14).

---

## 10. Política de evidencia de calidad

`/architecture` muestra resultados de calidad (02). Aplica el contrato de autenticidad: **cada
número es MEDIDO, con herramienta, versión, fecha, dispositivo y método, o no aparece.**

### Opciones evaluadas

| Opción | Honestidad | Costo y fragilidad | Veredicto |
|---|---|---|---|
| A. Leer en runtime la API de GitHub (artefactos, checks) | Alta | Abre `connect-src` a un tercero; límite de peticiones; los artefactos requieren autenticación aunque el repo sea público y caducan | No |
| B. **Snapshot JSON commiteado por PR** (`npm run evidence:*`) | Alta si incluye método, fecha, commit y enlace al run | Bajo. Puede envejecer, por eso la fecha se ve siempre | **V1** |
| C. Bot del CI que commitea resultados en `main` | Alta | Token con escritura, commits automáticos, riesgo de bucles de CI | Futuro, si B se vuelve tedioso |
| D. Enlaces `temporary-public-storage` de LHCI | Media: caducan en días | Nulo | Solo en resúmenes de PR, nunca en el sitio |
| E. Badges de terceros (shields.io) | Baja: no dicen método y cargan un recurso externo | — | No |
| F. Datos del propio build (bundle, páginas, tests) incrustados en el mismo deploy | Muy alta (mismo commit) | Pipeline circular (el build tendría que conocer su propio resultado) | Futuro (V1.1) |

### Cómo funciona B

1. Tras un release, César corre `npm run evidence:lighthouse -- --url https://<dominio>`.
   Ejecuta 5 corridas por URL y escribe `src/content/evidence/lighthouse/AAAA-MM-DD.json`.
   Hay comandos equivalentes para axe (rutas, tema y violaciones), bundle y MDN HTTP Observatory.
2. Lo revisa y lo mergea por PR, como cualquier contenido.
3. La página muestra **el snapshot más reciente de cada tipo, no el mejor**. Esa selección es
   código y tiene test.

```jsonc
{
  "kind": "lighthouse",
  "tool": { "name": "Lighthouse", "version": "<versión real>", "runner": "@lhci/cli <versión>" },
  "date": "<AAAA-MM-DD>",
  "target": { "url": "https://<dominio>/es/", "commit": "<sha>" },
  "environment": { "machine": "<GitHub Actions ubuntu-24.04 | equipo local>", "chrome": "<versión>",
                   "formFactor": "mobile", "throttling": "simulated (preset por defecto)" },
  "method": "mediana de 5 corridas",
  "results": { "performance": null, "lcpMs": null, "cls": null, "tbtMs": null },
  "ciRun": "https://github.com/<usuario>/<repo>/actions/runs/<id>"
}
```

Los `null` son el estado inicial real: hasta que exista una medición, la sección dice "Aún no hay
medición publicada". El esquema se valida en el build: si falta cualquier campo de método, el
build falla.

### Reglas de presentación

- Fuente visible junto a cada número, por ejemplo: "Lighthouse 12.6.1, móvil emulado, mediana de 5
  corridas, 2026-11-02 (commit abc1234)". Va como texto, no como metadatos unidos con separadores
  (anti-clichés de 03).
- Se distingue el commit medido del commit desplegado cuando no coinciden.
- Valores tal como los reporta la herramienta, con unidades y sin redondear hacia arriba.
- Si el snapshot tiene más de 180 días, se muestra un aviso de antigüedad.
- Junto a la evidencia va un enlace al historial público de Actions para ver el estado actual.
- **Lo que no se publica:** la nota de SSL Labs, porque mide la configuración TLS de Cloudflare y
  no un trabajo de César. Tampoco "100/100" sin método ni capturas de herramientas sin fecha.
- El registro manual de accesibilidad (sección 6) se resume con fecha y lectores usados. No se
  convierte en una "puntuación".

---

## 11. CI: etapas para PR y para `main`

```text
PULL REQUEST (mismo repo)                                   PUSH A MAIN (tras el merge)
─────────────────────────                                   ───────────────────────────
npm ci + npm audit signatures                               npm ci + npm audit signatures
        │                                                           │
        ├── verify ─────────────┐                                   ├── verify
        │   typegen + tsc       │                                   ├── gitleaks (rango del push)
        │   eslint, prettier    │                                   │
        │   vitest unit + dom   │                                   ▼
        │   (cobertura motor)   │                                 build (VITE_SITE_URL = producción)
        │   validación contenido│                                   │  + chequeos dist
        │                       │                                   ▼
        ├── security ───────────┤                                 e2e: Chromium + WebKit + Firefox
        │   dependency-review   │                                   │  axe en todas las rutas
        │   gitleaks (diff)     │                                   ▼
        │   CodeQL (GitHub)     │                                 deploy producción (environment: production)
        │                       ▼                                   │
        └──────────────────► build (VITE_SITE_URL = alias)          ▼
                                │  postbuild: OG, sitemap,        smoke post-deploy (13)
                                │  404, CSP → _headers              │  rutas 200, cabeceras, sitemap
                                │  chequeos dist + bundle           ▼
                                ▼                                 Lighthouse sobre producción
                              e2e local (wrangler pages dev)        (registra; si falla → alerta,
                                │  Chromium + WebKit móvil           decisión de rollback manual)
                                │  axe en todas las rutas
                                ▼
                              deploy preview (alias pr-<n>)
                                │
                                ▼
                              smoke + Lighthouse CI sobre el preview
                                │
                                ▼
                              checks requeridos ✓ → se puede mergear

SEMANAL (cron): smoke + recorridos + Lighthouse sobre producción · gitleaks historia completa ·
                enlaces externos (lychee) · vencimiento de security.txt y del certificado
```

| Job | PR | `main` | Requerido para mergear |
|---|---|---|---|
| `verify` | ✓ | ✓ | Sí |
| `dependency-review` | ✓ | — | Sí |
| `gitleaks` | ✓ | ✓ | Sí |
| CodeQL | ✓ | ✓ | Sí (alertas altas) |
| `build` + chequeos `dist` | ✓ | ✓ | Sí |
| `e2e` | 2 navegadores | 3 navegadores | Sí |
| `preview` + `preview-checks` (smoke + LHCI) | ✓ (no en forks ni Dependabot) | — | Sí |
| `deploy` + smoke | — | ✓ | — |

- `concurrency` por rama con `cancel-in-progress: true` en PRs y `false` en `main` (un deploy no
  se corta a la mitad), como en los workflows que César ya mantiene en el trabajo.
- Node 24 LTS fijado en `.nvmrc` (`@react-router/dev` 8.4.0 exige `node >=22.22.0`; el equipo de
  César tiene v24.14.0). Los workflows existentes de ERP-Rental usan Node 20, que aquí no sirve.
- Objetivo de duración del PR: menos de 10 minutos hasta el preview. Es un objetivo, no una
  medición, y se registra el valor real en Fase 0.
- Los PRs de Dependabot no tienen acceso a los secrets de Actions. Pasan `verify`, `build` y `e2e`
  locales, y el check de preview se omite para ellos con una condición explícita.

---

## Fuera de V1 (futuro)

| Elemento | Qué lo justificaría |
|---|---|
| Endpoint de reportes CSP + telemetría de errores propia | Backend propio (14). Hoy no hay dónde recibirlos sin un tercero |
| Medición de campo (RUM, INP real) | Analítica respetuosa de la privacidad (ADR-0011, 14) |
| Regresión visual (`toHaveScreenshot`) | Cambios de diseño frecuentes que rompan layouts sin que los E2E lo noten |
| Evidencia automática por build (opción F) y bot de resultados (C) | Que publicar snapshots a mano se vuelva tedioso o se olvide |
| `osv-scanner`, SBOM, provenance, Scorecard | Backend en contenedor o un segundo ecosistema de dependencias |
| Renovate | Varios repos o necesidad de automerge con reglas finas |
| `zizmor` / `actionlint` | Si los workflows crecen; hoy los cubre CodeQL |
| Hooks locales (lefthook) | Si el ciclo PR→CI se vuelve lento para errores triviales |
| `vite-imagetools` | Más de unas 30 imágenes |
| TypeScript 7 | Soporte en `typescript-eslint` |

## Decisiones para César

1. **¿Aceptas tolerancia cero en axe**, con excepciones fechadas en un archivo de waivers?
   Recomendación: sí.
2. **¿Quién hace la revisión manual con lector de pantalla** y con qué frecuencia? Recomendación:
   César, al cerrar cada fase y antes del lanzamiento, con el registro fechado.
3. **¿Correo para `security.txt` y `SECURITY.md`?** Puede ser el mismo del contacto.
4. **Lista de términos confidenciales** para el secret `SANITIZE_DENYLIST`. César la arma y nunca
   entra al repo.
5. **¿Publicar el puntaje de MDN HTTP Observatory** junto a Lighthouse? Recomendación: sí, porque
   mide cabeceras que César configuró.
6. **Presupuestos de 04:** el de JS inicial se corrigió con ADR-0013 (2026-10-06), aceptado; cifras
   confirmadas por César el 2026-10-06: ≤ 15 KiB brotli de código propio y ≤ 115 KiB brotli de JS
   total en Home.
7. **Trusted Types:** resuelto el 2026-10-06: fuera de V1, porque el spike dio violaciones (§8).
