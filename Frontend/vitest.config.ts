import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Independiente de vite.config.ts a propósito: el plugin de React Router (modo framework) no debe
// cargarse en los tests.
// Dos proyectos (11 §2): lógica pura en Node (app y scripts de build) y componentes en jsdom.
// Los `*.test-d.ts` no se ejecutan: son tests de tipos que verifica `npm run typecheck`.
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
          // Vitest vacía el CSS por defecto (también con ?raw). tokens.test.ts necesita el real.
          css: { include: [/styles[\\/]tokens\.css/] },
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./tests/setup-dom.ts'],
        },
      },
    ],
  },
})
