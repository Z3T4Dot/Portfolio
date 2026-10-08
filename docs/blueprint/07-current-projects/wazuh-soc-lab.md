# Wazuh SOC Lab

**Investigado:** 2026-10-05. **Blueprint completo:** [08 · Security Lab](../08-security-lab.md).
Evidencia privada: `.private/evidence/wazuh-soc-lab.md`.

Lab personal de blue team: Wazuh 4.14.7 oficial en Docker con un agente en Windows 11. César
configuró File Integrity Monitoring en tiempo real, hizo una prueba controlada con PowerShell, la
encontró en el dashboard y documentó cómo investigar y responder. Un commit (2026-08-13), construido
en tres días de agosto de 2026. Página canónica: `/:lang/security/wazuh-soc-lab`.

## Clasificación

| Eje | Clase |
|---|---|
| Existencia | **REAL**, tipo lab (`projectKind: 'lab'` en 05; clasificación fijada en 00, ver 08 §3) |
| Datos | **DEL REPOSITORIO** (versiones, conteos, puertos del compose upstream); **MEDIDO** solo para cifras dentro de capturas con fecha y ventana |
| Confidencialidad | **PÚBLICO** el contenido; **SANITIZADO** las capturas |

## Qué mostrar

- El pipeline endpoint → agente → manager → indexer → dashboard, con la topología real (un solo
  equipo; PENDIENTE confirmar).
- La única configuración de detección propia (directiva FIM en tiempo real) y la prueba controlada
  con su tabla esperado contra observado, incluida la fila no observada.
- El método de investigación: evento, alerta e incidente; campos que se revisan; árbol de decisión;
  `rule.level` como entrada y no como severidad.
- La tabla de fases de respuesta con su estado real ("Ejecutado" / "Solo metodología").
- La atribución: stack y compose oficiales de Wazuh; lo propio es endpoint, pruebas, investigación y
  documentación.

## Qué ocultar o no afirmar

- La captura de detalle del endpoint (número de serie, nombre del equipo, vulnerabilidades y puntaje
  CIS de la estación de trabajo real). No se usa.
- Nombre del host, build de Windows y barra del navegador en las demás capturas.
- Cualquier cifra del dashboard como titular o tarjeta de KPI.
- Reglas o decoders propios, mapeo MITRE propio, Sysmon, endpoints Linux, Active Response,
  simulación o detección de fuerza bruta, threat hunting, "SOC" operativo, "reproducible".

## Evidencia existente

- 3 documentos completos: metodología de respuesta a incidentes y dos documentos de la misma prueba
  FIM. 12 documentos terminan cortados tras su primer diagrama; 1 está vacío (DEL REPOSITORIO,
  2026-10-05).
- 4 capturas del 2026-08-13: agentes (usable con redacción), overview (usable recortada), eventos de
  Threat Hunting (usable con redacción y renombrada: no muestra eventos FIM), detalle del endpoint
  (no usar).
- Fragmentos verbatim: directiva FIM (XML) y comandos de la prueba (PowerShell).
- Reglas por defecto visibles en capturas: 503, 506, 60104, 60642, 19005, 19014, 23502, 23504.

## Qué falta documentar

1. Captura de una alerta FIM real con `rule.id` y `rule.level` (la evidencia central no existe).
2. Pasos de despliegue que César ejecutó y estado de hardening (credenciales, puertos).
3. Lecciones aprendidas en sus palabras (el documento está cortado).
4. Por qué no se observó el evento de creación y cómo se borró el archivo.
5. Opcional: investigación de una alerta real no generada por él; prueba de logons fallidos.

## Diagramas necesarios

1. Topología real (un host, contenedores, puertos del compose upstream).
2. Recorrido de un evento FIM por las cinco etapas.
3. Árbol de decisión del analista.

## Profundidad

Página propia con siete capítulos cortos (arquitectura, despliegue, detección, prueba,
investigación, respuesta, lecciones). Lectura de 5–8 minutos. En Home y en `/work`, una entrada que
enlaza a la página del lab; sin contenido duplicado.

## Preparación

| Capítulo | Estado |
|---|---|
| Arquitectura | Requiere trabajo (diagrama, topología por confirmar) |
| Despliegue | Requiere trabajo (documentación cortada) |
| Detección | Requiere trabajo (falta captura FIM) |
| Prueba controlada | Casi lista |
| Investigación | Lista en texto |
| Respuesta | Lista |
| Lecciones aprendidas | Falta |
