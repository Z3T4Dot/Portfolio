import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // MDX va antes del plugin de React Router para que los .mdx lleguen ya compilados a JSX.
    { enforce: "pre", ...mdx() },
    reactRouter(),
  ],
  build: {
    // Sin data: URIs, para que la CSP pueda usar img-src/font-src 'self' (11 §8).
    assetsInlineLimit: 0,
  },
});
