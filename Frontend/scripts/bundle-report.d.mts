// Blueprint 11 §7: tipos de scripts/bundle-report.mjs (JS para Node, sin @types/node), para
// importarlo desde vite.config.ts.
import type { Plugin } from 'vite'

export declare function isOwnModule(id: string): boolean
export declare function bundleReport(): Plugin
