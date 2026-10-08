# Spike D4: prerender en build (Fase 0)

- **Fecha:** 2026-10-06. Todas las mediciones son de ese día.
- **Qué decide:** si el sitio usa React Router 8 en modo framework con prerender en build, o
  sigue como Vite SPA sin prerender (regla de César, más abajo).
- **Proyecto de evidencia:** `spikes/d4-prerender/`, con su README. Contenido ficticio.
- **Criterios:** los de `docs/blueprint/12-seo.md`, "Spike de Fase 0 (D4 + CSP + hosting)".

## Recomendación

**Opción 1: adoptar el modo framework, con la CSP por hashes en `_headers`.** Queda condicionada
a que B3 pase en un preview real de Cloudflare Pages. Si B3 falla, se pasa a la opción 2
(modo framework con la CSP en `<meta>`), sin volver a decidir D4.

Por qué vale la pena, con lo medido:

- **Una SPA no sirve para la prioridad 1 de 12 (previews sociales).** Un crawler con el
  user-agent de LinkedInBot recibe en la SPA el mismo `<title>Cesar Acosta</title>` en todas
  las URLs: sin `og:title`, sin canonical, sin `h1` y con `<html lang="en">` también en las
  páginas en español. Con prerender recibe el título, la descripción, el canonical, los `og:*` y
  el idioma de cada página.
- **Sin JS, la SPA no muestra nada.** Con JavaScript desactivado, `/es/work/alpha/` tiene 0
  caracteres de texto visible y ningún `h1`. Con prerender tiene su `h1` y 487 caracteres de
  texto visible en `<body>`.
- **La SPA no puede dar un 404 real.** En Pages, sin `404.html`, toda URL inexistente responde
  200 con el `index.html` (medido: `/es/no-existe` → 200). Si se agrega un `404.html`, las rutas
  profundas válidas pasan a responder 404, porque no tienen archivo propio (deducido del
  comportamiento de Pages, no medido). Con prerender, las
  URLs inexistentes responden 404 con contenido en el idioma de la URL.
- **El costo es acotado:** +14,4 KiB gzip de JS en Home (+14,7 %), unos 5 s más de build y
  unas 230 líneas propias (entry de servidor y postbuild). Las sorpresas encontradas tienen
  solución conocida y quedan documentadas abajo.
- **El presupuesto de 90 KB de JS lo rompen las dos opciones** (A7). La SPA mínima ya pesa
  98,1 KiB gzip. Por eso A7 no sirve para elegir entre ellas, pero sí obliga a un ADR.

Mantener la SPA solo tendría sentido si se renunciara a los previews por página, al HTML con
contenido y a los 404 reales, que son justo lo que 12 pone primero.

## Versiones y entorno

| Pieza | Versión |
|---|---|
| react / react-dom | 19.3.0 / 19.3.0 |
| react-router / @react-router/dev | 8.4.0 / 8.4.0 |
| vite | 8.3.3 (rolldown) |
| typescript | 6.0.3 |
| @mdx-js/rollup | 3.1.1 |
| wrangler | 4.148.0 |
| @playwright/test | 1.63.0: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6 |
| eslint / typescript-eslint / eslint-plugin-react-hooks | 10.12.0 / 8.71.1 / 7.1.1 |
| parse5 | 8.0.1 (postbuild y mediciones) |
| @vitejs/plugin-react | 6.1.2 (solo la línea base SPA) |
| Node / npm | 24.14.0 / 11.9.0 |
| Equipo | Windows 11 Home 10.0.26200, AMD Ryzen 7 7735HS, 15,2 GB RAM |

## Montaje

- `appDirectory: "src"`, `ssr: false`, `prerender({ getStaticPaths })` con paths que salen de un
  índice de contenido de prueba: `/`, `/es/`, `/en/` y, por idioma, `work/`, `work/alpha/`,
  `work/beta/` y `cyber-ops/`. En total, 11 páginas más 3 páginas 404.
- `root.tsx` con `Layout`, script de tema inline, `<Meta>`, `<Links>`, `<ScrollRestoration>` y
  `<Scripts>`. `meta` por ruta con un `buildMeta()` puro. JSON-LD `WebSite` + `Person` en Home.
- `loader` en `work/` y `work/:slug/`, que en build genera los `_.data`. La prosa de cada caso es
  MDX por idioma, cargado con `import.meta.glob` + `lazy()`. CSS Modules.
- `/:lang/cyber-ops/` importa un componente de juego ficticio con una marca para encontrar su
  chunk.
- `src/entry.server.tsx` propio y `scripts/postbuild.mjs`, que mueve las 404, calcula los hashes
  CSP con parse5, escribe `_headers` con una regla por ruta y genera `sitemap.xml` y
  `robots.txt`.
- Pruebas con Playwright contra `wrangler pages dev build/client` (build) y contra
  `react-router dev` (dev), en los tres motores.
- **Línea base SPA** (`spa-baseline/`): los mismos componentes en React Router modo data con rutas
  `lazy`, Vite + `@vitejs/plugin-react`, servida con `wrangler pages dev`. Solo sirve para medir.

## Resultados por criterio

Resultados finales sobre el último build: **120/120** pruebas de build (40 por motor, corrida de
las 15:42) y **42/42** de dev (14 por motor, corrida de las 15:24), hora local del 2026-10-06.
En las corridas anteriores hubo dos fallos intermitentes, ambos en WebKit:

- Uno de B5 (ver su fila).
- Uno del arnés de Trusted Types (`route.fulfill` sobre una respuesta ya cerrada), que se
  corrigió con `unrouteAll` al final de esa prueba.

| # | Criterio | Resultado | Evidencia y medición |
|---|---|---|---|
| A1 | HTML por ruta | **Pasa** | Con JS desactivado, en los tres motores, las 11 páginas (incluida `/`) tienen un `h1` dentro de `<main>`, y el MDX de cada caso está visible dentro de `<main>`. Con el entry por defecto **fallaba**: el MDX diferido quedaba fuera de `<main>`, en un `<div hidden>`, y necesitaba el script `$RC` de React (ver sorpresa 2) |
| A2 | Head en el HTML estático | **Pasa** | Las pruebas verifican en el `<head>` estático título, descripción, canonical (= `og:url`), `hreflang` es/en/x-default, `og:type/title/description`, `twitter:card` y JSON-LD en Home, que parsea a `["WebSite","Person"]`. Los 11 títulos son distintos. `og:image` no se probó porque se omitió H4 |
| A3 | Hidratación limpia | **Pasa** | Cero errores y cero warnings de consola en todas las rutas, en dev (3 motores) y en build (3 motores). La navegación cliente pide `/es/work/_.data` y `/es/work/beta/_.data` sin recargar el documento y actualiza título y canonical. La 404 no se hidrata por diseño (sorpresa 5) |
| A4 | `<html lang>` | **Pasa** | `es` o `en` según el prefijo en el HTML estático, también en las 404. `/` usa `en` |
| A5 | Chunk diferido | **Pasa** | El chunk `cyber-ops-D81MQC4O.js` (930 B gzip) solo aparece en `modulepreload` de `/es/cyber-ops/` y `/en/cyber-ops/`. No se pide al abrir `/es/` ni al navegar a casos, y se pide al navegar a Cyber Ops. Matices: el manifest de rutas, presente en todas las páginas, lo nombra como dato, y `prefetch="intent"` lo descarga al pasar el puntero por el enlace |
| A6 | DX | **Pasa** | HMR sin recarga completa en los tres motores: MDX 126–260 ms, módulo TSX 183–314 ms. `react-router typegen && tsc` pasa con TS 6.0.3. ESLint 10.12 + typescript-eslint 8.71.1 pasan con dos ajustes (sorpresa 9). **Tiempo de build (MEDIDO):** 5 corridas de `react-router build` + postbuild dieron 6,0 / 6,1 / 7,1 / 7,2 / 8,8 s (mediana 7,1 s; postbuild 0,73–0,94 s). La SPA: 2,1 / 2,2 / 2,2 / 2,3 / 2,5 s (mediana 2,2 s) |
| A7 | Peso real | **Falla** | **JS inicial de Home `/es/` (MEDIDO):** 12 archivos, 357 214 B sin comprimir, **115 250 B gzip-9 (112,55 KiB)** y 100 923 B brotli-11. Supera 90 KB. El 96 % es React + React Router (110 559 B gzip). El código de la app más el manifest pesa 4 691 B. **La SPA mide 98,14 KiB gzip-9 en Home**, así que también supera 90 KB. Hace falta un ADR (consecuencia 9) |
| B1 | Scripts inline | **Anotado** | 6 por página, 7 en `/` y 1 en las 404. No cambian entre páginas: tema, `<ScrollRestoration>`, contexto de `<Scripts>` y cierre del stream. Sí cambian: los imports de módulos de ruta (5 variantes en 11 páginas), los datos turbo-stream (7 variantes) y la redirección de `/`. Hace falta un hash por ruta |
| B2 | CSP por hashes | **Pasa en local · preview PENDIENTE** | Con `wrangler pages dev` hay cero `securitypolicyviolation` en Chromium, Firefox y WebKit, en todas las rutas, las 404 y la navegación cliente, sin `unsafe-inline`. **Al principio falló en Firefox** con `default-src 'none'` (sorpresa 6); pasó al cambiar a `default-src 'self'` más directivas `'none'` explícitas. El preview real requiere cuenta de Cloudflare |
| B3 | Una sola CSP por respuesta | **Pasa en local · PENDIENTE: requiere cuenta de Cloudflare** | En local, cada respuesta HTML (páginas y 404) trae exactamente una cabecera `content-security-policy` con `! Content-Security-Policy`. Falta comprobarlo en el preview real, que es lo que decide B3 |
| B4 | JSON-LD y Trusted Types | **JSON-LD pasa · Trusted Types no entra en V1** | `ld+json`: cero violaciones. Con `require-trusted-types-for 'script'` las cargas iniciales no dan violaciones, pero al navegar en cliente a Home React asigna `innerHTML` al `<script type="application/ld+json">` de `<Meta>`. Chromium y Firefox lo bloquean siempre (6 violaciones, error de página) y la app deja de responder al siguiente clic. WebKit 26.6 de Playwright dio 0 violaciones en dos corridas y las mismas 6 en la final. Detalle en `test-results/trusted-types-*.json` |
| B5 | Recarga tras un deploy | **Pasa, con un matiz** | Se respondió 404 al primer pedido del módulo `work-detail`. En los tres motores, React Router recarga **una sola vez**, sin bucle, y el segundo clic navega bien. El matiz: **recarga la página actual (`/es/work/`), no la de destino**, así que el usuario tiene que volver a hacer clic. En WebKit hubo 1 fallo intermitente en unas 11 ejecuciones: tras el segundo clic cambió la URL, pero el `h1` siguió siendo el anterior durante 5 s. Al repetir la prueba aislada 6 veces, pasó las 6. No se diagnosticó |
| H1 | 404 real | **Pasa en local · preview PENDIENTE** | Con wrangler responden **404** `/es/no-existe`, `/en/does-not-exist`, `/no-existe`, `/xx/`, `/es/work/nope/` y `/a/b/c`. El contenido sale en el idioma del prefijo, con `noindex` y sin canonical, y no hay errores con JS. Detalle: `/es/404` (sin `.html`) responde 200 porque es la URL "bonita" del archivo; lleva `noindex` |
| H2 | Barra final | **Pasa en local · preview PENDIENTE** | Con wrangler, `/es/work/alpha/` → 200; `/es/work/alpha` → 308 a la forma con barra; `/es/work/alpha/index.html` → 308. Las 11 `loc` del sitemap tienen HTML generado |
| H3 | Paridad local | **Pasa en local · comparación PENDIENTE** | `wrangler pages dev` lee `_headers` ("Parsed 13 valid header rules") y `_redirects` (una regla de prueba devolvió 301 con `Location` correcto). La comparación con el preview real requiere la cuenta |
| H4 | Satori | **Omitido** | No se hizo por tiempo. No decide D4 |

## Lo que perdería la SPA (medido)

Datos de `scripts/compare-spa.mjs` del 2026-10-06, con los dos builds servidos con
`wrangler pages dev`:

| Medición | Modo framework + prerender | Vite SPA |
|---|---|---|
| Crawler (LinkedInBot) en `/es/work/beta/`: `<title>` | `Caso de prueba Beta \| Cesar Acosta` | `Cesar Acosta` (igual en todas las URLs) |
| …`og:title` / canonical | Propios de la página | Ausentes |
| …`<html lang>` | `es` | `en` |
| …`h1` en el HTML | Sí | No |
| Sin JS, `/es/work/alpha/` (texto visible en `<body>`) | `h1` + 487 caracteres | 0 caracteres, sin `h1` |
| URL inexistente | 404 con contenido localizado | 200 con `index.html` (soft 404) |
| JS al abrir `/es/` (gzip-9) | 112,55 KiB | 98,14 KiB |
| Build (mediana de 5) | 7,1 s | 2,2 s |
| CSP | Una regla por ruta (13 en el spike; unas 63 proyectadas para V1, por debajo del límite de 90) | Una sola política global; sin scripts inline, salvo el de tema |

La SPA solo gana en peso, tiempo de build y simplicidad de la CSP. Ninguna de esas ventajas
recupera los previews ni los 404.

## Sorpresas que afectan a la app principal

1. **`react-router build` puede borrar las devDependencies.** Sin un `entry.server.tsx` propio y
   sin `isbot` en `dependencies`, el build agrega `isbot` a `package.json` y ejecuta
   `npm install` con `NODE_ENV=production`. En el spike eliminó 324 paquetes de `node_modules`.
   Se evita teniendo un `entry.server.tsx` propio, que de todas formas hace falta por el punto 2.
2. **El entry de servidor por defecto rompe A1 con contenido diferido.** El prerender pide cada
   página sin user-agent, así que el entry por defecto usa `onShellReady`. Todo lo que está
   detrás de `<Suspense>`, como el MDX con `lazy()`, sale fuera de `<main>`, en un `<div hidden>`,
   con un script inline `$RC`. La solución es un entry propio de unas 25 líneas que espera a
   `allReady` (`src/entry.server.tsx`).
3. **`getStaticPaths()` de 8.4.0 devuelve paths con parámetros.** Incluye hijas estáticas de un
   padre dinámico, como `/:lang/work`, y el prerender falla con 404. Hay que filtrarlas.
4. **La barra final de los paths de prerender importa.** En la navegación cliente, React Router
   pide `<url>/_.data` si la URL termina en `/`. El prerender solo escribe `_.data` si el path de
   la lista también termina en `/`. La tabla de rutas tiene que usar siempre la forma con barra.
5. **La 404 no se puede hidratar de forma fiable.** El host sirve el mismo `404.html` en
   cualquier URL. En el cliente, esa URL puede coincidir con otro árbol de rutas que el usado al
   prerenderizar: `/xx/` coincide con `:lang`, `/es/work/nope/` con una ruta con loader y `/a/b/c`
   con `*`. Solución del spike: en las 404, `root.tsx` no emite `<Scripts>` ni
   `<ScrollRestoration>`. La página queda como HTML estático con enlaces normales y el script de
   tema, y el botón de tema no aparece. En dev se mantienen los scripts, porque ahí el dev server
   sirve el SPA fallback. El postbuild borra `__spa-fallback.html`.
6. **Firefox bloquea el prefetch de datos con `default-src 'none'`.** `<Link prefetch="intent">`
   inserta `<link rel="prefetch" as="fetch" href="…/_.data">`. Según CSP3, una petición con
   iniciador "prefetch" se rige por `default-src`, no por `connect-src`. Firefox 155 la bloquea
   y la reporta; Chromium no; WebKit no hace prefetch. La CSP del blueprint (11 §8 y 13) tiene que
   pasar a `default-src 'self'` y cerrar el resto de forma explícita:
   `object-src 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'`.
7. **Trusted Types es incompatible con el JSON-LD de `meta` en la navegación cliente** (B4). No
   entra en V1 salvo que se cambie cómo se emite el JSON-LD.
8. **B5 recarga la URL de origen.** React Router llama a `window.location.reload()` cuando falla
   el `import()` del módulo de ruta. La fila correspondiente de 11 §9 tiene que decir "recarga la
   página actual; el usuario repite la navegación", o la app agrega su propio manejo.
9. **Ajustes de lint:**
   - `@typescript-eslint/only-throw-error` marca el idioma `throw data(null, { status: 404 })`.
     Se resuelve con
     `allow: [{ from: "package", package: "react-router", name: "DataWithResponseInit" }]`.
   - `react-hooks/static-components` (plugin 7.1.1) marca el patrón "componentes `lazy()` creados
     en el módulo y elegidos por clave en el render", aunque no se crea nada en el render. En el
     spike se desactiva en esa línea.
10. **`suppressHydrationWarning` en `<html>`** es necesario, porque el script de tema agrega
    `data-theme` antes de hidratar.
11. **El chunk MDX no se precarga.** Como el contenido ya viene en el HTML, no hay salto visual,
    pero hay una petición más después de hidratar.
12. **Cabecera de más en local:** wrangler agrega `Access-Control-Allow-Origin: *` a todas las
    respuestas. Hay que comprobar en el preview si Pages también la envía y, si es así, decidir si
    se quita con `! Access-Control-Allow-Origin`.
13. **El postbuild importa TypeScript sin dependencias extra.** `runnerImport` de Vite 8 importa
    la tabla de rutas en TS desde `postbuild.mjs`, así que el sitemap sale de la misma fuente que
    el prerender sin agregar `tsx`.

## Consecuencias para la app principal

1. **Carpetas: se confirma que la app puede quedarse en `src/`.** Con
   `appDirectory: "src"`, el build, el dev server, el HMR, `react-router typegen` (genera
   `.react-router/types/src/...`) y `tsc` funcionan. El árbol de 04 puede usar `src/` en lugar de
   `app/`. Al migrar `Frontend/` desaparecen `index.html` y `src/main.tsx` (modo librería), y en
   `src/` se agregan `root.tsx`, `routes.ts` y `entry.server.tsx`.
2. **`entry.server.tsx` propio, obligatorio** (sorpresas 1 y 2).
3. **La tabla de rutas genera paths con barra final y filtra los parámetros** (sorpresas 3 y 4).
4. **La 404 es estática y sin hidratación** (sorpresa 5). El diseño de la 404 en 02/03 no debería
   depender de JS.
5. **Cambia la plantilla CSP de 11 §8 y 13** (sorpresa 6). Trusted Types queda fuera de V1
   (sorpresa 7).
6. **La regla de 11 §9 sobre chunks tras un deploy se corrige** (sorpresa 8).
7. **Configuración de ESLint** con los dos ajustes de la sorpresa 9.
8. **`_headers`:** 13 reglas en el spike y unas 63 proyectadas para V1 (unas 30 rutas × 2
   idiomas, más `/`, la regla global y `/assets/*`). La línea más larga midió 669 caracteres. Las
   dos cifras están dentro de los límites del chequeo de `dist` (90 reglas y 2.000 caracteres).
9. **ADR de presupuesto (A7).** 90 KB gzip de JS inicial no se alcanza con React 19 +
   React Router 8 ni siquiera en SPA (98,14 KiB). Opciones para el ADR:
   - Fijar el presupuesto de Home en la línea base medida más un margen. Referencia: framework
     112,55 KiB gzip-9 / 98,56 KiB brotli-11.
   - Presupuestar aparte el código propio. Hoy son 4,6 KiB, y el resto (unos 108 KiB) es
     framework.
   - Medir en brotli, que es lo que Pages sirve a los navegadores modernos.

   Decide César.
10. **El build sube a unos 7 s en este equipo** (frente a 2,2 s de la SPA). No afecta al objetivo
    de menos de 10 minutos por PR.

## Pendiente

**PENDIENTE: requiere cuenta de Cloudflare.** No se creó ninguna cuenta ni se desplegó nada. Con
la cuenta de César, sobre un preview real:

- **B3:** exactamente una `Content-Security-Policy` por respuesta HTML. Es el único criterio que
  todavía puede cambiar la recomendación a la opción 2.
- **B2** en el preview: el mismo E2E con `BASE_URL=<preview>` y
  `BROWSERS=chromium,firefox,webkit`.
- **H1:** status 404 y contenido de las 404 en el preview.
- **H2:** cada `loc` del sitemap responde 200 sin redirección y la forma sin barra redirige.
- **H3:** comparar las cabeceras del preview con las de wrangler. Revisar también
  `Access-Control-Allow-Origin` y `X-Robots-Tag: noindex`.
- Post Inspector de LinkedIn sobre una página de caso del preview (12, prueba manual).

**Omitido:** H4 (satori + resvg). No decide D4. Si se retoma, el recorte de alcance de 12 sigue
vigente.

## Cómo reproducir

Ver `spikes/d4-prerender/README.md`. Resultados en bruto, ignorados por git:
`build/reports/{csp,measure,compare-spa}.json` y
`test-results/{build,dev,b5-*,trusted-types-*}.json`.
