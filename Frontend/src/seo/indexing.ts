// Blueprint 12 §robots.txt y decisión de César: el sitio no se indexa hasta el lanzamiento (F10).
// Mientras sea `false`, cada página lleva `<meta name="robots" content="noindex">` y el postbuild
// agrega `X-Robots-Tag: noindex` a todas las respuestas en `_headers`. robots.txt sigue permitiendo
// el rastreo: un crawler que no puede pedir la página tampoco puede leer el noindex.
// Al lanzar, se cambia a `true` en un PR propio.
export const INDEXABLE = false as boolean
