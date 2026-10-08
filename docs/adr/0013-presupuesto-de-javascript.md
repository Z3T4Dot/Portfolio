# ADR-0013: Presupuesto de JavaScript: código propio aparte y techo total sobre la línea base medida

| Campo | Valor |
|---|---|
| Estado | **aceptado** (2026-10-06). Cifras confirmadas por César el mismo día, todas en brotli-11 |
| Fecha | 2026-10-06 |
| Decide | César |
| Evidencia | [Informe del spike D4](../spikes/d4-prerender.md), criterio A7 y consecuencia 9 |
| Blueprint | 04 ("Presupuestos de rendimiento"), 11 §7, 12 (criterio A7), 16 |

## Contexto

- 04 y 11 §7 fijaban **"JS inicial de Home ≤ 90 KB gzip"** como gate de PR. 11 §7 ya advertía que
  era un umbral objetivo, no una medición, y que si lo superaban el framework y el runtime se
  corregiría con un ADR, nunca en silencio. El criterio A7 de 12 obligaba a este ADR si fallaba.
- **Medición del spike** (2026-10-06). Método: se suma el JS que la página pide al cargar
  (`<script src>`, `<link rel="modulepreload">` y sus imports estáticos), comprimido con gzip
  nivel 9 y brotli calidad 11 de zlib de Node:

  | Medición (Home `/es/`) | Valor |
  |---|---|
  | Modo framework + prerender (ADR-0001) | 12 archivos; 357 214 B sin comprimir; **115 250 B gzip-9 (112,55 KiB)**; **100 923 B brotli-11 (98,56 KiB)** |
  | De eso, React + React Router | 110 559 B gzip (el 96 %) |
  | De eso, código de la app + manifest de rutas | 4 691 B gzip (unos 4,6 KiB) |
  | Vite SPA mínima con los mismos componentes | 98,14 KiB gzip-9 |

- **Conclusión:** 90 KB gzip no se alcanza con React 19 + React Router 8 ni siquiera en una SPA
  mínima. Además, casi todo lo que mide es framework: el número no dice nada sobre las decisiones
  que se toman en el código propio. Un gate que falla siempre se termina ignorando.
- Según el informe del spike, Pages sirve brotli a los navegadores modernos.

## Decisión

Se **invalida "≤ 90 KB gzip de JS inicial" como criterio de aceptación**. Se reemplaza por dos
presupuestos para Home, medidos en el build y comprobados por separado:

| # | Presupuesto | Cifra | Base |
|---|---|---|---|
| a | **Código propio** de Home: todo el JS que la página pide salvo los chunks de `react`, `react-dom` y `react-router`; el manifest de rutas cuenta como propio | **≤ 15 KiB brotli-11** | Hoy mide unos 4,6 KiB gzip (spike). Se fijó en brotli, como el total, para que ambos límites usen la misma unidad |
| b | **JS total** de Home | **≤ 115 KiB brotli-11** | Línea base del modo framework (98,56 KiB brotli-11) + el presupuesto propio (15 KiB) + ~1,5 KiB de margen. Los dos límites se pueden alcanzar a la vez: la primera propuesta (25 KiB gzip / 110 KiB brotli) no cuadraba, porque mezclaba unidades y el total dejaba sin uso el límite propio |

El gzip-9 del total se sigue reportando como referencia (línea base: 112,55 KiB), pero no es gate.

Este ADR no cambia los demás presupuestos de 04: JS adicional por ruta, chunk del juego, LCP, CLS,
TBT y fuentes.

**Nota para César sobre las cifras.** Con la línea base actual, (b) deja unos 11,4 KiB brotli de
margen para todo el crecimiento (110 − 98,56), mientras que (a) permite que el código propio crezca
unos 20 KiB gzip (25 − 4,6). Es difícil que ese crecimiento quepa en 11,4 KiB brotli, así que en
la práctica mandaría (b). Además, (a) se mide en gzip y (b) en brotli. Hay que elegir: bajar (a),
subir (b) o aceptar que (a) solo sirve para diagnosticar.

## Alternativas

| Alternativa | Por qué no |
|---|---|
| Mantener 90 KB gzip | Inalcanzable incluso en SPA (98,14 KiB). El gate quedaría siempre en rojo o desactivado |
| Solo subir el número total (línea base + margen en gzip) | No distingue el crecimiento propio del framework. Un 10 % de 112,55 KiB son unos 11 KiB, más del doble del código propio actual: la app podría triplicar su JS sin que el gate lo note |
| Solo presupuestar el código propio | No detecta una actualización de React o React Router que sume peso; pasaría sin revisión |
| Cambiar de enfoque para entrar en 90 KB (otro runtime, islas, sin router en cliente) | Contradice ADR-0001 y el stack de 04. El ahorro posible no se midió, y Cyber Ops necesita React en el cliente (ADR-0009) |
| Medir el total solo en gzip | Es lo que reportan la mayoría de las herramientas, pero no lo que Pages sirve a los navegadores modernos según el spike |

## Trade-offs

**Se gana:** gates que pueden fallar y que señalan la causa (código propio o framework), y cifras
ancladas en una medición fechada en lugar de un número redondo.

**Se pierde:**

- Dos cifras en lugar de una, en dos compresiones distintas.
- El script de bundle tiene que clasificar los chunks por origen: más código y un test más.
- El margen de (b) es una elección, no una medición.
- Brotli-11 calculado en el build es determinista, pero puede no coincidir byte a byte con lo que
  sirve el CDN. Es una aproximación reproducible, no la medición del cable.

## Consecuencias

- **04 y 11 §7:** la tabla de presupuestos cambia a (a) y (b).
- **`scripts/check-bundle.ts` (11 §7):** por cada HTML suma el JS que pide, como `measure.mjs` del
  spike; separa los chunks de `react`, `react-dom` y `react-router` del resto; escribe gzip-9 y
  brotli-11 en `build/reports/bundle.json` y en el resumen del job; y falla si Home supera (a) o
  (b). La forma de clasificar los chunks se fija al implementarlo y tiene test con fixtures.
- **La línea base se vuelve a medir en F0** sobre la app real (`Frontend/` migrado) y se anota con
  fecha. Si difiere de la del spike, César confirma las cifras con esa medición.
- Una actualización de React o React Router que rompa (b) no se mergea sin revisar este ADR.
- La evidencia de `/architecture` (11 §10) publica las dos cifras con su método.
- 16 ("Rendimiento") y el criterio de F0 en 15 usan estos presupuestos.

## Revisar si

- César confirma o cambia las cifras: el estado pasa a "aceptado" con las cifras finales.
- Una versión de React o React Router mueve la línea base más de ~10 %, en cualquier dirección.
- La medición en el preview (`content-encoding`, Lighthouse) muestra que Pages no sirve brotli.
- Lighthouse móvil falla por JS (LCP ≤ 2,0 s o TBT ≤ 200 ms) aunque (a) y (b) pasen: el techo es
  demasiado alto.
- El código propio de Home se acerca a (a): antes de subir la cifra, se revisa qué entró y por qué.
