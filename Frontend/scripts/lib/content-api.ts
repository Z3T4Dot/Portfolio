// Blueprint 05 §Prosa en MDX y verificación 10: lo que necesitan los plugins de contenido de Vite
// (scripts/content-plugins.mjs), que lo importan con `runnerImport` igual que el postbuild (spike D4,
// sorpresa 13). Así vite.config.ts no importa TypeScript de src/.
export { MDX_COMPONENTS } from '../../src/content/mdx'
export { allProjects } from '../../src/content/projects'
export { LOCALES } from '../../src/i18n/locales'
