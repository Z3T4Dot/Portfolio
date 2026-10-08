# 07 · Current projects blueprint

Investigación hecha el 2026-10-05 por agentes con acceso de solo lectura a los repositorios. La
evidencia exacta (rutas, comandos, conteos crudos) vive en `.private/evidence/`, fuera del
repositorio público.

| Documento | Contenido |
|---|---|
| [quantum-erp-rental.md](quantum-erp-rental.md) | Quantum (incluye ERP-Rental y el motor de workflows) |
| [keepme.md](keepme.md) | KeepMe: operación de custodia y su módulo en Quantum |
| [wazuh-soc-lab.md](wazuh-soc-lab.md) | Resumen del lab; el blueprint completo está en [08](../08-security-lab.md) |
| [other-candidates.md](other-candidates.md) | Registro masivo para una feria, Experiencias, ConnectMe, micrositio, Statera y timeline |

## Decisión D5: Quantum y ERP-Rental

**Un solo caso, "Quantum".** "ERP-Rental" es el nombre de la carpeta y del alcance inicial, no un
producto distinto. El dominio de alquiler es contexto del caso. El motor de workflows es una sección
del caso, con su alcance real y una subsección de "Límites conocidos".

## Estructura del trabajo en la V1 (D10, decidida el 2026-10-06)

| Nivel | Proyecto | Tipo | Confidencialidad | Formato | Bloqueado por |
|---|---|---|---|---|---|
| Caso profundo | **Quantum** (insignia) | producto | SANITIZADO | Plantilla completa (06) | Permiso de Brandex (G3) |
| Caso profundo | **KeepMe** | producto + operación | SANITIZADO (documentos de negocio CONFIDENCIALES) | Plantilla completa (06) | Permiso de Brandex (G3) |
| Lab propio | **Wazuh SOC Lab** | lab | PÚBLICO (capturas SANITIZADAS) | Capítulos (08) | Trabajo de César en el lab |
| Lab propio | **Cyber Ops** | lab (juego) | PÚBLICO | 09 | — |
| Selected Work | **Experiencias** | producto | Cliente CONFIDENCIAL; descripción SANITIZADA | Ficha breve (06) | G3 |
| Selected Work | **Registro masivo para una feria** | producto | Cliente CONFIDENCIAL; descripción SANITIZADA | Ficha breve (06) | G3; F3–F5 en pausa |
| Solo timeline | ConnectMe, micrositio de evento | — | — | Una línea | — |

Por qué dos casos profundos y no cinco: solo en Quantum y KeepMe se puede mostrar arquitectura,
decisiones y lecciones sin exponer a un cliente. Experiencias y el registro masivo son trabajo para
clientes que no quieren ser identificados; como ficha breve aportan evidencia (producción real,
autoría completa) sin el riesgo de un caso detallado. El registro masivo, además, es un sistema en
vivo: un caso de seguridad detallado sobre él no se publica.

**Fuera:** Statera (EXPERIMENTO), salvo que César quiera mostrar proyectos personales.

**Orden en `/work`:** Quantum → KeepMe → Wazuh SOC Lab (enlaza a `/security/…`) → Selected Work.
La Home destaca Quantum, KeepMe y el Wazuh SOC Lab.

## Ensayos de Engineering Judgment con respaldo

| Ensayo | Respaldo | Autoría |
|---|---|---|
| Por qué el frontend no decide quién puede qué | Quantum, ADR-022, PEP/PDP | Fuerte |
| Rotar refresh tokens y detectar su reutilización | Quantum, servicio de refresh | Fuerte |
| Probar el motor antes de apoyar dinero en él | Quantum, spike de ADR-023 | Fuerte |
| Si la migración no corre en CI, la prueba es producción | Quantum, incidente de deploy del 2026-09-22 | Fuerte |
| Por qué consolidar un portal de 11 microservicios en la plataforma | ConnectMe + ADR-021 | Por confirmar |
| Un ERP no necesita Kafka porque Kafka exista | Quantum, ADR-004 (V1 tenía Kafka configurado sin usar) | Media: contar la lección, no atribuirse el fix |
| Ensayos del lab | Ver 08 §9 | — |

Primera tanda de la V1: los cuatro de autoría fuerte.

## Hallazgos que cambian el plan

1. **El zero-trust interno de Quantum está diseñado, no implementado.** Ninguna página puede decir
   que los servicios se autentican entre sí con JWT firmados. El caso lo presenta, si César lo
   aprueba, como una diferencia honesta entre diseño e implementación, sin detalles explotables.
2. **El Wazuh SOC Lab es más pequeño de lo que se asumía.** El stack y todas sus reglas son upstream
   de Wazuh. Lo propio es una directiva FIM en tiempo real, una prueba controlada, la metodología de
   investigación y respuesta, y la documentación (3 de 16 documentos completos). No hay reglas
   propias, simulación de fuerza bruta ni respuesta activa. El lab se presenta tal cual es y la
   misión 02 de Cyber Ops no puede decir que se basa en una detección de fuerza bruta de César.
3. **Riesgo fuera del portafolio:** el repositorio público del lab incluye una captura con el número
   de serie, el nombre del equipo, las vulnerabilidades y el puntaje CIS de la estación de trabajo
   real de César. Hay que limpiar el historial del repositorio (no basta con un commit que la borre).
4. **Coautoría con IA:** muchos commits de Brandex declaran coautoría con un asistente de IA, y este
   portafolio también se está diseñando con agentes de IA. Hay que decidir cómo se dice (D9 en 00).
5. **El timeline no tiene respaldo antes de septiembre de 2025.** La etapa "2024" la confirma César
   con otra evidencia o se reformula.
6. **Las métricas disponibles son todas DEL REPOSITORIO.** No hay métricas de uso, rendimiento ni
   negocio verificadas. Los resultados de los casos serán cualitativos salvo que César aporte datos
   publicables.

## Trabajo de César antes de la fase de contenido

**Permisos y datos**

- [ ] Pedir a Brandex el permiso de publicación de casos sanitizados (D7): alcance, nombres de
      productos internos (Quantum, KeepMe, ConnectMe) y si se puede decir "para un cliente corporativo".
- [ ] Responder las preguntas de cada documento: cargo, autoría de ADRs y blueprints, producción y
      usuarios, quién ejecutó el análisis OWASP, qué hizo en la operación de KeepMe.
- [ ] Completar el timeline anterior a septiembre de 2025 (estudios, empleos, otra evidencia).

**Wazuh SOC Lab**

- [ ] Limpiar el historial del repositorio público.
- [ ] Rotar las credenciales por defecto si siguen activas.
- [ ] Capturar una alerta FIM real con `rule.id` y `rule.level`.
- [ ] Completar la documentación de despliegue y escribir las lecciones aprendidas.
- [ ] Opcional: una prueba de logons fallidos que dé respaldo real a la misión 02.
