# 14 · Future architecture blueprint

Ninguna fase de este documento se construye en la V1. Cada fase tiene un **problema que la
justificaría**, un **disparador** observable y una nota de **qué no la justifica**. Si el disparador
no ocurre, la fase no se construye.

## Vista general

```text
V1     Portafolio estático: casos, Security Lab, Cyber Ops, ES/EN
 │
 ├─ V1.1  Threat Modeling Lab          (estático, sin backend)
 ├─ V1.2  Reliability / Failure Lab    (simulado en el navegador, etiquetado)
 │
V2     Backend propio, solo si hay una necesidad de estado en servidor
 │
V2+    Engineering Assistant (IA), solo después de un experimento real
```

## V1.1: Threat Modeling Lab

- **Problema que lo justifica:** el razonamiento de amenazas hoy está implícito en las secciones de
  seguridad de los casos. Una audiencia de seguridad quiere ver el método aplicado: componentes,
  fronteras de confianza, STRIDE por elemento, mitigaciones y riesgo residual.
- **Disparador:** la revisión con personas de seguridad (01) muestra que la sección de seguridad
  convence, pero piden ver el método explícito.
- **Alcance:** modelo de amenazas interactivo de este mismo sitio (seguro de publicar) y de una
  versión sanitizada de Quantum. Usa el componente `Diagram` existente con un panel STRIDE.
- **Arquitectura:** solo contenido y componentes (`content/threat-models/`). Sin backend.
- **No lo justifica:** "queda impresionante". Un STRIDE de checklist sin conexión con un sistema
  real es teatro de seguridad.

## V1.2: Reliability / Failure Lab

- **Problema que lo justifica:** los failure modes aparecen en tablas y en la misión 03. Un lab
  permitiría explorar patrones de resiliencia (circuit breaker, fallback, reintentos con backoff,
  degradación) y ver su efecto.
- **Disparador:** la misión 03 y las tablas de failure modes generan preguntas de profundización en
  entrevistas, o un rol objetivo pide de forma explícita experiencia en confiabilidad o SRE.
- **Alcance V1.2:** simulación en el navegador del camino caché → breaker → base de datos, con
  fallos inyectables. **Todo etiquetado como SIMULADO**, incluida la latencia.
- **Evolución a V2:** si una simulación no basta para demostrar la implementación real, el boceto
  de `docs/future/` define la inyección de fallos acotada a la sesión del visitante, sobre un
  backend real.
- **No lo justifica:** botones de "Kill Redis" que solo cambian colores.

## V2: Backend propio

Un backend añade superficie de ataque, operación (actualizaciones, backups, monitoreo) y costo. Solo
entra si existe al menos un disparador:

| Disparador | Problema real | Alcance mínimo |
|---|---|---|
| Los recruiters no usan mailto o piden un formulario | Fricción de contacto medida | Endpoint de contacto con anti-spam (Turnstile) y rate limiting |
| Cyber Ops genera tráfico recurrente | Hay jugadores que volverían por un ranking | Leaderboard con validación de plausibilidad |
| Las audiencias de seguridad piden prueba ejecutable de IAM | La descripción sanitizada de Quantum no basta | Demo de identidad: RS256, rotación de refresh tokens con detección de reutilización, PDP con traza |
| El Failure Lab simulado se queda corto (V1.2) | Hay que demostrar la implementación real | Inyección de fallos acotada por sesión |
| Hace falta entender el embudo de contacto | Decisiones sin datos | Analítica propia y respetuosa (Umami o Plausible autohospedado) |

**Arquitectura base:** monolito modular en el mismo origen (`/api`), PostgreSQL y Redis, despliegue
con Docker Compose detrás del edge. El boceto en `docs/future/backend-v2-*.md` es el punto de
partida y se revisará cuando llegue el disparador.

**No lo justifica:** "un full-stack debería tener backend en su portafolio". La evidencia de backend
ya está en los casos.

## V2+: Engineering Assistant (IA)

- **Problema que lo justificaría:** un asistente que razone sobre los ADRs y las arquitecturas
  propias de César (por ejemplo, revisar un diagrama y señalar puntos únicos de falla), con
  privacidad (modelo local cuando sea posible).
- **Precondición:** que exista primero un **EXPERIMENTO real** y demostrable de IA aplicada a
  ingeniería. Hoy no existe ninguno; por eso la IA no aparece en el sitio.
- **No lo justifica:** un chatbot genérico.

## Otras ideas evaluadas

| Idea | Veredicto | Condición |
|---|---|---|
| Incident Room (postmortems) | Puede entrar en V1.x como contenido, sin tecnología nueva | Solo con incidentes reales, sanitizados |
| Performance Lab (antes/después) | V1.x | Cuando existan al menos dos mediciones reales en el tiempo |
| Mini ERP demostrable (vertical slice) | Grande; solo si hace falta código de dominio público | Si los roles objetivo piden ver código de negocio y Quantum no puede mostrarse |
| Pipeline CI/CD y supply chain visibles | Ya en V1 (11, 13) | Se muestran resultados reales del CI, no un diagrama decorativo |
| Consola tipo "CESAR.OS" con métricas | Descartada | Métricas inventadas; contradice el contrato de autenticidad |
