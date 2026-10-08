# 04 · Technical architecture blueprint

La V1 es un **sitio estático**: HTML prerenderizado por ruta, hidratado como SPA, servido desde un
CDN. No hay servidor de aplicación, base de datos ni secretos en runtime.

```text
 contenido (TS + MDX)                    navegador
        │                                    ▲
        ▼                                    │ HTML por ruta + JS por ruta
   build (Vite + React Router) ──► dist/ ──► CDN (headers de seguridad, caché)
        │
        ├─ typecheck, lint, tests, verificación de contenido
        └─ prerender de cada ruta × idioma
```

## Stack y justificación

| Pieza | Elección | Por qué | Alternativa descartada y costo |
|---|---|---|---|
| UI | React 19 | Es el stack de César; ecosistema de pruebas maduro | — |
| Lenguaje | TypeScript 6.0, `strict` | Tipos en contenido, juego y rutas. Fijado en 6.0 porque `typescript-eslint` aún no soporta TS 7 | TS 7: compila más rápido, pero hoy rompe el lint |
| Build | Vite 8 | Rápido, simple, estándar | — |
| Router | React Router 8 en **modo framework**, `ssr: false` + `prerender`, `appDirectory: "src"` (**D4**, decidido el 2026-10-06: ADR-0001) | Módulos por ruta con `meta` para SEO, code splitting por ruta y HTML estático por ruta sin servidor | Next.js (ver ADR-0001); SPA sin prerender (los previews sociales no funcionan) |
| Estilos | CSS Modules + tokens CSS (**D1**) | Los tokens son la fuente de verdad del diseño; estilos junto al componente; cero dependencias; el código fuente se lee como sistema de diseño | Tailwind v4: más velocidad al escribir, pero duplica los tokens en `@theme` y llena el MDX de clases |
| Contenido | MDX (`@mdx-js/rollup`) para prosa larga + TS tipado para datos | Ver 05 | — |
| Estado | `useState`/context para idioma y tema; store propio del juego con `useSyncExternalStore` | No hay estado global que justifique una librería | Zustand o Redux: dependencia sin problema que resolver |
| Animación | CSS + View Transitions (**D2**) | Ver 03 | Motion: unos 30–60 KB para efectos que la V1 no necesita |
| Unit/integración | Vitest + Testing Library | Ya instalados | — |
| E2E + a11y | Playwright + `@axe-core/playwright` | Recorridos por audiencia y en ambos idiomas | — |
| Rendimiento | Lighthouse CI sobre el preview desplegado | Mediciones reales con fecha | — |
| Calidad estática | ESLint (`typescript-eslint`, `react-hooks`, reglas de accesibilidad JSX) + Prettier | Detecta errores de accesibilidad al escribir | `eslint-plugin-jsx-a11y` solo declara compatibilidad hasta ESLint 9: en la Fase 0 se elige entre su fork compatible con ESLint 10 o fijar ESLint 9 |
| Runtime de build | Node 24 (≥ 22.22, requisito de `@react-router/dev` 8) | Misma versión en local y en CI | El CI de otros proyectos usa Node 20; aquí no sirve |
| Analítica | Ninguna en V1 | Privacidad, sin banner de cookies, CSP simple (ADR-0011) | Plausible o Umami autohospedado: futuro (14) |

**2026-10-06:** el spike de **D4** pasó A1–A6 con el modo framework, así que el plan B (modo
librería más un script de prerender propio) ya no aplica. Queda un gate antes de producción: B3,
una sola CSP por respuesta en un preview real. Si falla, la CSP pasa a `<meta>` sin cambiar el
router (ADR-0001, [informe del spike](../spikes/d4-prerender.md)).

## Estructura de carpetas

Modo framework de React Router con `appDirectory: "src"`: la app sigue en `src/` (confirmado en el
spike D4 el 2026-10-06 con build, dev, HMR, `typegen` y `tsc`). Al migrar desaparecen `index.html`
y `src/main.tsx`.

```text
Portafolio/
├── Frontend/
│   ├── react-router.config.ts     appDirectory: "src", ssr: false, prerender: rutas generadas
│   │                              desde content/ (con barra final y sin paths con parámetros, 12)
│   ├── vite.config.ts
│   ├── public/
│   │   ├── cv/                    cesar-acosta-cv-es.pdf, cesar-acosta-cv-en.pdf
│   │   └── robots.txt
│   │   (las fuentes woff2 se importan desde src/styles vía Vite, con hash en el nombre (11);
│   │    las imágenes OG se generan en el postbuild, directo en la salida del build (12))
│   ├── scripts/                   post-build: 404 por idioma, genera _headers con CSP por ruta
│   │                              (hashes de los scripts inline de cada HTML), sitemap y
│   │                              verificaciones (11, 13)
│   ├── src/
│   │   ├── root.tsx               shell HTML, <Meta/>, <Links/>, script de tema, ErrorBoundary raíz;
│   │   │                          en las 404 no emite <Scripts> ni <ScrollRestoration> (02)
│   │   ├── routes.ts              tabla de rutas con prefijo /:lang
│   │   ├── entry.server.tsx       entry propio, obligatorio: espera allReady para que el contenido
│   │   │                          diferido quede dentro de <main> (ADR-0001)
│   │   ├── routes/                módulos de ruta delgados: loader (busca contenido), meta, componente
│   │   ├── i18n/                  locales, messages/{es,en}.ts, useT, rutas por idioma
│   │   ├── content/               contenido tipado y bilingüe (05)
│   │   ├── features/
│   │   │   ├── site/              header, footer, navegación, selector de idioma y tema
│   │   │   ├── home/
│   │   │   ├── case-study/        layout de caso, índice de secciones, decisiones, failure modes
│   │   │   ├── security-lab/      layout de capítulos, figuras de evidencia
│   │   │   ├── judgment/
│   │   │   ├── about/             pilares, timeline
│   │   │   └── architecture/      página "cómo está hecho este sitio", ADRs
│   │   ├── game/                  Cyber Ops: core/, platform/, i18n/, shell/, missions/ (09 §16)
│   │   ├── components/
│   │   │   ├── ui/                Button, TextLink, Tag, Figure, CodeBlock, Callout, Metric, Prose
│   │   │   └── diagram/           grafo tipado → SVG (compartido por casos, lab y arquitectura)
│   │   ├── lib/                   utilidades puras: fechas por idioma, storage seguro, cx
│   │   └── styles/                tokens.css, base.css, fonts.css
│   ├── tests/e2e/                 especificaciones de Playwright
│   └── package.json
├── docs/
│   ├── blueprint/                 este documento
│   └── future/                    bocetos PLANEADOS (backend V2)
├── .github/workflows/             CI/CD (11, 13)
└── README.md
```

## Responsabilidades y reglas de dependencia

| Capa | Responsabilidad | Puede importar | No puede importar |
|---|---|---|---|
| `routes/` | Unir URL, contenido, `meta` y feature | todo lo de abajo | — |
| `features/*` | Una funcionalidad de página | `components`, `content` (tipos y loaders), `i18n`, `lib` | otra feature |
| `game/` | Cyber Ops autocontenido | `components/ui`, `i18n`, `lib` | `features`, `content` |
| `components/` | Primitivas reutilizables sin conocimiento de la app | `lib`, `styles` | `features`, `content`, `game` |
| `content/` | Datos y prosa | solo tipos de `content/schema.ts` | componentes de React (el MDX recibe sus componentes en el render) |
| `i18n/` | Idioma y mensajes de UI | `lib` | `features`, `content` |
| `lib/` | Funciones puras | nada de la app | todo lo demás |

Las reglas se verifican con `no-restricted-imports` de ESLint. Una violación rompe el CI. Así la
modularidad se comprueba, no solo se promete (ADR-0007).

## Flujo de datos

1. Cada módulo de ruta tiene un `loader` que obtiene la entidad de contenido por `lang` y `slug`.
   En prerender se ejecuta en build. Si el slug no existe, lanza un 404.
2. `meta` usa esos datos para el título, la descripción, Open Graph, el canonical y hreflang (12).
3. El componente de la ruta compone la feature con esos datos.
4. La prosa MDX se carga solo en el idioma pedido (`import.meta.glob` diferido).
5. La lista de rutas a prerenderizar se genera desde los índices de `content/`: cada ruta por cada
   idioma por cada slug. Los paths llevan **siempre barra final** (si no, el prerender no escribe
   el `_.data` que pide la navegación cliente) y se filtran los paths con parámetros que devuelve
   `getStaticPaths()` (spike D4, 2026-10-06).

Estado del cliente: el idioma sale de la URL; el tema vive en `localStorage` (con try/catch) y en
`data-theme`; el juego tiene su propio estado (09). Nada más.

## Manejo de errores

| Caso | Comportamiento |
|---|---|
| Slug inexistente | 404 prerenderizado, bilingüe, con salidas útiles. La que sirve el host es HTML estático sin hidratar: funciona sin JS y no tiene selector de tema (02). En la navegación cliente, el `loader` lanza 404 y se muestra el NotFound localizado (11 §9) |
| Error de render en una ruta | ErrorBoundary de la ruta: mensaje claro y enlace a Home; el resto del sitio sigue funcionando |
| Error en el juego | Boundary propio del juego: ofrece reiniciar la misión sin recargar el sitio |
| Falla al cargar un módulo de ruta tras un despliegue | React Router recarga **la página actual** una sola vez, sin bucle; no lleva a la de destino, así que el usuario repite la navegación (medido en el spike, 11 §9) |
| Falla al cargar un chunk diferido propio | Se recarga una sola vez (con marca en `sessionStorage` para no entrar en bucle) y, si persiste, se ofrece recargar (11 §9) |
| `localStorage` bloqueado | Todo funciona; solo se pierde la preferencia o el récord |

## Presupuestos de rendimiento

Se miden en CI (11). Si se superan, el CI falla.

**2026-10-06:** el presupuesto original de JS inicial de Home quedó invalidado. El spike midió
98,14 KiB gzip en una SPA mínima y 112,55 KiB gzip en modo framework, y el 96 % es React +
React Router. Lo reemplazan dos presupuestos de ADR-0013; las cifras son propuestas, a confirmar
por César.

| Métrica | Presupuesto |
|---|---|
| Código propio de Home (todo salvo `react`, `react-dom` y `react-router`; brotli-11) | ≤ 15 KiB (ADR-0013; hoy unos 4,6 KiB gzip) |
| JS total de Home (brotli-11) | ≤ 115 KiB (ADR-0013: línea base de 98,56 KiB + presupuesto propio + margen) |
| JS por ruta adicional (gzip) | ≤ 60 KB |
| Chunk del juego (gzip) | ≤ 45 KB JS + ≤ 6 KB CSS (09 §14) |
| LCP (Lighthouse móvil) | ≤ 2.0 s |
| CLS | ≤ 0.05 |
| Fuentes precargadas | 1 archivo |

## Seguridad de un sitio estático

La superficie es pequeña. Por eso conviene nombrarla con precisión en lugar de exagerarla.

| Amenaza | Control |
|---|---|
| Cadena de suministro (dependencias) | Lockfile, Dependabot, auditoría en CI, pocas dependencias |
| Filtración de información confidencial en el repo público | `.private/` en `.gitignore`, gitleaks en CI, checklist de sanitización por caso (06) |
| Despliegue malicioso con un token robado | Token de despliegue con mínimo privilegio, solo en CI; rama protegida |
| XSS | No hay contenido de usuarios; sin `dangerouslySetInnerHTML` salvo HTML generado en build desde el repo; CSP estricta sin `unsafe-inline`, con hashes calculados por ruta en el build (React Router inyecta scripts inline distintos por página y `nonce` requeriría servidor). Base `default-src 'self'` con `object-src`, `frame-src`, `worker-src` y `media-src` en `'none'`; Trusted Types fuera de V1 (spike D4; detalle en 11 §8) |
| Clickjacking | `frame-ancestors 'none'` |
| Rastreo de terceros | Cero scripts de terceros y fuentes propias |

Detalle de cabeceras y escaneos en 11 y 13 (ADR-0008).

## Cómo evolucionaría con backend

Nada en la V1 asume un backend. Si en V2 aparece una necesidad real (14):

- La API se sirve en el mismo origen bajo `/api` desde el edge. Sin CORS ni cookies de terceros.
- Las features que la consuman usan un cliente tipado en `lib/api` generado desde el contrato.
- El boceto existente (`docs/future/`) es el punto de partida: monolito modular, identidad,
  auditoría.
- Las páginas estáticas siguen prerenderizadas; solo las islas interactivas dependen de la API.
