# 15 · Development roadmap

La V1 se construye en fases pequeñas. Al cerrar cada una se puede decir de forma objetiva:
**"esto está terminado"**. Hay dos frentes en paralelo:

- **Frente A, construcción:** lo puede ejecutar un ingeniero o un agente con este blueprint.
- **Frente C, contenido y evidencia:** solo lo puede hacer César (decisiones, permisos, respuestas,
  trabajo en el lab, revisión de textos). **Bloquea fases concretas del frente A**, y está marcado
  donde ocurre.

Tamaños relativos: **S** (≤ 2 días), **M** (3–5 días), **L** (1–2 semanas). Son estimaciones, no
compromisos. Se reemplazan por el tiempo real medido al cerrar cada fase.

## Vista general

```text
Frente C  C0 decisiones ─┬─ C1 permiso Brandex ─┬─ C2 respuestas ── C5 revisión de textos (cada fase)
                         │                       │
                         │   C3 trabajo en el lab (incluye limpiar el repo público: URGENTE)
                         │   C4 timeline y CV
                         ▼
Frente A  F0 fundaciones + spike ─► F1 diseño y shell ─► F2 motor de contenido y plantillas
                                                              │
               ┌───────────────┬───────────────┬──────────────┼──────────────┐
               ▼               ▼               ▼              ▼              ▼
          F3 identidad    F4 casos        F5 Security    F6 Cyber Ops   F8 criterio, ADRs
          (C2, C4)        (C1, C2)        Lab (C3)       M01 + shell    y arquitectura
                                                              │
                                                              ▼
                                                         F7 M03, M02, cierre
               └───────────────┴───────────────┴──────────────┴──────────────┘
                                              ▼
                                   F9 inglés y paridad ─► F10 endurecimiento y lanzamiento
```

Después de F2, las fases F3 a F8 son independientes entre sí (cada una es dueña de sus carpetas) y
se pueden repartir entre varios agentes o personas.

**Límite de esfuerzo del juego (09 Q8):** F6 + F7 no deben pasar del 30 % del esfuerzo total del
frente A. Si se acercan, se aplican los recortes predefinidos de 09 §17.2, en orden.

---

## Frente C: César

| # | Tarea | Bloquea | Urgencia |
|---|---|---|---|
| C0 | Revisar este blueprint y decidir D1–D12 (00) y las "Decisiones para César" de 11, 12 y 13 | F0 | Primero |
| C3a | **Limpiar el historial del repositorio público `wazuh-soc-lab`** (captura con número de serie, nombre de equipo, vulnerabilidades y CIS de la estación real) y revisar si las credenciales por defecto siguen activas | — | **Urgente, independiente del portafolio** |
| C1 | Permiso de Brandex para casos sanitizados (D7): alcance, nombres de productos internos, "para un cliente corporativo" | F4 | Antes de F4 |
| C2 | Responder las preguntas de 07 (cargo, autoría de ADRs y blueprints, producción y usuarios, quién ejecutó el análisis OWASP, rol en la operación de KeepMe) | F3, F4 | Antes de F3 |
| C3b | Trabajo en el lab: capturar una alerta FIM real, completar la documentación de despliegue, escribir las lecciones, aclarar Sysmon (09 Q9). Opcional: prueba de logons fallidos | F5 | Antes de F5 |
| C4 | Timeline anterior a septiembre de 2025, CV en PDF (ES y EN), URLs de perfiles, datos de contacto, foto (opcional) | F3 | Antes de F3 |
| C5 | Revisar y aprobar los textos de cada fase en ES (y en EN en F9) | cierre de cada fase | Continua |
| C6 | Conseguir revisores: un CTO o EM, un recruiter, una persona de seguridad, 5 personas para el playtest del juego | F6, F10 | Antes de F6 |
| C7 | Dominio (D6) y cuenta de Cloudflare | Previews de F0 y el gate B3 (antes de F10), F10 (producción) | Lo antes posible; desde el 2026-10-06 es lo único que falta para cerrar el spike D4 |

---

## F0 · Fundaciones y spike de prerender · M

**Objetivo:** que exista un esqueleto desplegable con todas las decisiones de arquitectura validadas
con evidencia.

**Estado (2026-10-06):**

- **Spike D4 terminado** ([informe](../spikes/d4-prerender.md), proyecto `spikes/d4-prerender/`).
  Todo se verificó en local con `wrangler pages dev`; H4 se omitió.
- **Decisión tomada:** modo framework con prerender y CSP por hashes en `_headers`
  ([ADR-0001](../adr/0001-prerender-con-react-router.md), aceptado). Presupuesto de JS:
  [ADR-0013](../adr/0013-presupuesto-de-javascript.md), aceptado en principio, con cifras pendientes
  de confirmar por César.
- **`Frontend/` en migración** a modo framework en `src/` (entregables 2 y 3).
- **Pendiente: B3 en un preview real**, que requiere la cuenta de Cloudflare (C7). Es un **gate
  antes de F10 y de cualquier deploy a producción**, no de las fases intermedias. Si falla, la CSP
  pasa a `<meta>` sin reabrir D4. La lista completa de verificaciones del preview está en 13.

**Entregables**

1. Spike D4 de 12 (rama `spike/d4-prerender`, máximo 1,5 días): React Router 8 en modo framework con
   `ssr: false` y `prerender`, MDX, CSP por hashes y preview real en Cloudflare Pages. Resultados
   A1–H4 anotados con fecha. **Hecho el 2026-10-06, salvo el preview real** (estado arriba).
2. Según la regla de decisión del spike: modo framework adoptado en `main` (ADR-0001), con los
   requisitos de sus consecuencias: `entry.server.tsx` propio, paths con barra final y sin
   parámetros, 404 sin hidratar, plantilla CSP de 11 §8.
3. Estructura de carpetas de 04 (`appDirectory: "src"`); `src/root.tsx`, `src/routes.ts` con
   `/:lang` y rutas stub, y `src/entry.server.tsx`.
4. `styles/tokens.css`, `base.css` y `fonts.css` con fuentes autohospedadas.
5. i18n: `messages/es.ts` y `en.ts` con paridad verificada por tipos; selector de idioma funcional.
6. `content/schema.ts` y el test de integridad (05) corriendo sobre una entidad de prueba.
7. ESLint (con reglas de fronteras de 04 y la solución elegida para accesibilidad JSX), Prettier,
   Vitest, Playwright con un smoke.
8. CI de 11 §11 en su versión mínima: `verify`, `gitleaks`, `build` + chequeos de `dist`, `e2e`
   local, preview con alias por PR.
9. Postbuild: `_headers` con CSP por ruta, sitemap.
10. `README.md`, `.nvmrc` (Node 24), ADR-0001 y ADR-0010 escritos con los resultados del spike.
    ADR-0001 y ADR-0013 ya tienen borrador en `docs/adr/` (2026-10-06).

**Archivos principales:** `react-router.config.ts`, `vite.config.ts`, `src/root.tsx`,
`src/routes.ts`, `src/entry.server.tsx`, `src/i18n/*`, `src/content/schema.ts`, `src/styles/*`,
`scripts/postbuild.*`, `.github/workflows/*`, `eslint.config.js`.

**Criterios de aceptación**

- `npm run build` genera HTML por ruta e idioma, con `<html lang>`, título y canonical distintos.
- El preview de un PR carga, responde con las cabeceras de 13 y tiene una sola CSP por respuesta.
  **2026-10-06:** depende de C7. Si la cuenta no está, este criterio no bloquea el cierre de F0
  pero pasa a ser el gate B3 antes de F10 (13, "Primer preview real").
- Borrar `en.mdx` de la entidad de prueba hace fallar el CI (demostrado una vez).
- Una importación entre features prohibida hace fallar el lint (demostrado una vez).
- JS de Home medido (MEDIDO) en la app real con el método de ADR-0013: código propio en gzip-9 y
  total en brotli-11, comparados con los presupuestos de 04. La medición queda con fecha y sirve
  para que César confirme las cifras propuestas.
- El chequeo de bundle falla si se superan esos presupuestos (demostrado una vez).

**Dependencias:** C0 (D1–D4), C7 (cuenta de Cloudflare, solo para el preview y el gate B3).

**Riesgos:** con el spike hecho, los de MDX y CSP quedan acotados a las sorpresas documentadas en
el informe; `jsx-a11y` con ESLint 10.

**DoD:** criterios cumplidos, CI en verde en `main`, ADR-0001 y ADR-0010 aceptados, tiempo real de
la fase anotado.

---

## F1 · Sistema de diseño y shell · M

**Objetivo:** todas las primitivas visuales y la estructura global del sitio, accesibles y en
ambos temas.

**Entregables:** SiteHeader, MobileNav, LanguageSwitch, ThemeToggle (sin parpadeo), SiteFooter,
PageHeader, Button, TextLink, StatusTag, ClassificationTag, MetaList, Figure, CodeBlock, Callout,
Metric, Prose (mapeo MDX), SectionIndex, SkipLink, páginas 404 y de error (03). Una ruta interna
`/dev/components` excluida del build de producción para revisar los componentes.

**Archivos principales:** `src/components/ui/*`, `src/features/site/*`, `src/styles/*`.

**Criterios de aceptación**

- Cada componente tiene test de render, roles y teclado.
- axe sin violaciones en `/dev/components` en tema claro y oscuro.
- Capturas a 360, 768, 1024 y 1440px sin scroll horizontal.
- `Metric` sin `source` no compila (demostrado en un test de tipos).

**Dependencias:** F0; D1 (estilos) y D2 (animación) decididos.

**Riesgos:** derivar hacia lo decorativo. Se revisa contra la lista de "Qué evitar" de 03.

**DoD:** criterios cumplidos; revisión manual con teclado y lector de pantalla registrada (11 §6).

---

## F2 · Motor de contenido y plantillas · M

**Objetivo:** que cualquier contenido (caso, capítulo del lab, ensayo, ADR) se pueda publicar
escribiendo solo `meta.ts` y MDX.

**Entregables:** loaders por tipo de entidad; layouts de caso de estudio (06), capítulo del lab
(08 §7), ensayo y ADR; componente `Diagram` (grafo tipado → SVG interactivo con alternativa
textual y variante móvil); `Section`, `Decision`, `FailureModes`; plugin de remark que prohíbe
`import` en MDX; generación de `meta` (título, descripción, OG, canonical, hreflang) desde el
contenido (12); imágenes OG en build si se aprobó (12).

**Archivos principales:** `src/content/*` (loaders y tests), `src/features/case-study/*`,
`src/features/security-lab/*`, `src/features/judgment/*`, `src/features/architecture/*`,
`src/components/diagram/*`.

**Criterios de aceptación**

- Una entidad de prueba de cada tipo se renderiza completa en ES con contenido de relleno marcado
  como fixture (fuera de los índices publicados).
- El test de integridad cubre los 9 puntos de 05.
- Un diagrama de prueba es operable con teclado y tiene alternativa textual.

**Dependencias:** F1.

**Riesgos:** un `Diagram` demasiado ambicioso. Se limita a layouts declarados (en capas o
vertical), sin layout automático general.

**DoD:** criterios cumplidos; E2E de un caso fixture en ES.

---

## F3 · Identidad: Home, About, Contact · S–M

**Objetivo:** que en los primeros 30 segundos se entienda quién es César (01).

**Entregables:** Home (02), About con pilares, timeline y "cómo trabajo", Contact con CV,
`site.ts` y `about/*` en ES, JSON-LD `Person` (12).

**Criterios de aceptación**

- Prueba de 5 segundos con 3 personas superada (01).
- Recorrido E2E del recruiter en ES.
- Cada etapa del timeline enlaza a proyectos que existen o está marcada como pendiente fuera del
  build de producción.

**Dependencias:** F2; C2 y C4; D9 (cómo se dice el uso de IA).

**DoD:** criterios cumplidos; textos aprobados por César (C5).

---

## F4 · Casos de estudio · L

**Objetivo:** los casos que venden el criterio técnico (06, 07).

**Entregables**

- **F4a:** Quantum (insignia, con motor de workflows y diagramas Q1–Q3 de 07).
- **F4b:** KeepMe (caso propio de operaciones + tecnología).
- **F4c:** Selected Work: fichas breves de Experiencias y del registro masivo (formato breve de 06).
- Índice `/work` con los dos bloques (02).

**Criterios de aceptación**

- Checklist de sanitización de 06 completa por caso, con el permiso de C1 registrado.
- Cero afirmaciones sin respaldo: cada número es `Metric` con fuente; cada afirmación de rol fue
  confirmada en C2.
- Lo diseñado y no implementado se dice como tal (por ejemplo, zero-trust interno en Quantum).
- Recorrido E2E del CTO en ES.

**Dependencias:** F2; C1 y C2.

**Riesgos:** escribir sin las respuestas de César lleva a inflar o quedarse corto; por eso C2 bloquea.

**DoD:** criterios cumplidos; textos aprobados (C5).

---

## F5 · Security Lab · M

**Objetivo:** el hub `/security` y el Wazuh SOC Lab por capítulos, tal como es (08).

**Entregables:** hub; siete capítulos; evidencia sanitizada; diagramas de topología, recorrido de un
evento FIM y árbol de decisión; atribución correcta de lo upstream.

**Criterios de aceptación**

- Cada capítulo está marcado como REAL o EXPERIMENTO según 08 §3.
- Ninguna afirmación de la lista "Qué no se afirma" de 08 §11.
- Capturas revisadas a tamaño completo y sin metadatos EXIF.
- Recorrido E2E de seguridad en ES.

**Dependencias:** F2; C3a y C3b.

**Riesgos:** publicar antes de completar C3b obliga a capítulos vacíos. Alternativa: publicar los
capítulos listos y omitir los demás (sin marcadores de "próximamente").

**DoD:** criterios cumplidos; textos aprobados (C5).

---

## F6 · Cyber Ops: núcleo y misión 01 · M

**Objetivo:** shell del juego, persistencia y la misión Firewall jugable (09 §3–§6).

**Entregables:** motor y contrato común, RNG con semilla, bucle de paso fijo, hub, briefing y debrief,
catálogo bilingüe ampliado (09 §6.11, con IPs y dominios reservados), modo sin límite de tiempo,
persistencia en `localStorage`, ADR-0009 y ADR-0012.

**Criterios de aceptación:** DoD de la misión 01 (09 §6.14), incluido el playtest con 5 personas.

**Dependencias:** F1 (no necesita F2); C6 para el playtest; D12.

**Riesgos:** consumir el tiempo del resto del sitio. Aplica el límite de esfuerzo.

**DoD:** 09 §6.14 completo; 0 bytes del juego en el chunk de Home (medido).

---

## F7 · Cyber Ops: misiones 03 y 02 y cierre · M–L

**Objetivo:** completar el arco narrativo, en el orden de 09 §17.1 (primero M03, que no depende
de 08).

**Entregables:** M03 (recuperación y postmortem), M02 (tres casos, o dos si se aplica el recorte 1),
cierre con las frases decididas en D12 y salidas al Security Lab y a los failure modes de Quantum.

**Criterios de aceptación:** DoD de M03 (09 §8.11) y de M02 (09 §7.13); el texto puente de M02
coincide con 08.

**Dependencias:** F6; F5 para los enlaces de salida de M02.

**DoD:** 09 §18 completo.

---

## F8 · Engineering Judgment, ADRs y arquitectura del sitio · M

**Objetivo:** mostrar criterio general y cómo está hecho el propio sitio.

**Entregables:** cuatro ensayos de autoría fuerte (07); ADRs 0001–0013 (10) publicados, migrando
los borradores de `docs/adr/` a `src/content/adrs/` (desde ahí, única fuente); página
`/architecture` con diagrama del sistema estático, pipeline de CI, evidencia de calidad según la
política de 11 §10 y "Lo que viene" (PLANEADO).

**Criterios de aceptación**

- Cada ensayo enlaza a su respaldo (caso o ADR) y tiene la sección "cuándo estaría equivocada".
- Ninguna métrica de calidad sin fecha, herramienta y método.

**Dependencias:** F2; F4a para los enlaces de los ensayos.

**DoD:** criterios cumplidos; textos aprobados (C5).

---

## F9 · Inglés y paridad · M

**Objetivo:** el sitio completo en inglés natural.

**Entregables:** `en.mdx` de todas las entidades, mensajes de UI, contenido del juego, CV en inglés.

**Criterios de aceptación:** el test de integridad en modo producción (paridad obligatoria) en verde;
los recorridos E2E en EN en verde; revisión de César, o de un hablante nativo si es posible.

**Dependencias:** F3–F8 cerradas en ES.

**DoD:** criterios cumplidos.

---

## F10 · Endurecimiento y lanzamiento · M

**Objetivo:** cumplir la Definition of Done (16) en producción.

**Entregables:** CI completo de 11 §11 (CodeQL, dependency review, E2E en 3 navegadores, Lighthouse
CI); dominio con HTTPS y HSTS (13); `security.txt` y `SECURITY.md`; Lighthouse y MDN Observatory
medidos sobre producción y publicados con fecha; rollback probado una vez; revisión guiada con las
tres audiencias (C6).

**Criterios de aceptación:** todas las casillas de 16 marcadas con evidencia enlazada.

**Gate de entrada (2026-10-06):** antes del primer deploy a producción, las verificaciones del
primer preview real de 13 están hechas: **B3** (una sola CSP por respuesta; si falla, CSP en
`<meta>` según ADR-0001) y `Access-Control-Allow-Origin` revisado, entre otras.

**Dependencias:** F9; C6; C7.

**Riesgos:** descubrir tarde problemas de rendimiento o accesibilidad. Mitigación: los presupuestos y
axe corren desde F0.

**DoD:** 16 completo. **La V1 está terminada.**

---

## Reglas para todas las fases

1. Una fase no se cierra con casillas sin evidencia.
2. Ningún texto se publica sin pasar por C5.
3. Todo agente o persona que implemente una fase trabaja solo en las carpetas de esa fase (04) y
   reporta cualquier cambio necesario fuera de ellas en lugar de hacerlo.
4. Si una fase descubre que el blueprint está mal, se corrige primero el blueprint (con fecha) y
   después el código.
5. **Trazabilidad:** cada componente o funcionalidad nueva cita la sección del blueprint o la
   evidencia que justifica su existencia (en el PR o en el comentario de cabecera del módulo). Sin
   justificación trazable, queda fuera de la V1 ("sería cool" no es una justificación).
