// Blueprint 02 §Sitemap V1 (/:lang/work/:slug/), 04 §Flujo de datos (loader por lang y slug, 404 si no
// existe; prosa MDX solo en el idioma pedido, diferida), 06 (plantilla del caso), 12 (título
// `{caso} | Cesar Acosta`, descripción del caso, og:type article) y 05 verificación 10 (un draft solo
// existe en la vista previa de desarrollo).
//
// Se registra en routes.ts solo si hay casos publicados o vista previa de borradores, así que no usa
// los tipos de typegen (`./+types/case` no existe mientras la ruta no está en la tabla).
import { Suspense, lazy } from 'react'
import { data, useLoaderData, type LoaderFunctionArgs, type MetaFunction } from 'react-router'
import { caseProse } from 'virtual:case-prose'
import { PendingNotice } from '../components/ui/DevMarks'
import { SHOW_DRAFTS } from '../env'
import { CasePage, caseMdxComponents } from '../features/case-study'
import { caseData } from '../features/case-study/data'
import { isLocale } from '../i18n'
import { buildMeta } from '../seo/meta'

// Un componente diferido por caso e idioma, creado una sola vez: cada MDX es su propio chunk y solo se
// pide el de la página (spike D4). En el build, `virtual:case-prose` solo trae casos publicados.
const bodies = new Map(Object.entries(caseProse).map(([key, load]) => [key, lazy(load)]))

// Con ssr:false corre solo en el build (o en el servidor de desarrollo). El cliente recibe únicamente
// lo que devuelve (el `.data` de la página), nunca el índice completo.
export async function loader({ params }: LoaderFunctionArgs) {
  const lang = params.lang
  const entry = isLocale(lang) ? await caseData(lang, params.slug, { includeDrafts: SHOW_DRAFTS }) : null
  if (!entry) throw data(null, { status: 404 })
  return entry
}

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  if (!loaderData) return []
  return buildMeta({
    target: { routeId: 'case', slug: loaderData.slug },
    locale: loaderData.locale,
    title: loaderData.title,
    description: loaderData.description,
    ogType: 'article',
  })
}

export default function Case() {
  const entry = useLoaderData<typeof loader>()
  const Body = bodies.get(`${entry.slug}/${entry.locale}`)
  return (
    <CasePage data={entry}>
      {Body ? (
        <Suspense fallback={null}>
          {/* Los lazy() se crean una sola vez a nivel de módulo (bodies); aquí solo se elige uno.
              eslint-plugin-react-hooks 7 no lo distingue de crear un componente en el render (spike D4). */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Body components={caseMdxComponents} />
        </Suspense>
      ) : (
        // 05: en desarrollo puede faltar la prosa de un idioma, con un aviso visible; en producción la
        // verificación de contenido lo impide.
        <PendingNotice>
          falta {entry.locale}.mdx de este caso (content/projects/{entry.slug}/).
        </PendingNotice>
      )}
    </CasePage>
  )
}
