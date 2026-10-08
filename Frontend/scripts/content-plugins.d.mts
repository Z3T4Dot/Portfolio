// Blueprint 05 §Prosa en MDX y verificación 10: tipos de scripts/content-plugins.mjs (JS para Node, sin
// @types/node), para importarlo desde vite.config.ts y desde sus tests.
import type { PluginOption } from 'vite'

export declare const CASE_PROSE_ID: 'virtual:case-prose'
export declare const CASE_PROSE_DIR: string

/** Lo mínimo del árbol mdast + MDX que recorre el guard (mdast-util-mdx). */
export interface MdxNode {
  type: string
  name?: string | null
  value?: unknown
  attributes?: readonly { type: string; name?: string; value?: unknown }[]
  children?: readonly MdxNode[]
  position?: { start: { line: number; column: number } }
}

export interface MdxGuardOptions {
  components: readonly string[]
}

export interface ProseEntry {
  slug: string
  publication: 'draft' | 'published'
}

export declare function findMdxViolations(tree: MdxNode, components: readonly string[]): string[]
export declare function remarkMdxGuard(options: MdxGuardOptions): (tree: MdxNode, file: { path?: string }) => void
export declare function caseProseModule(entries: readonly ProseEntry[], options: { includeDrafts: boolean }): string
export declare function isAssetQuery(id: string): boolean
export declare function contentPlugins(): PluginOption[]
