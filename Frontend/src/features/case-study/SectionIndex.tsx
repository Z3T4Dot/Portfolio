// Blueprint 03 §Componentes visuales (SectionIndex: resalta la sección visible) y §Responsive (índice
// fijo en desktop; desplegable "En esta página" por debajo de 1024px), 02 §Navegación dentro de la
// página y 11 §3/§5 (marca la sección actual; el desplegable se abre y cierra con teclado y con Escape;
// el índice lleva el foco al ancla).
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useActiveSection } from '../../hooks/useActiveSection'
import styles from './SectionIndex.module.css'

export interface SectionIndexItem {
  id: string
  label: string
}

interface SectionIndexProps {
  /** "En esta página": nombre de la navegación, título en desktop y botón en móvil. */
  label: string
  items: readonly SectionIndexItem[]
}

export function SectionIndex({ label, items }: SectionIndexProps) {
  const active = useActiveSection(items.map((item) => item.id))
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <nav className={styles.index} aria-label={label}>
      <p className={styles.title} aria-hidden="true">
        {label}
      </p>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen(!open)
        }}
      >
        {label}
      </button>
      <ol id={listId} className={styles.list} data-open={open || undefined}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              className={styles.link}
              to={`#${item.id}`}
              aria-current={active === item.id ? 'location' : undefined}
              onClick={() => {
                setOpen(false)
                // El foco pasa a la sección (tabIndex -1), sin mover el scroll: lo hace la navegación.
                document.getElementById(item.id)?.focus({ preventScroll: true })
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
