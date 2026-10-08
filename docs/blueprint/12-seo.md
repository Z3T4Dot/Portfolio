# 12 · SEO y descubribilidad

## Objetivo y proporción

La mayoría de las visitas no llegarán por búsqueda. Llegarán por el enlace que César comparte en
LinkedIn, en una postulación o en el CV. "Cesar Acosta" es un nombre común y competir por él en
buscadores no es una meta realista ni prioritaria.

Por eso las prioridades son estas, en orden:

1. **Previews sociales correctos.** Un caso de estudio compartido en LinkedIn muestra su título, su
   descripción y su imagen. Los crawlers de previews no ejecutan JavaScript.
2. **Indexación sin errores técnicos.** HTML real por ruta, canonical, `hreflang`, sitemap y
   status 404 correcto.
3. **Que Google entienda que el sitio es de una persona** (JSON-LD `Person` con `sameAs` a GitHub
   y LinkedIn).

Fuera de alcance: estrategia de keywords, cadencia de publicación, backlinks y herramientas de SEO
de pago. El SEO no compite en prioridad con el producto. Casi todo lo de este documento sale de
la misma tabla de rutas y del contenido que ya existen (04, 05).

---

## Metadata por ruta

### Implementación

- Cada módulo de ruta exporta `meta` y delega en un helper puro,
  `buildMeta({ routeId, lang, params, entity })`, que devuelve título, descripción, canonical,
  alternates, Open Graph, Twitter y JSON-LD.
- `buildMeta` es una función pura con tests unitarios (11), y esa es la razón de usar `meta`. La
  documentación de React Router recomienda desde React 19 usar `<title>` y `<meta>` dentro del
  componente. El export `meta` sigue soportado y no está deprecado. Se prefiere porque concentra
  todo el `<head>` en una función que se prueba sin renderizar. Si React Router lo depreca, se
  migra con el mismo helper.
- Los textos salen del contenido (05): cada entidad tiene `title`, `summary` (la descripción) y,
  opcionalmente, `shareTitle` en ambos idiomas.
- La validación de contenido falla si un título final supera 60 caracteres o si una descripción
  queda fuera de 110–160. Los buscadores truncan por ancho en píxeles, así que es una regla
  práctica, no exacta.

### Patrones de título

El separador es ` | `, como en el `index.html` del spike. El patrón general es
**`{página} | Cesar Acosta`**. Home invierte el orden: **`Cesar Acosta | {rol}`**. En la tabla
aparece solo la parte `{página}`:

| Ruta | ES | EN |
|---|---|---|
| `/` | Página bilingüe: `Cesar Acosta` + rol en ambos idiomas | — |
| `/:lang/` | (Home) rol: `Desarrollador de software` | (Home) role: `Software engineer` |
| `/:lang/work/` | `Casos de estudio` | `Case studies` |
| `/:lang/work/:slug/` | `{título del caso}` | `{case title}` |
| `/:lang/security/` | `Seguridad` | `Security` |
| `/:lang/security/wazuh-soc-lab/` | `Wazuh SOC Lab` | `Wazuh SOC Lab` |
| `/:lang/judgment/` | `Criterio de ingeniería` | `Engineering judgment` |
| `/:lang/judgment/:slug/` | `{título del ensayo}` | `{essay title}` |
| `/:lang/cyber-ops/` | `Cyber Ops: un juego de seguridad` | `Cyber Ops: a security game` |
| `/:lang/cyber-ops/firewall/` | `Cyber Ops · Misión 01: Firewall` | `Cyber Ops · Mission 01: Firewall` |
| `/:lang/cyber-ops/detection/` | `Cyber Ops · Misión 02: Detección` | `Cyber Ops · Mission 02: Detection` |
| `/:lang/cyber-ops/recovery/` | `Cyber Ops · Misión 03: Recuperación` | `Cyber Ops · Mission 03: Recovery` |
| `/:lang/cyber-ops/ending/` | `Cyber Ops: cierre` | `Cyber Ops: debrief` |
| `/:lang/about/` | `Sobre mí` | `About` |
| `/:lang/contact/` | `Contacto` | `Contact` |
| `/:lang/architecture/` | `Cómo está hecho este sitio` | `How this site is built` |
| `/:lang/architecture/decisions/:id/` | `ADR-{id}: {título}` | `ADR-{id}: {title}` |
| 404 | `Página no encontrada` | `Page not found` |

La redacción del rol sigue el posicionamiento de 01 y la decide César.

### Patrones de descripción

- Dicen qué encontrará el lector, en la voz de la guía de contenido: primera persona, concreta,
  sin adjetivos de venta.
- Caso de estudio: el problema y la decisión principal en una frase. Por ejemplo: "Cómo diseñé
  la autorización de un ERP con varios servicios y qué costó mantenerla consistente."
- Ensayo: la tesis. ADR: la decisión y su alternativa principal.
- Ningún número en la descripción, salvo que cumpla el contrato de autenticidad. Un snippet no
  puede mostrar la fuente, así que la regla práctica es no poner números.

### Etiquetas por página

```html
<html lang="es">
<title>…</title>
<meta name="description" content="…">
<link rel="canonical" href="https://<dominio>/es/work/<slug>/">
<link rel="alternate" hreflang="es" href="https://<dominio>/es/work/<slug>/">
<link rel="alternate" hreflang="en" href="https://<dominio>/en/work/<slug>/">
<link rel="alternate" hreflang="x-default" href="https://<dominio>/en/work/<slug>/">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Cesar Acosta">
<meta property="og:title" content="…">            <!-- shareTitle ?? title, sin el sufijo -->
<meta property="og:description" content="…">
<meta property="og:url" content="https://<dominio>/es/work/<slug>/">   <!-- = canonical -->
<meta property="og:locale" content="es_LA">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:image" content="https://<dominio>/og/es/work-<slug>-<hash8>.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="…">         <!-- localizado -->
<meta name="twitter:card" content="summary_large_image">
```

- `og:type`: `website` en Home e índices; `profile` en About (con `profile:first_name` y
  `profile:last_name`); `article` en casos, ensayos, el lab y los ADRs. Los
  `article:published_time` y `article:modified_time` se emiten solo si el contenido tiene fechas
  reales.
- **X/Twitter:** basta `twitter:card`, porque X toma título, descripción e imagen de Open Graph.
  `twitter:creator` solo si César tiene cuenta activa (pendiente).
- **404:** `<meta name="robots" content="noindex">`, sin canonical ni hreflang.
- Todas las URLs son **absolutas** y usan `VITE_SITE_URL` (13): los crawlers sociales no resuelven
  rutas relativas.

---

## Imágenes sociales

### Opciones

| Opción | Costo | Valor | Riesgo |
|---|---|---|---|
| Una imagen por defecto por idioma, hecha a mano | Mínimo | Bajo: todos los enlaces se ven iguales | Ninguno |
| Una por página hecha a mano (Figma) | Alto: unas 60 imágenes (unas 30 rutas × 2 idiomas) y rehacerlas cada vez que cambia un título | Alto | **Desincronización**: título nuevo con imagen vieja |
| **Generadas en el build** (`satori` 0.35.0 → SVG, `@resvg/resvg-js` 2.6.2 → PNG) | Medio: 2 devDependencies, una plantilla JSX y un script. Tiempo de build a medir en el spike | Alto: cada enlace compartido muestra su propio título | Bajo: si la plantilla no cabe, el build falla en lugar de publicar algo roto |
| Servicio en runtime (`@vercel/og`, Workers) | Medio | Alto | Requiere runtime de servidor. Fuera de V1 |

### Recomendación: generar en el build con una sola plantilla tipográfica

Encaja con el hero tipográfico (D8) y con el costo marginal cero: una vez que existe la plantilla,
cada página nueva tiene su imagen sin trabajo extra.

**Especificación de la plantilla:**

- 1200×630 PNG, objetivo ≤ 200 KB para que cargue en cualquier red y en clientes de mensajería con
  límites de tamaño.
- Fondo `--paper` del tema claro, texto `--ink` y una sola marca en `--accent`. Sin gradientes,
  capturas, logos de terceros ni números. Una imagen no puede mostrar la fuente de un dato, así que
  no lleva datos.
- Arriba, el tipo de página localizado ("Caso de estudio", "Case study", "Ensayo", "ADR"). En el
  centro, el título en Archivo al 125 % de ancho, peso 800, máximo 3 líneas y tamaño escalonado
  según el largo. Abajo, "Cesar Acosta" y el dominio.
- **Fuentes:** satori acepta TTF, OTF y WOFF, **no WOFF2** (README de satori, consultado el
  2026-10-05). Se generan una vez instancias estáticas TTF de Archivo con
  `fonttools varLib.instancer` y se commitean en `scripts/og/fonts/`. No se sirven al público.
- **Nombre con hash:** `/og/{lang}/{routeId}-{hash8}.png`, donde el hash cubre el texto y la
  versión de la plantilla. Si cambia el título, cambia la URL y los crawlers bajan la imagen
  nueva. Al ser inmutables, se cachean un año (13).
- `/og/{lang}/default-{hash8}.png` se genera igual, con nombre y rol, para `/` y la 404.
- El chequeo de `dist` (11) falla si alguna ruta no tiene su imagen o si no mide 1200×630.

**Recorte de alcance si el spike se complica:** si satori + resvg no quedan funcionando en medio
día, V1 sale con la imagen por defecto por idioma y `og:title`/`og:description` por página, que
LinkedIn muestra igual. La generación por página pasa a V1.1.

---

## HTML semántico

Las reglas sirven a la vez a lectores de pantalla y a crawlers (03):

- Landmarks `header`, `nav` (con `aria-label` si hay más de uno), `main` y `footer`. Un solo `h1`
  por página y títulos sin saltos de nivel.
- `<article>` para casos, ensayos, ADRs y capítulos del lab; `<section>` con título para sus
  secciones.
- `<time datetime="AAAA-MM-DD">` en toda fecha visible; `<dl>` para metadatos de un caso (rol,
  periodo, stack); `<table>` con `<th scope>` solo para datos tabulares reales.
- `<figure>` + `<figcaption>` para evidencia; texto alternativo en ambos idiomas (05).
- **La navegación son enlaces reales** (`<a href>` con la URL canónica), nunca `onClick` sobre un
  `div`. Las acciones son `<button>`.
- Texto de enlace descriptivo ("Leer el caso de Quantum", no "Ver más"). Los CTA dicen lo que pasa
  (02).
- El selector de idioma es un enlace con `hreflang` y `lang` en su texto.
- `<html lang>` según la ruta, en el HTML estático y no solo después de hidratar.
- Si hay breadcrumbs visibles (ver JSON-LD), van en `<nav aria-label="Breadcrumb">` con `<ol>`.

---

## Canonical, barra final y hreflang

### Forma canónica de la URL

- Prefijo de idioma siempre; slugs en inglés e iguales en ambos idiomas (02).
- **Barra final:** se elige la forma que el host sirve con **200 y sin redirección** para el
  archivo que genera el prerender. React Router escribe `ruta/index.html` (ejemplo en su
  documentación: `build/client/blog/index.html`), y en Pages esa forma es `/es/work/<slug>/`.
  **Confirmado en el spike D4 (H2, 2026-10-06, con `wrangler pages dev`):** `/es/work/alpha/`
  responde 200; `/es/work/alpha` y `/es/work/alpha/index.html` redirigen con 308 a la forma con
  barra. Queda repetirlo en el preview real antes de producción. **Regla fijada: siempre barra
  final**, también en la lista de paths de prerender. Si un path de la lista no termina en `/`, el
  prerender no escribe su `_.data` y la navegación cliente, que pide `<url>/_.data`, falla.
- Una sola función, `href(routeId, lang, params)`, produce la forma canónica como ruta relativa al
  origen. La usan los enlaces internos y el selector de idioma, así que funcionan en cualquier
  entorno. `absoluteUrl()` le antepone `VITE_SITE_URL` para el canonical, los alternates, el
  sitemap y `og:*`. El chequeo de `dist` falla si un enlace interno no usa esa forma.
- Canonical **autorreferente** en cada idioma: la página en español es canónica de sí misma, no de
  la inglesa.
- Los previews usan su alias como origen (13) y además llevan `X-Robots-Tag: noindex`, que
  Cloudflare Pages agrega por defecto a los previews.

### hreflang

| Página | `es` | `en` | `x-default` |
|---|---|---|---|
| Home | `/es/` | `/en/` | `/` (elige idioma: preferencia guardada → navegador → `en`) |
| Cualquier otra | `/es/…/` | `/en/…/` | La versión en inglés (el mismo fallback de 02) |

- Códigos `es` y `en` sin región: el español es neutro y apunta a todo el público hispanohablante.
- Los alternates van en el `<head>` y también en el sitemap, generados por la misma función. El
  test de `dist` verifica que todos los alternates sean recíprocos.
- `/` es una página estática mínima y bilingüe. Tiene enlaces a `/es/` y `/en/`, sus propios
  `hreflang`, metadata y `og:image` por defecto. Además lleva un script inline, con hash en la
  CSP, que redirige con `location.replace` según la preferencia. Los crawlers ven una página válida
  con enlaces. No se usa redirección por `Accept-Language` en el edge porque requiere lógica de
  servidor (futuro).

---

## sitemap.xml

Se genera en el postbuild desde la misma tabla de rutas que alimenta el prerender. No puede listar
una página que no existe ni omitir una que sí.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://<dominio>/es/work/<slug>/</loc>
    <lastmod>AAAA-MM-DD</lastmod>
    <xhtml:link rel="alternate" hreflang="es" href="https://<dominio>/es/work/<slug>/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://<dominio>/en/work/<slug>/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://<dominio>/en/work/<slug>/"/>
  </url>
  <!-- una entrada por URL y por idioma, cada una con el grupo completo de alternates -->
</urlset>
```

- **`lastmod` honesto:** sale del campo `updatedAt` del contenido, que se revisa por PR, o se
  omite. **Nunca la fecha del build:** marcaría todas las páginas como actualizadas en cada
  deploy, lo cual sería falso, y Google deja de usar `lastmod` cuando no es confiable.
- No se incluyen `priority` ni `changefreq`, porque Google los ignora.
- Se excluyen la 404 y los archivos que no son páginas. `/` se incluye con su grupo de alternates.
- Verificación en el build: el XML parsea, cada `loc` corresponde a un HTML generado, todo está
  bajo `VITE_SITE_URL` y los alternates son recíprocos. Después del deploy, cada `loc` responde
  200 sin redirección (smoke, 13).

## robots.txt

```text
User-agent: *
Allow: /

Sitemap: https://<dominio>/sitemap.xml
```

- No hay nada que bloquear: el sitio es público y `.private/` nunca se despliega. **No se bloquea
  `/assets/`**, porque Google necesita JS y CSS para renderizar.
- **Crawlers de IA** (GPTBot, ClaudeBot, Google-Extended, etc.): es una decisión de César. La
  recomendación es permitirlos, porque el objetivo del sitio es que lo encuentren, también desde
  asistentes.
- **Cuidado con Cloudflare:** las funciones de robots.txt gestionado y de bloqueo de bots de IA
  pueden **modificar el robots.txt servido** o bloquear crawlers, incluidos los de previews
  sociales si se activa Bot Fight Mode. El smoke compara byte a byte el `robots.txt` servido con el
  del build y pide una página con user-agent de LinkedInBot (13).

---

## Datos estructurados (JSON-LD)

Se emiten con el descriptor `"script:ld+json"` del export `meta`. Son bloques de datos que no se
ejecutan, así que no necesitan hash en la CSP. Confirmado en el spike D4 (B4, 2026-10-06): cero
violaciones. Por este mismo JSON-LD, Trusted Types queda fuera de V1 (11 §8).

| Tipo | Dónde | Por qué aporta |
|---|---|---|
| `Person` | Home (en un `@graph` con `WebSite`) y About | Identifica a la persona y enlaza perfiles (`sameAs`). Es lo que más ayuda con un nombre común |
| `WebSite` | Home | Google lo usa para el nombre del sitio en los resultados |
| `ProfilePage` con `mainEntity` → `Person` | About | Declara que la página trata sobre esa persona |
| `BreadcrumbList` | Páginas de profundidad 2 o más (caso, ensayo, lab, ADR) | Ruta legible en los resultados. **Solo si hay breadcrumbs visibles**, porque los datos estructurados deben reflejar el contenido visible |

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://<dominio>/#website",
      "url": "https://<dominio>/",
      "name": "Cesar Acosta",
      "inLanguage": ["es", "en"],
      "publisher": { "@id": "https://<dominio>/#person" }
    },
    {
      "@type": "Person",
      "@id": "https://<dominio>/#person",
      "name": "Cesar Acosta",
      "url": "https://<dominio>/",
      "jobTitle": "Software engineer",
      "sameAs": ["https://github.com/<usuario>", "https://www.linkedin.com/in/<perfil>"]
    }
  ]
}
```

`jobTitle` va localizado. **No se incluyen:**

- `worksFor`: confidencialidad, pendiente de D7.
- `knowsAbout`: invita a la sopa de tecnologías que 01 descarta.
- `image`: la foto es opcional y está pendiente.
- `Article`/`BlogPosting`: poco valor fuera de medios.
- `FAQPage`: Google lo restringió a sitios de gobierno y salud.
- `Review`/`Rating`: autoevaluaciones prohibidas.
- `SoftwareSourceCode`: no genera resultado enriquecido.

---

## Cómo se prueba

### Automático (en cada PR, sobre `build/client`, ver 11)

- Contrato SEO por HTML: título único, descripción en rango, canonical igual a `og:url`, grupo
  `hreflang` completo y recíproco, `og:image` que existe y mide 1200×630, `twitter:card`, JSON-LD
  que parsea, `<html lang>` correcto, 404 con `noindex`.
- Contenido sin JS: Playwright con `javaScriptEnabled: false` encuentra `h1` y texto principal.
- Sitemap y robots válidos.

### Manual (antes del lanzamiento y al publicar cada página nueva)

| Qué | Herramienta |
|---|---|
| Lo que ve un crawler social sin JS | `curl -s -A "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)" https://<url> \| grep -E '<title>\|og:\|twitter:\|canonical'` |
| Imagen social | `curl -sI https://<dominio>/og/…png`: 200, `image/png`, tamaño |
| Preview en LinkedIn | LinkedIn Post Inspector (también fuerza a refrescar la caché de LinkedIn) |
| Preview en Facebook y WhatsApp | Sharing Debugger de Meta; envío a uno mismo en WhatsApp |
| Preview en X, Slack y Teams | Borrador de post o mensaje a uno mismo |
| JSON-LD | Rich Results Test de Google y validator.schema.org |
| Indexación (tras el lanzamiento) | Google Search Console (propiedad de dominio verificada por DNS): enviar sitemap, inspeccionar Home ES/EN y el caso principal. Bing Webmaster Tools importando desde Search Console |

- Los previews de Pages llevan `X-Robots-Tag: noindex`. Eso impide indexar, no descargar la página,
  y se espera que los scrapers sociales generen el preview igual. Se verifica con Post Inspector en
  el primer preview; si no funciona, la prueba social se hace en producción después del deploy. Si
  se protegen los previews con Cloudflare Access, los scrapers no pueden verlos (13).
- Cada revisión manual queda en `docs/quality/seo/AAAA-MM-DD.md`.

---

## D4: prerender en build

**Estado: decidido (2026-10-06).** React Router 8 en modo framework con prerender en build
(`ssr: false`, `appDirectory: "src"`) y CSP por ruta con hashes en `_headers`
([ADR-0001](../adr/0001-prerender-con-react-router.md)). Evidencia: [informe del spike
D4](../spikes/d4-prerender.md). A1–A6 pasan; A7 falla en las dos opciones y lo resuelve
[ADR-0013](../adr/0013-presupuesto-de-javascript.md). B3 pasa en local y queda como **gate antes de
producción** en un preview real (requiere cuenta de Cloudflare). Si falla, la CSP pasa a `<meta>`
sin reabrir D4. El resto de esta sección es el registro de la investigación y del spike.

### Lo que dice la investigación (2026-10-05)

| Fuente | Hallazgo |
|---|---|
| `npm view @react-router/dev version` | **8.4.0**, publicado el 2026-09-15; la misma versión que `react-router` 8.4.0 del spike |
| `npm view @react-router/dev peerDependencies` | `vite ^7 \|\| ^8` (proyecto: 8.3.2 ✓), `react-router ^8.4.0` ✓. Opcionales (`peerDependenciesMeta`): `typescript ^5.1 \|\| ^6 \|\| ^7` (6.0 ✓), `wrangler ^4`, paquetes RSC |
| `npm view @react-router/dev engines` | `node >=22.22.0`. El equipo de César tiene v24.14.0 ✓; el CI usará Node 24 |
| README en npm | Vacío. La referencia es la documentación oficial |
| Docs "Pre-Rendering" | `prerender` existe **solo en modo framework** (no en data ni declarative). Acepta `true`, una lista de paths o `async ({ getStaticPaths }) => paths`, y `{ paths, concurrency }`. Genera `[url].html` + `[url].data`; el ejemplo escribe `build/client/blog/index.html` |
| Docs "Pre-Rendering" con `ssr: false` | `headers` y `action` prohibidos. `loader` permitido en rutas prerenderizadas, donde se ejecuta en build. Las rutas no prerenderizadas usan `__spa-fallback.html` cuando `/` está prerenderizada |
| Docs "SPA Mode" | `ssr: false` solo desactiva el render en runtime; el código debe poder renderizarse en build (sin `window` en el render inicial) |
| Changelog 8.0.0 | El prerender ahora usa el flujo del preview server. Exige Vite 7+, Node 22.22+ y React 19.2.7+; elimina `react-router-dom`; `meta` recibe `loaderData` (se quitó `data`) |
| Docs "Security" | La guía de CSP es solo con `nonce` (servidor por petición). Para estático hacen falta hashes en el build (11) |
| `npm view vite-react-ssg peerDependencies` | 0.9.2 requiere `react-router-dom ^6.14.1`: **incompatible** con React Router 8 |
| `npm view vite-plugin-ssg version` | 0.1.0: sin madurez |

**Conclusión:** la función existe, está documentada y es compatible con las versiones instaladas.
El spike actual usa `react-router` en modo librería (`createRoot` en `main.tsx`), así que adoptar
D4 implica **migrar a modo framework**: plugin `reactRouter()` de `@react-router/dev/vite` en
lugar de `@vitejs/plugin-react`, `src/root.tsx`, `src/routes.ts`, `src/entry.server.tsx` y
`react-router.config.ts` con `appDirectory: "src"` (carpeta confirmada en el spike). Con un spike
tan pequeño, el costo es bajo.

### Alternativas

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| **React Router 8 en modo framework con `ssr: false` + `prerender`** | Oficial y documentado; `loader` en build; `meta` por ruta; code splitting por ruta; `.data` para navegación cliente; `typegen` | Migración a modo framework; scripts inline distintos por página (CSP por ruta, 11); acoplamiento a sus convenciones | **Adoptada** el 2026-10-06 (ADR-0001) |
| Script propio: modo librería + `createStaticHandler`/`StaticRouterProvider` + `prerenderToNodeStream` de `react-dom/static` + build SSR de Vite | Control total; nada oculto | Unas 200–300 líneas propias: head, assets y `modulepreload` desde el manifest de Vite, datos de hidratación, 404, `.data`. Es reinventar lo que el framework ya resuelve | **Plan B**; no hizo falta (A1–A3 pasaron) |
| `vite-react-ssg` / `vite-plugin-ssg` | Poco código | Incompatible con React Router 8 o inmaduro | Descartada |
| Next.js con `output: 'export'` | SSG maduro, Metadata API | Cambia todo el stack; los `headers` de `next.config` no aplican en export; ADR-0001 | Descartada (ADR-0001) |
| Astro (islas) | Hecho para sitios de contenido; poco JS | Cambia stack y modelo; el juego quedaría como isla React | No evaluada a fondo; se considera solo si fallan A y B |
| SPA sin prerender + servicio externo (Prerender.io) | Ninguno | Tercero, costo, HTML distinto para crawlers y usuarios | Descartada |

### Spike de Fase 0 (D4 + CSP + hosting)

**Objetivo:** decidir D4 con evidencia y fijar las incógnitas que 11 y 13 marcan como "se confirma
en el spike". **Duración:** 1,5 días como máximo (plan B: 1 día más si hace falta).
**Rama:** `spike/d4-prerender`.

**Montaje mínimo:**

- `@react-router/dev@8.4.0`, modo framework, `ssr: false`, `prerender` con
  `async ({ getStaticPaths })` y paths generados desde un índice de contenido de prueba.
- Rutas: `/`, `/:lang/`, `/:lang/work/`, `/:lang/work/:slug/` (2 slugs), `/:lang/cyber-ops/` (chunk
  diferido de prueba) y una ruta catch-all para la 404. Con dos idiomas son unas 12 páginas.
- `root.tsx` con `Layout`, script de tema, `meta` con `buildMeta()`, una página MDX (para probar
  `@mdx-js/rollup` junto al plugin de React Router) y un `loader` en una ruta de contenido.
- Postbuild mínimo: hashes de CSP → `_headers`, sitemap y copia de 404 si hace falta.
- Servido con `wrangler pages dev build/client` y desplegado una vez a un preview real de
  Cloudflare Pages (cuenta de César).

**Criterios. Cada uno pasa o falla, y el resultado se anota con fecha.** La columna de resultado
resume el [informe del spike](../spikes/d4-prerender.md) (2026-10-06); "local" es
`wrangler pages dev`.

| # | Criterio | Pasa si | Resultado (2026-10-06) |
|---|---|---|---|
| A1 | HTML por ruta | Cada path de la lista tiene su HTML con `h1` y texto principal dentro de `<main>` sin JavaScript | Pasa, solo con `entry.server.tsx` propio que espera `allReady` |
| A2 | Head en el HTML estático | Título, descripción, canonical, `hreflang`, `og:*` y JSON-LD están **en el `<head>`** del HTML generado (no se inyectan al hidratar) y son distintos por ruta | Pasa |
| A3 | Hidratación limpia | Cero errores o warnings de hidratación en consola, en dev y en build, en todas las rutas; la navegación cliente funciona (y pide `.data` sin errores) | Pasa. La 404 no se hidrata por diseño |
| A4 | `<html lang>` | Correcto por idioma en el HTML estático | Pasa |
| A5 | Chunk diferido | Ninguna ruta salvo `cyber-ops` referencia el chunk del juego; se carga al navegar a esa ruta | Pasa |
| A6 | DX | HMR funciona con MDX + plugin de React Router; `react-router typegen && tsc` pasa con TS 6.0; ESLint con `typescript-eslint` 8.71 pasa. Se anota el tiempo de build (MEDIDO) | Pasa; build de 7,1 s (mediana de 5) |
| A7 | Peso real | Se mide el JS inicial de Home en gzip (MEDIDO) contra el presupuesto original de 04. Si no lo cumple, no bloquea D4, pero obliga a un ADR que corrija el presupuesto o el enfoque | Falla en las dos opciones (112,55 KiB gzip; SPA 98,14 KiB). Presupuesto reemplazado por ADR-0013 |
| B1 | Scripts inline | Se anota cuántos scripts inline tiene cada página y si su contenido cambia por ruta | 6 por página, 7 en `/`, 1 en las 404; cambian por ruta |
| B2 | CSP por hashes | Con la CSP generada, cero `securitypolicyviolation` en Chromium, Firefox y WebKit en todas las rutas, con `wrangler pages dev` **y** en el preview real; sin `unsafe-inline` | Pasa en local con `default-src 'self'`; preview pendiente |
| B3 | Una sola CSP por respuesta | En el preview real, cada respuesta HTML trae exactamente una cabecera `Content-Security-Policy` (comprueba el uso de `! Content-Security-Policy` sobre la regla `/*`) | Pasa en local. **Preview pendiente: gate antes de producción** |
| B4 | JSON-LD y Trusted Types | El bloque `ld+json` no genera violaciones; con `require-trusted-types-for 'script'` se anota si hay violaciones (decide si entra en V1) | JSON-LD pasa; Trusted Types fuera de V1 |
| B5 | Recarga tras un deploy | Al borrar un chunk de ruta y navegar, React Router recarga una sola vez y se recupera | Pasa con un matiz: recarga la página actual, no la de destino; el usuario repite la navegación |
| H1 | 404 real | En el preview, `/es/no-existe` responde **status 404** con contenido en español útil sin JS y sin errores de hidratación con JS; lo mismo en inglés y en una ruta sin prefijo | Pasa en local; preview pendiente |
| H2 | Barra final | Cada `loc` del sitemap responde **200 sin redirección** en el preview; se anota qué hace el host con la otra forma | Pasa en local (la forma sin barra redirige con 308); preview pendiente |
| H3 | Paridad local | `wrangler pages dev` aplica `_headers` y `_redirects` igual que el preview; si no, el E2E de cabeceras se mueve al preview | Aplica ambos en local; comparación con el preview pendiente |
| H4 | Satori | Una imagen OG generada con la plantilla y la fuente TTF instanciada en el tiempo previsto (medio día) | Omitido por tiempo; no decide D4 |

**Regla de decisión:**

- **A1–A5 y B2–B3 pasan** → D4 = React Router en modo framework con prerender. Se escribe el ADR
  con los resultados medidos.
- **A1–A5 pasan y B2 o B3 falla** → se adopta igual el modo framework y la CSP pasa al plan B de
  11 (`<meta http-equiv>` por página + cabecera con `frame-ancestors`). Queda registrado en el ADR
  de CSP.
- **Falla A1, A2 o A3** → plan B (script propio) con los mismos criterios y 1 día más. Si también
  falla, se reevalúa Astro antes de seguir.
- H1–H4 no deciden D4. Fijan detalles de 11 y 13.

**Aplicación (2026-10-06):** A1–A5 pasan y B2–B3 pasan en local, así que D4 = modo framework con
prerender (ADR-0001). Como B3 solo se pudo medir en local, se verifica en un preview real como gate
antes de producción. Si falla ahí, se aplica la segunda regla (CSP en `<meta>`) sin reabrir D4.
Los hallazgos que pasan a requisitos de V1 (entry de servidor propio, barra final, filtro de paths
con parámetros, 404 sin hidratar, plantilla CSP, Trusted Types fuera) están en las consecuencias
de ADR-0001.

---

## Fuera de V1 (futuro)

| Elemento | Qué lo justificaría |
|---|---|
| Redirección por `Accept-Language` en el edge | Que el salto con JS desde `/` moleste de verdad (requiere Worker o Function) |
| Imágenes OG en runtime | Contenido dinámico, que no existe en V1 |
| `Article` en ensayos, RSS/Atom | Publicación frecuente de ensayos |
| Medición de búsquedas (Search Console como métrica de producto) | Preguntas concretas sobre descubrimiento que justifiquen revisarla |
| `twitter:creator` | Que César use X activamente |
| Más tipos de JSON-LD | Un resultado enriquecido concreto que aplique |

## Decisiones para César

1. **D4:** decidido el 2026-10-06: modo framework con `prerender` (ADR-0001). Pendiente solo B3 en
   un preview real, como gate antes de producción.
2. **Imágenes sociales:** generadas en el build (recomendado) o solo la imagen por defecto en V1.
3. **Breadcrumbs visibles** en páginas profundas (habilitan `BreadcrumbList`). Afecta a 03.
4. **Crawlers de IA:** permitir (recomendado) o bloquear. Hay que revisar los ajustes de Cloudflare
   para que coincidan.
5. **Texto del rol** en títulos y en `jobTitle` (01).
6. **URLs de GitHub y LinkedIn** para `sameAs`; cuenta de X, si existe.
7. **¿Incluir `worksFor`?** Depende de D7.
