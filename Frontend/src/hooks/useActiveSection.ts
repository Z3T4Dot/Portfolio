// Blueprint 03 §Componentes visuales (SectionIndex: resalta la sección visible, "estado real del
// scroll") y §Microinteracciones (índice de sección: instantáneo). Hook genérico: recibe ids de
// elementos de la página y devuelve el primero visible bajo el header fijo.
import { useEffect, useState } from 'react'

/**
 * Margen del área observada: deja fuera el header fijo arriba y la mitad inferior de la pantalla,
 * para que la sección activa sea la que se está leyendo, no la que asoma por abajo.
 */
const ROOT_MARGIN = '-80px 0px -55% 0px'

/** Id de la sección activa, o `null` antes de hidratar (el HTML estático no marca ninguna). */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const order = key.split('|')
    const visible = new Set<string>()
    const observed = new Set<string>()
    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // Sin ninguna en la franja se mantiene la última: el estado no parpadea entre secciones.
        const first = order.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      { rootMargin: ROOT_MARGIN },
    )
    const observeNew = () => {
      for (const id of order) {
        const element = observed.has(id) ? null : document.getElementById(id)
        if (element) {
          observed.add(id)
          intersection.observe(element)
        }
      }
      return observed.size === order.length
    }
    // En la navegación cliente la prosa llega después (MDX diferido): se esperan las que faltan.
    const mutations = observeNew()
      ? null
      : new MutationObserver(() => {
          if (observeNew()) mutations?.disconnect()
        })
    mutations?.observe(document.body, { childList: true, subtree: true })
    return () => {
      mutations?.disconnect()
      intersection.disconnect()
    }
  }, [key])

  return active
}
