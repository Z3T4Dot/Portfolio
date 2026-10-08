> **Estado: PLANEADO, fuera de la V1.** Boceto escrito antes del blueprint, cuando se evaluó un backend desde la V1. Se conserva como punto de partida si en V2 aparece una necesidad real de backend (ver `docs/blueprint/14-future.md`). No describe nada que exista.

# Arquitectura del portafolio

El portafolio es en sí mismo una pieza de evidencia: un frontend React y un backend propio
que implementa de verdad lo que el sitio muestra (identidad, autorización, auditoría, detección,
resiliencia y observabilidad). Nada de lo que se presenta como "en vivo" es inventado; lo que
es sintético se etiqueta como sintético.

## Contexto

```text
                 Visitante (navegador)
                         │  HTTPS
                         ▼
        ┌────────────────────────────────────┐
        │  Edge: Caddy                        │  TLS, cabeceras de seguridad (CSP, HSTS…),
        │  - sirve el frontend estático       │  compresión, bloqueo de /metrics
        │  - proxy /api → api:3000            │
        └───────────────┬────────────────────┘
                        │  red interna (docker)
                        ▼
        ┌────────────────────────────────────┐
        │  API: monolito modular (NestJS)     │
        │  ┌──────────┐ ┌───────┐ ┌────────┐  │
        │  │ identity │ │ authz │ │ audit  │  │
        │  └──────────┘ └───────┘ └────────┘  │
        │  ┌─────┐ ┌──────┐ ┌─────┐ ┌──────┐  │
        │  │ soc │ │ game │ │ lab │ │ obs  │  │
        │  └─────┘ └──────┘ └─────┘ └──────┘  │
        └──────┬───────────────────┬─────────┘
               │                   │
               ▼                   ▼
        ┌────────────┐      ┌────────────┐
        │ PostgreSQL │      │   Redis    │  streams (audit, auth-events),
        │     16     │      │     7      │  caché del lab, rate limiting
        └────────────┘      └────────────┘
```

Fronteras de confianza: (1) internet → edge, (2) edge → API, (3) API → datos. Postgres y Redis
no tienen puertos publicados. `/metrics` solo es accesible desde la red interna.

## Por qué un monolito modular

Es un sitio de bajo tráfico con un solo equipo. Microservicios añadirían despliegues, red y
consistencia distribuida sin beneficio. Los módulos se separan como si fueran servicios:

- Cada módulo es dueño de sus tablas. Ningún módulo consulta tablas de otro.
- La comunicación entre módulos es por interfaces de servicio exportadas o por eventos
  (Redis Streams). Nunca importando repositorios ajenos.
- Si un módulo tuviera que extraerse a un servicio, su frontera ya existe.

Ver ADR correspondiente en `docs/adr/`.

## Módulos del backend

| Módulo     | Responsabilidad | Datos |
|------------|-----------------|-------|
| `identity` | Login con cuentas demo, access tokens RS256 (5 min), refresh tokens rotativos con detección de reutilización, revocación por familia y global, JWKS. | `identity_subjects`, `refresh_token_families`, `refresh_tokens` |
| `authz`    | PDP (policy decision point): RBAC + políticas con condiciones, con traza explicable de cada decisión. PEP en recursos demo. | Modelo de políticas en código/YAML versionado |
| `audit`    | Registro de auditoría append-only con cadena de hashes (tamper-evident). Consume el stream `audit`. Verificación de integridad. | `audit_events` |
| `soc`      | Detección sobre eventos de autenticación reales del sitio + generador sintético etiquetado. Reglas mapeadas a MITRE ATT&CK. SSE. | `soc_events`, `soc_alerts` |
| `game`     | Partidas de Cyber Ops: inicio/fin con validación de plausibilidad, leaderboard. | `game_runs` |
| `lab`      | Failure Lab: inyección de fallos **acotada a la sesión del visitante** (Redis caído, latencia, pérdida de peticiones, caché corrupta) sobre una ruta real caché → circuit breaker → base de datos. | `lab_catalog_items` + caché Redis |
| `obs`      | Métricas reales en proceso (latencias p50/p95/p99, errores, cache hit rate). `/metrics` Prometheus y un resumen JSON. | memoria |
| `health`   | Liveness y readiness (Postgres, Redis). | — |

Preocupaciones transversales (globales): request ID, logs estructurados con redacción,
validación con Zod, rate limiting con almacenamiento en Redis, Helmet, CORS con lista blanca,
sobre de error uniforme, validación de variables de entorno al arrancar.

## Aislamiento de visitantes

Los visitantes no comparten estado peligroso entre sí:

- **Cookie `lab_sid`** (anónima, httpOnly, 24 h) identifica al visitante.
- **Identidad**: las cuentas demo son plantillas. Cada login crea un sujeto efímero
  `<usuario>:<visitante>`. La revocación global de un visitante no desconecta a otros.
- **Failure Lab**: los fallos se guardan por `lab_sid` y solo afectan las peticiones de ese visitante.
- **Pseudonimización**: IPs y visitantes se muestran como hashes truncados con sal (HMAC).
- **Retención**: sesiones, eventos y fallos se purgan a las 24–72 h.

## Frontend

React 19 + TypeScript + Vite + React Router. CSS plano con tokens (sin framework de CSS).
Contenido como código tipado (`src/content`), bilingüe ES/EN.

```text
Frontend/src
├── main.tsx, router.tsx        rutas /:lang/...
├── i18n/                       locale, useLocale, useT, rutas por idioma
├── content/                    contenido tipado y bilingüe (proyectos, perfil, ADRs, arquitectura, lab)
├── components/                 layout y primitivas compartidas
├── features/                   una carpeta por funcionalidad (architecture, labs, security…)
├── game/                       Cyber Ops
├── lib/api.ts                  cliente HTTP del contrato
├── hooks/                      hooks compartidos
├── pages/                      una página por ruta (delgadas: componen features)
└── styles/                     tokens.css y base.css
```

Rutas:

| Ruta | Página |
|------|--------|
| `/` | Redirige a `/es` o `/en` según preferencia guardada o idioma del navegador |
| `/:lang` | Home: identidad profesional en 5 segundos |
| `/:lang/about` | Perfil: pilares (ingeniería, seguridad, liderazgo, sistemas de negocio) |
| `/:lang/projects` y `/:lang/projects/:slug` | Casos de estudio |
| `/:lang/security` | Security Lab: Wazuh SOC Lab, laboratorio de identidad, PDP, SOC en vivo |
| `/:lang/architecture` | Arquitectura interactiva de esta plataforma + threat model STRIDE |
| `/:lang/labs` | Failure Lab y observabilidad |
| `/:lang/decisions` y `/:lang/decisions/:slug` | ADRs |
| `/:lang/game` | Cyber Ops |

En desarrollo, Vite hace proxy de `/api` a `http://localhost:3000`.

## Despliegue

Docker Compose en un VPS: `edge` (Caddy + frontend estático), `api`, `postgres`, `redis`.
CI en GitHub Actions: lint, typecheck, tests, build, análisis de seguridad (CodeQL, Trivy,
gitleaks), SBOM, imágenes, despliegue y health check. Detalle en `docs/DEPLOY.md`.

Contrato de la API: `docs/API-CONTRACT.md`.
