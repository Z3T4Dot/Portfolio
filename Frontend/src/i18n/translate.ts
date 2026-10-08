import type { Locale } from './locales'
import { en } from './messages/en'
import { es, type Messages } from './messages/es'

export const messages: Readonly<Record<Locale, Messages>> = { es, en }

type Catalog = typeof es

/** Ruta con puntos a cada texto: 'nav.work', 'caseStudy.sections.failure-modes'… */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type MessageKey = Leaves<Catalog>

type At<T, Path extends string> = Path extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? At<T[Head], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never

type Placeholders<S> = S extends `${string}{${infer Name}}${infer Rest}` ? Name | Placeholders<Rest> : never

/** Parámetros que exige cada clave, deducidos de los `{marcadores}` del texto en español. */
export type MessageParams<K extends MessageKey> = Placeholders<At<Catalog, K>>

export type TranslateArgs<K extends MessageKey> = [MessageParams<K>] extends [never]
  ? []
  : [params: Record<MessageParams<K>, string | number>]

export type Translate = <K extends MessageKey>(key: K, ...args: TranslateArgs<K>) => string

const flatCache = new Map<Locale, ReadonlyMap<string, string>>()

type Tree = Readonly<Record<string, unknown>>

const isTree = (value: unknown): value is Tree => typeof value === 'object' && value !== null

function flatten(tree: Tree, prefix = '', out = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out.set(path, value)
    else if (isTree(value)) flatten(value, path, out)
  }
  return out
}

/** Todos los textos de un idioma como mapa plano `clave → texto`. */
export function flatMessages(locale: Locale): ReadonlyMap<string, string> {
  let flat = flatCache.get(locale)
  if (!flat) {
    flat = flatten(messages[locale])
    flatCache.set(locale, flat)
  }
  return flat
}

function interpolate(template: string, params: Readonly<Record<string, string | number>> | undefined): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

/**
 * Traductor puro para un idioma. No depende de React ni del router: sirve en componentes, en
 * `meta` de las rutas y en scripts de build. Las claves y los parámetros se verifican al compilar.
 */
export function createT(locale: Locale): Translate {
  const flat = flatMessages(locale)
  return (key, ...args) => {
    const template = flat.get(key)
    // Inalcanzable con claves tipadas; si ocurre, se ve la clave y no un hueco.
    if (template === undefined) return key
    const [params] = args as [Readonly<Record<string, string | number>>?] // forma común de los args tipados
    return interpolate(template, params)
  }
}
