// Blueprint 13 §Variables de entorno: tipos de las variables públicas del build (las valida env.ts).
// 04 §Flujo de datos (4): el módulo virtual con la prosa MDX diferida de cada caso
// (scripts/content-plugins.mjs).
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origen absoluto del sitio, https y sin barra final. Local: http://localhost:8788. */
  readonly VITE_SITE_URL?: string
  /** Fecha del commit desplegado (AAAA-MM-DD) para el footer. */
  readonly VITE_BUILD_DATE?: string
  /** `false` oculta los borradores en `npm run dev`, donde se ven por defecto (env.ts: SHOW_DRAFTS). Sin efecto en el build. */
  readonly VITE_SHOW_DRAFTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:case-prose' {
  import type { MDXContent } from 'mdx/types'

  /** `"<slug>/<idioma>"` → MDX diferido. En el build, solo casos publicados; en dev, todos. */
  export const caseProse: Readonly<Record<string, () => Promise<{ default: MDXContent }>>>
}
