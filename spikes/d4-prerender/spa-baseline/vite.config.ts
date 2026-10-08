// Línea base "Vite SPA" para comparar con el modo framework: mismas versiones, mismos componentes
// (src/components, src/lib, src/content, src/game), React Router en modo data con rutas lazy.
// Solo existe para medir (peso de JS, tiempo de build y lo que recibe un crawler sin JS).
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [{ enforce: "pre", ...mdx() }, react()],
  build: {
    outDir: fileURLToPath(new URL("../build-spa", import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
