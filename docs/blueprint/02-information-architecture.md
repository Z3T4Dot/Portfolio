# 02 · Information architecture

## Sitemap V1

Todas las rutas llevan prefijo de idioma. Los slugs son en inglés y son iguales en ambos idiomas:
URLs estables y compartibles, sin coste de traducir rutas.

```text
/                                   → redirige a /es o /en
                                      (preferencia guardada → idioma del navegador → en)
/:lang                              Home
/:lang/work                         Casos de estudio (índice)
/:lang/work/:slug                   Caso de estudio
/:lang/security                     Security hub: enfoque de seguridad + labs + evidencia en casos
/:lang/security/wazuh-soc-lab       Wazuh SOC Lab, por capítulos
/:lang/judgment                     Engineering Judgment (índice de ensayos)
/:lang/judgment/:slug               Ensayo
/:lang/cyber-ops                    Cyber Ops: hub del juego (chunk diferido; detalle en 09)
/:lang/cyber-ops/firewall           Misión 01
/:lang/cyber-ops/detection          Misión 02
/:lang/cyber-ops/recovery           Misión 03
/:lang/cyber-ops/ending             Cierre y salida al Security Lab
/:lang/about                        Perfil, pilares, Engineering Timeline, cómo trabajo
/:lang/contact                      Contacto y CV
/:lang/architecture                 Cómo está hecho este sitio: arquitectura, calidad medida,
                                    ADRs, "Lo que viene"
/:lang/architecture/decisions/:id   ADR
*                                   404 bilingüe con salidas útiles
```

### Decisiones de estructura

- **`/security/wazuh-soc-lab` en lugar de poner el lab directamente en `/security`.** En V1.1
  llegará el Threat Modeling Lab; con esta forma las URLs no se rompen cuando haya más labs. El hub
  no queda vacío: explica el enfoque de seguridad, enlaza el lab, las secciones de seguridad de
  cada caso, los ensayos de seguridad y Cyber Ops.
- **Una sola página canónica por cosa.** El Wazuh SOC Lab aparece en el índice de `/work`, pero su
  tarjeta enlaza a `/security/wazuh-soc-lab`. No hay contenido duplicado.
- **Engineering Judgment es sección propia, separada de los ADRs.** Los ADRs registran decisiones
  de un sistema concreto (este sitio). Los ensayos explican un criterio general con contraejemplos.
  Mezclarlos debilita a ambos.
- **Sin `/labs` en V1.** Con el backend y el Failure Lab fuera de alcance, una página de labs solo
  tendría cosas PLANEADAS. "Lo que viene" vive en `/architecture` y en la etapa NEXT del timeline.

## Navegación

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Cesar Acosta    Trabajo  Seguridad  Criterio  Sobre mí  Contacto   ES|EN  ◐ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Header (todas las páginas):** nombre (→ Home) · Trabajo · Seguridad · Criterio · Sobre mí ·
  Contacto · selector de idioma · tema. En la 404 no hay selector de tema (ver "404").
- **Cyber Ops** se entra desde la Home, desde el Security Lab y desde el footer.
- **D11 (pendiente de César):** ¿Cyber Ops va en el header? 09 recomienda dejarlo solo en Home,
  Security Lab y footer, para que la audiencia de seguridad no lo lea como un gimmick. A favor de
  ponerlo en el header: es la pieza interactiva que distingue al sitio. Recomendación: fuera del
  header en V1; se reconsidera tras la revisión con las audiencias.
- **Móvil (< 768px):** nombre + botón "Menú" que despliega los mismos enlaces; idioma y tema dentro
  del menú.
- **Selector de idioma:** cambia a la misma ruta en el otro idioma y recuerda la preferencia.
- **Footer:** Contacto, Cyber Ops, Cómo está hecho este sitio, GitHub, LinkedIn, CV (ES/EN), idioma, fecha de
  la última actualización (fecha real del build).
- **Navegación dentro de la página:** índice de secciones fijo en casos y en el lab (desktop); en
  pantallas < 1024px se convierte en un desplegable "En esta página".
- **Cierre de cada página profunda:** el siguiente paso lógico (otro caso, el capítulo siguiente, un
  ensayo relacionado) y Contacto.

## Relaciones entre páginas

```text
                 ┌──────────────────────────── Home ────────────────────────────┐
                 │            │             │             │           │        │
                 ▼            ▼             ▼             ▼           ▼        ▼
               Work       Security       Judgment     Cyber Ops     About   Contact
                 │            │             │             │           │
                 ▼            ▼             │       (final del juego) │
           Caso :slug   Wazuh SOC Lab ◄─────┼─────────────┘           │
            │   │  │      capítulos         │                         │
            │   │  │        ▲  ▲            │                         ▼
            │   │  │        │  └── misión 02 de Cyber Ops      Timeline: cada etapa
            │   │  │        │                                  abre casos reales
            │   │  └── Seguridad del caso ─┘
            │   └── Failure modes ◄── misión 03 de Cyber Ops
            └── Decisiones ──► Ensayo de Judgment / ADR
                                          │
                                          ▼
                            Architecture (este sitio) ──► ADR :id
```

## CTAs

| Lugar | Principal | Secundario |
|---|---|---|
| Home | Ver casos | Explorar el Security Lab · Jugar Cyber Ops |
| Fin de un caso | Siguiente caso | Ensayo relacionado · Contactar |
| Fin del Security Lab | Jugar Cyber Ops (misión 02) | Contactar |
| Fin de Cyber Ops | Explorar el Security Lab real | Ver casos |
| About | Descargar CV | Contactar |
| Ensayo | Caso o ADR que lo respalda | Contactar |

Los textos de CTA dicen exactamente lo que pasa ("Descargar CV (PDF, 2 páginas)"), sin flechas
decorativas.

## Recorridos ideales

**CTO / Engineering Manager**
Home → caso Quantum (decisiones, trade-offs, failure modes) → ensayo de Judgment enlazado →
arquitectura de este sitio → Contacto.

**Recruiter técnico**
Home (30 s) → About (timeline y pilares) → índice de casos (rol y stack de cada uno) → CV → Contacto.

**Security engineer / SOC**
Home → Security hub → Wazuh SOC Lab (detección, prueba controlada, investigación, respuesta) → Cyber Ops
misión 02 → ensayos de seguridad → Contacto.

**Software engineer**
Home → Architecture (este sitio) → ADRs → repositorio en GitHub.

## Contenido por página

### Home

1. **Identidad:** nombre, rol, una frase de posicionamiento, CTAs.
2. **Trabajo seleccionado:** 3 entradas (Quantum, KeepMe y Wazuh SOC Lab, según 07). Cada una: nombre, el problema en una línea, una decisión o hallazgo, etiquetas de estado.
3. **Cómo pienso:** 2–3 títulos de ensayos de Engineering Judgment, cada uno con su tesis en una línea.
4. **Invitación a Cyber Ops:** qué es, cuánto dura y qué se aprende; vista estática, sin animación.
5. **Timeline compacto** (desde la primera etapa con evidencia hasta NEXT) con enlace a About.
6. **Contacto.**

### Work (índice)

Dos bloques, en lista (no rejilla de tarjetas):

1. **Casos y labs:** Quantum, KeepMe y el Wazuh SOC Lab. Cada fila: nombre, tipo de sistema, rol,
   periodo, etiquetas (existencia y confidencialidad) y el problema en una línea.
2. **Selected Work (confidencial):** fichas breves sin página propia (Experiencias, registro masivo):
   problema general, rol, stack a alto nivel y qué construí. Sin cliente ni cifras.

Sin filtros: con tan pocos elementos no aportan.

### Caso de estudio

Plantilla del documento 06: cabecera de metadatos, "En 30 segundos", las doce secciones, cierre.

### Security hub y Wazuh SOC Lab

Detalle en 08.

### Engineering Judgment

Índice con la tesis de cada ensayo en una línea. Cada ensayo (400–800 palabras):

1. La afirmación.
2. El contexto en que la aprendí.
3. **Cuándo estaría equivocada** (el contraejemplo es lo que demuestra criterio).
4. La evidencia: caso o ADR que la respalda.

### About

Introducción breve (máximo 3 párrafos), los cuatro pilares con habilidades en lista simple (sin
niveles) y enlaces a evidencia, Engineering Timeline (cada etapa abre proyectos reales), cómo trabajo
(4–5 principios), formación (PENDIENTE: confirmar con César) y descarga del CV.

### Contact

Email (mailto), LinkedIn, GitHub, CV ES/EN, ubicación y zona horaria, disponibilidad y qué tipo de rol
busca (PENDIENTE: confirmar con César). Sin formulario en V1 (ver 14).

### Architecture (este sitio)

Diagrama del sistema estático (contenido → build → prerender → CDN), resumen de decisiones con enlace
a cada ADR, evidencia de calidad medida con fecha (11), pipeline de CI, "Lo que viene" (PLANEADO,
etiquetado) y enlace al repositorio.

### 404

Bilingüe, explica que la página no existe y ofrece Home, Trabajo y Contacto.

**Estática y sin JavaScript (2026-10-06, spike D4).** El host sirve el mismo `404.html` en cualquier
URL inexistente, y en el cliente esa URL puede coincidir con otra ruta; por eso la 404 no se
hidrata. Es HTML con enlaces normales y solo el script de tema, que aplica la preferencia guardada.
Funciona igual sin JS. **No tiene selector de tema** ni ningún otro control que dependa de JS.
