# 13 · Despliegue

Lo que se despliega es una carpeta estática (`build/client`) con dos archivos de configuración del
host: `_headers` y, si hace falta, `_redirects`. No hay servidor, base de datos ni secretos en
runtime.

**Principio:** el host solo sirve archivos. **Todo se construye y se verifica en nuestro CI**, y
solo el CI despliega lo que pasó los gates. Por eso no se usa la integración Git del host, que
compila y publica cada push sin mirar los checks.

## Pipeline

```text
Repositorio (GitHub, público)
   │  PR o push a main
   ▼
CI: GitHub Actions, runners de GitHub (ubuntu), Node 24 (.nvmrc)
   │  npm ci + npm audit signatures
   ▼
Build
   │  react-router build (prerender por ruta × idioma)
   │  postbuild: imágenes OG → sitemap.xml → 404 por idioma → hashes CSP → _headers
   ▼
Tests
   │  tipos, lint, unitarios y de componentes, validación de contenido
   │  chequeos sobre build/client (SEO, enlaces, CSP, bundle)
   │  E2E + axe contra wrangler pages dev (mismas _headers que producción)
   ▼
Security checks
   │  dependency review · gitleaks (con reglas de confidencialidad) · CodeQL
   ▼
Preview (solo PR) ──► smoke + Lighthouse CI ──► checks requeridos ──► merge
   ▼
Producción (main): mismo pipeline → wrangler pages deploy --branch main → smoke post-deploy
```

El detalle de jobs, navegadores y gates requeridos está en 11, sección 11.

**Runners:** solo los de GitHub. Cualquier runner self-hosted de la infraestructura del trabajo
queda excluido por dos motivos: separa la infraestructura del empleador de un proyecto personal, y GitHub desaconseja
runners self-hosted en repos públicos porque un PR de un fork podría ejecutar código en esa
máquina.

## Entornos

| Entorno | URL | Cómo se crea | Indexable | `VITE_SITE_URL` |
|---|---|---|---|---|
| Desarrollo | `http://localhost:5173` | `npm run dev` | — | `http://localhost:5173` |
| Local tipo producción | `http://localhost:8788` | `npm run build && npm run serve:dist` (`wrangler pages dev build/client`) | — | `http://localhost:8788` |
| Preview de PR | `https://pr-<n>.<proyecto>.pages.dev` | CI, solo PRs del mismo repo | No (`X-Robots-Tag: noindex`, que Pages agrega a todo preview) | El alias del PR |
| Producción | `https://<dominio>` | CI, push a `main` con todos los gates en verde | Sí | `https://<dominio>` |

**Sin staging en V1.** El preview del PR ya ejecuta smoke y Lighthouse sobre la plataforma real. El
ruleset exige que la rama esté al día con `main` antes de mergear, así que el árbol que se previsó
es el que se despliega. La única diferencia entre ambos artefactos es `VITE_SITE_URL` y los
metadatos del build. El riesgo residual se cubre con el smoke post-deploy y un rollback que tarda
un minuto. Una etapa de staging con promoción del mismo artefacto queda en "Fuera de V1".

---

## Hosting (D3)

### Comparación

| Criterio | Cloudflare Pages | Netlify | Vercel | GitHub Pages | VPS propio (Docker + Caddy) |
|---|---|---|---|---|---|
| Cabeceras propias y CSP por ruta | Sí: `_headers` por ruta (máximo 100 reglas y 2.000 caracteres por línea) | Sí: `_headers` o `netlify.toml` | Sí: `headers` en `vercel.json` por patrón | **No.** Solo CSP en `<meta>`, sin `frame-ancestors` ni HSTS propios | Total (Caddyfile) |
| Preview por PR | Sí: alias por rama + URL inmutable por deploy; `noindex` automático | Sí (Deploy Previews) | Sí | No nativo | Hay que construirlo |
| 404 real por idioma | Sí: sirve el `404.html` **más cercano** subiendo por el árbol (`/es/404.html`, `/en/404.html`) | Con reglas 404 en `_redirects` por prefijo | Configurable | Un solo `404.html` | Total |
| Rollback | Instantáneo a un deploy de producción anterior (UI o API) | Instantáneo (publicar un deploy anterior) | Instantáneo (Instant Rollback) | Volver a ejecutar un deploy viejo | Volver a desplegar una imagen etiquetada |
| Costo | Plan gratuito; los estáticos no tienen límite de ancho de banda | Plan gratuito por créditos; si se agotan, el sitio puede pausarse (verificar condiciones vigentes) | Hobby gratuito, solo para uso personal no comercial | Gratis en repos públicos | VPS pequeño + horas de operación |
| Lock-in | Bajo: una carpeta + `_headers`/`_redirects`, casi el mismo formato que Netlify | Bajo | Medio (`vercel.json`) | Bajo | Ninguno, pero el mantenimiento es propio |
| Privacidad | El CDN ve IPs, como cualquiera; sin analítica salvo que se active | Similar | Similar; en previews se inyecta su toolbar (desactivable) | Similar | Logs bajo control propio |
| Qué demuestra honestamente | Seguridad configurada como código y verificada en CI | Lo mismo | Lo mismo | Que se renunció a las cabeceras | Operación de servidores. Para un sitio estático es complejidad sin problema que resolver (regla 2) |

GitHub Pages queda descartado por las cabeceras: un portafolio que habla de seguridad no puede
servirse sin CSP real ni `frame-ancestors`. El VPS demuestra una habilidad que César ya ejerce (los
deploys con Docker en servidores propios del trabajo), pero aquí no resuelve ningún problema. Si se quiere mostrar
operación, el lugar es el Wazuh SOC Lab o el backend de V2.

### Recomendación: Cloudflare Pages con Direct Upload desde GitHub Actions

- **`_headers` por ruta** es justo lo que exige la CSP con hashes por página (11).
- **El 404 más cercano** da 404 localizados con status real sin reglas extra.
- **Previews por rama con `noindex` automático** y **rollback instantáneo** sin reconstruir.
- **Ancho de banda gratuito sin límite para estáticos:** si un post de LinkedIn tiene tráfico, el
  sitio no se pausa ni genera costos.
- **Salida barata:** el artefacto es una carpeta y dos archivos de texto con el mismo formato que
  usa Netlify.

Costos y riesgos que se aceptan:

| Riesgo | Mitigación |
|---|---|
| Límite de 100 reglas en `_headers` (unas 30 rutas × 2 idiomas + globales ≈ 65) | Chequeo de `dist` que falla por encima de 90 (11); plan B de CSP en `<meta>`, que no consume reglas |
| Funciones de la zona de Cloudflare que **inyectan scripts o reescriben HTML** | Ver la checklist de abajo; el smoke lo detecta |
| Cloudflare invierte cada vez más en Workers con Static Assets, que tiene guía de migración desde Pages con `_headers`, `_redirects`, previews y rollbacks | Pages sigue soportado y es más simple para un sitio solo estático. Si en V2 hay lógica en el edge, se migra y el artefacto no cambia |
| Concentración: registrador, DNS y hosting en una cuenta | Cuenta **personal** (nunca la de Brandex) con 2FA por llave física o passkey; lo mismo en GitHub |

### Configuración de Cloudflare (checklist de Fase 0)

**Proyecto de Pages:**

- Creado como **Direct Upload**. No se puede convertir a integración Git después, y eso es lo que
  se busca.
- Rama de producción: `main`.
- Sin Web Analytics.

**Zona (cuando exista el dominio), revisando que estén apagadas:**

- **Email Address Obfuscation** (Scrape Shield). Suele venir activada: reescribe los `mailto:` e
  inyecta un script desde `/cdn-cgi/`. Rompería la página de Contacto bajo la CSP.
- **Rocket Loader**, **Zaraz** y la inyección automática de analítica.
- **Bot Fight Mode**: puede desafiar a los crawlers de previews sociales.
- **robots.txt gestionado y bloqueo de crawlers de IA**: deben coincidir con la decisión de 12; si
  no, modifican el `robots.txt` servido.

**Zona, encendido:**

- **Always Use HTTPS**, TLS mínimo 1.2, TLS 1.3 y DNSSEC.

**Comprobación automática:** el smoke verifica que no haya `/cdn-cgi/` en el HTML, que los
`mailto:` estén intactos y que `robots.txt` sea idéntico byte a byte al del build. Una opción que
se encienda sin aviso aparece en el job semanal.

### Primer preview real: gate antes de producción (agregado el 2026-10-06)

El spike D4 verificó todo en local con `wrangler pages dev`, sin cuenta de Cloudflare
([informe](../spikes/d4-prerender.md), "Pendiente"). Con la cuenta (C7), sobre un preview real, se
comprueba la lista de abajo. **Es un gate antes de producción (F10):** ningún deploy a producción
ocurre antes, pero el desarrollo de las demás fases no lo espera.

- **B3:** cada respuesta HTML (páginas y 404) trae **exactamente una** cabecera
  `Content-Security-Policy`. Si falla, la CSP pasa a `<meta http-equiv>` por página más una
  cabecera con `frame-ancestors` (11 §8), sin reabrir D4 (ADR-0001).
- **B2:** el E2E completo con `BASE_URL=<preview>` en Chromium, Firefox y WebKit, sin
  `securitypolicyviolation`.
- **H1 y H2:** las 404 responden 404 con el contenido del idioma; cada `loc` del sitemap responde
  200 sin redirección y la forma sin barra redirige.
- **H3:** las cabeceras del preview coinciden con las de `wrangler pages dev`, incluido
  `X-Robots-Tag: noindex`.
- **`Access-Control-Allow-Origin`:** en local, wrangler agrega `Access-Control-Allow-Origin: *` a
  todas las respuestas. Se revisa si Pages también la envía; si es así, César decide si se quita
  con `! Access-Control-Allow-Origin` en la regla `/*`.
- Post Inspector de LinkedIn sobre una página de caso (12).

## Docker en V1: no

| Lo que Docker aportaría | Cómo se resuelve sin Docker |
|---|---|
| Preview local tipo producción con las mismas cabeceras | `wrangler pages dev build/client` lee los mismos `_headers` y `_redirects`. El spike lo verificó en local (criterio H3 de 12, 2026-10-06); la comparación con el preview real está pendiente. Diferencia conocida: wrangler agrega `Access-Control-Allow-Origin: *` |
| Entorno de build reproducible | `npm ci` + lockfile + `.nvmrc`. Playwright instala sus navegadores fijados por versión |
| Paridad con producción | La paridad real es con Cloudflare, no con un contenedor |

Con Docker + Caddy o nginx, las cabeceras se escribirían **dos veces en dos formatos**: `_headers`
para producción y la configuración del proxy para el contenedor. Las dos fuentes divergerían, que
es el defecto que se quiere evitar.

**Docker entra** si D3 cambia a VPS o con el backend de V2: Dockerfile multi-stage y Caddy con
cabeceras **generadas desde la misma fuente** que `_headers`.

---

## Variables de entorno

No hay variables en runtime. Todas las `VITE_*` se incrustan en el bundle y son públicas por
definición; el CI de ERP-Rental ya lo documenta. **Nunca contienen secretos.**

| Variable | Tipo | Valor | Uso | ¿Secreto? |
|---|---|---|---|---|
| `VITE_SITE_URL` | Build, pública | Producción: `https://<dominio>`; PR: alias del PR; local: `http://localhost:8788` | Canonical, `hreflang`, `og:url`, `og:image`, sitemap, robots | No |
| `VITE_BUILD_SHA` | Build, pública | `github.sha` | Clave de la recarga de chunks (11); commit visible en `/architecture` | No |
| `VITE_BUILD_DATE` | Build, pública | Fecha del commit (`git log -1 --format=%cs`) | "Última actualización" en el footer (02) | No |
| `CLOUDFLARE_ACCOUNT_ID` | CI | Variable del repo | `wrangler` | No (es un identificador) |
| `CLOUDFLARE_API_TOKEN` | CI | Secret de Environment | `wrangler pages deploy` | **Sí** |
| `SANITIZE_DENYLIST` | CI | Secret del repo | Reglas de confidencialidad de gitleaks (11) | **Sí**: su contenido es confidencial |
| `BASE_URL` | CI | URL a probar | Smoke, Playwright, Lighthouse CI | No |

`src/env.ts` valida las variables en el build. En modo producción `VITE_SITE_URL` debe ser https
(salvo localhost) y sin barra final; si no, el build falla. Una variable mal puesta no puede
producir canonicals rotos en silencio.

## Secretos y permisos

| Elemento | Configuración |
|---|---|
| Token de Cloudflare | Token personalizado con **un solo permiso**: `Account › Cloudflare Pages › Edit`, limitado a la cuenta personal. Sin permisos de zona ni DNS. Vence a los 12 meses |
| Dónde vive | GitHub Environments: `preview` y `production`, **cada uno con su propio token** del mismo alcance. Cloudflare no permite limitar un token por rama, así que tener dos sirve para revocar el de previews sin tocar producción |
| Environment `production` | Ramas de despliegue: solo `main`. Aprobación manual: decisión de César (abajo) |
| Environment `preview` | Solo lo usan jobs con `github.event.pull_request.head.repo.full_name == github.repository`. **Nunca forks ni Dependabot**, que de todos modos no reciben secrets de Actions |
| Permisos del workflow | `contents: read` por defecto. Los jobs de deploy no piden más: la URL del Environment aparece en el PR sin dar permisos de escritura |
| Inyección en workflows | Ningún valor controlado por el autor del PR (nombre de rama, título) se interpola en `run:`. Se pasa por `env:`. El alias usa `github.event.number`, que es numérico. CodeQL revisa los workflows (11) |
| Vencimiento | El job semanal llama a `GET /user/tokens/verify` de Cloudflare y falla si al token le quedan menos de 30 días |
| Cuentas | GitHub y Cloudflare personales, con 2FA por llave física o passkey. Nada en organizaciones del empleador |

## Dominio y HTTPS (D6)

- **Dominio pendiente.** Criterios: corto y con el nombre de César. `.dev` está en la lista de
  precarga HSTS de los navegadores, así que el HTTPS es obligatorio desde el primer día, y para un
  perfil de seguridad es coherente. `.com` es el más universal. No se verificó la disponibilidad de
  ninguno.
- **DNS en Cloudflare**, necesario para usar el apex como dominio personalizado de Pages. El
  registrador puede ser Cloudflare Registrar (a costo) u otro.

| Registro | Valor | Motivo |
|---|---|---|
| Apex | Dominio personalizado del proyecto de Pages | Host canónico |
| `www` | Redirección 301 al apex conservando la ruta (Redirect Rule) | Un solo host canónico |
| Verificación | TXT de Google Search Console | Propiedad de dominio (12) |
| Correo, si el dominio no recibe mail | `MX 0 .` (null MX), `TXT "v=spf1 -all"`, `_dmarc TXT "v=DMARC1; p=reject"` | Nadie puede suplantar el dominio de César ante recruiters. Higiene básica y coherente con el perfil |
| Correo, si se usa Email Routing | MX de Cloudflare + SPF de Cloudflare + DMARC | Recibir en `hola@<dominio>` sin servidor de correo |
| CAA (opcional) | Solo si se agregan, incluir las CAs que usa Cloudflare | Que un CA no autorizado no emita certificados. Verificar el comportamiento con Universal SSL al configurarlo |

**HSTS escalonado.** Se declara en `_headers`, la fuente única, y lo verifica el smoke:

1. Lanzamiento: `max-age=86400`.
2. Una o dos semanas sin problemas: `max-age=31536000; includeSubDomains`.
3. Precarga: `max-age=63072000; includeSubDomains; preload` y envío a hstspreload.org. **En la
   práctica no se puede deshacer:** salir de la lista tarda meses en llegar a los navegadores. Con
   `.dev` el TLD ya está precargado y el envío no hace falta, aunque la cabecera se envía igual.

## `_headers` (generado)

`scripts/headers.ts` lo genera desde `headers.config.ts`: cabeceras comunes, caché y política CSP
base, más los hashes que calcula `scripts/csp.ts` por cada HTML. **No se edita a mano** y no vive
en `public/`, porque los hashes dependen del build (ver `scripts/` en 04).

```text
# Generado por scripts/headers.ts. No editar.
/*
  Strict-Transport-Security: max-age=86400
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<404/fallback>'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests

/es/work/<slug>/
  ! Content-Security-Policy
  Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-…' 'sha256-…' 'sha256-…'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests

# … una regla por HTML prerenderizado …

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/og/*
  ! Cross-Origin-Resource-Policy
  Cross-Origin-Resource-Policy: cross-origin
  Cache-Control: public, max-age=31536000, immutable
```

Cloudflare **une con coma** los valores de una cabecera que aplica dos veces, y dos CSP se
intersectan. Por eso cada regla específica quita con `!` lo que hereda de `/*`. En local, el spike
D4 confirmó que cada respuesta queda con una sola CSP. En un preview real (criterio B3 de 12) es un
**gate antes de producción** (sección anterior), y después lo vigila el smoke.

**Plantilla CSP (cambio del 2026-10-06, spike D4):** `default-src 'self'` en lugar de `'none'`,
porque Firefox bloquea con `'none'` el prefetch de `_.data` de `<Link prefetch="intent">`. Lo
demás se cierra con `object-src`, `frame-src`, `worker-src` y `media-src` en `'none'`.
`upgrade-insecure-requests` solo se emite si el origen es https. Sin Trusted Types en V1. Detalle
en 11 §8.

`_redirects` está vacío en V1. **Los slugs son estables.** Si uno cambia, se agrega un 301 del slug
viejo al nuevo, para que un enlace ya compartido en LinkedIn nunca termine en 404.

## Caché

| Recurso | Cache-Control | Motivo |
|---|---|---|
| `/assets/*` (JS, CSS y fuentes con hash de Vite) | `public, max-age=31536000, immutable` | El nombre cambia si cambia el contenido |
| `/og/*` (nombre con hash, 12) | `public, max-age=31536000, immutable` | Ídem |
| HTML (`*/index.html`, `404.html`) | Por defecto de Pages: `public, max-age=0, must-revalidate` + `ETag` | Un deploy se ve de inmediato. Si se revalida, la petición se resuelve con 304 |
| `*.data` (datos de navegación de React Router) | Por defecto (revalidar) | Nombre sin hash; un caché largo serviría contenido viejo después de un deploy |
| `sitemap.xml`, `robots.txt`, `/.well-known/security.txt`, `/cv/*.pdf` | Por defecto (revalidar) | Nombre estable; el CV nunca queda viejo |

- Solo se fija `Cache-Control` donde difiere del valor por defecto, para no combinar dos valores
  en la misma cabecera. El smoke comprueba el valor **exacto** en un asset y en un HTML.
- La recuperación de chunks después de un deploy (11) **depende** de que el HTML se revalide. Si
  alguien sube el caché del HTML, se rompe esa garantía.

**Service worker: no en V1.**

- No hay requisito offline y el HTTP caching de arriba ya da casi todo el beneficio en visitas
  repetidas.
- Un service worker agrega el peor modo de falla de un sitio estático: HTML viejo en caché que pide
  chunks que ya no existen, justo el problema que 11 resuelve. Además suma `worker-src` a la CSP y
  un ciclo de actualización más que depurar.
- Entraría si Cyber Ops se vuelve jugable offline (14).

---

## Workflow de despliegue (boceto)

Forma parte de `.github/workflows/ci.yml` (11). Las actions van fijadas por SHA.

```yaml
permissions:
  contents: read

jobs:
  # verify, security, build, e2e: ver 11

  preview:
    if: >-
      github.event_name == 'pull_request' &&
      github.event.pull_request.head.repo.full_name == github.repository &&
      github.actor != 'dependabot[bot]'
    needs: [build, e2e]
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@<sha>
        with: { persist-credentials: false }
      - uses: actions/setup-node@<sha>
        with: { node-version-file: Frontend/.nvmrc, cache: npm, cache-dependency-path: Frontend/package-lock.json }
      - run: npm ci
        working-directory: Frontend
      - uses: actions/download-artifact@<sha>
        with: { name: site, path: Frontend/build/client }
      - id: deploy
        working-directory: Frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          PR_NUMBER: ${{ github.event.number }}
        run: |
          npx wrangler pages deploy build/client --project-name=<proyecto> --branch="pr-$PR_NUMBER"
          echo "url=https://pr-$PR_NUMBER.<proyecto>.pages.dev" >> "$GITHUB_OUTPUT"

  preview-checks:
    needs: preview
    # smoke (scripts/smoke.ts) + Playwright @smoke + Lighthouse CI contra la URL del preview

  deploy-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [build, e2e, gitleaks]
    runs-on: ubuntu-latest
    concurrency: { group: deploy-production, cancel-in-progress: false }
    environment:
      name: production
      url: https://<dominio>
    steps:
      # checkout, setup-node, npm ci y download-artifact, igual que en preview
      - working-directory: Frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: npx wrangler pages deploy build/client --project-name=<proyecto> --branch=main --commit-hash="$GITHUB_SHA"

  smoke-production:
    needs: deploy-production
    # smoke + Playwright @smoke + Lighthouse (registro, no gate) contra https://<dominio>
```

`wrangler` es una devDependency fijada por el lockfile: local y CI usan la misma versión. 4.147.0
era la última el 2026-10-05.

## Rollback

**Runbook:**

1. **Detectar.** Falla el smoke post-deploy (GitHub notifica), el job semanal o llega un aviso.
2. **Decidir, en 5 minutos como máximo.** Si el sitio está roto, faltan cabeceras de seguridad o
   hay contenido que no debía publicarse, se hace rollback. Si es cosmético, se corrige hacia
   adelante.
3. **Rollback.** En Cloudflare: Workers & Pages → `<proyecto>` → Deployments → último deploy de
   producción sano → *Rollback*. Restaura **a la vez** HTML, assets y `_headers` (CSP y cabeceras),
   sin rebuild. También existe un endpoint de API de rollback; se verifica en Fase 0 por si conviene
   un `workflow_dispatch`.
4. **Verificar.** Ejecutar el workflow de smoke a mano (`workflow_dispatch`) contra producción.
5. **Corregir `main`.** `git revert <sha>` por PR, por el pipeline normal. **No se mergea nada más
   hasta entonces**, porque el siguiente deploy reintroduciría el problema.
6. **Registrar.** Una nota breve en `docs/quality/incidents/AAAA-MM-DD.md`: qué pasó, impacto,
   cómo se detectó y qué cambió.

**Lo que el rollback no deshace:**

- El HSTS cacheado en los navegadores. Por eso la precarga es una decisión aparte.
- Los previews ya cacheados por LinkedIn. Se refrescan con Post Inspector.
- Cambios de DNS o de zona.
- Si el problema es contenido confidencial, el rollback lo quita del sitio pero **sigue en la
  historia de git**. Hace falta reescribir la historia del repo público y asumir que pudo copiarse.
  Por eso gitleaks es un gate.

**Simulacro:** antes del lanzamiento se hace un rollback de prueba y se registran fecha y duración
(MEDIDO). Es un ítem de la Definition of Done (16).

## Health checks post-deploy

`scripts/smoke.ts` corre en Node con `fetch`, sin navegador, y recibe `--base-url` y
`--expect preview|prod`. Reintenta durante 60 s para dar tiempo a la propagación.

| # | Verificación | Falla si… |
|---|---|---|
| 1 | Cada `loc` del `sitemap.xml` **servido** | No responde 200 sin redirección, no es `text/html`, `<html lang>` no coincide con el prefijo o el canonical no es la `loc` |
| 2 | `/` | No responde 200 o no tiene `hreflang="x-default"` |
| 3 | `/es/__smoke-404/`, `/en/__smoke-404/`, `/__smoke-404` | No responde **404** con el texto del idioma correcto |
| 4 | Cabeceras de seguridad en una muestra de HTML | No hay **exactamente una** CSP; aparece `unsafe-inline`; falta `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP o XFO; en producción falta HSTS o no coincide con la etapa vigente |
| 5 | Indexación | En el preview falta `X-Robots-Tag: noindex`; **en producción aparece** |
| 6 | Caché | Un `/assets/*.js` no tiene exactamente `public, max-age=31536000, immutable`; un HTML o un `.data` tiene caché largo |
| 7 | `sitemap.xml` y `robots.txt` | El XML no parsea o hay `loc` fuera del origen esperado; `robots.txt` difiere del build o no tiene la línea `Sitemap:` |
| 8 | Inyecciones del host | El HTML contiene `/cdn-cgi/` o los `mailto:` de Contacto fueron reescritos |
| 9 | CV | Los PDF no responden 200 `application/pdf` |
| 10 | Crawler social | Con user-agent de LinkedInBot, el caso principal no responde 200 con sus `og:*` (desafío de bots) |
| 11 | `/.well-known/security.txt` | No responde 200 `text/plain` o `Expires` está vencido |

Después del script corre Playwright `@smoke`: un recorrido por idioma con el detector de
violaciones de CSP y de errores de consola (11).

**Cuándo corre:**

| Disparador | Contra | Además |
|---|---|---|
| Preview de PR | Alias del PR | Lighthouse CI con presupuestos (gate) |
| Deploy a `main` | Producción | Lighthouse (registro, no gate) |
| Semanal (cron) | Producción | Certificado TLS con más de 14 días de vigencia; token de Cloudflare con más de 30 días; `security.txt` con más de 30 días; enlaces externos con `lychee` (excluyendo LinkedIn, que responde 999 a bots); gitleaks sobre toda la historia |
| Manual (`workflow_dispatch`) | URL indicada | Tras un rollback |

Si un smoke de producción falla: el job queda en rojo, llega la notificación de GitHub y se aplica
el runbook. **Sin rollback automático en V1.** Con un solo mantenedor, un rollback manual de un
minuto es más seguro que una automatización que puede oscilar entre versiones.

---

## Fuera de V1 (futuro)

| Elemento | Qué lo justificaría |
|---|---|
| Staging con promoción del mismo artefacto a producción | Que aparezca un fallo que el preview del PR no detectó |
| Rollback automático ante un smoke fallido | Más de un mantenedor o deploys frecuentes sin supervisión |
| Migración a Workers con Static Assets | Lógica en el edge (V2) o que Cloudflare deje de mantener Pages |
| Docker + Caddy, con cabeceras generadas desde la misma fuente | D3 = VPS o backend de V2 |
| Redirección por `Accept-Language` en el edge | Ver 12 |
| Monitoreo externo de disponibilidad | Que haya algo cuyo downtime cueste más que el riesgo de sumar un tercero |
| Reportes de CSP y errores en producción | Backend propio (14) |
| Protección de previews con Cloudflare Access | Contenido sensible en revisión. Hoy bloquearía la prueba de previews sociales |
| Releases etiquetados con changelog | Que alguien externo siga las versiones |

## Decisiones para César

1. **D3:** Cloudflare Pages con Direct Upload desde GitHub Actions (recomendado).
2. **D6:** dominio (nombre; `.dev` o `.com`). Es el único costo recurrente de la V1.
3. **Correo en el dominio:** sin correo (null MX + SPF `-all` + DMARC `reject`, recomendado si no
   se usa) o Email Routing a su buzón.
4. **Precarga HSTS:** sí o no, y cuándo. Con `.dev` se resuelve sola.
5. **Aprobación manual** del Environment `production`. Recomendación: no en V1; los gates son la
   aprobación.
6. **Fecha del footer:** fecha del commit desplegado (recomendada: reproducible) o fecha del
   build (02 dice "fecha real del build").
7. **Confirmar** que las cuentas de GitHub y Cloudflare son personales y que ninguna
   infraestructura del empleador (runners, servidores, cuentas) participa en este proyecto.
8. **Ajustes de bots y crawlers de IA** en la zona de Cloudflare, alineados con la decisión de 12.
9. **`Access-Control-Allow-Origin`** (agregado el 2026-10-06): si el primer preview muestra que
   Pages la envía, ¿se quita con `! Access-Control-Allow-Origin`? Se decide con ese dato.
