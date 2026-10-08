# 08 · Security Lab

**Estado:** borrador para revisión.
**Fecha de la investigación:** 2026-10-05.
**Fuente:** repositorio del Wazuh SOC Lab de César (solo lectura). Rutas exactas, comandos usados en
la investigación y notas de datos sensibles por captura: `.private/evidence/wazuh-soc-lab.md`.

Este documento define la sección de seguridad del sitio (`/:lang/security` y
`/:lang/security/wazuh-soc-lab`) a partir de lo que el lab contiene de verdad. Donde el lab dice
más de lo que demuestra, este documento se queda con lo demostrado.

---

## 1. El lab en 30 segundos (para quien implementa)

- **Qué es:** un stack oficial de Wazuh 4.14.7 (manager, indexer, dashboard) en Docker, con un
  agente en un endpoint Windows 11. César configuró File Integrity Monitoring (FIM) en tiempo real
  sobre un directorio de prueba, generó cambios controlados con PowerShell, los encontró en el
  dashboard y documentó cómo investigarlos y cómo respondería.
- **Qué demuestra:** que el pipeline endpoint → agente → manager → indexer → dashboard funciona, y
  un método de investigación y clasificación escrito con disciplina (evento, alerta e incidente se
  distinguen; lo no capturado se marca como no capturado).
- **Qué no tiene:** reglas o decoders propios, mapeo MITRE propio, Sysmon, Active Response,
  simulaciones de ataque (fuerza bruta incluida), segundo endpoint ni investigación de un evento
  desconocido.
- **Tamaño real:** un commit (2026-08-13), un endpoint, una prueba controlada. De 16 archivos
  Markdown, 3 están completos, 12 terminan cortados dentro de su primer bloque de código y 1 está
  vacío (DEL REPOSITORIO, conteo 2026-10-05).
- **Implicación para el sitio:** el lab es REAL y vale la pena mostrarlo, pero como lo que es: un
  lab de un endpoint que valida el pipeline y practica el método. La página gana credibilidad
  diciendo con precisión qué no se hizo.

---

## 2. Qué es propio y qué es upstream

Este es el punto de honestidad más importante del lab. La carpeta `wazuh-docker/` es un clon del
repositorio oficial `wazuh/wazuh-docker`.

| Pieza | Origen | Aporte de César |
|---|---|---|
| Wazuh manager, indexer, dashboard | Producto de Wazuh Inc. (GPLv2). Imágenes oficiales `wazuh/wazuh-*:4.14.7` | Ninguno sobre el producto |
| `wazuh-docker/` (compose single-node, generador de certificados) | Clon de `github.com/wazuh/wazuh-docker`, HEAD en el tag `v4.14.7`. 2 800 commits upstream desde 2016; ninguno de César | Tres cambios locales sin commitear: una línea en la config del dashboard (`enrollment.dns: "localhost"`), `.gitignore` reemplazado por el del lab, y el archivo de entorno (no revisado: política de no abrir `.env`) |
| Reglas, decoders, mapeo MITRE, SCA, detección de vulnerabilidades | Ruleset y módulos por defecto de Wazuh | Ninguno. Todo lo que dispara en las capturas es por defecto |
| Configuración FIM del agente | Propia | Una directiva: `<directories realtime="yes">C:\SentinelTest</directories>` |
| Prueba controlada (escritura, sobreescritura y borrado de un archivo) | Propia | Diseño, ejecución y lectura del resultado |
| Método de investigación, modelo de severidad, árbol de decisión, plantilla de documentación | Propio (adaptación del ciclo estándar de respuesta a incidentes) | Documento `response/incident-response.md`, el más completo del repo |
| Documentación y capturas | Propias | 16 `.md` (3 completos) y 4 capturas |

Hechos de atribución:

- `wazuh-docker` quedó en el índice del repo del lab como gitlink, sin `.gitmodules` y sin
  commitear. **No está en el repositorio publicado.** El repo público solo tiene documentación y
  capturas.
- La documentación del lab **no menciona** que el despliegue sale de `wazuh/wazuh-docker`. El sitio
  debe decirlo.

**Texto de atribución para el sitio** (cabecera del lab y capítulo de despliegue):

> ES: "El stack es el Wazuh 4.14.7 oficial, desplegado con el compose single-node del repositorio
> `wazuh/wazuh-docker`. Lo mío es la configuración del endpoint, las pruebas, la investigación y la
> documentación."
>
> EN: "The stack is the official Wazuh 4.14.7, deployed with the single-node compose from the
> `wazuh/wazuh-docker` repository. My part is the endpoint configuration, the tests, the
> investigation and the documentation."

Recomendación para César (fuera del portafolio): añadir esa misma línea al README del lab.

---

## 3. Clasificación

### Lab completo

| Eje | Clase | Nota |
|---|---|---|
| Existencia | **REAL** | Se ejecutó y hay evidencia (capturas, config, documentación). Se presenta como lab, nunca como producto ni como "SOC" operativo |
| Datos | **DEL REPOSITORIO** para conteos y versiones; **MEDIDO** para cifras leídas en capturas del dashboard (fuente: Wazuh Dashboard, 2026-08-13, ventana de 24 h) | Ninguna cifra del dashboard se extrae al texto como titular |
| Confidencialidad | **PÚBLICO** para el contenido; **SANITIZADO** para las capturas | Las capturas muestran datos de la estación de trabajo real de César (ver §6) |

Resuelto en 00: el lab es `REAL · lab` (existe, se ejecutó, se puede demostrar). El modelo de
contenido lleva el tipo en `projectKind: 'lab'` (05) para que nunca se lea como producto.

### Por capítulo

| Capítulo | Existencia | Estado en el sitio | Preparación |
|---|---|---|---|
| Arquitectura | REAL | Ejecutado | Requiere trabajo: diagrama por dibujar y topología por confirmar |
| Despliegue | REAL (sobre upstream) | Ejecutado | Requiere trabajo: documentación cortada, sin comandos |
| Detección | REAL (reglas por defecto + 1 directiva FIM) | Ejecutado | Requiere trabajo: falta una captura de una alerta FIM |
| Simulación | REAL (una prueba controlada) | Ejecutado | Casi lista: texto completo, falta evidencia visual |
| Investigación | REAL (método aplicado a un evento de respuesta conocida) | Ejecutado | Lista en texto; evidencia débil |
| Respuesta | REAL como documento; contención y erradicación no implementadas | Solo metodología | Lista, con etiquetas de estado explícitas |
| Lecciones aprendidas | Documento cortado (una lección) | Pendiente | Falta: César debe escribirlas |

Lo que el propio lab lista como mejoras futuras (reglas propias, mapeo MITRE, Sysmon, Active
Response, simulación de fuerza bruta) es **PLANEADO** y solo puede aparecer en el bloque "Lo que
viene", si César se compromete a hacerlo.

---

## 4. Git y cronología

- **Repositorio del lab:** un solo commit, 2026-08-13 14:23 (UTC−5), autor único: César (identidad
  de git en `.private`). Publicado en GitHub el mismo día, visibilidad pública, sin licencia. Sin
  commits posteriores (≈ 7 semanas sin cambios a 2026-10-05).
- **Clon upstream:** archivos con fecha 2026-08-11; HEAD en `v4.14.7` (tag upstream del 2026-07-09).

Cronología reconstruida. Son indicios (fechas de archivos y datos visibles en capturas), no
registros. Sirve para escribir con precisión, no para publicarse tal cual:

| Fecha (UTC−5) | Indicio | Fuente |
|---|---|---|
| 2026-08-11 | Clon de `wazuh/wazuh-docker` | Fechas de archivos del clon |
| 2026-08-12 10:01 | `enrollment.dns: "localhost"` en la config del dashboard | Fecha del archivo |
| 2026-08-12 10:04 | Registro del agente | Captura del endpoint ("Registration date") |
| 2026-08-12 tarde | Último cambio en el directorio de prueba (hoy vacío) | Fecha del directorio |
| 2026-08-13 11:17 | Cambio en la config del agente; el agente se detiene y arranca (reglas 506 y 503) | Fecha del archivo y captura de eventos |
| 2026-08-13 12:29–13:20 | Capturas | Fechas de archivos |
| 2026-08-13 14:04–14:15 | Documentación | Fechas de archivos |
| 2026-08-13 14:23 | Commit y publicación | Git y GitHub |

Lectura honesta para el sitio: **el lab se construyó en tres días de agosto de 2026.** El metadato
del lab dice "agosto 2026", sin inflar la duración.

---

## 5. Capítulos

Cada capítulo tiene la misma forma en el sitio: **qué hay**, **evidencia**, **qué no hay**.
Abajo, para cada uno: qué existe en el repo, la evidencia disponible, los huecos y lo que no se
puede afirmar.

### 5.1 Arquitectura

**Qué existe en el repo**

- 21 bloques de diagrama ASCII en 15 documentos (DEL REPOSITORIO, 2026-10-05). La mayoría repite
  el mismo flujo: endpoint Windows → agente → manager → indexer → dashboard.
- Inconsistencias: `architecture/README.md` se titula "Deployment"; un diagrama lista "Sysmon /
  Windows Events" en el endpoint, pero el documento de respuesta dice que Sysmon no está integrado;
  algunos diagramas encadenan dashboard después del indexer y otros los ponen en paralelo.

**Topología real (PENDIENTE: confirmar con César)**

Tres indicios apuntan a que todo corre en una sola máquina, la estación de trabajo Windows 11 de
César: el agente se registró con dirección IPv6 de loopback (visible en la captura de agentes); la
config del dashboard fija `enrollment.dns` a `localhost`; Docker Desktop y el agente de Wazuh están
instalados en el mismo equipo. Si se confirma, el diagrama del sitio debe mostrar **un host físico**,
no un endpoint separado de un "SOC host". El diagrama `SOC LAB HOST → Windows 11` del repo sugiere
dos máquinas y no se reutiliza.

**Evidencia visual: diagramas por dibujar (SVG propio, tokens del sistema de diseño)**

1. **Topología** (principal). Un rectángulo "Estación de trabajo Windows 11" que contiene:
   el servicio del agente de Wazuh (con FIM en tiempo real sobre el directorio de prueba y los
   canales de eventos de Windows por defecto) y Docker Desktop con tres contenedores: manager,
   indexer y dashboard. Flechas con puertos del compose upstream (DEL REPOSITORIO): agente → manager
   `1514/tcp` (eventos) y `1515/tcp` (registro); dashboard → indexer `9200`; dashboard → API del
   manager `55000`; navegador → dashboard `443 → 5601`. El puerto `514/udp` (syslog) está publicado
   por el compose pero el lab no lo usa (PENDIENTE: confirmar). Nota al pie: "Componentes oficiales
   de Wazuh; despliegue con `wazuh/wazuh-docker`".
2. **Recorrido de un evento** (secundario). Una fila de cinco etapas con lo que cada una añade:
   cambio en el archivo → el agente calcula checksum y envía el evento → el manager decodifica y
   evalúa reglas (por defecto) y genera la alerta con `rule.id` y `rule.level` → el indexer la
   guarda → el analista la consulta en el dashboard. Detalle opcional, solo si César lo valida
   porque no está en su documentación: dentro del contenedor del manager, Filebeat envía las alertas
   al indexer.
3. **Fuera del lab**: lista textual, no diagrama: sin segundo endpoint, sin segmento de red propio,
   sin Sysmon, sin Active Response, sin integraciones externas.

**Qué no afirmar:** varios endpoints, endpoints Linux (el README del lab tiene un badge "Windows |
Linux" que no tiene respaldo), red aislada, Sysmon, arquitectura "de producción".

**Clasificación:** REAL · DEL REPOSITORIO (puertos y versiones) · PÚBLICO.

### 5.2 Despliegue

**Qué existe en el repo**

- `deployment/README.md`, `deployment/docker/README.md`, `deployment/agent/windows-agent.md`:
  los tres terminan cortados tras el primer diagrama. No hay comandos, ni pasos de generación de
  certificados, ni instalación del agente, ni la configuración completa del agente.
- El clon upstream con un cambio funcional propio: `enrollment.dns: "localhost"` en
  `single-node/config/wazuh_dashboard/wazuh.yml` (hace que el asistente "Deploy new agent" del
  dashboard apunte a `localhost`).
- Agente 4.14.7 en Windows 11, grupo `default`, activo (captura).

**Evidencia**

- Visual: captura de agentes (redactada, ver §6): "1 agente activo, versión 4.14.7, grupo default".
- Técnica: la línea de `enrollment.dns` (no contiene secretos) y la tabla de puertos del compose
  upstream.
- Comandos: los pasos estándar del README oficial de `wazuh-docker` (generar certificados del
  indexer, `docker compose up -d`) **no están documentados por César**. Solo se publican como
  "pasos del README oficial" con enlace, o después de que César confirme cuáles ejecutó.

**Huecos**

- Documentación cortada; la palabra "reproducible" del README del lab no tiene respaldo hasta que
  existan los pasos.
- Hardening del despliegue no documentado (credenciales, exposición de puertos publicados).
  **PENDIENTE: confirmar con César** (detalle en `.private`).
- La config del agente no está en el repo; la única evidencia de la directiva FIM es el fragmento
  citado en la documentación.

**Qué no afirmar:** "construí el despliegue" (es el compose oficial), "reproducible",
"hardened", "alta disponibilidad" o multi-node.

**Clasificación:** REAL sobre upstream · DEL REPOSITORIO · PÚBLICO.

### 5.3 Detección

**Qué existe en el repo**

- `detection/README.md`, `authentication.md`, `endpoint-events.md`, `file-integrity-monitoring.md`:
  los cuatro terminan cortados tras el diagrama. Describen objetivos ("visibilidad de logons
  fallidos", "procesos y servicios") pero no configuraciones ni resultados.
- Configuración propia: una directiva FIM en tiempo real sobre un directorio de prueba.
- Todo lo demás que dispara es por defecto: canales de eventos de Windows, Security Configuration
  Assessment (CIS Windows 11), detección de vulnerabilidades, inventario del sistema.
- **No hay** reglas ni decoders propios, ni mapeo MITRE propio. El propio lab lo reconoce en su
  tabla de capacidades y en "mejoras futuras".

**Evidencia técnica disponible**

Fragmento de configuración (verbatim de la documentación del lab):

```xml
<directories realtime="yes">C:\SentinelTest</directories>
```

Reglas por defecto visibles en la captura de eventos del 2026-08-13 (DEL REPOSITORIO, captura):

| `rule.id` | Descripción (por defecto de Wazuh) | `rule.level` | Módulo |
|---|---|---|---|
| 503 | Wazuh agent started | 3 | Agente |
| 506 | Wazuh agent stopped | 3 | Agente |
| 60104 | Windows audit failure event | 5 | Eventos de Windows |
| 60642 | Software protection service scheduled successfully | 3 | Eventos de Windows |
| 19005 | SCA summary: CIS Microsoft Windows 11 Enterprise Benchmark | 9 | SCA |
| 19014 | Cambio de estado de un control CIS | 9 | SCA |
| 23502 / 23504 | Vulnerabilidad resuelta / vulnerabilidad detectada en un paquete | 3 / 7 | Vulnerabilidades |

Si la tabla se publica, el título dice "Reglas por defecto de Wazuh que dispararon en el lab" y las
filas de SCA y vulnerabilidades no nombran paquetes ni puntajes (ver §6).

**Hueco principal: no hay evidencia visual de una alerta FIM.** La captura llamada
`file-integrity-event.png` muestra la vista de eventos de Threat Hunting con eventos de agente,
Windows, SCA y vulnerabilidades; ninguna fila visible es de syscheck. Los `rule.id` de los eventos
FIM tampoco se registraron ("Not captured in this lab run", dice el propio lab). En el ruleset por
defecto, esos eventos corresponden a reglas como 550 (checksum cambiado) y 553 (archivo borrado),
pero eso **no se publica como observado** hasta recapturar.

**Acción (la de mayor valor de todo el lab):** repetir la prueba FIM y capturar la alerta de
syscheck (vista de FIM y el detalle del documento con `rule.id`, `rule.level`, `syscheck.event`,
ruta y hashes), sanitizada. Costo estimado: menos de una hora.

**Qué no afirmar:** "detection engineering" en el sentido de escribir reglas, reglas o decoders
propios, mapeo MITRE ATT&CK propio (el dashboard muestra tácticas MITRE, pero vienen del ruleset por
defecto y su origen exacto no está verificado), detección de autenticación probada, monitoreo de
procesos, PowerShell logging, threat hunting como práctica (usar la vista "Threat Hunting" no es
hacer threat hunting).

**Clasificación:** REAL · DEL REPOSITORIO · PÚBLICO.

### 5.4 Simulación

**Qué existe en el repo**

- `simulations/file-modification.md` (completo): objetivo, prerrequisitos, configuración, dos
  comandos de PowerShell, eventos esperados contra observados, interpretación y limitaciones.
- `simulations/suspicious-activity.md` (completo): la **misma** prueba vista desde la metodología.
  El título promete más de lo que hay: el propio documento aclara que no se usó malware, exploits ni
  herramientas ofensivas.

**Evidencia técnica**

```powershell
# Escritura inicial
Set-Content "C:\SentinelTest\test.txt" "SENTINEL TEST 001"

# Modificación posterior (cambia contenido y checksum)
Set-Content "C:\SentinelTest\test.txt" "SENTINEL TEST 002"
```

| Acción | Evento esperado | Observado según el lab |
|---|---|---|
| Primera escritura | Archivo creado | No reportado |
| Sobreescritura | `Integrity checksum changed` | Sí |
| Borrado | `File deleted` | Sí (el comando de borrado no está documentado) |

Esta tabla es mejor evidencia que un adjetivo: muestra esperado contra observado e incluye la fila
que no se observó.

**Huecos:** una sola ejecución con un solo archivo; sin captura del evento; sin `rule.id`; el
evento de creación esperado no aparece como observado y no se explica por qué (posible: el archivo
se creó antes de activar la directiva; **PENDIENTE: confirmar con César**).

**Qué no afirmar:** simulación de ataque, emulación de adversario, "actividad sospechosa" como
amenaza, Atomic Red Team o similares, pruebas de volumen.

**Nombre en el sitio:** "Prueba controlada" o "Validación del pipeline", no "simulación de ataque".

**Clasificación:** REAL (ejecutada una vez, agosto 2026) · PÚBLICO.

### 5.5 Investigación

**Qué existe en el repo**

En `response/incident-response.md` (§3–§6, §11, §12, §14) y en la sección "Investigation" de
`suspicious-activity.md`:

- Campos que el analista revisa: `timestamp`, `agent.id`, `agent.name`, `rule.id`, `rule.level`,
  `rule.description`, `location` y datos de syscheck.
- Distinción explícita entre **evento** (telemetría), **alerta** (evento que coincidió con una
  regla) e **incidente** (alerta confirmada como no autorizada o maliciosa tras investigar).
- Flujo: validar el evento → identificar el endpoint → reconstruir la línea de tiempo → contexto →
  severidad → decisión.
- Tabla de preguntas: qué pasó, en qué endpoint, cuándo, qué lo detectó, qué evidencia adicional
  hay, si requiere escalar.
- Modelo de severidad de cuatro niveles donde `rule.level` es una entrada inicial, no la severidad
  final.
- Ejemplo trabajado: el cambio FIM se correlaciona con la ventana de la prueba y se clasifica como
  **bajo / benigno, ejercicio de validación**.

**Evidencia**

- Visual: árbol de decisión del analista (redibujar como diagrama: ¿esperado? → documentar y
  cerrar; si no → investigar → ¿evidencia de compromiso? → monitorear o contener, erradicar,
  recuperar, documentar). Captura de la vista de eventos, redactada (§6), para mostrar con qué
  datos trabaja el analista.
- Técnica: la lista de campos como bloque de código; la tabla de preguntas con sus respuestas.

**Hueco:** la investigación se hizo sobre un evento cuya respuesta se conocía de antemano. Las
alertas reales que el lab sí recibió y no generó César (por ejemplo, 60104 "Windows audit failure
event") no se investigaron. **Oportunidad:** investigar una de esas alertas como evento desconocido
y documentarla con el mismo método convertiría este capítulo en el más fuerte del lab.

**Qué no afirmar:** investigación de un incidente real, threat hunting, correlación de varias
fuentes (no hay telemetría de procesos ni de red).

**Clasificación:** REAL (método documentado y aplicado a una prueba controlada) · PÚBLICO.

### 5.6 Respuesta

**Qué existe en el repo**

- `response/incident-response.md` (309 líneas, completo): ciclo de vida (preparación, detección y
  análisis, contención, erradicación, recuperación, post-incidente), cada fase con su estado real
  en el lab.
- `response/README.md`: vacío.

| Fase | Estado según el lab |
|---|---|
| Preparación | Implementada (stack, agente, FIM) |
| Detección y análisis | Implementada |
| Contención | Solo metodología; sin Active Response; sería manual |
| Erradicación | Solo metodología |
| Recuperación | Verificación manual: el agente reconecta (regla 503) y el directorio vuelve a su estado |
| Post-incidente | Documentación en el repo |

**Evidencia:** esa tabla con su columna de estado es el mejor artefacto de honestidad del lab y el
sitio debe reutilizar ese patrón visual: cada fase con una etiqueta "Ejecutado" o "Solo metodología".
También: la tabla de severidad y la plantilla de registro de incidentes (campos), como texto.

**Qué no afirmar:** respuesta automatizada, Active Response, contención ejecutada, playbooks
probados, SOAR, ticketing, guardias.

**Clasificación:** REAL como documento; contención y erradicación **no implementadas** y así se
etiquetan. Active Response es PLANEADO.

### 5.7 Lecciones aprendidas

**Qué existe en el repo**

- `docs/lessons-learned.md` está cortado: solo el título "A SIEM is more than a dashboard" y el
  diagrama telemetría → … → respuesta.
- `docs/troubleshooting.md` y `docs/methodology.md` también están cortados: no registran ningún
  problema real encontrado ni cómo se resolvió.
- Hay lecciones reales dentro de las simulaciones: FIM en tiempo real frente a escaneo programado;
  capturar `rule.id` en el momento; tratar toda alerta como no confirmada hasta investigarla.

**Lecciones que la evidencia respalda (César las confirma y las escribe con sus palabras):**

1. **Desplegar un SIEM no es tener detección.** Todo lo que disparó fue por defecto; la única
   decisión de detección propia fue qué directorio vigilar y en qué modo. (Documentada en el lab.)
2. **La evidencia se captura en el momento.** Los `rule.id` de la prueba no se registraron y no se
   pueden reconstruir con certeza. (Documentada en el lab.)
3. **El ruido viene de lo que no configuraste.** En 24 horas, un solo equipo sin actividad
   maliciosa produjo decenas de alertas, casi todas de módulos por defecto (SCA, vulnerabilidades,
   eventos de Windows). (Derivada de las capturas. Confirmar.)
4. **Un lab en la estación de trabajo diaria no es un lab aislado.** El agente reportó las
   vulnerabilidades y el puntaje CIS reales del equipo, y una de esas capturas está publicada.
   (Derivada de las capturas. Confirmar que César quiere contarla: demuestra criterio.)
5. **La evidencia se nombra por lo que muestra.** La captura "file-integrity-event" no contiene un
   evento FIM. (Derivada. Conecta con el contrato de autenticidad del propio sitio.)

**Preparación:** falta. Sin este capítulo escrito por César, la página termina en "Respuesta".

---

## 6. Capturas: inventario y seguridad

Las cuatro capturas son de 2026-08-13, 1920 px de ancho, con la barra del navegador visible
(extensiones, idioma de la interfaz y URL del dashboard). **Las cuatro ya son públicas en el repo de
GitHub del lab.** Los valores exactos de los datos sensibles están en `.private`.

| Captura | Qué muestra | Datos sensibles (categoría) | Veredicto |
|---|---|---|---|
| `agent-connected.png` | Endpoints: 1 agente activo; ID, nombre, IP, grupo, SO, nodo, versión, estado | Nombre del host; build exacto de Windows; IP (loopback, sin riesgo, pero revela la topología); barra del navegador | **Usable con redacción:** recortar la barra del navegador; bloque sólido sobre el nombre del host; opcional, la build |
| `dashboard-overview.png` | Overview: resumen de agentes, alertas de 24 h por severidad y la rejilla de módulos de Wazuh | Barra del navegador. Riesgo de interpretación: la rejilla muestra módulos por defecto (AWS, GCP, GitHub, Docker, PCI DSS, HIPAA, malware) que el lab no configuró | **Usable recortada:** solo la franja superior (agentes y alertas de 24 h), con pie que diga fecha, ventana y "un endpoint". Sin la rejilla de módulos |
| `file-integrity-event.png` | Threat Hunting > Events: histograma y 15 eventos (página 2 de 13) con `timestamp`, `agent.name`, `rule.description`, `rule.level`, `rule.id` | Nombre del host en la miga de pan y en cada fila; una fila revela una aplicación instalada con una CVE; filas SCA revelan el puntaje CIS del equipo; barra del navegador | **Usable con redacción, renombrada:** no muestra eventos FIM. Sirve para el capítulo de Investigación ("lo que ve el analista"). Redactar el nombre del host, recortar las filas de CVE y SCA, recortar la barra del navegador. Renombrar el asset (`threat-hunting-events`) |
| `Captura de pantalla 2026-08-13 123038.png` | Detalle del endpoint: ID, IP, versión, SO, fechas de registro y keep-alive; inventario de hardware; evolución de eventos; tácticas MITRE; cumplimiento PCI DSS; resumen de vulnerabilidades con paquetes; puntaje SCA | Nombre del equipo (dos variantes), número de serie, CPU y memoria, build de Windows, paquetes vulnerables, conteo de vulnerabilidades críticas y altas, puntaje CIS del equipo real | **No usar.** Expone la superficie de ataque de la estación de trabajo de César. Recortarla dejaría solo paneles por defecto (MITRE, PCI DSS) que invitan a atribuir capacidades que el lab no tiene |

**Reglas de tratamiento para todas las capturas:**

- Redacción con bloques sólidos y la etiqueta "redactado" en el pie de figura. Sin desenfoque (se
  puede revertir y además parece ocultar algo sin decirlo).
- La redacción se hace sobre una copia en el repo del portafolio; el original del lab no se toca
  desde aquí.
- Se exportan a AVIF/WebP con metadatos eliminados.
- El texto alternativo describe lo que muestra la figura sin repetir datos redactados.

**Capturas que faltan (las pide el sitio):**

1. Alerta FIM en la vista de File Integrity Monitoring o en Discover, con el documento expandido
   (`rule.id`, `rule.level`, `syscheck.event`, ruta, hashes). Es la evidencia central.
2. (Opcional) Una alerta real no generada por César, expandida, si se escribe la investigación de un
   evento desconocido (§5.5).

---

## 7. Diseño de `/security` y `/security/wazuh-soc-lab`

Rutas según 02: `/:lang/security` (hub) y `/:lang/security/wazuh-soc-lab` (el lab por capítulos).
Estilos con CSS Modules por componente (D1), sin prefijos globales. Si D1 eligiera CSS global: `.sec-` para el hub y `.lab-` para el lab.

### 7.1 Hub `/security`

Página corta. Su trabajo es orientar, no impresionar.

1. **Encabezado:** título y un párrafo: cómo trato la seguridad (como disciplina de diseño en los
   sistemas que construyo y como práctica blue team en un lab propio).
2. **Lab:** una entrada en lista (no tarjeta con sombra): Wazuh SOC Lab, una línea de qué es, las
   etiquetas de clasificación (REAL, PÚBLICO) y el alcance ("un endpoint, agosto 2026").
3. **Seguridad en los casos:** enlaces a la sección de seguridad de cada caso (contenido de 06 y 07).
4. **Ensayos de seguridad:** enlaces a los ensayos de Engineering Judgment de §9.
5. **Cyber Ops, misión 02:** una línea, con la etiqueta "Datos simulados".
6. **Lo que viene** (bloque separado, solo PLANEADO): Threat Modeling Lab, según 00 y 14. Nada
   PLANEADO aparece en los bloques 2–5.

### 7.2 Página del lab: estructura

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Wazuh SOC Lab                                                             │
│ Lede: qué es, en una frase llana                                          │
│ Metadatos: Lab personal · agosto 2026 · Wazuh 4.14.7 oficial en Docker ·  │
│ agente en Windows 11 · REAL · PÚBLICO · repositorio (si César lo aprueba) │
│ Línea de atribución (§2)                                                  │
├───────────────┬──────────────────────────────────────────────────────────┤
│ Índice fijo   │ En 30 segundos (3 viñetas: qué construí, qué probé,       │
│               │ qué no construí)                                          │
│ 1 Arquitectura│                                                           │
│ 2 Despliegue  │ Alcance: Ejecutado / Solo metodología / No hecho          │
│ 3 Detección   │                                                           │
│ 4 Prueba      │ Capítulo 1 … 7                                            │
│ 5 Investig.   │   Qué hay · Evidencia · Qué no hay                        │
│ 6 Respuesta   │                                                           │
│ 7 Lecciones   │ Lo que viene (PLANEADO, bloque aparte)                    │
│               │ Siguiente paso: Cyber Ops misión 02 (datos simulados)     │
│               │ · Contacto                                                │
└───────────────┴──────────────────────────────────────────────────────────┘
```

(El diagrama usa " · " solo para abreviar aquí; en la interfaz los metadatos van como pares
etiqueta/valor, según 03.)

- **Numeración 1–7:** permitida porque los capítulos son una secuencia real (el ciclo del lab). Sin
  ceros a la izquierda.
- **Bloque "Alcance":** tres listas cortas al mismo peso visual: "Ejecutado" (pipeline, FIM, prueba
  controlada, investigación de la prueba), "Solo metodología" (contención, erradicación),
  "No hecho" (reglas propias, MITRE propio, Sysmon, Active Response, ataques simulados, segundo
  endpoint). "No hecho" es una limitación, no un plan; los planes van en "Lo que viene".

### 7.3 Navegación por capítulos

- **≥ 1024 px:** columna izquierda con `<nav aria-label="Capítulos">`, `position: sticky`. El
  capítulo visible se marca con `aria-current="true"` (observador de intersección; ya existe
  `useInView`). Cada entrada muestra su estado como texto pequeño con `.status`: "Ejecutado",
  "Solo metodología" o "En redacción". Sin barra de progreso.
- **< 1024 px:** un desplegable "En esta página" (`<details>`) bajo el encabezado, como define 02.
- Cada capítulo tiene ancla estable en inglés (`#architecture`, `#deployment`, `#detection`,
  `#test`, `#investigation`, `#response`, `#lessons`), igual en ambos idiomas.
- Al final de cada capítulo, un enlace al siguiente. Sin flechas decorativas.

### 7.4 Cómo se muestra la evidencia

Un solo componente de evidencia (`LabEvidence`) con cuatro variantes: figura, diagrama, código y
tabla. Todas comparten la misma anatomía:

```text
┌────────────────────────────────────────────────────┐
│ [contenido: captura / SVG / bloque de código / tabla]│
├────────────────────────────────────────────────────┤
│ Pie: qué muestra y por qué importa (1–2 frases)    │
│ Clasificación: [REAL] [MEDIDO] [SANITIZADO] (chips)│
│ Fuente: captura del Wazuh Dashboard, 2026-08-13,   │
│ ventana 24 h. Nombre del host redactado.           │
└────────────────────────────────────────────────────┘
```

- **Clasificación:** chips de texto (sin color decorativo; `--muted` y borde `--line`). Los tres
  ejes cuando aplican; el build falla si falta el de existencia (00).
- **Fuente:** siempre visible, no en tooltip. Para capturas: herramienta, fecha, ventana de tiempo y
  qué se redactó. Para código: archivo de origen ("configuración del agente, `ossec.conf`") y si es
  verbatim o abreviado.
- **Capturas:** marco con `--surface-2` y radio `--radius-l`, sin sombras ni filtros (las capturas
  son de interfaz clara; en modo oscuro se dejan tal cual dentro del marco). Clic o Enter abre un
  `<dialog>` a tamaño completo. `width` y `height` explícitos; carga diferida fuera del primer
  viewport; variantes de 800/1600 px.
- **Diagramas:** SVG en línea con `role="img"`, `<title>` y descripción textual equivalente debajo
  (lista de etapas). Estáticos en V1.
- **Código y logs:** `<pre><code>` en Fragment Mono, etiqueta del tipo arriba ("XML", "PowerShell",
  "Campos de la alerta"), botón "Copiar" (respuesta a una acción, sin animación), sin numeración de
  líneas salvo que el texto las cite. **Solo contenido verbatim del repo o de una captura real
  sanitizada.** Hoy no existe ningún extracto de log o JSON de alerta real; no se muestra ninguno
  inventado ni "de ejemplo". Si se recaptura la alerta FIM, el JSON se publica recortado a los campos
  relevantes y marcado "abreviado".
- **Tablas:** HTML real, con `<caption>`; en móvil, desplazamiento horizontal dentro del contenedor
  (no en la página).

### 7.5 Cómo no parecer un dashboard de SOC falso

- **Sin tarjetas de KPI** ("179 alertas", "1 agente activo", "0 críticas"). Si un número del
  dashboard aparece, aparece dentro de su captura con fecha y ventana, y el pie explica qué significa
  (un endpoint, 24 h, alertas por defecto).
- **Sin contadores en vivo, puntos pulsantes, "LIVE", medidores de "threat level"**, ni
  reproducción en HTML de la interfaz de Wazuh. El sitio no simula una consola.
- **Sin estética de terminal** (verde sobre negro, glitch, escritura animada): ver "Qué evitar" en [03](03-visual-ux.md).
- **El color de estado** (`--ok`, `--warn`, `--threat`) solo se usa para el estado de un capítulo
  o fase, nunca para decorar.
- **Las capturas se presentan como documentos** (figura con pie y fuente), no como paneles.
- **El texto lidera, la evidencia respalda.** Cada capítulo abre con prosa en primera persona; las
  figuras vienen después.
- **El logo de Wazuh no se usa** como elemento gráfico; se nombra el producto en texto.

### 7.6 Contenido y bilingüismo

- Todo el texto vive en los archivos de contenido (05), primero en español. Las capturas tienen la
  interfaz en inglés; pies y texto alternativo existen en ES y EN.
- Términos que no se traducen: FIM, SIEM, `rule.id`, `rule.level`, syscheck, Active Response,
  Threat Hunting (nombre de la vista), nombres de reglas tal como los muestra Wazuh.
- Propuesta de forma de datos (05 tiene la última palabra):

```ts
type LabChapterStatus = 'executed' | 'methodology-only' | 'in-progress';

interface LabChapter {
  id: 'architecture' | 'deployment' | 'detection' | 'test' | 'investigation' | 'response' | 'lessons';
  title: Localized;
  status: LabChapterStatus;
  existence: 'real' | 'experiment';   // 'planned' no se permite en capítulos
  body: Localized;                     // qué hay
  evidence: LabEvidence[];
  limits: Localized<string[]>;         // qué no hay
}

interface LabEvidence {
  kind: 'figure' | 'diagram' | 'code' | 'table';
  caption: Localized;
  alt?: Localized;                     // obligatorio en 'figure' y 'diagram'
  classification: { existence: 'real'; data?: 'measured' | 'repository' | 'simulated'; confidentiality: 'public' | 'sanitized' };
  source: Localized;                   // herramienta, fecha, ventana, archivo
  redactions?: Localized<string[]>;    // qué se redactó, sin valores
}
```

### 7.7 Cierre de la página

1. **Lo que viene** (PLANEADO, bloque separado, solo lo que César confirme): por ejemplo, una regla
   propia para ráfagas de cambios de checksum, una prueba de autenticación fallida, Sysmon, Active
   Response. Si César no se compromete con nada, el bloque no se muestra.
2. **Siguiente paso:** "Jugar Cyber Ops: misión 02", con la nota de datos simulados (§8).
3. **Contacto.**

---

## 8. Relación con Cyber Ops, misión 02

La misión 02 (registros, IOC, investigación de fuerza bruta) se diseña en 09. Este capítulo fija
qué puede tomar del lab y cómo se dice.

### Qué del lab puede inspirar la misión (conceptual)

| Del lab (real) | En la misión (simulado) |
|---|---|
| Distinción evento → alerta → incidente | La decisión final del jugador no es "¿hay alertas?" sino "¿esto es un incidente?" |
| Campos que revisa el analista (`timestamp`, endpoint, regla, nivel, descripción, origen) | Los registros simulados exponen campos equivalentes; el jugador filtra y correlaciona |
| Pregunta "¿la actividad era esperada?" y correlación con la ventana de una prueba conocida | Un señuelo: una ráfaga de logons fallidos que coincide con una prueba autorizada, frente a otra que no |
| El nivel de la regla es una entrada, no la severidad final | El jugador asigna severidad y la justifica con contexto |
| Árbol de decisión (documentar y cerrar, o contener, erradicar, recuperar) | Las acciones disponibles al final de la misión |
| La regla 60104 "Windows audit failure event" sí apareció en el lab, pero nunca se investigó | Solo como inspiración del tipo de evento; no se cita como hallazgo del lab |

### Qué no puede venir del lab

- **La fuerza bruta.** El lab nunca simuló ni detectó un ataque de autenticación; lo lista como
  mejora futura. La misión no dice "basada en un ataque del lab".
- **Registros reales.** El lab no tiene exportaciones de logs ni extractos sanitizados. Todos los
  datos de la misión son SIMULADO.
- **Reglas de Wazuh como si hubieran disparado.** La misión no usa `rule.id` reales de Wazuh ni imita
  la interfaz de Wazuh. Los identificadores de regla del juego son ficticios, con prefijo `SIM-`.
- **Mapeo MITRE del lab.** Si la misión usa T1110 (Brute Force) o T1110.001 (Password Guessing), y
  Event IDs de Windows como 4625 (logon fallido), 4624 (logon exitoso) o 4740 (cuenta bloqueada),
  es conocimiento público de referencia aplicado al juego, no un mapeo hecho en el lab.

### Regla de redacción (exacta)

En la introducción de la misión, en su pantalla final y en el CTA de la página del lab:

> **ES:** "La misión 02 usa registros simulados. No está conectada a Wazuh ni a ningún sistema real.
> Del Wazuh SOC Lab toma el método de investigación, no sus datos."
>
> **EN:** "Mission 02 runs on simulated logs. It is not connected to Wazuh or to any live system.
> It takes the Wazuh SOC Lab's investigation method, not its data."

Cada panel de registros de la misión lleva la etiqueta "Datos simulados" / "Simulated data".

Frases prohibidas en cualquier parte del sitio: "con Wazuh real", "powered by Wazuh", "alertas en
vivo", "datos reales del lab", "integrado con el SOC", "basado en un ataque real del lab".

Si César llega a ejecutar una prueba de logons fallidos en el lab (§10), la misión podrá decir
"inspirada en una prueba real del lab", y la regla de "no está conectada a Wazuh" se mantiene igual.

---

## 9. Ensayos de Engineering Judgment que el lab respalda

Formato según 02: afirmación, contexto, cuándo estaría equivocada, evidencia. Orden por solidez de
la evidencia.

1. **"Una alerta no es un incidente."**
   Contexto: en el lab, cada alerta generada se investigó y se clasificó como benigna; ninguna llegó
   a incidente. Cuándo estaría equivocada: con señales de alta fidelidad (un archivo señuelo, un
   honeytoken), donde la alerta ya es el incidente y esperar a investigar es el error. Evidencia:
   `response/incident-response.md` §4 y §12; la prueba FIM.
2. **"Desplegar un SIEM no es tener detección."**
   Contexto: todo lo que disparó en el lab era el ruleset por defecto; la decisión propia fue qué
   vigilar y cómo. Cuándo estaría equivocada: en una organización pequeña, los valores por defecto
   bien ajustados pueden bastar al principio; escribir reglas propias antes de conocer la línea base
   es desperdicio. Evidencia: tabla de capacidades del lab; captura de eventos.
3. **"Marca lo que no capturaste; no lo reconstruyas."**
   Contexto: el lab dice "Not captured in this lab run" donde faltan `rule.id` en lugar de inventarlos.
   Es el mismo principio del contrato de autenticidad de este sitio. Cuándo estaría equivocada:
   cuando la reconstrucción es determinista y verificable, reconstruir con una etiqueta es válido.
   Evidencia: `simulations/file-modification.md` §8–§9; 00 de este blueprint.
4. **"Prueba la detección con un cambio conocido antes de buscar lo desconocido."**
   Contexto: la prueba FIM validó el pipeline con un cambio cuyo resultado se conocía. Cuándo estaría
   equivocada: un cambio conocido solo prueba el camino feliz; no prueba evasión ni volumen, y puede
   dar falsa confianza. Evidencia: la prueba y su sección de limitaciones.
5. (Secundario) **"El nivel de una regla es una entrada, no la severidad."** Evidencia:
   `response/incident-response.md` §11. Puede fusionarse con el ensayo 1.

Los ensayos 1 y 3 son los más fuertes: tienen evidencia directa y un contraejemplo claro.

---

## 10. Trabajo pendiente antes de publicar (para César)

En orden de valor por esfuerzo:

1. **Recapturar la prueba FIM** con la alerta de syscheck expandida (§5.3). Sin esto, el capítulo de
   detección no tiene evidencia visual propia.
2. **Confirmar la topología** (un solo equipo, Docker Desktop) y el puerto 514/udp sin uso.
3. **Escribir las lecciones aprendidas** con sus palabras (§5.7).
4. **Decidir si el sitio enlaza el repo público del lab.** Si sí, antes: sustituir o retirar las
   capturas con datos del equipo (§6), completar o recortar los documentos cortados, añadir la
   atribución a `wazuh/wazuh-docker`, quitar el badge "Linux", corregir la mención a Sysmon y elegir
   licencia. Si no, el sitio no enlaza y lo dice ("repositorio en revisión").
5. (Opcional, alto valor) **Investigar una alerta real no generada por él** (por ejemplo, una 60104)
   con el método del lab.
6. (Opcional) **Una prueba de logons fallidos** en su propio equipo. Daría a la misión 02 una
   contraparte real y abriría un capítulo de detección de autenticación con evidencia.
7. **Redactar las capturas** según §6 (copias en el portafolio).

## 11. Qué no se afirma en ninguna parte del sitio

Reglas o decoders propios; mapeo MITRE propio; Sysmon, monitoreo de procesos o PowerShell logging;
endpoints Linux; varios endpoints o red aislada; Active Response, contención ejecutada, SOAR o
ticketing; detección o simulación de fuerza bruta; threat hunting como práctica; un "SOC" operativo;
"reproducible" sin pasos documentados; "producción" o "hardened"; investigación de un incidente real;
`rule.id` de FIM como observados; gestión de vulnerabilidades o hardening CIS como trabajo hecho (los
módulos corrieron por defecto y no consta remediación).

## 12. Preguntas abiertas (PENDIENTE: confirmar con César)

1. ¿Todo corrió en la misma estación de trabajo (agente y Docker Desktop)? ¿Se planea pasar el
   agente a una VM?
2. ¿Qué cambió en el archivo de entorno de `wazuh-docker` y se rotaron las credenciales por defecto?
   (No se abrió el archivo.)
3. ¿Cómo se borró el archivo de prueba y por qué no aparece el evento de creación?
4. ¿Se enlaza el repo público del lab desde el portafolio? ¿Con qué identidad de git y licencia?
5. ¿Acepta contar la lección 4 (lab en la estación de trabajo diaria) en público?
6. ~~¿Clasificación del lab: REAL con `kind: 'lab'` o EXPERIMENTO?~~ Resuelta en 00: `REAL · lab`
   (`projectKind: 'lab'` en 05).
7. ¿Se compromete con algún punto de "Lo que viene", o el bloque no se muestra?
8. ¿Valida el detalle de Filebeat en el diagrama del recorrido de un evento?
