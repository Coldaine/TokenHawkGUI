import { describe, expect, it } from 'vitest'
import { TrailLines } from '../src/sim/TrailLines'

describe('TrailLines', () => {
  it('initializes the complete trail at the first position instead of drawing a streak from origin', () => {
    const trails = new TrailLines(1, 4)
    trails.update(new Float32Array([3, 4, 5]))
    const positions = trails.line.geometry.getAttribute('position').array as Float32Array
    expect(Array.from(positions)).toEqual([3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5])
    trails.dispose()
  })

  it('advances trail vertices as the agent moves and ignores undersized input', () => {
    const trails = new TrailLines(1, 3)
    trails.update(new Float32Array([1, 0, 0]))
    trails.update(new Float32Array([2, 0, 0]))
    trails.update(new Float32Array([3, 0, 0]))
    const positions = trails.line.geometry.getAttribute('position').array as Float32Array
    expect(Array.from(positions)).toEqual([3, 0, 0, 2, 0, 0, 2, 0, 0, 1, 0, 0])
    const before = Array.from(positions)
    trails.update(new Float32Array([9, 9]))
    expect(Array.from(positions)).toEqual(before)
    trails.dispose()
  })
})
