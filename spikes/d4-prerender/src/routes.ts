import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // "/": página mínima bilingüe con redirección por preferencia (12).
  index("routes/root-index.tsx"),
  route(":lang", "routes/lang-layout.tsx", [
    index("routes/home.tsx"),
    route("work", "routes/work-index.tsx"),
    route("work/:slug", "routes/work-detail.tsx"),
    route("cyber-ops", "routes/cyber-ops.tsx"),
  ]),
  // Catch-all: se prerenderiza en /404/, /es/404/ y /en/404/ y el postbuild lo mueve a 404.html.
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
