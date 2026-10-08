// Blueprint 04 §Stack y justificación (D4): React Router 8 en modo framework; 04 §Contenido y 05 §Prosa en
// MDX (@mdx-js/rollup con el guard de remark, antes del plugin de React Router, como en el spike D4); 05
// verificación 10 (la prosa de un draft no entra al build); 11 §8 (sin data: URIs); 11 §7 (inventario de
// módulos por chunk para medir código propio frente a framework).
import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import { bundleReport } from './scripts/bundle-report.mjs'
import { contentPlugins } from './scripts/content-plugins.mjs'

export default defineConfig({
  plugins: [...contentPlugins(), reactRouter(), bundleReport()],
  build: {
    // Nada se incrusta como data: URI: la CSP no permite data: en img-src ni font-src (11 §8).
    assetsInlineLimit: 0,
  },
})
