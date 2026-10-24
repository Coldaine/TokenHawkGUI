export type RNG = () => number

/** Small, fast, deterministic PRNG. */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(input: string | number): number {
  if (typeof input === 'number') {
    const n = input >>> 0
    return n === 0 ? 0x9e3779b9 : n
  }
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const n = h >>> 0
  return n === 0 ? 0x9e3779b9 : n
}

export function seedHex(seed: number): string {
  return (seed >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0')
    .slice(-6)
}

export function seedFromHex(hex: string): number {
  const clean = hex.trim().replace(/^#/, '').slice(0, 6)
  if (!/^[0-9a-f]{1,6}$/i.test(clean)) return 0xa57e7b
  return parseInt(clean, 16) >>> 0
}

export function randomSeed(): number {
  return (Math.random() * 0xffffff) >>> 0
}

/** Random float in [-1, 1]. */
export function signed(rng: RNG): number {
  return rng() * 2 - 1
}
