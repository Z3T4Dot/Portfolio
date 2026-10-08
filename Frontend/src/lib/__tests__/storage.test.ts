import { describe, expect, it } from 'vitest'
import { createSafeStorage, type StorageLike } from '../storage'

const isString = (value: unknown): value is string => typeof value === 'string'

function memoryStorage(): StorageLike {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

const throwing: StorageLike = {
  getItem: () => {
    throw new DOMException('Bloqueado', 'SecurityError')
  },
  setItem: () => {
    throw new DOMException('Cuota llena', 'QuotaExceededError')
  },
  removeItem: () => {
    throw new DOMException('Bloqueado', 'SecurityError')
  },
}

describe('createSafeStorage', () => {
  it('lee, escribe y borra con un storage que funciona', () => {
    const backing = memoryStorage()
    const safe = createSafeStorage(() => backing)
    expect(safe.read('tema', isString)).toBeNull()
    expect(safe.write('tema', 'dark')).toBe(true)
    expect(safe.read('tema', isString)).toBe('dark')
    expect(safe.remove('tema')).toBe(true)
    expect(safe.read('tema', isString)).toBeNull()
  })

  it('el guard filtra valores que no tienen la forma esperada', () => {
    const backing = memoryStorage()
    backing.setItem('tema', 'morado')
    const safe = createSafeStorage(() => backing)
    const isTheme = (value: unknown): value is 'light' | 'dark' => value === 'light' || value === 'dark'
    expect(safe.read('tema', isTheme)).toBeNull()
  })

  it('no lanza si el storage lanza en cada operación', () => {
    const safe = createSafeStorage(() => throwing)
    expect(safe.read('tema', isString)).toBeNull()
    expect(safe.write('tema', 'dark')).toBe(false)
    expect(safe.remove('tema')).toBe(false)
  })

  it('no lanza si acceder al storage lanza (cookies bloqueadas)', () => {
    const safe = createSafeStorage(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })
    expect(safe.read('tema', isString)).toBeNull()
    expect(safe.write('tema', 'dark')).toBe(false)
  })

  it('sin storage (prerender) devuelve null y false', () => {
    const safe = createSafeStorage(() => undefined)
    expect(safe.read('tema', isString)).toBeNull()
    expect(safe.write('tema', 'dark')).toBe(false)
    expect(safe.remove('tema')).toBe(false)
  })
})
