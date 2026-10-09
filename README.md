# Portafolio · Cesar Acosta

Portafolio personal de Cesar Acosta, desarrollador de software. Sitio bilingüe (ES/EN), en
desarrollo.

*Personal portfolio of Cesar Acosta, software engineer. Bilingual (ES/EN), work in progress.*

## Contexto

El portafolio se construye como un producto de ingeniería, no como una landing page. En lugar de
una lista de tecnologías, muestra criterio técnico: el problema, la arquitectura, las decisiones y
lo que costaron, los modos de falla y las lecciones de cada proyecto.

Todo lo que aparece en el sitio sigue un **contrato de autenticidad**:

- **Existencia:** real, experimento o planeado. Nunca se mezclan.
- **Datos:** medido (con herramienta y fecha), contado en el repositorio o simulado (etiquetado). Un
  número sin fuente no se publica.
- **Confidencialidad:** público, sanitizado o confidencial. El trabajo para empleadores y clientes
  se publica sanitizado.

El modelo de contenido aplica este contrato en el build: un caso en borrador nunca llega a
producción.

## Estado

V1 en construcción.

| Hecho | Pendiente |
|---|---|
| Shell bilingüe prerenderizado, Home, Sobre mí, Contacto | Cyber Ops (juego de tres misiones) |
| Motor de casos de estudio (primer caso en borrador) | Security Lab, Criterio (ensayos), Arquitectura del sitio |
| CSP por ruta, sitemap, 404 real | Nueva dirección visual y despliegue en Cloudflare Pages |

## Stack

React 19 · TypeScript 6 · React Router 8 (modo framework con prerender) · Vite 8 · MDX ·
CSS Modules con design tokens · Vitest · Testing Library · Playwright · ESLint · Prettier

## Estructura

```text
Frontend/              el sitio
docs/blueprint/        especificación de la V1: producto, arquitectura, diseño, calidad, roadmap
docs/adr/              decisiones de arquitectura
docs/spikes/           informes de spikes, con mediciones
spikes/d4-prerender/   proyecto de evidencia del spike de prerender
```

## Correrlo en local

Requiere Node 24.

```bash
cd Frontend
npm install
npm run dev                         # http://localhost:5173/es/
npm run build && npm run serve:dist # build de producción en http://localhost:8788/es/
npm test                            # unitarias y de componentes
npm run test:e2e                    # smoke E2E (Playwright)
```

En desarrollo, los casos en borrador se ven marcados "BORRADOR". `VITE_SHOW_DRAFTS=false` los
oculta.

## Documentación

Empieza por [`docs/blueprint/00-README.md`](docs/blueprint/00-README.md): reglas, contrato de
autenticidad, alcance y decisiones.
