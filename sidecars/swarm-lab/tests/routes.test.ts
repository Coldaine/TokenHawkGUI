import { describe, expect, it } from 'vitest'
import { DEFAULT_SEED, parseRoute, routeHash } from '../src/app/routes'

describe('hash routes', () => {
  it('parses valid world links and seeds', () => {
    expect(parseRoute('#/world/12?seed=ABCDEF')).toEqual({ world: 12, seed: 0xabcdef })
    expect(parseRoute('#/?seed=000123')).toEqual({ world: null, seed: 0x123 })
  })

  it('falls back to the gallery for malformed or out-of-range worlds', () => {
    for (const hash of ['#/world/0', '#/world/13', '#/world/2/extra', '#/world/nope']) {
      expect(parseRoute(hash).world).toBeNull()
    }
    expect(parseRoute('#/world/1').seed).toBe(DEFAULT_SEED)
  })

  it('round-trips hashes with additional query parameters', () => {
    expect(parseRoute('#/world/6?other=ok&seed=00BEEF')).toEqual({ world: 6, seed: 0xbeef })
    expect(routeHash(6, 0xbeef)).toBe('#/world/6?seed=00BEEF')
    expect(routeHash(null, 0xbeef)).toBe('#/?seed=00BEEF')
  })
})
