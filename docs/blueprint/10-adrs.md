# 10 · Architecture Decision Records blueprint

## Criterio para escribir un ADR

Un ADR se escribe solo si se cumplen las tres condiciones:

1. Hubo **alternativas reales** que se consideraron.
2. La decisión tiene **consecuencias** que alguien sufrirá o disfrutará más adelante.
3. Revertirla **cuesta** algo (tiempo, migración, reescritura).

Si una decisión no cumple las tres, se documenta en una línea dentro del blueprint, no como ADR.
Un ADR artificial le resta credibilidad a los demás.

## Formato

```text
ADR-NNNN: Título en forma de decisión
Estado         propuesto | aceptado | reemplazado por ADR-XXXX
Fecha          YYYY-MM-DD
Contexto       qué problema y qué restricciones
Decisión       qué se decidió, en una o dos frases
Alternativas   cada una con por qué no
Trade-offs     qué se gana y qué se pierde
Consecuencias  qué cambia para el código, la operación y el futuro
Revisar si     la condición que obligaría a reabrir la decisión
```

"Revisar si" es lo que distingue una decisión pensada de una preferencia.

Los ADRs viven en `src/content/adrs/` (bilingües) y se publican en `/architecture/decisions/:id`.
Hasta que existan esas páginas (F8), los borradores se escriben en español en
[`docs/adr/`](../adr/README.md) y en F8 se migran; desde entonces `src/content/adrs/` es la única
fuente.
Los ADRs de Quantum (ADR-018 a ADR-027 en su repositorio) **no** se renumeran aquí; los casos los
referencian en su sección de decisiones, sanitizados.

## ADRs de la V1

| ADR | Decisión propuesta | Por qué merece un ADR | Estado |
|---|---|---|---|
| **0001** | React Router 8 en modo framework con prerender en build, en lugar de SPA o Next.js | Define el build, el SEO, el hosting y el modelo de rendering. Revertirlo es migrar el sitio. Revisar si aparece una necesidad de render en servidor por petición | **Aceptado (2026-10-06)** con evidencia del [spike D4](../spikes/d4-prerender.md); B3 es gate antes de producción. [Borrador](../adr/0001-prerender-con-react-router.md) |
| **0002** | Frontend estático primero; backend solo cuando una funcionalidad necesite estado en servidor | Fija el alcance de la V1 y la superficie de seguridad. Lista explícita de los disparadores que justificarían un backend (14) | Propuesto |
| **0003** | Contenido por entidad con prosa por idioma (MDX) y datos tipados; sin librería de i18n | Define cómo se escribe, traduce y valida todo el contenido. Cambiarlo es migrar todo el contenido | Propuesto |
| **0004** | El contrato de autenticidad (existencia, fuente de métricas, confidencialidad) vive en el modelo de datos y se verifica en build | Convierte una regla editorial en una garantía técnica. Es la decisión más distintiva del sitio | Propuesto |
| **0005** | CSS Modules + tokens CSS en lugar de Tailwind | Afecta a cada componente. D1 aprobado por César (2026-10-06) | Aceptado |
| **0006** | Movimiento solo con significado: sin librería de animación, CSS y View Transitions | Afecta la experiencia, el peso del bundle y la accesibilidad. Revisar si una interacción concreta necesita animación de layout o física | Propuesto (D2) |
| **0007** | Frontend modular por features con reglas de importación verificadas por lint | La modularidad se comprueba en CI, no se promete. Revisar si el sitio crece al punto de necesitar paquetes separados | Propuesto |
| **0008** | Fronteras de seguridad del sitio estático: CSP estricta con hashes, cero scripts de terceros, fuentes propias, sin secretos en runtime | Define qué se puede añadir al sitio en el futuro (todo tercero pasa por esta decisión) | Propuesto. Plantilla CSP ajustada tras el spike (2026-10-06): `default-src 'self'` con `'none'` explícitos y sin Trusted Types en V1 (11 §8) |
| **0009** | Cyber Ops: motor TS puro y determinista (semilla) + vista React, DOM/SVG en lugar de Canvas, progreso solo en `localStorage` | Define testabilidad, accesibilidad y la ausencia de backend del juego. Revisar si se construye backend (leaderboard) | Propuesto; detalle en 09 §2 |
| **0010** | Hosting en Cloudflare Pages | Lock-in, soporte de cabeceras, previews y rollback. D3 aprobado por César (2026-10-06) | Aceptado; detalle en 13 |
| **0011** | Sin analítica en V1 | Trade-off real: privacidad, sin banner de cookies y CSP simple a cambio de no tener datos de visitas. Revisar si hace falta medir el embudo de contacto | Propuesto |
| **0012** | Modo sin límite de tiempo como equivalente accesible de la misión en tiempo real | Resuelve WCAG 2.2.1 sin degradar la mecánica principal; obliga a mantener dos modos y puntajes separados | Propuesto; detalle en 09 |
| **0013** | Presupuesto de JavaScript: código propio aparte y techo total sobre la línea base medida | A7 falló (2026-10-06): 90 KB gzip no se alcanza ni en SPA (98,14 KiB) y el 96 % del JS de Home es framework. Cambia el gate de rendimiento de cada PR | **Aceptado** (2026-10-06); cifras confirmadas: ≤ 15 KiB propios y ≤ 115 KiB totales, en brotli. [Borrador](../adr/0013-presupuesto-de-javascript.md) |

## Decisiones que no merecen ADR

| Decisión | Dónde queda | Por qué no es ADR |
|---|---|---|
| Usar React | Contexto en 04 | No se evaluaron alternativas; es el stack de César |
| Usar TypeScript | 04 | Sin alternativa real en este contexto |
| Fijar TypeScript en 6.0 | Nota en 04 y en el README | Táctica y temporal: se revierte al actualizar `typescript-eslint` |
| No usar librería de estado global | 04 | No había un problema que resolver |
| Monorepo o polyrepo | — | Sin backend en V1, la pregunta no existe |
| Slugs en inglés en ambos idiomas | 02 | Consecuencias pequeñas y reversibles con redirecciones |
| Redis Streams frente a Kafka | Caso de Quantum | Es una decisión de Quantum, no de este sitio |

## Ensayos de Engineering Judgment (distintos de los ADRs)

Los ensayos no registran una decisión de un sistema, sino un **criterio general con su
contraejemplo**. La lista con respaldo verificado está en [07](07-current-projects/README.md):

- **Primera tanda (autoría fuerte):** por qué el frontend no decide quién puede qué; rotar refresh
  tokens y detectar su reutilización; probar el motor antes de apoyar dinero en él; si la migración
  no corre en CI, la prueba es producción.
- **Segunda tanda (por confirmar):** consolidar un portal de 11 microservicios en la plataforma; un
  ERP no necesita Kafka porque Kafka exista; los ensayos que respalda el lab (08 §9).

- **Respaldado desde el 2026-10-06:** "modular antes que distribuido". César confirmó su
  razonamiento sobre los 15 procesos de Quantum y qué haría distinto hoy (monolito modular con las
  mismas pruebas de arquitectura, y separar un proceso solo con una razón operacional concreta).
  Pasa a la primera tanda: tiene decisión, costo, lección y evidencia (ArchUnit en CI).

Descartado: "por qué no usé microservicios" (Quantum sí los usó; la versión honesta es el ensayo
anterior).

Regla: un ensayo solo se publica si un caso, un capítulo del lab o un ADR lo respalda. Si no hay
respaldo, el ensayo espera.
