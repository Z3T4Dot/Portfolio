// Blueprint 11 §7 (presupuesto de bundle) y ADR-0013 (código propio y JS total de Home, por separado):
// registra qué módulos forman cada chunk del cliente. No cambia la salida del build; escribe
// build/reports/modules.json, que lee scripts/measure.mjs.
//
// Hace falta porque rolldown mezcla en un mismo chunk código propio y de React Router (por ejemplo,
// el de los <Link> junto a features/site/theme.ts): clasificar por chunk daría un número falso.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** Módulo propio: código de src/. Todo lo de node_modules y los módulos virtuales es framework. */
export function isOwnModule(id) {
  const normalized = id.replace(/\\/g, '/')
  if (normalized.startsWith('\0') || normalized.startsWith('virtual:')) return false
  if (normalized.includes('/node_modules/')) return false
  return normalized.includes('/src/')
}

export function bundleReport() {
  return {
    name: 'portfolio:bundle-report',
    apply: 'build',
    async generateBundle(_options, bundle) {
      if (this.environment.name !== 'client') return
      const root = this.environment.config.root
      const chunks = {}
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk') continue
        let own = 0
        let framework = 0
        const ownModules = []
        for (const [id, info] of Object.entries(output.modules)) {
          if (isOwnModule(id)) {
            own += info.renderedLength
            ownModules.push(path.relative(root, id.split('?')[0]).replace(/\\/g, '/'))
          } else framework += info.renderedLength
        }
        // ownModules permite ubicar chunks por su contenido (p. ej. la prosa MDX diferida de un caso).
        chunks[fileName] = {
          ownRendered: own,
          frameworkRendered: framework,
          bytes: Buffer.byteLength(output.code),
          ownModules,
        }
      }
      const dir = path.join(root, 'build', 'reports')
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, 'modules.json'), JSON.stringify({ chunks }, null, 2))
    },
  }
}
