> **Estado: PLANEADO, fuera de la V1.** Boceto escrito antes del blueprint, cuando se evaluó un backend desde la V1. Se conserva como punto de partida si en V2 aparece una necesidad real de backend (ver `docs/blueprint/14-future.md`). No describe nada que exista.

# Contrato de la API v1

Base: `/api`. JSON UTF-8. El backend implementa exactamente esto; el frontend consume
exactamente esto. Cualquier cambio se acuerda aquí primero.

## Convenciones

- **Errores**: `{ "error": { "code": "snake_case", "message": "texto", "requestId": "..." } }`
  con el status HTTP correcto. Nunca stack traces.
- **Request ID**: toda respuesta lleva `x-request-id`.
- **Textos bilingües** en respuestas: `{ "es": "...", "en": "..." }` (tipo `Localized`).
- **Fechas**: ISO 8601 UTC.
- **Access token**: `Authorization: Bearer <jwt>` RS256, 5 min, claims `sub`, `roles`, `ver`, `fam`, `iat`, `exp`, `iss`, `aud`, `kid` en el header.
- **Refresh token**: cookie `rt` httpOnly, `Secure` en producción, `SameSite=Strict`,
  `Path=/api/identity`. Nunca se expone a JavaScript ni en el body.
- **Visitante**: cookie `lab_sid` httpOnly, `SameSite=Lax`, 24 h. Se emite automáticamente
  si falta en cualquier petición a `/api/*`.
- **CSRF**: las peticiones que mutan estado con cookies exigen la cabecera
  `x-requested-with: portfolio` además de `SameSite`.
- **Rate limiting**: 429 con `retry-after`. Límites: global 120/min por IP;
  login 10/min; game 10/min; lab 60/min por visitante.

## Health y observabilidad

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/health` | `{ "status": "ok" }` |
| GET | `/api/health/ready` | 200/503 `{ "status": "ok"\|"degraded", "checks": { "postgres": "up"\|"down", "redis": "up"\|"down" } }` |
| GET | `/api/observability/summary` | ver abajo |
| GET | `/metrics` | Prometheus (solo red interna; el edge lo bloquea) |

```json
{
  "since": "2026-10-05T12:00:00Z",
  "uptimeSeconds": 3600,
  "requests": { "total": 1234, "perMinute": 12.5 },
  "latencyMs": { "p50": 4, "p95": 18, "p99": 40 },
  "errorRate": 0.004,
  "cache": { "hits": 300, "misses": 40, "hitRate": 0.88 },
  "byRoute": [{ "route": "GET /api/lab/catalog/:id", "count": 200, "p95": 22 }]
}
```

Todo dato es real y medido en proceso desde `since`.

## Identity

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/identity/demo-users` | — | Cuentas demo públicas: `[{ "username", "password", "roles": [], "description": Localized }]` |
| POST | `/api/identity/login` | — | Body `{ "username", "password" }` |
| POST | `/api/identity/refresh` | cookie `rt` + `x-requested-with` | Rota el refresh token |
| POST | `/api/identity/logout` | cookie `rt` + `x-requested-with` | 204. Revoca la familia y borra la cookie |
| POST | `/api/identity/revoke-all` | Bearer | Revocación global del sujeto: sube `ver` y revoca todas sus familias. `{ "revokedFamilies": n, "tokenVersion": n }` |
| POST | `/api/identity/demo/replay-old-refresh` | Bearer + cookie `rt` | Simula que un atacante reutiliza el refresh token anterior de la familia actual. Ejecuta la ruta real de detección por `jti`. `{ "outcome": "family_revoked", "familyId", "detectedAt" }` |
| GET | `/api/identity/session` | Bearer | Estado para visualización (ver abajo) |
| GET | `/api/identity/jwks.json` | — | JWKS con la(s) clave(s) pública(s) RS256 |

Login 200:

```json
{ "accessToken": "eyJ...", "expiresIn": 300, "user": { "subject": "engineer:3f9a1c", "username": "engineer", "roles": ["engineer"] } }
```

Errores de login: 401 `invalid_credentials`; 423 `account_locked` (5 fallos en 15 min por
usuario+visitante bloquean 5 min). Cada fallo emite un evento de autenticación (alimenta el SOC).

Refresh: 200 `{ "accessToken", "expiresIn" }`. Reutilizar un token ya rotado → 401
`refresh_token_reused` y se revoca toda la familia (evento de auditoría y de SOC).
Un access token con `ver` menor al vigente del sujeto → 401 `token_revoked`.

Session 200:

```json
{
  "subject": "engineer:3f9a1c",
  "username": "engineer",
  "roles": ["engineer"],
  "permissions": ["project.read", "project.update"],
  "tokenVersion": 1,
  "accessToken": { "header": { "alg": "RS256", "kid": "..." }, "claims": { "sub": "...", "exp": 0 } },
  "family": {
    "id": "fam_...", "generation": 3, "status": "active",
    "createdAt": "...", "lastRotatedAt": "...", "expiresAt": "..."
  },
  "history": [{ "generation": 1, "issuedAt": "...", "status": "rotated" }]
}
```

Cuentas demo (plantillas): `viewer`, `engineer`, `admin`, `auditor`. Contraseñas demo
públicas, mostradas en la UI. Los sujetos son efímeros por visitante.

## Authorization (PDP)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/authz/model` | — | Roles, permisos, políticas y recursos demo |
| POST | `/api/authz/evaluate` | opcional | Decisión "what-if" sin efectos |
| GET | `/api/demo/projects/:id` | Bearer | Recurso protegido (PEP → PDP) |
| DELETE | `/api/demo/projects/:id` | Bearer | Recurso protegido; nunca borra nada real: `{ "deleted": true, "simulated": true }` si se permite, 403 con la decisión si no |

Model:

```json
{
  "roles": [{ "id": "engineer", "name": Localized, "inherits": ["viewer"] }],
  "permissions": [{ "id": "project.delete", "description": Localized }],
  "policies": [{
    "id": "POL-003", "effect": "permit" | "deny",
    "roles": ["admin"], "actions": ["project.delete"],
    "resource": { "type": "project", "conditions": [{ "attribute": "classification", "operator": "notEquals", "value": "restricted" }] },
    "description": Localized
  }],
  "resources": [{ "type": "project", "id": "quantum", "attributes": { "department": "engineering", "classification": "internal" } }]
}
```

Evaluate body: `{ "subject": { "role": "engineer", "department": "engineering" }, "action": "project.delete", "resource": { "type": "project", "id": "quantum" } }`.
Si `subject` falta y hay Bearer, se usa el sujeto del token.

Evaluate 200:

```json
{
  "decision": "permit" | "deny",
  "reason": Localized,
  "matchedPolicyId": "POL-003" | null,
  "trace": [{ "step": "rbac" | "policy" | "condition" | "default", "detail": Localized, "result": "pass" | "fail" | "skip" }],
  "evaluatedAt": "..."
}
```

Regla: deny explícito gana; sin política que permita → deny por defecto.
Cada deny en el PEP genera evento de auditoría `authz.denied`.

## Audit

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/audit/events?limit=50&before=<seq>` | `{ "events": AuditEvent[], "nextBefore": number \| null }` |
| GET | `/api/audit/verify` | `{ "valid": boolean, "checked": n, "firstInvalidSeq": n \| null, "headHash": "..." }` |

```json
{
  "seq": 42, "at": "...",
  "type": "auth.login_succeeded",
  "actor": "engineer:3f9a1c",
  "summary": Localized,
  "prevHash": "…", "hash": "…"
}
```

Tipos: `auth.login_succeeded`, `auth.login_failed`, `auth.account_locked`, `token.rotated`,
`token.reuse_detected`, `token.family_revoked`, `token.global_revocation`, `authz.denied`,
`lab.faults_changed`, `game.run_finished`.
`hash = sha256(prevHash + JSON canónico del evento sin hash)`. Un único consumidor escribe
en orden.

## SOC

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/soc/events?limit=100` | `{ "events": SocEvent[] }` |
| GET | `/api/soc/alerts?limit=20` | `{ "alerts": SocAlert[] }` |
| GET | `/api/soc/stats` | `{ "window": "24h", "events": { "total", "bySeverity": { "low", "medium", "high", "critical" } }, "alerts": { "open", "total" }, "sources": { "live", "synthetic" } }` |
| GET | `/api/soc/stream` | SSE. Eventos `event` y `alert` con los mismos JSON; `ping` cada 20 s |

```json
{ "id": "...", "at": "...", "source": "live" | "synthetic", "category": "authentication" | "web" | "system",
  "severity": "low" | "medium" | "high" | "critical", "message": Localized, "entity": "user:engineer" }
```

```json
{ "id": "...", "at": "...", "rule": { "id": "AUTH-BRUTE-01", "name": Localized, "mitre": "T1110.001" },
  "severity": "high", "source": "live" | "synthetic", "entity": "user:engineer",
  "evidence": ["eventId"], "status": "open" | "acknowledged" | "resolved" }
```

Reglas v1:

| Regla | Condición | Severidad | MITRE |
|---|---|---|---|
| `AUTH-BRUTE-01` | ≥5 logins fallidos del mismo usuario en 60 s | high | T1110.001 |
| `AUTH-SPRAY-01` | logins fallidos a ≥3 usuarios distintos desde el mismo visitante en 60 s | high | T1110.003 |
| `TOKEN-REUSE-01` | reutilización de refresh token | critical | T1550.001 |
| `AUTHZ-ESC-01` | ≥3 denegaciones de acciones de admin del mismo sujeto en 60 s | medium | T1068 |

El generador sintético emite eventos de fondo (1 cada 5–15 s) marcados `synthetic`.

## Game

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/game/runs/start` | `{ "runId", "startedAt" }` |
| POST | `/api/game/runs/:runId/finish` | Body `{ "nickname"?: string, "missionsCompleted": 0-3, "score": int, "mistakes": int }` → `{ "accepted": true, "rank": n, "score": n }` |
| GET | `/api/game/leaderboard?limit=10` | `{ "entries": [{ "rank", "nickname", "score", "missionsCompleted", "at" }] }` |

Validación: la partida existe, no está terminada, duración ≥ 20 s por misión completada,
`score ≤ maxScore(missionsCompleted)` (3 000 por misión). Si no → 422 `implausible_run`.
`nickname` opcional `^[A-Za-z0-9_-]{3,16}$`; si falta → `anon`.

## Lab (Failure Lab)

Todo acotado a `lab_sid`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/lab/state` | `LabState` |
| PUT | `/api/lab/faults` | Body parcial de `faults` → `LabState` |
| POST | `/api/lab/reset` | `LabState` por defecto |
| GET | `/api/lab/catalog/:itemId` | Lectura real caché → breaker → base de datos. `itemId` = `item-001` … `item-020` |

```json
{
  "faults": { "redisDown": false, "dbLatencyMs": 0, "dropRate": 0, "cacheCorrupt": false },
  "breaker": { "state": "closed" | "open" | "half-open", "failures": 0, "openedAt": null }
}
```

Validación: `dbLatencyMs` 0–1500, `dropRate` 0–0.5.

Catalog 200:

```json
{
  "item": { "id": "item-007", "name": "...", "stock": 12, "updatedAt": "..." },
  "served": "cache" | "database" | "stale-cache",
  "degraded": false,
  "trace": [{ "step": "cache" | "breaker" | "database" | "integrity-check" | "fallback", "outcome": "hit" | "miss" | "skipped" | "error" | "ok" | "open" | "rejected", "ms": 1.2, "note": Localized }],
  "totalMs": 3.4
}
```

Comportamiento: `redisDown` hace fallar el cliente de caché de esa sesión; tras 3 fallos el
breaker abre 10 s y luego pasa a half-open. `cacheCorrupt` devuelve una entrada con checksum
inválido que el integrity-check detecta → fallback a la base de datos y repoblado.
`dropRate` responde 503 `request_dropped` con esa probabilidad (el cliente reintenta con backoff).
