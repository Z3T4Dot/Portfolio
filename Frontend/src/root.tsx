// Blueprint 04 §Estructura de carpetas (root.tsx: shell HTML, <Meta/>, <Links/>, script de tema y
// ErrorBoundary raíz) y docs/spikes/d4-prerender.md (sorpresas 5 y 10).
import archivoLatin from '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?url'
import type { ReactNode } from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useMatches,
  useParams,
} from 'react-router'
import type { Route } from './+types/root'
// Directo a theme.ts: el índice de la feature arrastraría el CSS del shell a `/`.
import { THEME_SCRIPT } from './features/site/theme'
import { DEFAULT_LOCALE, LOCALES, createT, href, isLocale, localeFromPath } from './i18n'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  // Precarga solo de Archivo latin normal (03, 04, 11 §7): el mismo archivo con hash que usa fonts.css.
  { rel: 'preload', href: archivoLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
]

/**
 * La 404 se sirve como 404.html en cualquier URL inexistente. En el cliente esa URL puede coincidir
 * con otro árbol de rutas que el usado al prerenderizar (`/xx/` → :lang, `/a/b/c` → *), y la
 * hidratación fallaría. Por eso la 404 se publica como HTML estático, sin <Scripts> ni
 * <ScrollRestoration>: solo enlaces normales y el script de tema (sorpresa 5 del spike).
 */
function useIsStaticNotFound(): boolean {
  const matches = useMatches()
  const params = useParams()
  const notFound = matches.some((match) => match.id === 'routes/not-found')
  const badPrefix = params.lang !== undefined && !isLocale(params.lang)
  // En dev no hay 404.html: el dev server sirve el SPA fallback y la 404 necesita sus scripts.
  return (notFound || badPrefix) && !import.meta.env.DEV
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const isStatic = useIsStaticNotFound()
  return (
    // <html lang> según la ruta, ya en el HTML estático (12). suppressHydrationWarning: el script
    // de tema agrega data-theme a <html> antes de hidratar (sorpresa 10 del spike).
    <html lang={localeFromPath(pathname) ?? DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* --paper de cada tema (styles/tokens.css) */}
        <meta name="theme-color" content="#f4f5f7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0c0d10" media="(prefers-color-scheme: dark)" />
        {/* Tema antes del primer pintado, sin parpadeo (03). Su hash va en la CSP de cada ruta. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {isStatic ? null : <ScrollRestoration />}
        {isStatic ? null : <Scripts />}
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

/**
 * Error en el layout raíz (11 §9): HTML mínimo bilingüe, sin depender del idioma de la ruta ni de
 * la feature del sitio. Enlaces normales: después de un error así, recargar es lo más seguro.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const key = isRouteErrorResponse(error) && error.status === 404 ? 'notFound.title' : 'error.title'
  return (
    <main id="main">
      <h1>
        {LOCALES.map((locale, i) => (
          <span key={locale} lang={locale}>
            {i > 0 ? ' / ' : null}
            {createT(locale)(key)}
          </span>
        ))}
      </h1>
      <ul>
        {LOCALES.map((locale) => (
          <li key={locale} lang={locale}>
            <a href={href('home', locale)} hrefLang={locale}>
              {createT(locale)('error.home')}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
