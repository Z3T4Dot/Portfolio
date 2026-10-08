import { useEffect, useState, type RefObject } from 'react'

export function useInView(ref: RefObject<Element | null>, threshold = 0) {
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setInView(entry.isIntersecting)
      },
      { threshold },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [ref, threshold])

  return inView
}
