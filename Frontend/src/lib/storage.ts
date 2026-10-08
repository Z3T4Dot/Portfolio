// Acceso seguro a Web Storage (04, 11 §1). Es el único dato externo en runtime: puede no existir
// (prerender, Node), lanzar (Safari privado, cookies bloqueadas, cuota llena) o traer cualquier
// cosa que alguien escribió a mano. Por eso nada aquí lanza y toda lectura pasa por un type guard.

export interface SafeStorage {
  /** Devuelve el valor solo si cumple el guard; si no existe, no es válido o el storage falla, `null`. */
  read<T>(key: string, guard: (value: unknown) => value is T): T | null
  /** `true` si se guardó. Un storage bloqueado solo pierde la preferencia. */
  write(key: string, value: string): boolean
  remove(key: string): boolean
}

/** Lo mínimo que se usa de `Storage`; permite probar con un objeto simple. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function createSafeStorage(resolve: () => StorageLike | undefined): SafeStorage {
  const storage = (): StorageLike | undefined => {
    try {
      return resolve()
    } catch {
      return undefined
    }
  }

  return {
    read(key, guard) {
      try {
        const value: unknown = storage()?.getItem(key) ?? null
        return guard(value) ? value : null
      } catch {
        return null
      }
    },
    write(key, value) {
      try {
        const target = storage()
        if (!target) return false
        target.setItem(key, value)
        return true
      } catch {
        return false
      }
    },
    remove(key) {
      try {
        const target = storage()
        if (!target) return false
        target.removeItem(key)
        return true
      } catch {
        return false
      }
    },
  }
}

// `globalThis.localStorage` no existe en el prerender; leerlo en un sandbox puede lanzar.
export const safeLocal = createSafeStorage(() =>
  typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage,
)
