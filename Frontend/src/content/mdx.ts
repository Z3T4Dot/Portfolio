// Blueprint 05 §Prosa en MDX: los únicos componentes que un MDX de contenido puede usar. Sin
// `import` ni `export` dentro del MDX y sin HTML crudo: el MDX recibe sus componentes en el render
// (04: content/ no importa React). La misma lista la aplican el plugin de remark en el build
// (scripts/content-plugins.mjs) y la verificación de contenido (content.test.ts).

export const MDX_COMPONENTS = [
  'Section',
  'Decision',
  'FailureModes',
  'Figure',
  'Diagram',
  'Callout',
  'Metric',
  'Tag',
] as const

export type MdxComponentName = (typeof MDX_COMPONENTS)[number]
