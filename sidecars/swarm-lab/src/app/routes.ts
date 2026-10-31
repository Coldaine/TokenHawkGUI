import { seedFromHex, seedHex } from '../engine/rng'

export const DEFAULT_SEED = 0xa57e7b

export interface Route {
  world: number | null
  seed: number
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [path = '', ...queryParts] = raw.split('?')
  const seedParam = new URLSearchParams(queryParts.join('?')).get('seed')
  const seed = seedParam ? seedFromHex(seedParam) : DEFAULT_SEED
  const match = /^world\/(\d{1,2})$/.exec(path)
  const parsed = match ? Number(match[1]) : null
  const world = parsed !== null && parsed >= 1 && parsed <= 12 ? parsed : null
  return { world, seed }
}

export function routeHash(world: number | null, seed: number): string {
  return world === null ? `#/?seed=${seedHex(seed)}` : `#/world/${world}?seed=${seedHex(seed)}`
}
