# Otros candidatos a caso de estudio y timeline

**Estado:** investigación para el blueprint, 2026-10-05.
**Documento público.** Los proyectos hechos para clientes aparecen con un nombre genérico. No se
nombran clientes, eventos de clientes, marcas de terceros, personas, repositorios ni rutas. La
evidencia exacta (rutas, comandos, fechas por identidad) está en
`.private/evidence/keepme-and-others.md`, fuera del repositorio.

Quantum (incluido su motor de workflows) y el Wazuh SOC Lab ya están dentro del V1. Este documento
evalúa el resto.

---

## Resumen

| Proyecto (nombre público) | Qué es | Audiencia principal | Pilar | Existencia | Datos | Confidencialidad | Recomendación |
|---|---|---|---|---|---|---|---|
| Registro masivo para una feria | Registro de alto volumen para un evento presencial, con análisis OWASP y plan de capacidad | Security engineer, CTO | Seguridad, ingeniería | REAL | DEL REPOSITORIO; MEDIDO solo si Brandex autoriza | SANITIZADO | **Caso completo** |
| KeepMe | Operación de custodia y su módulo en Quantum | CTO | Business systems | REAL | DEL REPOSITORIO | SANITIZADO / CONFIDENCIAL | **Caso medio, condicionado** (ver [keepme.md](keepme.md)) |
| Experiencias | Inscripción de colaboradores de un cliente corporativo a experiencias, con dos almacenes de datos | Software engineer, recruiter | Ingeniería, business systems | REAL | DEL REPOSITORIO | SANITIZADO | **Caso corto** |
| ConnectMe | Portal corporativo sobre 11 microservicios, inactivo, con plan de absorción en Quantum | CTO | Liderazgo técnico (criterio) | REAL (inactivo) | DEL REPOSITORIO | SANITIZADO | **Timeline + nota en Engineering Judgment** |
| Micrositio de evento | Sitio estático con la marca de un cliente para un evento | Recruiter | Ingeniería (frontend) | REAL | — | SANITIZADO | **Solo timeline**, genérico |
| Statera | App personal de presupuesto (web y Android) | — | — | EXPERIMENTO | — | PÚBLICO | **Excluir de casos**; mención opcional en timeline |

### Lista final recomendada para el V1 (5 casos)

1. Quantum / ERP-Rental, con su motor de workflows (ya decidido).
2. Wazuh SOC Lab (ya decidido; es el ancla del Security Lab).
3. Registro masivo para una feria: el caso de seguridad aplicada y operación bajo carga.
4. KeepMe: operaciones + tecnología, de profundidad media. Si César confirma que solo hizo el
   software, se integra al caso de Quantum y el V1 queda con 4 casos.
5. Experiencias: caso corto sobre integración entre dos almacenes de datos y seguridad por capas.

ConnectMe no tiene caso propio. Su mejor historia es una decisión: absorber un portal de
11 microservicios dentro de la plataforma. Esa historia encaja en Engineering Judgment.

---

## Registro masivo para una feria

**Qué es.** Infraestructura de registro para un evento presencial de alta asistencia, hecha para un
cliente. Next.js actúa como BFF y es la única superficie pública. Detrás hay microservicios NestJS
con Fastify (registro, auditoría, administración, media), PostgreSQL, Redis y una base de datos
gestionada para los registros. Delante, Cloudflare y un reverse proxy. Todo corre en contenedores
sobre un servidor dedicado, con despliegue por GitHub Actions.

**Lo que muestra el repositorio:**

- **Análisis de vulnerabilidades frente al OWASP Top 10**, de caja gris: pruebas activas
  autorizadas, revisión de código e inspección de infraestructura. Tiene una versión 2 con
  verificación de cierre de cada recomendación y evidencia conservada.
- **Mínima exposición**: ningún servicio de backend es alcanzable desde Internet. El BFF añade la
  API key de servicio (comparada en tiempo constante) y el JWT antes de reenviar.
- **Controles por servicio**: Helmet con CSP en modo bloqueo, CORS con lista blanca, rate limiting
  por endpoint, bloqueo de cuenta por intentos fallidos, validación contra mass assignment,
  reglas restrictivas en la base de datos gestionada, dependencias sin avisos tras la remediación,
  procedimiento de rotación de secretos y purga de logs con documentos de identidad.
- **Plan de capacidad**: modo cluster, presupuesto de CPU y de conexiones a PostgreSQL, qué estado
  vive por proceso y cuál se coordina, vigilancia durante el evento y checklist del día.
- **Pruebas de carga** en un entorno espejo, con un escenario k6 documentado.
- **Análisis de costos** de la base de datos gestionada con datos reales de consola, y el costo por
  acción antes y después de optimizar.
- 113 archivos de test en el backend: 110 unitarios y 3 end-to-end (DEL REPOSITORIO, conteo de
  `*.spec.ts` y `*.e2e-spec.ts`, 2026-10-05).

**Valor para la narrativa.** Es el caso más fuerte para un security engineer: muestra controles
concretos, un método reconocido y verificación de cierre. Para un CTO muestra dimensionamiento,
costos y operación en vivo. Conecta el Security Lab con trabajo de producción.

**Cuidado con la honestidad.** César construyó el sistema y el análisis lo ejecutó su empleador.
El caso debe presentarlo como una **auditoría interna del propio sistema**, no como un pentest
independiente. **PENDIENTE: confirmar con César** quién ejecutó el análisis.

**Qué ocultar.** Nombre del cliente y del evento, dominio, objetivo de concurrencia, resultados
numéricos de carga y de costos (a menos que Brandex los autorice; en ese caso serían MEDIDO, con
herramienta y fecha), proveedor de hosting, capturas del sitio con marca.

**Clasificación.** REAL · DEL REPOSITORIO (MEDIDO solo con autorización) · SANITIZADO.

**Recomendación: caso completo.**

**PENDIENTE: confirmar con César.** Número real de registros y picos (solo si se pueden publicar),
incidentes durante el evento, autoría del análisis, permiso de Brandex.

---

## ConnectMe

**Qué es.** Portal corporativo interno de Brandex para empleados, clientes y marcas: tienda de
beneficios con moneda interna, centro de activos de marca, solicitudes de recursos humanos,
eventos y notificaciones. Frontend en React 19 con Vite. Backend de 11 microservicios: 5 en Kotlin
con Spring (gateway, autenticación, usuarios, marcas, mensajes) y 6 en NestJS.

**Lo que muestra el repositorio.** El frontend tiene historial entre septiembre de 2025 y mayo de
2026. Los servicios de backend no tienen historial de git disponible localmente. Un ADR de Quantum
(septiembre de 2026) redefine ConnectMe como módulo declarativo de la plataforma: la identidad, la
moneda, las notificaciones y la auditoría estaban duplicadas respecto de Quantum, y una sola moneda
reemplaza la anterior.

**Valor para la narrativa.** Para un CTO, la historia valiosa es la decisión, no el portal:
reconocer que 11 servicios propios duplicaban la plataforma y planear su absorción. Mostrarlo como
caso de microservicios invitaría a leerlo como complejidad por sí misma, que es justo lo que el
blueprint quiere evitar.

**Clasificación.** REAL, inactivo · DEL REPOSITORIO · SANITIZADO (producto interno, se puede nombrar
si Brandex lo aprueba).

**Recomendación: timeline + nota en Engineering Judgment** ("por qué consolidé un portal de
11 microservicios en la plataforma").

**PENDIENTE: confirmar con César.** Si diseñó y construyó también el backend, dónde está su
historial, si el portal llegó a producción y con cuántos usuarios (solo si se puede publicar), y si
la absorción ya empezó o sigue planeada (si sigue planeada, va como PLANEADO).

---

## Experiencias

**Qué es.** Plataforma donde una organización publica experiencias (talleres, catas, viajes,
charlas) y sus colaboradores se inscriben. El repositorio indica que se hizo para un cliente
corporativo, cuyo nombre no se publica. API en Express con TypeScript, Supabase (autenticación y
metadatos) y Airtable (inscritos, una tabla por evento). Frontend en React con Vite. Se despliega en
un servidor propio detrás de Nginx, con GitHub Actions.

**Lo que muestra el repositorio:**

- **Decisión de negocio explícita**: los inscritos van a Airtable porque el equipo de negocio
  necesita verlos y exportarlos sin pasar por TI.
- **Escritura entre dos almacenes con compensación**: primero Supabase y después Airtable; si
  Airtable falla, se revierte en Supabase. El orden está justificado por escrito.
- **Mapeo estable** del formulario dinámico a columnas por identificador de campo, no por nombre.
- **Seguridad por capas**: API key, JWT verificado, validación con Zod en todas las escrituras,
  Helmet con CSP restrictiva, rate limits separados para lectura, escritura y autenticación,
  límite de tamaño del body, logs con cabeceras sensibles redactadas, request ID y verificación
  anti-bots.
- Scripts de prueba de seguridad y de carga, y un test de base de datos.
- Un README extenso con sus decisiones de diseño.

**Valor para la narrativa.** Para un software engineer o un recruiter: un sistema pequeño, completo
y en producción (PENDIENTE confirmar), con decisiones explicadas y su costo. Complementa a Quantum
con una escala distinta.

**Clasificación.** REAL · DEL REPOSITORIO · SANITIZADO.

**Recomendación: caso corto** (problema, arquitectura, 2 o 3 decisiones, seguridad).

**PENDIENTE: confirmar con César.** Uso en producción y periodo, permiso para describirlo como
"para un cliente corporativo", resultados de las pruebas de carga (solo si se pueden publicar).

---

## Micrositio de evento

**Qué es.** Sitio estático con la marca de un cliente para un evento: agenda, registro y contenido
del evento. React 19, Vite, Tailwind y despliegue por GitHub Actions. Trabajo entre mayo y agosto de
2026.

**Valor para la narrativa.** Bajo. Es trabajo de frontend correcto, pero su valor visual depende de
la marca del cliente, que no se puede mostrar. No aporta decisiones de arquitectura ni de seguridad
que los otros casos no cubran mejor.

**Clasificación.** REAL · sin datos publicables · SANITIZADO (sin capturas).

**Recomendación: solo timeline**, como "micrositio de evento para un cliente". Excluirlo es
aceptable.

---

## Statera (app personal de presupuesto)

**Qué es.** Dos versiones de una app personal de presupuesto: una web con React, Vite y Capacitor
(octubre de 2025) y otra con Next.js y Capacitor para Android (abril de 2026).

**Lo que muestra el repositorio.** Poco historial: 5 commits en la primera versión y 1 en la
segunda (DEL REPOSITORIO, 2026-10-05). Los READMEs son las plantillas del framework. No hay
evidencia de publicación en una tienda de apps.

**Valor para la narrativa.** Bajo para las tres audiencias. No muestra criterio de arquitectura ni
de seguridad y competiría por atención con casos más fuertes.

**Clasificación.** EXPERIMENTO (proyecto personal en desarrollo) · sin datos · PÚBLICO.

**Recomendación: excluir de los casos.** Mencionarlo en el timeline solo si César quiere mostrar
proyectos personales.

**PENDIENTE: confirmar con César.** Si la app está publicada o la usa alguien más.

---

## Nota transversal: asistentes de IA

En varios repositorios de Brandex, una parte de los commits declara coautoría con un asistente de
IA (conteo exacto en la evidencia privada). Las reglas de honestidad del blueprint piden decidir
cómo se presenta. Recomendación: decirlo de forma directa en About o en la sección de proceso, y
que cada caso explique qué decidió César, no quién escribió cada línea.
**PENDIENTE: confirmar con César.**

---

## Timeline propuesta

Basada en las fechas del primer y del último commit de César en cada repositorio local
(DEL REPOSITORIO, consultado el 2026-10-05). Solo se publican años y etapas.

| Periodo | Etapa propuesta | Respaldo en git | Estado |
|---|---|---|---|
| Antes de septiembre de 2025 | Formación y primeros trabajos en desarrollo | **Ninguno**: no hay historial local anterior a septiembre de 2025 | **PENDIENTE: lo completa César** (estudios, empleos, repos en otras cuentas o máquinas) |
| 2025 (septiembre a diciembre) | Desarrollo full stack: portal corporativo | Frontend de ConnectMe desde septiembre de 2025; app personal en octubre de 2025 | Respaldado |
| 2026 (enero a mayo) | Full stack sobre microservicios; empieza Quantum | ConnectMe hasta mayo de 2026; backend y frontend de Quantum desde finales de abril de 2026; micrositio desde mayo | Respaldado |
| 2026 (junio a octubre) | Arquitectura de plataforma, sistemas de negocio y seguridad aplicada | Quantum (su mayor actividad, en septiembre), Experiencias (junio a septiembre), Wazuh SOC Lab (agosto), KeepMe (agosto y septiembre), registro de la feria (agosto a octubre, con análisis OWASP en septiembre) | Respaldado |
| Liderazgo | Liderazgo técnico | Quantum tiene otros contribuidores, pero git no muestra quién lideró | **PENDIENTE: confirmar con César** (cargo, equipo a cargo, desde cuándo) |

Observaciones:

- La etapa "2024: desarrollo de software" que se propuso al inicio **no tiene respaldo en git
  local**. César debe confirmarla con otra evidencia o la etapa se reformula.
- El backend de ConnectMe no tiene historial disponible. Si existe en otra cuenta, podría adelantar
  o detallar la etapa de 2025.
- Las fechas de commit miden actividad en el código, no fechas de contratación ni de lanzamiento.
  El timeline debe decir "trabajo en" y no "lancé", salvo que haya otra evidencia.
