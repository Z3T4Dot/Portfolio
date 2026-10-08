import type { Config } from "@react-router/dev/config";
import { prerenderPaths } from "./src/content/paths";

export default {
  // Prueba de que el modo framework no obliga a usar `app/`.
  appDirectory: "src",
  // Sin runtime de servidor: solo HTML estático generado en build.
  ssr: false,
  // getStaticPaths() debería devolver solo rutas sin parámetros ("/"), pero en 8.4.0 también
  // devuelve hijas estáticas de un padre dinámico ("/:lang/work"), que fallan con 404 en el
  // prerender. Se filtran. El resto de paths sale del índice de contenido.
  prerender({ getStaticPaths }) {
    const staticPaths = getStaticPaths().filter((p) => !/[:*]/.test(p));
    return [...new Set([...staticPaths, ...prerenderPaths()])];
  },
} satisfies Config;
