# 01 · Product blueprint

## Propósito

El portafolio existe para que César consiga conversaciones con los equipos correctos: roles de
ingeniería de software orientados a sistemas, seguridad y arquitectura.

Lo logra mostrando **evidencia de criterio técnico**, no una lista de tecnologías. Además, el propio
sitio es un artefacto de ingeniería público: repositorio, ADRs, pipeline de calidad y mediciones
reales.

## Percepción que debe generar

Al terminar la visita, la persona debería pensar algo como:

> "Construye sistemas reales, piensa en cómo fallan y cómo se protegen, explica sus trade-offs y
> documenta sus decisiones."

Y, si el perfil encaja, concluir por su cuenta que su nivel es mayor de lo que sugieren sus años
de experiencia formal. El sitio nunca lo afirma.

## Perfil profesional a comunicar

**Software engineer: sistemas, seguridad y arquitectura.**

| Pilar | Qué demuestra | Evidencia principal |
|---|---|---|
| Ingeniería | Sistemas full-stack en producción en un contexto empresarial | Quantum / ERP-Rental |
| Seguridad | Seguridad como disciplina de diseño (IAM, autorización en el servidor, auditoría) y práctica blue team | Quantum (sanitizado), Wazuh SOC Lab |
| Liderazgo técnico | Arquitectura documentada, decisiones explícitas, estándares, CI/CD | Blueprints y ADRs de Quantum, este sitio |
| Sistemas de negocio | Traducir operaciones reales a software y procesos | ERP-Rental, KeepMe |

Borrador de posicionamiento (la redacción final es de César):

- ES: "Desarrollador de software. Construyo sistemas empresariales y me ocupo de cómo se protegen y de cómo fallan."
  (Rol decidido el 2026-10-07: en español "Desarrollador de software", porque "ingeniero" es un título
  profesional regulado en Colombia y César es tecnólogo; en inglés "Software engineer", término de
  industria que no implica titulación.)
- EN: "Software engineer. I build business systems and care about how they're secured and how they fail."

## Audiencias

| Audiencia | Qué busca | Qué la convence | Dónde lo encuentra | Tiempo típico |
|---|---|---|---|---|
| CTO / Engineering Manager | ¿Piensa en sistemas y trade-offs? ¿Se hace cargo de resultados? | Decisiones con alternativas y costo, failure modes, lecciones honestas | Casos (decisiones, trade-offs, failure modes), Engineering Judgment, arquitectura de este sitio | 3–8 min |
| Recruiter técnico | Encaje con el rol, stack, señales de nivel, contacto | Resumen claro, rol en cada proyecto, trayectoria, CV | Home, About (timeline), índice de casos, Contacto | 1–3 min |
| Security engineer / SOC | Fundamentos reales: detección, IAM, hardening, pensamiento de atacante; honestidad lab vs producción | Lógica de detección, una prueba controlada ejecutada y validada, investigación y respuesta documentadas | Security Lab, Cyber Ops misión 02, secciones de seguridad de los casos | 5–10 min |
| Software engineer (par) | Calidad del código y cómo está construido | Repo legible, tests, CI, ADRs | Arquitectura de este sitio, ADRs, GitHub | 5+ min |

El recruiter tiene que poder entender todo sin leer profundidad técnica. El CTO y el security
engineer tienen que encontrar profundidad sin buscarla.

## Los primeros 30 segundos

Lo que una persona debe entender, en este orden:

1. **Quién es:** nombre y rol ("Software engineer: sistemas, seguridad, arquitectura").
2. **Que construye cosas reales:** el caso principal (Quantum) y el Security Lab, cada uno con una
   línea sobre lo que tiene de notable.
3. **Qué lo diferencia:** piensa en decisiones y en modos de falla. Se ve en al menos una línea
   concreta de criterio y su enlace.
4. **A dónde ir:** dos CTAs, "Ver casos" y "Explorar el Security Lab". Cyber Ops queda como
   invitación secundaria.

**Criterio de aceptación de la Home:** en una prueba de 5 segundos con tres personas, cada una
sabe decir el rol, un proyecto y que César trabaja seguridad.

## Qué NO queremos comunicar

- "Soy senior", títulos inflados o años de experiencia como argumento.
- Sopa de tecnologías: muros de logos, barras o porcentajes de habilidad.
- Actividad falsa: dashboards con números inventados, "system online", CPU o memoria.
- Clichés hacker: Matrix, glitch, capucha, terminal decorativa.
- Cosas que no existen presentadas como reales (asistente de IA, Failure Lab). Solo aparecen en
  "Lo que viene".
- Información del empleador o de sus clientes.
- Copy genérico ("apasionado por la tecnología", "soluciones robustas").
- Un sitio cuyo protagonista son los efectos visuales y no la ingeniería.

## Principios de producto y contenido

1. **Evidencia antes que afirmaciones.** Cada afirmación lleva a evidencia: una sección de caso, un
   capítulo del lab, un ADR o el repositorio.
2. **Decisiones antes que tecnologías.** El stack aparece, pero después del problema y de las decisiones.
3. **Estado honesto.** El contrato de autenticidad es visible en la interfaz (etiquetas de existencia,
   fuente de cada número, confidencialidad).
4. **Profundidad a demanda.** Cada página se puede escanear en segundos; el detalle está ahí para
   quien lo busca. El recruiter lee el resumen; el CTO lee las decisiones.
5. **Mismo contenido en dos idiomas.** Paridad completa en el lanzamiento.
6. **Diseño callado, un solo elemento memorable.** La tipografía y Cyber Ops como firma interactiva.
7. **El sitio es parte del argumento.** Rendimiento, accesibilidad y seguridad del propio sitio se
   miden y se publican con fecha, no se proclaman.
8. **Complejidad solo si resuelve un problema.**

## Cómo sabremos que la V1 funciona

Sin analítica en la V1 (ver 10, ADR de privacidad), la validación es cualitativa y explícita:

- **Revisión guiada** con al menos una persona de cada audiencia (CTO o EM, recruiter, alguien de
  seguridad), con un guion: qué entendiste en 30 segundos, qué te convenció, qué te sobró.
- **Seguimiento manual** de César: postulaciones enviadas con el enlace y respuestas obtenidas.
- **Revisión de los criterios** de cada fase (15) y de la Definition of Done (16).
