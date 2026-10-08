# 06 · Case study blueprint

Los casos son el corazón del portafolio. Aquí es donde el visitante decide si César piensa como
ingeniero o solo enumera tecnologías.

## Anatomía de la página

```text
┌──────────────────────────────────────────────────────────────┐
│ Quantum                                         (h1, 125 %)  │
│ Plataforma de operaciones para una empresa de eventos        │
│ [Real · producto] [Sanitizado]                               │
│                                                              │
│ Rol        PENDIENTE (cargo por confirmar)                   │
│ Periodo    2026 – hoy                                        │
│ Equipo     PENDIENTE                                         │
│ Stack      Java 21, Spring Boot, PostgreSQL, Redis, React    │
│                                                              │
│ En 30 segundos                                               │
│ Problema · Qué hice · Resultado (60–90 palabras)             │
├──────────────┬───────────────────────────────────────────────┤
│ Contexto     │ las 12 secciones                              │
│ Problema     │                                               │
│ Rol          │                                               │
│ …            │                                               │
│ (índice fijo)│                                               │
├──────────────┴───────────────────────────────────────────────┤
│ Relacionado: ensayos · ADRs   Siguiente caso   Contactar     │
└──────────────────────────────────────────────────────────────┘
```

"En 30 segundos" es para el recruiter. Las doce secciones son para el CTO y el security engineer.

## Las doce secciones

| # | Sección | Pregunta que responde | Extensión | Obligatoria |
|---|---|---|---|---|
| 1 | **Contexto** | ¿Dónde ocurre esto y para quién? | 80–150 palabras | Sí |
| 2 | **Problema** | ¿Qué hacía falta y por qué era difícil? | 100–200 | Sí |
| 3 | **Rol** | ¿Qué hice yo: diseñé, implementé, lideré? ¿Con quién? | 60–120 | Sí |
| 4 | **Restricciones** | ¿Qué limitaba las opciones: tiempo, equipo, presupuesto, legado, normativa? | lista de 3–6 | Sí |
| 5 | **Arquitectura** | ¿Qué forma tiene el sistema? | diagrama + 150–300 | Sí |
| 6 | **Decisiones técnicas** | ¿Qué decidí y por qué A y no B? | 2–4 bloques | Sí |
| 7 | **Trade-offs** | ¿Qué sacrificamos a cambio? | lista de 3–5 | Sí |
| 8 | **Seguridad** | ¿Cómo se protege y de qué? | 100–250 o lista | Sí* |
| 9 | **Failure modes** | ¿Qué pasa si cae Redis, un servicio, la red? | tabla de 3–6 filas | Sí* |
| 10 | **Implementación** | ¿Qué fue lo difícil de construir de verdad? | 150–300 | Opcional |
| 11 | **Resultado** | ¿Qué cambió? | 60–150 | Sí |
| 12 | **Lecciones** | ¿Qué haría distinto hoy? | lista de 2–4 | Sí |

\* Si el proyecto no tiene una dimensión relevante (por ejemplo, failure modes en una app personal
sin servidor), la sección se omite en `meta.sections`. No se rellena.

Extensión total del caso: 1 200 – 2 000 palabras. Se muestra el tiempo de lectura.

### Formato de una decisión

```text
Título: "Autorización centralizada en un PDP en lugar de reglas en cada servicio"
Contexto          qué situación obligaba a decidir
Opciones          A, B (y C si la hubo), cada una en una línea
Elección          cuál y por qué
Costo             qué se aceptó perder
¿Lo repetiría?    sí / no / con matices, y por qué
ADR               enlace si existe
```

### Formato de failure modes

| Falla | Cómo se detecta | Impacto | Mitigación implementada | Riesgo residual |
|---|---|---|---|---|
| Redis no disponible | health check, errores en logs | … | … | … |

Solo se incluyen fallas cuya mitigación existe en el código o en la documentación. Si una falla se
identificó y **no** está mitigada, puede aparecer como riesgo residual, pero nunca en un sistema del
empleador si revela una debilidad explotable (ver sanitización).

### Resultado sin métricas inventadas

- Con números: solo MEDIDOS o DEL REPOSITORIO, con su fuente visible (`<Metric>`).
- Sin números: resultado cualitativo verificable ("en producción desde 2025-06", "reemplazó el
  registro manual de inventario en tres bodegas"). Requiere confirmación de César.
- Si no hay resultado verificable, se dice el estado actual con honestidad ("en desarrollo; el
  módulo X ya se usa internamente").

## Clasificación de confidencialidad

| Clase | Qué se publica | Ejemplos |
|---|---|---|
| **Público** | Todo, tras revisar que no haya datos personales | Wazuh SOC Lab, este sitio |
| **Sanitizado** | Forma del sistema, patrones, decisiones y razonamiento, stack, conteos del repositorio | Quantum (incluye ERP-Rental), KeepMe |
| **Confidencial** | Nada | Datos comerciales de KeepMe, clientes, código fuente del empleador |

### Reglas de sanitización para el trabajo en Brandex

**Siempre se elimina:**

- Nombres de clientes, eventos de clientes y marcas de terceros.
- Nombres, correos o fotos de personas.
- Precios, costos, tarifas, volúmenes y cualquier cifra de documentos de negocio.
- Hostnames, IPs, dominios internos, nombres de buckets, rutas de repositorios y nombres de máquinas.
- Capturas con datos reales; se rehacen con datos ficticios o se recortan.
- **Debilidades de seguridad no corregidas** en sistemas del empleador. Publicarlas es crear un
  riesgo, no demostrar criterio.
- Fragmentos de código fuente del empleador, salvo permiso explícito. Se usan pseudocódigo o
  fragmentos reescritos.

**Se puede publicar** (con el permiso de D7):

- La forma de la arquitectura a nivel de componentes.
- Patrones y decisiones con su razonamiento y su costo.
- El stack.
- Conteos del repositorio (servicios, módulos, ADRs) con fecha.
- El nombre de productos internos (Quantum) si Brandex lo aprueba.

### Checklist antes de publicar un caso

- [ ] Clasificación definida en `meta.ts` y revisada por César.
- [ ] Ningún elemento de "Siempre se elimina" presente (texto, diagramas, capturas, nombres de archivo).
- [ ] Cada número tiene fuente (`<Metric>`).
- [ ] Cada afirmación de rol fue confirmada por César.
- [ ] Las capturas se revisaron a tamaño completo, metadatos EXIF incluidos.
- [ ] Ambos idiomas dicen lo mismo.
- [ ] Permiso de Brandex registrado (fecha y alcance) en `.private/`.

## Formato breve: Selected Work

Para trabajo hecho para clientes que no quieren ser identificados. No tiene página propia: es una
ficha dentro de `/work`.

| Campo | Contenido |
|---|---|
| Qué es | Una o dos frases genéricas: "Plataforma de inscripción para los colaboradores de un cliente corporativo" |
| Rol | Atribución exacta del registro de hechos (diseñé / construí / lideré) |
| Qué construí | 2–4 viñetas concretas |
| Stack | A alto nivel, sin versiones ni infraestructura identificable |
| Estado | En producción / entregado, con el año |

Nunca: nombre o marca del cliente, cifras, capturas, detalles de seguridad explotables ni nada que
permita deducir quién es el cliente.

## Errores comunes a evitar

- Empezar por el stack. El stack va en la cabecera; la historia empieza en el problema.
- Escribir "implementé X" sin decir por qué X.
- Trade-offs sin costo real ("elegimos la mejor opción").
- Lecciones que en realidad son elogios ("aprendí lo importante que es la calidad").
- Diagramas con todos los componentes al mismo nivel: hay que mostrar fronteras y flujos.
- Un caso por cada repositorio: mejor 4–6 casos profundos que 15 superficiales.
