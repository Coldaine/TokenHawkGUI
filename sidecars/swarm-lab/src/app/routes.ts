import { seedFromHex, seedHex } from '../engine/rng'

export const DEFAULT_SEED = 0xa57e7b

export interface Route {
  world: number | null
  seed: number
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [path = '', query = ''] = raw.split('?')
  const seedParam = new URLSearchParams(query).get('seed')
  const seed = seedParam ? seedFromHex(seedParam) : DEFAULT_SEED
  const match = /world\/(\d{1,2})/.exec(path)
  const world = match ? Number(match[1]) : null
  return { world: Number.isFinite(world) ? world : null, seed }
}

export function routeHash(world: number | null, seed: number): string {
  return world === null ? `#/?seed=${seedHex(seed)}` : `#/world/${world}?seed=${seedHex(seed)}`
}
