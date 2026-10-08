import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToReadableStream } from "react-dom/server";

// Con ssr:false este archivo solo se ejecuta en el build (prerender). Dos motivos para no usar el
// entry por defecto de React Router:
// 1. El prerender pide cada página sin user-agent, así que el entry por defecto usa onShellReady:
//    todo lo que está detrás de <Suspense> (el MDX diferido) sale fuera de <main>, en un
//    <div hidden>, y necesita el script inline $RC de React para aparecer. Sin JS no se ve.
//    Esperar a `allReady` deja el HTML completo en su sitio y sin scripts de streaming.
// 2. Sin entry propio, `react-router build` agrega `isbot` a package.json y ejecuta `npm install`
//    con NODE_ENV=production, que borra las devDependencies de node_modules.
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  let status = responseStatusCode;
  const body = await renderToReadableStream(<ServerRouter context={routerContext} url={request.url} />, {
    signal: request.signal,
    onError(error: unknown) {
      status = 500;
      console.error(error);
    },
  });
  await body.allReady;
  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status });
}
