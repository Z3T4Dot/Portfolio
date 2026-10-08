// Blueprint 11 §2 (scripts/csp: extracción de scripts inline y cálculo de hashes con fixtures de
// HTML conocidos) y 11 §8 (política).
import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, executableHashes, inlineScripts, sha256 } from '../csp'

// Calculados aparte con `node:crypto` (sha256 en base64).
const HASH_LOG = 'sha256-CihokcEcBW4atb/CW/XWsvWwbTjqwQlE9nj9ii5ww5M='
const HASH_EMPTY = 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='

describe('inlineScripts', () => {
  it('hashea el contenido exacto de cada script ejecutable', async () => {
    const html = [
      '<!doctype html><html><head><script>console.log(1)</script>',
      '<script src="/assets/x.js"></script>',
      '<script type="application/ld+json">{"@type":"Person"}</script></head>',
      '<body><script type="module">console.log(1)</script><script></script>',
      '<template><script>console.log(1)</script></template></body></html>',
    ].join('')
    const scripts = await inlineScripts(html)
    expect(scripts.map((script) => [script.type, script.executable, script.hash])).toEqual([
      ['classic', true, HASH_LOG],
      ['application/ld+json', false, undefined],
      ['module', true, HASH_LOG],
      ['classic', true, HASH_EMPTY],
      ['classic', true, HASH_LOG],
    ])
    expect(executableHashes(scripts)).toEqual([HASH_LOG, HASH_EMPTY])
  })

  it('un cambio de un solo carácter cambia el hash', async () => {
    expect(await sha256('console.log(1)')).toBe(HASH_LOG)
    expect(await sha256('console.log(2)')).not.toBe(HASH_LOG)
  })
})

describe('contentSecurityPolicy', () => {
  const policy = contentSecurityPolicy([HASH_LOG, HASH_LOG], { https: true })
  const directives = new Map(
    policy.split('; ').map((directive) => {
      const [name = '', ...values] = directive.split(' ')
      return [name, values.join(' ')]
    }),
  )

  it("default-src 'self' y cierres explícitos (spike D4, sorpresa 6)", () => {
    expect(directives.get('default-src')).toBe("'self'")
    for (const name of [
      'object-src',
      'frame-src',
      'worker-src',
      'media-src',
      'base-uri',
      'form-action',
      'frame-ancestors',
    ]) {
      expect(directives.get(name), name).toBe("'none'")
    }
  })

  it("script-src con 'self' y cada hash una vez, sin 'unsafe-inline' ni Trusted Types", () => {
    expect(directives.get('script-src')).toBe(`'self' '${HASH_LOG}'`)
    expect(policy).not.toContain('unsafe-inline')
    expect(policy).not.toContain('trusted-types')
  })

  it('upgrade-insecure-requests solo con https', () => {
    expect(directives.has('upgrade-insecure-requests')).toBe(true)
    expect(contentSecurityPolicy([], { https: false })).not.toContain('upgrade-insecure-requests')
  })
})
