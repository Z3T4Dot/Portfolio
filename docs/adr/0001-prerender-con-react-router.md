# ADR-0001: React Router 8 en modo framework con prerender en build

| Campo | Valor |
|---|---|
| Estado | **aceptado** (2026-10-06). B3 queda como gate antes de producción (ver Consecuencias) |
| Fecha | 2026-10-06 |
| Decide | César |
| Evidencia | [Informe del spike D4](../spikes/d4-prerender.md) (proyecto `spikes/d4-prerender/`), mediciones del 2026-10-06 |
| Blueprint | 04, 11 §7–§9, 12 ("D4: prerender en build"), 13 |

## Contexto

- La V1 es un sitio estático, bilingüe con prefijo `/:lang`, servido desde Cloudflare Pages (04,
  02, 13). No hay servidor por petición.
- La prioridad 1 de 12 son los **previews sociales**: los crawlers de LinkedIn y similares no
  ejecutan JavaScript. La prioridad 2 es la indexación sin errores: HTML real por ruta, canonical,
  `hreflang` y **404 con status real**.
- Sin servidor no hay `nonce`. Los scripts inline del framework necesitan una CSP con hashes por
  ruta (11 §8).
- `Frontend/` empezó como Vite SPA en modo librería (00, "Estado del código existente").
- El spike D4 de la Fase 0 midió las dos opciones el 2026-10-06 con los criterios de 12.

## Decisión

React Router 8 en **modo framework con prerender en build**: `ssr: false`, `appDirectory: "src"` y
`prerender` con los paths de la tabla de rutas. La CSP va **por ruta, con hashes, en `_headers`**,
que genera el postbuild.

**B3** (exactamente una cabecera `Content-Security-Policy` por respuesta HTML) se verifica en un
preview real de Cloudflare Pages como **gate antes de producción**. Si falla, la CSP pasa a
`<meta http-equiv>` por página, más una cabecera con `frame-ancestors` (opción 2 del spike, plan B
de 11 §8), **sin reabrir esta decisión**. El desarrollo sigue mientras tanto.

## Comparación medida con la SPA

Datos del informe del spike (`scripts/compare-spa.mjs`, 2026-10-06), con los dos builds servidos
con `wrangler pages dev`. La SPA usa los mismos componentes en React Router modo data con rutas
`lazy`.

| Medición | Modo framework + prerender | Vite SPA |
|---|---|---|
| Crawler (LinkedInBot) en `/es/work/beta/`: `<title>` | `Caso de prueba Beta \| Cesar Acosta` | `Cesar Acosta` (igual en todas las URLs) |
| …`og:title` y canonical | Propios de la página | Ausentes |
| …`<html lang>` | `es` | `en` |
| …`h1` en el HTML | Sí | No |
| Sin JS, `/es/work/alpha/` (texto visible en `<body>`) | `h1` + 487 caracteres | 0 caracteres, sin `h1` |
| URL inexistente | 404 con contenido localizado | 200 con `index.html` (soft 404) |
| JS al abrir `/es/` (gzip-9) | 112,55 KiB | 98,14 KiB |
| Build (mediana de 5 corridas) | 7,1 s | 2,2 s |
| CSP | Una regla por ruta (13 en el spike; unas 63 proyectadas para V1) | Una política global; sin scripts inline, salvo el de tema |

Resultado por criterio del spike (detalle en el informe):

| Criterios | Resultado |
|---|---|
| A1–A6 (HTML por ruta, head estático, hidratación, `lang`, chunk diferido, DX) | Pasan. A1 solo pasa con `entry.server.tsx` propio |
| A7 (peso) | Falla en las dos opciones. Lo resuelve [ADR-0013](0013-presupuesto-de-javascript.md) |
| B2 (CSP por hashes) | Pasa en local en Chromium, Firefox y WebKit tras cambiar a `default-src 'self'`. Preview pendiente |
| B3 (una sola CSP por respuesta) | Pasa en local. **Pendiente en preview real: requiere cuenta de Cloudflare** |
| B4 (JSON-LD y Trusted Types) | JSON-LD pasa. Trusted Types no entra en V1 |
| B5 (recarga tras un deploy) | Pasa con un matiz: recarga la página actual, no la de destino |
| H1–H3 (404 real, barra final, paridad local) | Pasan en local. Preview pendiente |
| H4 (satori) | Omitido; no decide D4 |

## Alternativas

| Alternativa | Por qué no |
|---|---|
| Vite SPA sin prerender | Gana en peso (−14,4 KiB gzip en Home), en tiempo de build y en simplicidad de la CSP, pero pierde lo que 12 pone primero: previews por página, HTML con contenido sin JS y 404 reales (tabla de arriba). Si se agrega un `404.html`, las rutas profundas válidas pasarían a responder 404 (deducido del comportamiento de Pages, no medido) |
| Script propio de prerender (modo librería + `createStaticHandler` + `prerenderToNodeStream`) | Plan B de 12: unas 200–300 líneas propias que reinventan head, assets, `modulepreload`, datos de hidratación, 404 y `.data`. No hizo falta: A1–A3 pasaron con el framework |
| Next.js con `output: 'export'` | Cambia todo el stack, y los `headers` de `next.config` no aplican en export (12) |
| Astro (islas) | Cambia stack y modelo; Cyber Ops quedaría como isla React. 12 solo lo consideraba si fallaban el framework y el plan B. No se evaluó a fondo |
| `vite-react-ssg` / `vite-plugin-ssg` | Incompatible con React Router 8 (requiere `react-router-dom ^6`) o sin madurez (12) |
| SPA + servicio externo de prerender | Tercero, costo y HTML distinto para crawlers y usuarios (12) |
| Modo framework con la CSP en `<meta>` desde el inicio | Es el fallback si falla B3. No es la primera opción porque los escáneres de cabeceras no ven una CSP en `<meta>` y `frame-ancestors` no se puede declarar ahí (11 §8) |

## Trade-offs

**Se gana:** HTML con contenido y `<head>` propio por ruta (previews, crawlers, lectura sin JS),
404 reales y localizados, `<html lang>` correcto en el HTML estático, code splitting por ruta,
`loader` ejecutado en build y tipos generados por `react-router typegen`.

**Se pierde:**

- +14,4 KiB gzip de JS en Home (+14,7 %) frente a la SPA.
- Build de unos 7 s frente a 2,2 s (mediana, equipo de César). No afecta al objetivo de menos de
  10 minutos por PR.
- Unas 230 líneas propias en el spike (entry de servidor y postbuild).
- Una regla de CSP por ruta en `_headers` en lugar de una global.
- Acoplamiento a las convenciones del framework y a sus cambios. Ejemplo medido:
  `getStaticPaths()` de 8.4.0 devuelve paths con parámetros.

## Consecuencias

Requisitos de V1 que salen del spike (sorpresas y consecuencias del informe):

1. **Carpetas:** la app vive en `Frontend/src/` con `appDirectory: "src"`. Se agregan
   `src/root.tsx`, `src/routes.ts` y `src/entry.server.tsx`, y desaparecen `index.html` y
   `src/main.tsx` (04).
2. **`entry.server.tsx` propio, obligatorio, que espera `allReady`.** Con el entry por defecto, el
   prerender (sin user-agent) usa `onShellReady` y el MDX diferido queda fuera de `<main>`, en un
   `<div hidden>`: rompe A1. Además, sin entry propio, `react-router build` agrega `isbot` a
   `package.json` y ejecuta `npm install` con `NODE_ENV=production`, que en el spike borró 324
   paquetes de `node_modules`. `isbot` no va en `dependencies`.
3. **Tabla de rutas:** los paths de prerender usan **siempre barra final**; si no, el prerender no
   escribe `_.data` y la navegación cliente lo pide igual. Se **filtran los paths con parámetros**
   que devuelve `getStaticPaths()` (por ejemplo `/:lang/work`), que hacen fallar el prerender con
   404.
4. **La 404 es estática y no se hidrata.** El host sirve el mismo `404.html` en cualquier URL, que
   en el cliente puede coincidir con otro árbol de rutas. En las 404, `root.tsx` no emite
   `<Scripts>` ni `<ScrollRestoration>`: queda HTML con enlaces normales y el script de tema, y
   **sin botón de tema** (02, 03). El postbuild mueve las 404 por idioma y borra
   `__spa-fallback.html`.
5. **CSP:** `default-src 'self'` y cierre explícito con
   `object-src 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'`. Con
   `default-src 'none'`, Firefox bloquea el prefetch de `_.data` que inserta
   `<Link prefetch="intent">` (las peticiones con iniciador "prefetch" se rigen por `default-src`).
   `upgrade-insecure-requests` solo cuando el origen es https. **Trusted Types queda fuera de
   V1:** en la navegación cliente React asigna `innerHTML` al JSON-LD de `<Meta>` (11 §8, 13).
6. **Fallo de un módulo de ruta tras un deploy:** React Router recarga **la página actual** una
   sola vez, sin bucle, y no la de destino. El usuario repite la navegación. V1 acepta ese
   comportamiento y la documentación lo dice así (04, 11 §9). En WebKit hubo 1 fallo intermitente
   en unas 11 ejecuciones, sin diagnosticar; el E2E lo vigila.
7. `suppressHydrationWarning` en `<html>`, porque el script de tema agrega `data-theme` antes de
   hidratar.
8. **ESLint:** `@typescript-eslint/only-throw-error` con
   `allow: [{ from: "package", package: "react-router", name: "DataWithResponseInit" }]`, y
   `react-hooks/static-components` desactivada solo en la línea del patrón "componentes `lazy()`
   del módulo elegidos por clave".
9. **`_headers`:** una regla por ruta; unas 63 proyectadas para V1 y una línea máxima de 669
   caracteres en el spike, dentro de los límites del chequeo de `dist` (90 reglas, 2.000
   caracteres).
10. **Gates antes de producción** (requieren la cuenta de Cloudflare, C7). No bloquean el
    desarrollo, pero sí F10:
    - **B3** en un preview real. Si falla: CSP en `<meta>` según la decisión de arriba.
    - B2, H1, H2 y H3 repetidos contra el preview.
    - **`Access-Control-Allow-Origin`:** `wrangler pages dev` agrega `Access-Control-Allow-Origin: *`
      a todas las respuestas en local. Se revisa si Pages también lo envía y, si es así, se decide
      si se quita con `! Access-Control-Allow-Origin` (13).
    - Post Inspector de LinkedIn sobre una página de caso del preview (12).
11. **Presupuesto de JS:** el de 90 KB no se cumple con ninguna de las dos opciones. Lo reemplaza
    [ADR-0013](0013-presupuesto-de-javascript.md).

## Revisar si

- **B3 falla en el preview real.** Se pasa a la CSP en `<meta>` sin reabrir D4 y se anota aquí y en
  ADR-0008.
- Aparece una necesidad real de render en servidor por petición (contenido dinámico, sesión): 14.
- React Router depreca o rompe `prerender` con `ssr: false`, o el export `meta`.
- El número de rutas lleva `_headers` cerca del límite del chequeo de `dist` (90 reglas).
- El JS del framework crece tanto que el techo de ADR-0013 no se puede cumplir sin cambiar de
  enfoque.
