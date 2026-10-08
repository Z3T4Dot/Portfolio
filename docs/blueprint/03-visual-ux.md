# 03 · Visual / UX blueprint

**Dirección:** minimalista, técnico, elegante, profesional, ligeramente futurista. Mucho espacio
negativo, tipografía limpia, negro/blanco/grises y **un solo color de acento**. El lenguaje de
sistemas (estados, trazas, diagramas) solo se usa cuando representa información real.

## Concepto

El sitio se lee como la documentación de un sistema bien diseñado, no como una consola de
ciencia ficción. Lo futurista viene de la precisión: una tipografía de ancho variable usada con
intención, diagramas limpios y una sola tinta de acento. No hay neón ni brillos.

**Elemento memorable:** la tipografía. Archivo en su ancho máximo (125 %) para títulos, contra
texto de ancho normal. Todo lo demás es silencioso.

## Qué evitar

- Fondo negro con texto verde "Matrix", neón, glitch, scanlines, escritura animada infinita.
- Paneles tipo HUD con métricas inventadas (CPU 12 %, MEMORY 41 %, "SYSTEM ONLINE"). Si aparece un
  número, es real o dice "simulado".
- Etiquetas en MAYÚSCULAS con tracking sobre cada título; eyebrows decorativos.
- Fuente monoespaciada para etiquetas que no son código.
- Numeración 01/02/03 si el contenido no es una secuencia real.
- Rejillas de tarjetas idénticas con la misma sombra gris; gradientes decorativos.
- Una palabra resaltada en otro color dentro de un título.
- Flechas "→" pegadas al texto de cada enlace; metadatos unidos con " · ".
- Animaciones de entrada en cada sección al hacer scroll.
- Muros de logos de tecnologías y barras de nivel de habilidad.

## Color

Fuente de verdad: `styles/tokens.css`. Los componentes nunca usan hex; solo tokens.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--paper` | `#F4F5F7` | `#0C0D10` | fondo de página |
| `--surface` | `#FFFFFF` | `#15171C` | superficies elevadas (figuras, tablero del juego) |
| `--surface-2` | `#ECEEF1` | `#1C1F26` | superficies hundidas, bloques de código, hover |
| `--ink` | `#121417` | `#E8EAEE` | texto principal |
| `--muted` | `#5B616E` | `#9298A5` | texto secundario |
| `--line` | `#D9DCE2` | `#272B34` | separadores |
| `--line-strong` | `#B9BEC8` | `#3A3F4B` | bordes decorativos (no llega a 3:1) |
| `--line-ui` | `#7C8290` | `#6B7280` | bordes de controles y aristas de diagramas (≥ 3:1, WCAG 1.4.11) |
| `--accent` | `#2742E6` | `#8FA0FF` | **único acento**: enlaces, foco, selección, elemento activo |
| `--accent-wash` | `#E6EAFD` | `#1A2150` | fondo de selección o elemento activo |
| `--ok` | `#1D7A4C` | `#4CC38A` | estado operativo o mitigado |
| `--warn` | `#995900` | `#E3A33B` | estado degradado o parcial |
| `--threat` | `#C8322A` | `#FF7468` | amenaza o falla |

Reglas:

- `--ok`, `--warn` y `--threat` son **semánticos**: solo aparecen cuando hay un estado real que
  comunicar (un capítulo del lab, una tabla de failure modes, el juego). Nunca como decoración.
- El color nunca es la única señal: siempre va acompañado de texto o forma.
- Contraste medido en ambos temas (texto normal ≥ 4.5:1 sobre `--paper` y `--surface`). Se
  verifica en CI con axe (11). Ningún texto usa opacidad para "suavizarse".
- Tema: por defecto el del sistema; el selector guarda la preferencia. Un script inline (con hash
  en la CSP) aplica el tema antes del primer pintado para evitar el parpadeo.

## Tipografía

| Rol | Familia | Ajustes |
|---|---|---|
| Display (nombre en la Home) | Archivo | `clamp(3rem, 9vw, 7rem)`, ancho 125 %, peso 800, interlineado 0.92, tracking −0.03em |
| Título de página (h1) | Archivo | `--step-4`, ancho 125 %, peso 750, interlineado 1.05 |
| Sección (h2) | Archivo | `--step-3`, ancho 112 %, peso 700 |
| Subsección (h3) | Archivo | `--step-1`, ancho 100 %, peso 650 |
| Texto | Archivo | `--step-0` (17px), peso 400, interlineado 1.6 |
| Secundario | Archivo | `--step--1` (13px), interlineado 1.45 |
| Código, logs, payloads, tokens | Fragment Mono | 0.875em; **solo** para contenido que de verdad es código |

- Escala 1.25: 13 · 17 · 21 · 26 · 33 · `clamp(2.25rem, 4.5vw, 3.25rem)` · display.
- Medida del texto: ≤ 70 caracteres (`.prose`, máximo 68ch).
- Títulos en sentence case. No hay etiquetas en mayúsculas con tracking.
- Fuentes **autohospedadas** en woff2 (subconjunto latin y latin-ext), `font-display: swap` y
  precarga solo de Archivo. Sin Google Fonts en runtime: menos terceros, CSP más simple y mejor
  privacidad.
- Números tabulares (`font-variant-numeric: tabular-nums`) en tablas, marcadores del juego y fechas.

## Espaciado

Base 4px.

| Token | Valor | Uso típico |
|---|---|---|
| `--space-1` | 4px | separación entre ícono y texto |
| `--space-2` | 8px | dentro de controles |
| `--space-3` | 12px | listas compactas |
| `--space-4` | 16px | gutter móvil, párrafos |
| `--space-5` | 24px | gap de grilla |
| `--space-6` | 32px | entre bloques relacionados |
| `--space-7` | 48px | entre subsecciones |
| `--space-8` | 64px | entre secciones (móvil) |
| `--space-9` | 96px | entre secciones (desktop) |
| `--space-10` | 128px | respiración del hero |

Las secciones se separan con espacio, no con cajas. Los separadores de línea (`--line`) solo
aparecen entre elementos de una lista.

## Grid y layout

- Contenedor máximo de 1200px, gutter `clamp(16px, 4vw, 48px)`.
- 12 columnas en desktop (gap 24px); 1 columna en móvil (gap 16px).
- Breakpoints: 480 / 768 / 1024 / 1280. Se diseña primero para móvil.
- Alineación a la izquierda en todo el sitio. No hay bloques de texto centrados, salvo los estados
  vacíos del juego.

Plantillas de página:

```text
Página estándar (Work, Judgment, About)
┌────────────────────────────────────────────────────────────┐
│ h1 (ancho 125 %)                                           │
│ lede, máx. 60ch                                            │
│                                                            │
│ contenido en columnas 1–8, notas en 10–12 (≥ 1280px)       │
└────────────────────────────────────────────────────────────┘

Caso de estudio y capítulos del lab (≥ 1024px)
┌──────────────┬─────────────────────────────────────────────┐
│ índice fijo  │ cabecera de metadatos                       │
│ (cols 1–3)   │ "En 30 segundos"                            │
│ sección      │ secciones en prosa (cols 4–11, máx. 68ch)   │
│ activa       │ figuras y diagramas a ancho completo (4–12) │
└──────────────┴─────────────────────────────────────────────┘
```

Hero de la Home:

```text
┌────────────────────────────────────────────────────────────┐
│ Cesar                                   (display, 125 %)   │
│ Acosta                                                     │
│                                                            │
│ Software engineer:            Construyo sistemas           │
│ sistemas, seguridad,          empresariales y me ocupo de  │
│ arquitectura.                 cómo se protegen y cómo      │
│ (cols 1–4)                    fallan. (cols 5–11)          │
│                                                            │
│ [ Ver casos ]   Explorar el Security Lab                   │
└────────────────────────────────────────────────────────────┘
```

**D8:** el hero no tiene animación ambiental. Una animación de "tráfico de ejemplo" mostraría
datos no reales en el lugar más visible del sitio y competiría con la tipografía. La interacción
vive en Cyber Ops, donde el visitante la elige.

## Radios y bordes

Jerarquía, no un radio único:

| Token | Valor | Uso |
|---|---|---|
| `--radius-s` | 4px | etiquetas, chips, inputs, bloques de código |
| `--radius-m` | 8px | nodos de diagrama, controles secundarios |
| `--radius-l` | 14px | figuras, tablero del juego |
| `--radius-pill` | 999px | botón principal |

Sin sombras decorativas. La elevación se expresa con `--surface` frente a `--paper` y un borde
`--line`.

## Componentes visuales

| Componente | Propósito | Notas de diseño |
|---|---|---|
| SiteHeader / MobileNav | navegación global | fijo con fondo `--paper` al 90 % y blur; en móvil, menú desplegable con focus trap |
| LanguageSwitch | ES/EN | dos enlaces; el activo con `aria-current` |
| ThemeToggle | claro/oscuro | botón con ícono y `aria-label` que nombra la acción. **No aparece en la 404** (ver abajo) |
| PageHeader | h1 + lede | igual en todas las páginas |
| StatusTag | REAL / EXPERIMENTO / PLANEADO | texto siempre visible; REAL con punto `--ok`, EXPERIMENTO con `--warn`, PLANEADO con contorno `--muted` |
| ClassificationTag | Público / Sanitizado | texto con `--muted`; el sanitizado lleva un tooltip que explica qué se omitió |
| MetaList | rol, periodo, stack, equipo | lista de definición en dos columnas; stack en texto, sin logos |
| SectionIndex | índice de la página | resalta la sección visible (estado real del scroll) |
| Figure | imagen o diagrama + leyenda + fuente + clasificación | borde `--line`, radio `--radius-l`, fondo `--surface` |
| Diagram | grafo tipado → SVG accesible | ver "Diagramas" abajo |
| DecisionBlock | contexto → opciones → elección → costo → ¿lo repetiría? | sin caja; título h3 y lista de definición |
| FailureModeTable | falla, detección, impacto, mitigación, riesgo residual | en móvil se apila por fila |
| Metric | número + etiqueta + fuente obligatoria | sin la prop `source` no compila (05) |
| Callout | nota o advertencia dentro de la prosa | barra lateral de 2px, sin ícono decorativo |
| CodeBlock | código, logs, comandos | Fragment Mono, `--surface-2`, botón "Copiar" con confirmación "Copiado" |
| Timeline | etapas con evidencia → NEXT | vertical en móvil y horizontal ≥ 1024px; es una secuencia real, así que sí lleva orden visual |
| CaseRow | fila del índice de casos | toda la fila es un enlace; hover cambia el fondo a `--surface-2` |
| Button | acciones | principal (pill, `--ink` sobre `--paper`) y secundario (texto subrayado) |
| SkipLink | "Saltar al contenido" | visible al recibir foco |

**La página 404 (2026-10-06, spike D4)** es HTML estático sin hidratar (02): funciona sin JS, sus
salidas son enlaces normales y solo lleva el script de tema, que aplica la preferencia guardada
antes del primer pintado. Su diseño no puede depender de JS: no hay ThemeToggle ni otros controles
interactivos.

## Diagramas

Los diagramas son centrales: muestran arquitectura, y la arquitectura es el argumento.

- Se generan desde **datos tipados** (nodos, aristas, fronteras de confianza) y se renderizan como
  SVG. No se usan imágenes exportadas, para que funcionen en ambos temas y en ambos idiomas.
- Estilo: nodos con radio `--radius-m`, borde 1px `--line-ui` y etiqueta Archivo 14px; aristas
  de 1px `--line-ui` con punta de flecha; fronteras de confianza con línea discontinua y una etiqueta; colores
  semánticos solo para estados reales.
- **Interacción:** cada nodo es un botón. Al pasar el puntero o enfocarlo se resaltan el nodo y sus
  aristas, y un panel lateral muestra qué hace y sus controles de seguridad. Es información real del
  sistema, no decoración.
- **Móvil:** cada diagrama define una variante vertical simplificada. Si un diagrama no cabe, no se
  reduce hasta quedar ilegible.
- **Accesibilidad:** `role="img"` con título y descripción, y además una alternativa textual
  generada desde los mismos datos (lista de componentes y conexiones), desplegable.

## Imágenes y evidencia

- Capturas reales solo dentro de Figure, siempre con leyenda, fuente y clasificación. Se revisan y
  sanitizan antes de entrar al repo (08).
- Sin fotos de stock ni ilustraciones genéricas. La foto personal es opcional (PENDIENTE: confirmar
  con César).
- Formatos AVIF o WebP con `width` y `height` explícitos (sin saltos de layout), carga diferida
  bajo el pliegue.
- Íconos solo funcionales (menú, tema, copiar, enlace externo): SVG inline, trazo de 1.5px,
  `currentColor`.

## Microinteracciones

| Interacción | Comportamiento | Duración |
|---|---|---|
| Enlace | el subrayado cambia de grosor y offset | 150ms |
| Botón | cambio de fondo; estado presionado | 120ms |
| Índice de sección | resalta la sección actual | instantáneo |
| Nodo de diagrama | resalta nodo y aristas; abre el panel | 150ms |
| Desplegar/plegar | altura con `interpolate-size` donde haya soporte | 200ms |
| Copiar código | el texto cambia a "Copiado" | 2s |
| Cambio de ruta | crossfade con View Transitions donde haya soporte | 150ms |
| Cambio de idioma o tema | inmediato | — |

## Reglas de animación

1. El movimiento responde a una acción del usuario o muestra un cambio de estado real. Nada más.
2. Sin animaciones de entrada al hacer scroll, sin parallax y sin bucles infinitos fuera del juego.
3. Duraciones de 120–240ms con `--ease: cubic-bezier(.2,.7,.2,1)`.
4. Con `prefers-reduced-motion` se eliminan transiciones de posición y escala; se mantiene, como
   mucho, la opacidad.
5. Sin librería de animación en V1 (**D2**): CSS y View Transitions cubren todo lo anterior. Se
   reconsidera solo si aparece una interacción concreta que lo requiera (ADR de animación, 10).

## Responsive

- Mobile first. Objetivos táctiles de al menos 44px en acciones principales y 24px como mínimo
  absoluto (WCAG 2.2).
- Header: menú desplegable por debajo de 768px.
- Índice de sección: desplegable "En esta página" por debajo de 1024px.
- Tablas: en móvil se apilan como listas de definición; sin scroll horizontal de página.
- Diagramas: variante vertical (ver "Diagramas").
- Juego: diseño táctil propio (09).
- Se verifica a 360, 768, 1024 y 1440px en Playwright (11).

## Accesibilidad (piso, no extra)

Objetivo: WCAG 2.2 AA.

- Landmarks (`header`, `nav`, `main`, `footer`), un `h1` por página y jerarquía de títulos sin saltos.
- `lang` del documento según el idioma de la ruta.
- Skip link; orden de foco lógico; `:focus-visible` con anillo de 2px `--accent` y offset de 3px.
- El color nunca es la única señal.
- Texto alternativo obligatorio en ambos idiomas para cada figura (el build falla si falta, 05).
- Diagramas con alternativa textual.
- Regiones vivas (`aria-live="polite"`) solo donde hay un cambio de estado real, como el juego o
  "Copiado".
- Verificación: axe en CI y una checklist manual de teclado y lector de pantalla (NVDA en Windows,
  VoiceOver en iOS) por fase (11).
