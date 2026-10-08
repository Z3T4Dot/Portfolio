// Blueprint 11 §4 y §8: el HTML generado se recorre con un parser (parse5), no con regex.
import { parse, type DefaultTreeAdapterTypes } from 'parse5'

type Node = DefaultTreeAdapterTypes.Node
export type Element = DefaultTreeAdapterTypes.Element

function isElement(node: Node): node is Element {
  return 'tagName' in node
}

/** Todos los elementos del documento, incluido el contenido de <template>. */
export function* elements(node: Node): Generator<Element> {
  if (isElement(node)) yield node
  if ('childNodes' in node) for (const child of node.childNodes) yield* elements(child)
  if ('content' in node) yield* elements(node.content)
}

export function attrs(element: Element): Map<string, string> {
  return new Map(element.attrs.map((attr) => [attr.name, attr.value]))
}

export function textOf(element: Element): string {
  return element.childNodes.map((child) => ('value' in child ? child.value : '')).join('')
}

export function parseHtml(html: string): DefaultTreeAdapterTypes.Document {
  return parse(html)
}
