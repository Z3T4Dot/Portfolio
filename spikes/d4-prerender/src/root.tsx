import type { ReactNode } from "react";
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
} from "react-router";
import type { Route } from "./+types/root";
import { DEFAULT_LANG, isLang, langFromPath } from "./lib/i18n";
import "./styles/global.css";

// Script de tema (03): fija data-theme antes del primer pintado. Es igual en todas las páginas,
// así que su hash es el mismo en todas las reglas de la CSP.
const THEME_SCRIPT =
  '(function(){var d=document.documentElement,t;try{t=localStorage.getItem("theme")}catch(e){}' +
  'if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}' +
  "d.dataset.theme=t})();";

/**
 * Las 404 se sirven como 404.html en cualquier URL inexistente. En el cliente esa URL puede
 * coincidir con otro árbol de rutas que el usado al prerenderizar (`/xx/` → :lang, `/a/b/c` → *,
 * `/es/work/nope/` → work-detail con loader), y la hidratación fallaría. Por eso la 404 se
 * publica como HTML estático sin <Scripts>: solo enlaces normales y el script de tema.
 */
function useIsNotFound() {
  const matches = useMatches();
  const params = useParams();
  return matches.some((m) => m.id === "routes/not-found") || (params.lang !== undefined && !isLang(params.lang));
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const lang = langFromPath(pathname) ?? DEFAULT_LANG;
  // En dev no hay 404.html: el dev server sirve el SPA fallback y la 404 necesita sus scripts.
  const isNotFound = useIsNotFound() && !import.meta.env.DEV;
  return (
    // suppressHydrationWarning: el script de tema agrega data-theme a <html> antes de hidratar.
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {isNotFound ? null : <ScrollRestoration />}
        {isNotFound ? null : <Scripts />}
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return (
    <main id="main">
      <h1>{status === 404 ? "404 · Página no encontrada / Page not found" : "Error"}</h1>
      <p>
        <a href="/es/">Ir al inicio</a> · <a href="/en/">Go home</a>
      </p>
    </main>
  );
}
