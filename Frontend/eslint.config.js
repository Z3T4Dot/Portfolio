// Reglas de accesibilidad JSX: eslint-plugin-jsx-a11y-x (fork de es-tooling), no el original.
// Probado el 2026-10-06: jsx-a11y 6.10.2 (último release: 2024-10) funciona con ESLint 10, pero su
// peer declara eslint hasta ^9, así que instalarlo exige --legacy-peer-deps u `overrides` para
// siempre. El fork declara ^9 || ^10, se instala limpio, reporta lo mismo con las mismas reglas
// (verificado con un archivo de muestra) y trae menos dependencias. Fijar ESLint 9 se descartó:
// degradaría toda la cadena (typescript-eslint, react-hooks) por un solo plugin.
// Revisar si el original publica soporte para ESLint 10: volver a él es cambiar el import y el
// prefijo de las reglas.

import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// ---------------------------------------------------------------------------------------------
// Límites entre capas (04, ADR-0007), con no-restricted-imports.
//
// Los imports son relativos, así que la capa de destino depende de la profundidad del archivo:
// desde src/<capa>/a/b.ts, `../../content/x` sube 2 niveles hasta src/ y entra a content/. Por eso
// se genera un bloque por capa y por profundidad. También se cubren los alias `~/` y `@/` por si
// el router los introduce.

// Raíz del código de la app: el modo framework usa `appDirectory: 'src'` (spike D4, consecuencia 1).
// root.tsx, routes.ts, entry.server.tsx y env.ts viven en la raíz y, como routes/, pueden importar
// cualquier capa (04: routes/ une URL, contenido, meta y feature).
const ROOT = 'src'
const MAX_DEPTH = 8
const TOP_LEVEL = '[^./][^/]*' // cualquier carpeta de src/

/** Import que, desde un archivo a `depth` carpetas de src/, llega a la capa `target` (regex). */
const reach = (depth, target) => `^(?:\\.\\./){${depth}}(?:${target})(?:/|$)`
const alias = (target) => `^[~@]/(?:${target})(?:/|$)`

const restrict = (depth, target, message) => [
  { regex: reach(depth, target), message },
  { regex: alias(target), message },
]

const msg = (layer, rule) => `${layer} ${rule} (04: responsabilidades y reglas de dependencia).`

const LAYERS = {
  features: (depth) => [
    // Desde src/features/<f>/…, subir depth-1 niveles deja en src/features/: lo que sigue es otra feature.
    ...(depth >= 2
      ? [{ regex: `^(?:\\.\\./){${depth - 1}}[^./]`, message: msg('Una feature', 'no importa otra feature') }]
      : []),
    { regex: alias('features'), message: msg('Una feature', 'no importa otra feature (usa una ruta relativa)') },
    ...restrict(depth, 'routes', msg('Una feature', 'no importa rutas')),
  ],
  game: (depth) => restrict(depth, 'features|content|routes', msg('game/', 'no importa features, content ni rutas')),
  components: (depth) =>
    restrict(depth, 'features|content|game|routes', msg('components/', 'no importa features, content, game ni rutas')),
  i18n: (depth) => restrict(depth, 'features|content|routes', msg('i18n/', 'no importa features, content ni rutas')),
  // Metadata, tabla de páginas y sitemap (11 §2, 12): leen contenido e i18n, nunca la interfaz.
  seo: (depth) =>
    restrict(depth, 'features|components|game|routes', msg('seo/', 'no importa features, components, game ni rutas')),
  content: (depth) => restrict(depth, TOP_LEVEL, msg('content/', 'solo importa tipos de content/schema.ts')),
  lib: (depth) => restrict(depth, TOP_LEVEL, msg('lib/', 'no importa nada de la app')),
  // Hooks genéricos de React (sin conocimiento de la app): como lib/, pero pueden usar React.
  hooks: (depth) => restrict(depth, `(?!lib(?:/|$))${TOP_LEVEL}`, msg('hooks/', 'solo importa lib/')),
}

const NO_REACT = ['react', 'react-dom'].map((name) => ({
  name,
  message: 'content/ y lib/ no dependen de React (04).',
}))

const FIXTURES = {
  regex: '(?:^|/)__fixtures__(?:/|$)',
  message: 'Los fixtures son solo para tests: nunca entran a un índice publicado ni al bundle (05).',
}

const SOURCE = '*.{ts,tsx}'

const boundaries = [
  // Base: ningún archivo de la app importa fixtures.
  { files: [`${ROOT}/**/${SOURCE}`], rules: { 'no-restricted-imports': ['error', { patterns: [FIXTURES] }] } },
  ...Object.entries(LAYERS).flatMap(([layer, patternsAt]) =>
    Array.from({ length: MAX_DEPTH }, (_, i) => i + 1).map((depth) => ({
      files: [`${ROOT}/${layer}/${'*/'.repeat(depth - 1)}${SOURCE}`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: layer === 'content' || layer === 'lib' ? NO_REACT : [],
            patterns: [...patternsAt(depth), FIXTURES],
          },
        ],
      },
    })),
  ),
]

const TEST_FILES = ['**/*.test.{ts,tsx}', '**/*.test-d.ts', '**/__tests__/**', 'tests/**']

export default defineConfig(
  globalIgnores(['build', '.react-router', '.wrangler', 'coverage', 'playwright-report', 'test-results']),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, jsxA11y.configs.strict],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message: 'Sin style inline: la CSP lo bloquea en el HTML prerenderizado. Usa clases y tokens.',
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Prohibido. El MDX compila a JSX; no hace falta HTML crudo.',
        },
      ],
      // Política de `any` y aserciones (11 §1)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 10 },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Idioma de React Router en loaders: `throw data(null, { status: 404 })` (spike D4, sorpresa 9).
      '@typescript-eslint/only-throw-error': [
        'error',
        { allow: [{ from: 'package', package: 'react-router', name: 'DataWithResponseInit' }] },
      ],
      // Igual que el esquema de 05: string[] para tipos simples, Array<…> para uniones y objetos.
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    },
  },

  // Scripts inline con hash en la CSP (03 tema, 12 redirección de `/`; 11 §8): el único HTML crudo
  // permitido es código generado en el build desde el repo (04 §Seguridad), y solo en estos archivos.
  {
    files: ['src/root.tsx', 'src/routes/root-index.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message: 'Sin style inline: la CSP lo bloquea en el HTML prerenderizado. Usa clases y tokens.',
        },
      ],
    },
  },

  // Nota para la prosa MDX diferida (spike D4, sorpresa 9): `react-hooks/static-components` marca el
  // patrón "componentes lazy() creados en el módulo y elegidos por clave en el render". Se desactiva
  // en esa línea con eslint-disable-next-line y un comentario, nunca en todo el proyecto.

  ...boundaries,

  // Los tests cruzan capas a propósito (verifican la paridad entre ellas) y usan los fixtures.
  { files: TEST_FILES, rules: { 'no-restricted-imports': 'off' } },

  // Archivos de configuración y scripts en JS: Node y sin reglas con tipos.
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
)
