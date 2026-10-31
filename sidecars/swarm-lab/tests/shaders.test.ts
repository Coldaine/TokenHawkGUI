import { describe, expect, it } from 'vitest'

// Raw source text for every shader-bearing module. Vite resolves this at test
// time; no filesystem or Node types are needed.
const sources = import.meta.glob<string>('../src/**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const NUMERIC_SMOOTHSTEP = /smoothstep\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,/g

describe('GLSL smoothstep edges', () => {
  it('only ever ascends, because descending edges are undefined in GLSL', () => {
    const offenders: string[] = []
    let checked = 0

    for (const [file, source] of Object.entries(sources)) {
      for (const match of source.matchAll(NUMERIC_SMOOTHSTEP)) {
        checked += 1
        const [, edge0, edge1] = match
        if (Number(edge0) >= Number(edge1)) {
          const line = source.slice(0, match.index).split('\n').length
          offenders.push(`${file}:${line} smoothstep(${edge0}, ${edge1}, ...)`)
        }
      }
    }

    // Guard the guard: a broken glob would otherwise make this pass vacuously.
    expect(checked).toBeGreaterThan(10)
    expect(offenders).toEqual([])
  })
})
