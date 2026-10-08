import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Outlet, createBrowserRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { NotFoundContent } from "../src/components/NotFoundContent";
import { SiteShell } from "../src/components/SiteShell";
import { DEFAULT_LANG, isLang } from "../src/lib/i18n";
import "../src/styles/global.css";

function LangLayout() {
  const { lang } = useParams();
  if (!isLang(lang)) {
    return (
      <SiteShell lang={DEFAULT_LANG} notFound>
        <NotFoundContent lang={DEFAULT_LANG} />
      </SiteShell>
    );
  }
  return (
    <SiteShell lang={lang}>
      <Outlet />
    </SiteShell>
  );
}

const router = createBrowserRouter([
  { path: "/", lazy: async () => ({ Component: (await import("./routes")).RootIndex }) },
  {
    path: ":lang",
    Component: LangLayout,
    children: [
      { index: true, lazy: async () => ({ Component: (await import("./routes")).Home }) },
      { path: "work", lazy: async () => ({ Component: (await import("./routes")).WorkIndex }) },
      { path: "work/:slug", lazy: async () => ({ Component: (await import("./routes")).WorkDetail }) },
      { path: "cyber-ops", lazy: async () => ({ Component: (await import("./cyber-ops")).CyberOps }) },
    ],
  },
  { path: "*", lazy: async () => ({ Component: (await import("./routes")).NotFound }) },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
