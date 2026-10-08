# Blueprint V1: portafolio de Cesar Acosta

**Estado:** aprobado el 2026-10-06. Alcance congelado. La implementación sigue el roadmap (15).
**Fecha:** 2026-10-05 (redacción) · 2026-10-06 (aprobación).

Antes de redactar casos, cada hecho sobre César se valida en un registro privado (`.private/validation/`).

Este blueprint trata el portafolio como un producto de ingeniería. Debe permitir que otro
ingeniero empiece la implementación sin adivinar decisiones.

## Las dos reglas que gobiernan todo

1. **No aparentar seniority.** Mostrar criterio técnico suficiente para que el visitante llegue
   solo a esa conclusión.
2. **La complejidad existe solo si resuelve un problema real.** Ninguna tecnología, sección o
   animación entra porque haga que el sitio parezca más complejo.

## Índice

| # | Documento | Contenido |
|---|---|---|
| 00 | Este archivo | Reglas, contrato de autenticidad, alcance, decisiones abiertas |
| 01 | [Producto](01-product.md) | Propósito, percepción, audiencias, primeros 30 segundos, qué no comunicar |
| 02 | [Arquitectura de información](02-information-architecture.md) | Sitemap, rutas, navegación, recorridos, CTAs |
| 03 | [Visual y UX](03-visual-ux.md) | Tipografía, color, grid, espaciado, componentes, movimiento, accesibilidad |
| 04 | [Arquitectura técnica](04-technical-architecture.md) | Stack, carpetas, responsabilidades, límites entre módulos |
| 05 | [Arquitectura de contenido](05-content-architecture.md) | Separación contenido/presentación, i18n, modelo de datos |
| 06 | [Plantilla de caso de estudio](06-case-study-template.md) | Secciones, clasificación de confidencialidad |
| 07 | [Proyectos actuales](07-current-projects/README.md) | Quantum / ERP-Rental, KeepMe, Wazuh SOC Lab, otros candidatos |
| 08 | [Security Lab](08-security-lab.md) | Sección de seguridad construida sobre `wazuh-soc-lab` |
| 09 | [Cyber Ops](09-cyber-ops.md) | Diseño del juego y sus tres misiones |
| 10 | [ADRs](10-adrs.md) | Decisiones a documentar y por qué cada una merece un ADR |
| 11 | [Calidad de ingeniería](11-quality.md) | Tests, accesibilidad, rendimiento, seguridad, CI |
| 12 | [SEO y descubribilidad](12-seo.md) | Metadata, Open Graph, sitemap, prerender |
| 13 | [Despliegue](13-deployment.md) | Pipeline, hosting, dominios, caché, rollback |
| 14 | [Arquitectura futura](14-future.md) | V1.1 → V2+ y qué problema justifica cada fase |
| 15 | [Roadmap](15-roadmap.md) | Fases pequeñas y verificables con Definition of Done |
| 16 | [Definition of Done V1](16-definition-of-done.md) | Checklist final |

## Contrato de autenticidad

Todo lo que aparece en el sitio se clasifica en tres ejes. La clasificación es un campo
obligatorio del contenido (ver 05); el build falla si falta.

### Eje 1: existencia

| Clase | Definición | Dónde puede aparecer |
|---|---|---|
| **REAL** | Existe y César puede demostrarlo **como lo que se dice que es** (código, despliegue, documentación, capturas). | Casos de estudio, Security Lab, timeline, juego |
| **EXPERIMENTO** | Spike, prueba o investigación con resultado parcial o exploratorio. | Marcado como experimento dentro de un caso o en notas; nunca en la lista principal de trabajo |
| **PLANEADO** | Idea futura. No existe. | Solo en un bloque "Lo que viene" / "Building next" y en el roadmap público. Nunca junto a lo REAL |

La existencia se combina con el **tipo**: `product` (sistema usado por otros), `lab` (entorno
controlado de aprendizaje o demostración) o `spike`. Un lab presentado como lab es REAL; lo que no
puede hacer es presentarse como producto u operación ("SOC operativo"). El Wazuh SOC Lab es
`REAL · lab`.

Regla: **nunca se mezclan en la misma lista ni en el mismo bloque visual.** "Building next:
Reliability Lab" es válido; una tarjeta de Reliability Lab entre los proyectos, no.

Inventario (investigado en 07):

- REAL · product: Quantum (incluye ERP-Rental y su motor de workflows con su alcance real),
  registro masivo para una feria, KeepMe (módulo de software; la parte de operación por confirmar),
  Experiencias, ConnectMe (inactivo, solo timeline), este portafolio.
- REAL · lab: Wazuh SOC Lab.
- EXPERIMENTO: Statera (app personal).
- PLANEADO: Threat Modeling Lab, Reliability / Failure Lab, backend propio, Engineering
  Assistant (IA). La IA no aparece en el sitio hasta que exista algo demostrable.
- **No existe y no se afirma:** zero-trust entre servicios en Quantum (solo diseñado), reglas propias
  o simulación de fuerza bruta en el lab.

### Eje 2: datos y métricas

| Clase | Definición | Cómo se muestra |
|---|---|---|
| **MEDIDO** | Resultado de una medición real con herramienta, fecha y método. | Con la fuente: "Lighthouse, móvil, 2026-11-02" |
| **DEL REPOSITORIO** | Conteo verificable en el código (servicios, ADRs, módulos). | Con la fecha del conteo |
| **SIMULADO** | Dato generado para una demo o el juego. | Etiquetado explícitamente como simulado, siempre |

Un número sin una de estas tres clases **no se publica**. Ningún resultado, métrica, cliente ni
tecnología se inventa.

### Eje 3: confidencialidad

| Clase | Definición | Regla |
|---|---|---|
| **PÚBLICO** | Puede publicarse tal cual. | Proyectos personales (Wazuh SOC Lab, este portafolio) |
| **SANITIZADO** | Publicable sin nombres de clientes, datos de negocio, rutas internas, IPs, nombres de personas ni capturas sin revisar. | Valor por defecto para todo el trabajo hecho en Brandex |
| **CONFIDENCIAL** | No se publica. | Se queda fuera del repositorio |

Consecuencias:

- El repositorio del portafolio será público. Por eso la evidencia interna (rutas de los repos de
  Brandex, notas de verificación) vive en `.private/`, que está en `.gitignore`. Los documentos
  públicos describen la evidencia sin exponerla.
- **Acción para César:** confirmar con Brandex qué puede publicarse en forma sanitizada antes de
  F4, casos de estudio (ver 15, tarea C1).

## Alcance V1 (decidido)

- **Frontend estático, sin backend.** Si una funcionalidad no necesita servidor, no se crea servidor.
- **Bilingüe ES/EN** con i18n desde el inicio. Se escribe primero en español; no se duplican
  componentes ni datos no traducibles.
- **Páginas:** identidad (Home, About con timeline), casos de estudio, Security Lab (Wazuh),
  Engineering Judgment, arquitectura y ADRs de este sitio, Cyber Ops, contacto.
- **Cyber Ops** con tres misiones. Sin integración real con Wazuh: la conexión es narrativa y
  conceptual, y así se dice.
- **Motor de workflows**: se presenta dentro de Quantum / ERP-Rental con su alcance real, no como
  proyecto independiente.

**Fuera de V1:** backend propio, Failure Lab, Threat Modeling Lab, asistente de IA, leaderboard,
formulario de contacto. Cada uno tiene en 14 el problema que justificaría construirlo.

## Decisiones abiertas para revisar con César

| # | Decisión | Recomendación | Dónde |
|---|---|---|---|
| D1 | Tailwind CSS o CSS Modules con tokens | **Aprobado (2026-10-06):** CSS Modules + tokens | 04, 10 |
| D2 | Librería de animación (Motion) | **Aprobado:** no usarla en V1 | 03, 10 |
| D3 | Hosting | **Aprobado:** Cloudflare Pages | 13 |
| D4 | Prerender para SEO y previews sociales | **Decidido (2026-10-06), tras el [spike de F0](../spikes/d4-prerender.md):** React Router 8 en modo framework con prerender en build (`ssr: false`, `appDirectory: "src"`) y CSP por ruta con hashes en `_headers` ([ADR-0001](../adr/0001-prerender-con-react-router.md)). B3 (una sola CSP por respuesta) se verifica en un preview real como gate antes de producción; si falla, CSP en `<meta>` sin reabrir D4. El presupuesto de 90 KB de JS queda invalidado ([ADR-0013](../adr/0013-presupuesto-de-javascript.md), cifras pendientes de confirmar) | 04, 10, 12 |
| D5 | Quantum y ERP-Rental: uno o dos casos | Un solo caso, "Quantum"; ERP-Rental es contexto | 07 |
| D6 | Dominio | **Decidido:** `cesaracosta.dev` (libre según RDAP el 2026-10-06). No bloquea: primero se despliega en el dominio de Cloudflare Pages | 13 |
| D7 | Permiso de Brandex para casos sanitizados | Pendiente; bloquea la fase de casos | 06, 07 |
| D8 | Animación ambiental en el hero | **Aprobado:** no; el hero es tipográfico | 03 |
| D9 | Cómo se dice el uso de asistentes de IA | **Decidido:** de forma directa, como *AI-assisted, human-directed engineering*: la IA propone y redacta; César decide, valida y responde por el resultado | 01, 07 |
| D10 | Estructura del trabajo | **Decidido (2026-10-06):** 2 casos profundos (Quantum, KeepMe), labs propios (Wazuh SOC Lab, Cyber Ops), Selected Work breve y confidencial (Experiencias, registro masivo), solo timeline (ConnectMe, micrositio) | 02, 06, 07 |
| D11 | Cyber Ops en el header | **Aprobado:** no en V1; Home, Security Lab y footer | 02, 09 |
| D12 | Preguntas del juego (integridad 5, API ficticia en inglés, nombres ficticios en M02, frases de cierre) | Las recomendaciones de 09 §19 | 09 |

Decisiones operativas menores (tolerancia de axe, imágenes sociales, crawlers de IA, breadcrumbs,
aprobación manual de despliegues, HSTS preload, lista de términos confidenciales): ver la sección
"Decisiones para César" al final de [11](11-quality.md), [12](12-seo.md) y [13](13-deployment.md).

Orden recomendado de lectura para la revisión: 00 → 01 → 02 → 07 (README) → 15 → el resto según
interés. 08, 09, 11, 12 y 13 son documentos de detalle para quien implementa.

## Estado del código existente

Antes del blueprint se creó un spike en `Frontend/`: dependencias instaladas (React 19, Vite 8,
React Router 8, TypeScript 6.0, Vitest, Testing Library, ESLint, Prettier), configuración
básica y un primer motor de payloads para la misión Firewall (`src/game/payloads.ts`).
Se reorganiza en la Fase 0 según este blueprint.

**2026-10-06:** el spike D4 terminó (`spikes/d4-prerender/`, informe en
[`docs/spikes/d4-prerender.md`](../spikes/d4-prerender.md)) y `Frontend/` se migra a modo framework
en `src/`. Los borradores de ADR viven en [`docs/adr/`](../adr/README.md) hasta F8.

`docs/future/` contiene un boceto de backend marcado como PLANEADO.

## Convenciones de este documento

- Español; términos técnicos en inglés cuando ese es su nombre estándar.
- Cada decisión incluye alternativas y su costo.
- Lo que no se pudo verificar se marca **PENDIENTE: confirmar con César**.
- Sin datos inventados. Las cifras de proyectos son conteos del repositorio con fecha.
