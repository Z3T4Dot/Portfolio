# Quantum / ERP-Rental

**Estado:** borrador para revisión con César. Investigación del repositorio hecha el 2026-10-05.
**Alcance de este documento:** cómo presentar Quantum en el portafolio. No se implementa nada.
La evidencia concreta (rutas, comandos, conteos crudos) vive en `.private/`, fuera del repositorio.

---

## 1. Resumen y recomendación

**Recomendación: un solo caso de estudio insignia, "Quantum".** El motor de workflows va como
una sección dentro del caso, con su alcance real. El dominio de alquiler y operaciones es el
contexto del caso, no un segundo caso.

Razones:

1. **Es un solo producto.** "ERP-Rental" es el nombre de la carpeta de trabajo y del encuadre
   original (alquiler de activos para eventos). "Quantum" es el nombre del producto, de los
   repositorios y de toda la documentación de arquitectura. Partirlo en dos casos inventaría una
   frontera que el código no tiene.
2. **La parte de César con más evidencia es la plataforma:** runtime de ejecución, identidad y
   autorización, gateway, motor de workflows, CI/CD. Buena parte del dominio de alquiler más
   reciente (módulo de órdenes, migración de datos, datos maestros) tiene commits y ADR de
   otros miembros del equipo. Un caso "ERP-Rental: dominio de alquiler" quedaría débil en autoría.
3. **KeepMe ya tiene su propio caso.** KeepMe corre como módulo sobre Quantum. Un segundo caso de
   "dominio" se pisaría con el de KeepMe. Mejor: Quantum explica la plataforma; KeepMe explica la
   operación y su módulo, y enlaza a Quantum para lo de plataforma.
4. **Profundidad sobre cantidad.** Un caso bien argumentado, más 4–6 ensayos de Engineering
   Judgment sacados del mismo código, muestra más criterio que dos casos medianos.

### Clasificación en los tres ejes

| Eje | Clase | Nota |
|---|---|---|
| Existencia | **REAL** | Plataforma desplegada con pipeline a un servidor de producción. Motor de workflows REAL con alcance acotado (ver §3). Lo que solo está en documentos de diseño se presenta como límite, no como capacidad. |
| Datos | **DEL REPOSITORIO** | Conteos con fecha (2026-10-05). No hay métricas MEDIDAS de rendimiento ni de uso. Nada SIMULADO. |
| Confidencialidad | **SANITIZADO** | Trabajo para Brandex. Sin clientes, sin datos de negocio, sin rutas, hosts ni nombres de personas. Código no publicable salvo permiso (D7). |

---

## 2. Relación Quantum / ERP-Rental

| Nombre | Qué es en realidad | Evidencia (genérica) |
|---|---|---|
| **Quantum** | El producto: plataforma interna de operaciones de Brandex. Backend, frontend y documentación usan este nombre. | Nombre de los repositorios, del documento de arquitectura ("Quantum ERP — Architecture Blueprint v3.3") y de la arquitectura de referencia. |
| **ERP-Rental** | Nombre de la carpeta de trabajo local y del README original ("Quantum ERP — Rental Platform"). Refleja el alcance inicial: alquiler de activos para eventos, logística y CRM. | README raíz; carpeta contenedora de backend, frontend y documentos. |
| **V1 / V2** | Dos generaciones del backend. V1 (abril–julio 2026): Kotlin + NestJS + Kafka configurado, un servicio central que concentraba casi todo. V2 (desde agosto 2026): Java 21 + Spring Boot 3.3, 15 servicios, Redis Streams. V1 quedó congelado como referencia. | Carpeta de legado con README que marca "frozen" y su reemplazo por servicio. |
| **Módulos de negocio** | Seis módulos declarativos (YAML) sobre la plataforma: eventos, custodia (KeepMe), personalización, marketplace, servicios y portal interno (ConnectMe). | Un archivo `blueprint` por módulo; ADR-021 y ADR-022. |

La propia arquitectura de referencia lo dice así: "Quantum no es un ERP. Un ERP gestiona datos.
Quantum gestiona operaciones". Para el portafolio: **Quantum = plataforma; alquiler, custodia y
portal interno = dominios que corren encima.**

**Ojo con el README:** describe V1 (Kotlin/NestJS/Kafka). El código vigente es Java/Spring con
Redis Streams. El caso se escribe sobre el código, no sobre el README.

---

## 3. Motor de workflows: alcance real y cómo presentarlo

### Dónde vive

Dentro del servicio de runtime de la plataforma, como un paquete propio (43 archivos, unas
3.000 líneas, al 2026-10-05). No es un servicio aparte ni una librería independiente. Se apoya en
la persistencia de ejecuciones del runtime (Postgres) y en Redis (estado suspendido, suscripciones,
idempotencia y Redis Streams como transporte de eventos).

### Qué está implementado (verificado en código)

| Capacidad | Estado | Detalle |
|---|---|---|
| DSL en YAML, versionado, compilado y validado al cargar | Implementado | 12 reglas de validación con código propio; un workflow inválido no se registra. |
| Pasos `execute`, `condition`, `parallel`, `wait` | Implementado, con matices | `parallel` **no es paralelo**: encola las ramas y las corre en secuencia. |
| Pasos directos a través del mismo pipeline de ejecución | Implementado | Cada paso pasa por el mismo control de autorización (PEP → PDP) que una llamada del frontend. Antes no pasaba: era una vía de escape de la autorización (hallazgo del spike, cerrado). |
| Suspensión y reanudación por evento | Implementado | Al llegar a un `wait` de tipo evento, el estado se guarda en Redis, la ejecución queda `AWAITING_INPUT` en Postgres y se registra una suscripción. |
| Correlación evento ↔ ejecución | Implementado | Los filtros del `wait` se resuelven contra la ejecución al suspender; solo despierta la ejecución que corresponde. Si el filtro resuelve vacío, el paso falla (fail closed). |
| Consumo de eventos con Redis Streams | Implementado | Consumer group, ACK manual solo tras procesar, reclamo de pendientes al (re)suscribirse, idempotencia por id de evento con TTL. |
| Disparo por API y por evento | Implementado | |
| Compensación en orden inverso | Implementado | Pasos marcados como compensables se deshacen en orden inverso si un paso posterior falla con `COMPENSATE`. Un fallo durante la compensación no se reintenta. |
| Expiración por deadline | Implementado | Un job revisa cada minuto y pasa a `EXPIRED` las ejecuciones vencidas. |

### Qué NO está implementado (solo en documentos de diseño)

- Modelos de ejecución SAGA, AI_DECISION y HUMAN_APPROVAL: diseñados en ADR-018, sin estrategia de
  ejecución. La aprobación humana se modela hoy como un `wait` por evento.
- Disparo programado (schedule).
- Políticas de reintento: el DSL las acepta, el ejecutor no las aplica.
- `wait` por duración (timer): suspende, pero nada lo reanuda.
- Paralelismo real.

### Madurez

- **Un workflow de negocio en uso:** la redención de beneficios del portal interno (reservar stock,
  congelar saldo, esperar decisión de un administrador, capturar o liberar). El frontend lo dispara.
  El commit que lo cierra dice que se verificaron ocho escenarios contra el entorno desplegado.
  **PENDIENTE: confirmar con César** si corre en producción con usuarios reales.
- Hay un segundo workflow de ejemplo que referencia un engine que no existe. No cuenta como uso.
- **Pruebas:** 40 métodos de prueba unitarios en el paquete del motor (Mockito). No hay pruebas de
  integración del motor contra un Redis real.
- **Historia honesta:** antes de construir encima, un spike obligatorio (ADR-023, Fase 0) mostró que
  el motor nunca había corrido de punta a punta. Encontró tres bugs (un paso fallido terminaba como
  `COMPLETED`, el listener de eventos nunca arrancaba, eventos duplicados) y cinco huecos de diseño.
  Se corrigieron los bugs y se cerraron los huecos de autorización, correlación y transporte antes
  de tocar saldo o stock.

### Clasificación y presentación

- **REAL, con alcance acotado.** No es EXPERIMENTO: está en código de producción, tiene un flujo de
  negocio encima y pruebas. Tampoco es un "motor de workflows genérico": es el orquestador de la
  plataforma con cuatro tipos de paso, suspensión por evento y compensación.
- **Dentro del caso Quantum**, como sección "Orquestar sin acoplar engines". El ejemplo es la
  redención de beneficios: ningún engine conoce al otro y el workflow es lo único que sabe que la
  reserva de stock y el saldo congelado pertenecen al mismo pedido.
- **Lo que no hace se dice en la misma sección**, como "Límites conocidos". No va en "Lo que viene":
  no hay plan confirmado para cerrarlo.
- Nombre en el sitio: "motor de workflows de la plataforma". Evitar "workflow engine distribuido",
  "saga engine" o cualquier término que sugiera lo no implementado.

---

## 4. Qué mostrar / qué ocultar (sanitización)

### Mostrar

- Nombre del producto (Quantum) y de Brandex como empleador.
- Forma de la arquitectura: gateway, runtime, identidad/PDP, servicios de plataforma y engines de
  negocio, Redis Streams, una base de datos lógica por servicio.
- Decisiones con su porqué y su costo (ver §6 y §8).
- Diagramas redibujados a mano, nivel lógico (ver §7).
- Fragmentos cortos de pseudocódigo o YAML **reescritos**, no copiados (por ejemplo, la forma de un
  `wait` con filtro).
- Conteos DEL REPOSITORIO con fecha.

### Ocultar

- Nombres de clientes, de marcas de terceros y de personas del equipo.
- Rutas de repositorio, nombres de organizaciones en GitHub, dominios, hosts, puertos, IPs.
- Datos de negocio: cantidades de órdenes, catálogos, tarifas, saldos, nombres de productos.
- Nombres de proveedores externos (email, mensajería, ERP anterior): se describen por función.
- Capturas del frontend sin revisar (pueden mostrar datos reales).
- Detalles de seguridad explotables: claves de Redis, nombres de cabeceras internas, rutas públicas
  del gateway, huecos aún abiertos (ver §5 de `.private/`).
- Nombres internos de las unidades de negocio distintas de KeepMe y ConnectMe, hasta que Brandex
  confirme (D7). Se describen por función: eventos, personalización, marketplace, servicios.

---

## 5. Evidencia disponible

Descrita de forma genérica. Las rutas exactas están en el archivo privado.

| Tipo | Qué hay | Uso en el caso |
|---|---|---|
| Código backend | Monorepo Maven: 15 servicios, 4 librerías compartidas, 6 módulos declarativos. | Arquitectura, implementación, modos de fallo. |
| Código frontend | SPA React 18 + TypeScript + Vite que descubre los módulos desde el runtime. | Contexto; no es el foco. |
| Documento de arquitectura | Blueprint v3.3 (2026-08-04), con 17 ADR embebidos (ADR-001 a ADR-017) y principios numerados (anti-complejidad, zero trust interno, autorización desde la fuente de verdad). | Decisiones y trade-offs. |
| ADR sueltos | 10 archivos (ADR-018 a ADR-027), del 2026-08-05 al 2026-09-23. | Decisiones con fecha. |
| Especificación del DSL de workflows | Documento de ~800 líneas. | Contraste diseño vs implementación. |
| Historial git | Backend y frontend con autoría por commit. | Rol y timeline. |
| Mensajes de commit largos | Varios commits explican causa raíz y fix (motor de workflows, despliegue fallido por migraciones, imagen de terceros que dejó de ser pública). | Historias de Failure modes y Lessons learned. |
| Pipeline CI/CD | CI que compila y prueba todo el reactor; deploy con compuertas (cobertura de servicios, migraciones sobre Postgres real, build de 15 imágenes, despliegue y espera de salud). | Implementation, calidad. |
| Pruebas | 60 clases y 411 métodos de prueba; pruebas de arquitectura (ArchUnit); dos pruebas de integración con Testcontainers. | Implementation, sin inflar. |

**No hay:** métricas de rendimiento, uptime, usuarios, volumen de eventos ni resultados de negocio
verificables. Todo eso queda PENDIENTE.

---

## 6. Mapa a la plantilla de caso

### Context

- **Material disponible:** empresa de experiencias y eventos con varias unidades de negocio
  (alquiler de mobiliario y activos para eventos, custodia, personalización, marketplace,
  servicios, portal interno de empleados). Quantum es la plataforma interna donde esas unidades
  operan. V1 con pipeline de despliegue desde abril 2026; V2 desde agosto 2026.
- **PENDIENTE: confirmar con César:** qué se usaba antes de Quantum (el repositorio menciona un ERP
  anterior y un portal con microservicios propios); fecha real de entrada a producción de V2;
  cuántas personas lo usan.

### Problem

- **Material disponible:** el propio documento de arquitectura lo describe. V1 era "un monolito con
  un nombre diferente": el gateway enrutaba 11 de 13 rutas al mismo servicio. Kafka estaba
  configurado pero inactivo, y si notificaciones caía, el proceso fallaba sin reintento. Datos del
  CRM, departamentos y órdenes vivían en el `localStorage` del navegador. El nivel de acceso de un
  usuario lo decidía el frontend con un claim que el backend nunca emitió (ADR-022). Además, el
  portal interno corría aparte con su propia identidad, moneda, notificaciones y auditoría
  duplicadas (ADR-021).
- **PENDIENTE: confirmar con César:** qué dolor de negocio concreto disparó la reescritura (pérdida
  de datos, operación en equipo, auditoría); qué pidió la empresa en sus palabras.

### Role

- **Material disponible (DEL REPOSITORIO, 2026-10-05):** autor de 214 de 262 commits del backend
  (82%) y de 236 de 351 del frontend (67%). Hasta el 2026-09-09 fue el único autor del backend
  (88 commits). Autor de todos los merges del backend (39) y de 77 de 87 en el frontend. Autor de
  todos los commits de CI/CD del backend. Figura como quien aprueba ADR-022 y ADR-023 ("CES"). En el
  motor de workflows, 10 de 10 commits son suyos. Subió 7 de los 10 ADR sueltos (ADR-018 a 023 y
  027). El documento de arquitectura completo (v3.3, con ADR-001 a 017) entra en git el 2026-08-13
  desde una identidad personal que parece ser suya (a confirmar).
- **PENDIENTE: confirmar con César:** su cargo formal; si los ADR y el blueprint los redactó él,
  con el equipo o con asistencia de IA (para describir el rol con precisión); dónde estuvo el código
  de V2 antes del 2026-08-07, fecha en que entra en un solo commit grande; quién es la identidad
  git personal que aparece en el repositorio raíz.

### Constraints

- **Material disponible:** equipo pequeño (el backend tuvo un solo autor hasta septiembre). Un solo
  servidor con Docker Compose y un runner self-hosted. Redis ya estaba en producción (rate
  limiting), lo que pesó en no operar Kafka. Migración de datos desde un sistema anterior con reglas
  estrictas: solo agregar, idempotente, una transacción por carga, backup verificado antes.
- **PENDIENTE: confirmar con César:** presupuesto de infraestructura, plazos, número de
  servidores, restricciones de la empresa.

### Architecture

- **Material disponible:** gateway como único punto de entrada (valida JWT RS256, versión de sesión y
  rate limit por tenant; los servicios internos dejaron de publicar puertos). Runtime de plataforma
  con un pipeline de ejecución por etapas: blueprint → engine → capability → contexto → autorización
  (PEP/PDP) → modelo de ejecución → despacho. Identity como fuente de verdad de identidad y
  autorización (PDP). Servicios de contexto y organización. Engines de negocio (inventario,
  tienda, moneda, proyectos, creativo, organización). Servicios de plataforma (auditoría,
  notificaciones, mensajería, analítica, datos maestros). Redis Streams como bus de eventos. Una
  base de datos lógica por servicio sobre una instancia de Postgres. Módulos de negocio declarados
  en YAML, sin código propio.
- **PENDIENTE: confirmar con César:** si hay réplicas de algún servicio en producción.

### Technical decisions

- **Material disponible:** decisiones con contexto, alternativa y costo documentados:
  1. Redis Streams en lugar de activar Kafka (ADR-004).
  2. Partir el servicio central por dominio de forma incremental (ADR-001).
  3. Autorización por departamento con roles genéricos y scope, decidida en el servidor (ADR-022).
  4. Vocabulario de modelos de ejecución y persistencia de ejecuciones antes de construir el motor
     (ADR-018, ADR-019, ADR-020).
  5. Consolidar el portal interno como módulo declarativo y una sola moneda de plataforma (ADR-021).
  6. Autorización dentro de identity con extracción futura definida por criterios (ADR-011).
- **PENDIENTE: confirmar con César:** cuáles de estas tomó él y cuáles el equipo o la dirección.

### Trade-offs

- **Material disponible:**
  - Redis Streams: menos operación; a cambio, menos durabilidad (snapshot cada 60 s, sin AOF en la
    configuración revisada) y un umbral explícito (10.000 eventos/día) para revisar.
  - Publicación de eventos best-effort: una falla de mensajería no deshace la operación de negocio;
    a cambio, un evento puede perderse (no hay outbox transaccional para eventos de dominio).
  - Chequeo de revocación de sesión en el gateway: si Redis falla, se deja pasar; la firma del JWT
    sigue validándose y el token dura 15 minutos.
  - 15 servicios en un solo host: despliegue y fallos aislados por proceso, pero no por máquina.
  - Órdenes dentro de la base de inventario y no en un servicio nuevo, para reservar stock en una
    sola transacción (ADR-026; autoría a confirmar).
- **PENDIENTE: confirmar con César:** si el costo de 15 servicios para un equipo pequeño fue
  discutido y qué lo justificó en su opinión. El documento de arquitectura justifica partir el
  monolito; no justifica el número.

### Security considerations

- **Material disponible:** JWT RS256 de 15 minutos con clave pública distribuida y endpoint JWKS;
  contraseñas con Argon2id; refresh tokens guardados como hash, rotación atómica y detección de
  reutilización con revocación global de sesiones y evento de auditoría; versión de sesión en el JWT
  validada en el gateway; PDP que falla cerrado; caché de decisiones de 30 s que ante error de Redis
  consulta al PDP (no permite ni niega por su cuenta); pasos de workflow obligados a pasar por el
  mismo PEP; gateway como único punto de entrada; credenciales por servicio para llamar al PDP;
  auditoría central alimentada por eventos; webhooks de proveedores con verificación de firma.
- **Brecha honesta:** el principio de zero trust interno del blueprint pide service JWTs firmados de
  corta duración. Eso **no está implementado**: la autenticación entre servicios todavía no cumple
  todo el principio (detalle solo en el archivo privado). En el sitio se presenta como diferencia
  entre diseño e implementación, sin decir qué servicios ni cómo. Revisar con César si se menciona
  siquiera mientras siga abierta.
- **PENDIENTE: confirmar con César:** si hubo revisión de seguridad o pentest; qué incidente real,
  si lo hubo, motivó la detección de reutilización de tokens.

### Failure modes

Solo lo que existe en código (detalle en §9 de `.private/`):

| Falla | Qué pasa hoy |
|---|---|
| Identity / PDP no responde | Se deniega (fail closed), con timeouts explícitos de conexión y lectura. |
| Un engine no responde | El paso devuelve `FAILED` tras el timeout. En un workflow, la ruta de falla decide: terminar o compensar. Sin reintento automático ni circuit breaker. |
| Redis no responde: gateway | La firma del JWT se sigue validando; el chequeo de revocación de sesión se omite (fail open, registrado). |
| Redis no responde: caché de autorización | Se consulta al PDP directamente. |
| Redis no responde: publicación de eventos | Se registra y la operación de negocio continúa; el evento se pierde. |
| Redis no responde: suspensión de un workflow | El error al guardar el estado se registra pero no se propaga; esa ejecución no podrá reanudarse y vencerá por deadline. |
| Evento procesado con error | No se confirma; queda pendiente y se reintenta al re-suscribirse. Idempotencia por id de evento evita doble reanudación. |
| Evento duplicado o re-publicado | Se reconoce y se descarta. |
| Base de auditoría caída | No se confirma el mensaje. La recuperación automática de pendientes no está implementada en ese consumidor (hallazgo de esta investigación). |
| Proveedor de notificaciones caído | Outbox con estados, reintento programado y estado terminal `DEAD`; reparto entre réplicas con `SKIP LOCKED`. |
| Broker de eventos de autorización ausente | La publicación falla sin deshacer la asignación de rol; la caché vence en 30 s. |
| Hold de saldo repetido | Idempotente por referencia del pedido (restricción única). |

- **PENDIENTE: confirmar con César:** qué incidentes reales ocurrieron en producción y cómo se
  detectaron; si existe monitoreo con alertas (hay Prometheus y Zipkin en la configuración, sin
  evidencia de alertas).

### Implementation

- **Material disponible:** Java 21, Spring Boot 3.3, Maven multi-módulo, arquitectura hexagonal en
  los servicios (puertos y adaptadores), Flyway por servicio (120 migraciones), Redis 7, Postgres 16,
  MinIO, Docker Compose, GitHub Actions con imágenes en un registro de contenedores. CI que compila y
  prueba todo el reactor en cada push y PR. Deploy con compuertas: verificación de que cada servicio
  está en la matriz y en los compose, aplicación de todas las migraciones sobre un Postgres 16
  vacío, `mvn verify`, build en paralelo de 15 imágenes, despliegue y espera de salud con
  diagnóstico. Pruebas de arquitectura que impiden que el runtime importe clases de dominio.
- **PENDIENTE: confirmar con César:** cobertura de pruebas (no medida); tiempos de build y deploy
  (no medidos).

### Result

- **Material disponible:** solo hechos del repositorio: V2 desplegado por pipeline; redención de
  beneficios de punta a punta sobre el motor de workflows; portal interno consolidado como módulo;
  runbook de carga de datos migrados a producción (2026-09-23).
- **PENDIENTE: confirmar con César:** cualquier resultado de negocio (usuarios activos, procesos que
  dejaron de hacerse a mano, errores evitados). Sin dato verificable, la sección dice qué cambió
  en la forma de operar, sin números.

### Lessons learned

- **Material disponible (con respaldo en código o commits):**
  1. Probar el motor antes de construir encima: el spike encontró un falso éxito y una vía de escape
     de la autorización.
  2. Un canal secundario (eventos de invalidación) no puede deshacer la operación principal.
  3. "At-least-once" exige reclamar pendientes e idempotencia, no solo dejar de confirmar.
  4. Si las migraciones no corren en CI, el primer entorno que las prueba es producción
     (deploy caído el 2026-09-22; los tests no tocaban SQL).
  5. La documentación de diseño se adelantó al código (README de V1, service JWTs, catálogo de
     permisos que dejó de ser la fuente real). Hay que marcar qué está implementado.
  6. Depender de imágenes públicas de terceros es un riesgo de despliegue: una se cerró dos veces.
- **PENDIENTE: confirmar con César:** qué lecciones considera suyas y cuál haría distinto hoy.

---

## 7. Diagramas necesarios

Todos redibujados, nivel lógico, sin puertos, hosts, nombres de cabeceras ni claves.

| # | Diagrama | Propósito | Nodos y aristas (sanitizado) | Detalle |
|---|---|---|---|---|
| Q1 | Vista de plataforma | Mostrar la forma del sistema en 10 segundos. | Navegador (SPA) → Gateway → Runtime. Runtime → Identity (PDP), Contexto, Organización. Runtime → Engines de negocio (agrupados en un bloque). Engines → Redis Streams → Auditoría, Notificaciones, Analítica, Runtime (consumo de eventos). Cada servicio → su base lógica en Postgres (un bloque). Módulos YAML → Runtime (carga). | Bajo: cajas agrupadas, sin todos los servicios por nombre. |
| Q2 | Pipeline de ejecución | Explicar que toda operación pasa por la misma autorización. | Petición → Gateway (firma JWT, versión de sesión, rate limit) → Runtime: blueprint → engine → capability → contexto → PEP ⇄ PDP (con caché) → modelo (directo o workflow) → engine. Rama de denegación en PEP. | Medio: secuencia lineal con una rama. |
| Q3 | Workflow con suspensión | Mostrar el motor con un caso real. | Inicio → reservar stock → congelar saldo → anotar → esperar decisión [suspendido: estado en Redis, ejecución en espera] → evento de decisión llega por stream → idempotencia → reanudar → condición → capturar o liberar → fin. Rama de compensación en orden inverso. | Medio: diagrama de estados o secuencia. Sin nombres de eventos internos. |
| Q4 | Mapa de fallos | Hacer visible qué falla abierto y qué falla cerrado. | Matriz componente caído × efecto, con color por política: fail closed, fail open, degrada, pierde evento. | Bajo: tabla visual. |
| Q5 | Pipeline de entrega | Mostrar las compuertas de calidad. | Push/PR → CI (compilar y probar todo) → compuerta de cobertura de servicios → migraciones sobre Postgres vacío → build de imágenes en paralelo → registro → deploy → espera de salud. | Bajo. Opcional en el caso; útil en el ensayo de migraciones. |
| Q6 | Rotación de refresh token | Solo para el ensayo de sesiones. | Cliente → refresh → ¿token ya rotado? → sí: revocación global + auditoría; no: rotación atómica → nuevo par. Gateway compara versión de sesión. | Medio. |

---

## 8. Profundidad recomendada

- **Caso insignia largo:** 2.000–2.500 palabras en español, misma extensión en inglés. Es el caso
  principal del sitio para la audiencia CTO.
- **Tres diagramas dentro del caso:** Q1, Q2, Q3. Q4 como tabla. Q5 y Q6 viven en los ensayos.
- **Sección del motor de workflows:** 400–600 palabras, con "Límites conocidos" en la misma sección.
- **Decisiones:** 3–4 en el cuerpo (Redis Streams, autorización en el servidor, spike del motor,
  pipeline de entrega). El resto enlaza a ensayos o se omite.
- **Para el recruiter:** un resumen de 3 líneas al inicio con stack, rol y alcance.
- **Para seguridad:** el bloque de Security considerations completo, incluida la brecha de zero trust.
- No mostrar los 15 servicios uno por uno. Agruparlos por capa: borde, plataforma, fundación, negocio.

---

## 9. Ensayos de Engineering Judgment respaldados

Solo los que el código sostiene. Cada uno indica qué lo respalda y su riesgo de autoría.

| # | Título de trabajo | Respaldo | Autoría |
|---|---|---|---|
| E1 | Por qué el frontend no decide quién puede qué | ADR-022: el frontend decidía con un claim que el backend nunca emitió, una vista solo era alcanzable con un selector de desarrollo y el scope por departamento nunca se evaluaba. Hoy el PDP combina principal, permiso y scope y falla cerrado; los pasos de workflow pasan por el mismo PEP. Matiz honesto: el frontend todavía guarda estado operativo en el navegador (24 stores persistidos) mientras migra. | Fuerte: ADR y código de PEP/PDP son de César. |
| E2 | Un ERP no necesita Kafka porque Kafka exista | ADR-004: Kafka configurado e inactivo; Redis ya en producción; umbral para revisar. Matiz: quedó un resto de Kafka para invalidar la caché de autorización sin broker desplegado, y eso llegó a deshacer una asignación de rol hasta que se corrigió. | Medio: ADR-004 está en el documento de arquitectura, que entra desde una identidad git que parece ser de César (a confirmar); el fix del resto de Kafka figura en un commit de otro miembro. Contar la lección, no atribuirse el fix. |
| E3 | Rotar refresh tokens y detectar su reutilización | Hash del token, rotación atómica, reuso → revocación global y auditoría, versión de sesión validada en el gateway, decisión explícita de fail open si Redis cae, TTL de 15 minutos como límite. | Fuerte: 8 de 10 commits del servicio de refresh son de César. |
| E4 | Probar el motor antes de apoyar dinero en él | Spike de Fase 0 de ADR-023 como compuerta: tabla de resultados, tres bugs corregidos, cinco huecos, decisión de no construir saldo ni stock hasta cerrarlos. | Fuerte: ADR, fixes y cierre de huecos son de César. |
| E5 | Publicar un evento no puede tumbar la operación (y qué se pierde) | Publicadores best-effort, publicación después del commit, outbox de notificaciones con `DEAD`, reclamo de pendientes, idempotencia, bug de arranque que dejaba de suscribirse tras el primer redespliegue. Falta un outbox para eventos de dominio: decirlo. | Fuerte en lo del runtime y notificaciones (César). |
| E6 | Si la migración no corre en CI, la prueba es producción | Deploy caído el 2026-09-22 por dos migraciones que no aplicaban sobre una base vacía; 352 tests en verde no lo detectaban porque ninguno tocaba SQL. Respuesta: compuerta que aplica todas las migraciones sobre Postgres real y compuerta de cobertura de servicios. | Fuerte: commit de César. |
| E7 (condicional) | Cuándo no crear otro microservicio | ADR-026 elige un esquema dentro de una base existente para reservar stock en una sola transacción; ADR-001 y el principio de anti-complejidad. | Débil hasta confirmar: ADR-026 lo subió otro miembro. Solo si César confirma que la decisión fue suya. |

Recomendación V1: publicar E1, E3, E4 y E6 (autoría fuerte, temas que cubren las tres audiencias).
E2 y E5 en una segunda tanda o fusionados ("Eventos sin Kafka y sin perder la operación").

---

## 10. Cifras DEL REPOSITORIO

Fecha del conteo: **2026-10-05**. Backend en el commit más reciente de `main` (2026-09-28);
frontend en `main` (último commit 2026-09-28). Se excluye la carpeta de legado V1.

| Cifra | Valor | Publicable |
|---|---|---|
| Servicios desplegables (módulos Maven) | 15 | Sí |
| Librerías compartidas | 4 | Sí |
| Módulos de negocio declarativos (YAML) | 6 | Sí |
| ADR en archivos propios | 10 (ADR-018 a ADR-027) | Sí |
| ADR embebidos en el documento de arquitectura | 17 (ADR-001 a ADR-017) | Sí |
| Imágenes de contenedor construidas por el pipeline | 15 | Sí |
| Migraciones Flyway | 120 | Sí |
| Archivos Java de producción | 1.333 | Mejor "más de 1.300" |
| Clases de prueba / métodos de prueba | 60 / 411 | Sí, sin hablar de cobertura |
| Motor de workflows: archivos / líneas / reglas de validación / métodos de prueba | 43 / ~3.000 / 12 / 40 | Sí |
| Workflows definidos / en uso por el producto | 2 / 1 | Sí |
| Commits backend (total / de César) | 262 / 214 (82%) | Sí, con fecha |
| Commits frontend (total / de César) | 351 / 236 (67%) | Sí, con fecha |
| Merges backend de César | 39 de 39 | Sí |
| Primer commit / último commit | 2026-04-30 / 2026-09-28 | Sí (timeline) |

Advertencia de método: los commits no miden contribución. El código de V2 entró el 2026-08-07 en un
commit de ~30.000 líneas. Por eso no se publican líneas por autor.

---

## 11. Preguntas para César

1. ¿Cuál era tu cargo formal en Brandex durante Quantum, y desde qué fecha?
2. ¿Dónde estuvo el código de V2 antes del 2026-08-07? Los ADR hablan de "Sprint 14" el 2026-08-05.
3. ¿Los documentos de arquitectura y los ADR los escribiste tú, con el equipo o con asistencia de
   IA? Algunos ADR se dirigen a "CES" como quien decide. Necesito describir tu rol sin inflarlo ni
   quedarme corto.
4. ¿La redención de beneficios corre en producción con usuarios reales? ¿Desde cuándo?
5. ¿Desde qué fecha está V2 en producción y cuántas personas lo usan (aproximado, si se puede decir)?
6. ¿Qué problema de negocio concreto motivó la reescritura de V1 a V2?
7. ¿Por qué 15 servicios con un equipo pequeño y un solo servidor? ¿Lo harías igual hoy?
8. ¿Hubo incidentes reales en producción que quieras contar (además del deploy del 2026-09-22)?
9. ¿El fix del resto de Kafka que deshacía asignaciones de rol fue tuyo, en pareja o de otra persona?
10. ¿La decisión de ADR-026 (órdenes dentro de la base de inventario) fue tuya?
11. ¿La identidad git personal que sube el documento de arquitectura v3.3 al repositorio raíz
    (2026-08-13) es tuya? De eso depende atribuirte ADR-001 a ADR-017.
12. ¿Brandex permite publicar el caso sanitizado y nombrar las unidades de negocio internas (D7)?
13. ¿Hay alguna captura del frontend que se pueda usar después de revisarla?
14. ¿Qué harías distinto hoy? (Para Lessons learned en tu voz.)

---

## 12. Notas para otras secciones del blueprint

- **Timeline (About):** 2026-04-30 primer commit de Quantum (V1) y pipeline de deploy el mismo día;
  2026-08-04 Architecture Blueprint v3.3; 2026-08-07 entra V2 y V1 queda congelado; 2026-08-13 el
  gateway pasa a ser el único punto de entrada; 2026-09-08 consolidación del portal interno
  (ADR-021); 2026-09-11 autorización por departamento (ADR-022) y spike del motor (ADR-023);
  2026-09-14 primer flujo de negocio de punta a punta sobre el motor; 2026-09-22 compuerta de
  migraciones en CI; 2026-09-28 último commit revisado.
- **KeepMe (07):** KeepMe es un módulo declarativo de Quantum; su implementación vive en el
  servicio de inventario. El caso KeepMe no debe repetir cifras de plataforma; enlaza a este caso.
- **ADRs del portafolio (10):** ninguno de estos ADR es del sitio. Pero el formato que usa Quantum
  (contexto, decisión, alternativa descartada, costo, criterio para revisar) es un buen modelo para
  los ADR del portafolio. Candidato de tema propio: "Cómo se clasifican las afirmaciones del sitio
  (REAL / DEL REPOSITORIO / SANITIZADO)", que este caso pone a prueba.
- **Security Lab (08):** E3 (sesiones) y E1 (autorización) conectan con la audiencia de seguridad;
  pueden enlazarse desde ahí.
- **Engineering Judgment (02):** ver §9; E1, E3, E4, E6 para V1.
