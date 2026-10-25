import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/engine/rng'
import { AgentSwarm, type SwarmOptions } from '../src/sim/AgentSwarm'

function place(swarm: AgentSwarm, positions: Array<[number, number, number]>): void {
  positions.forEach(([x, y, z], i) => {
    swarm.positions[i * 3] = x
    swarm.positions[i * 3 + 1] = y
    swarm.positions[i * 3 + 2] = z
    swarm.velocities[i * 3] = 0
    swarm.velocities[i * 3 + 1] = 0
    swarm.velocities[i * 3 + 2] = 0
  })
}

function distance(swarm: AgentSwarm, a: number, b: number): number {
  return Math.hypot(
    swarm.positions[a * 3]! - swarm.positions[b * 3]!,
    swarm.positions[a * 3 + 1]! - swarm.positions[b * 3 + 1]!,
    swarm.positions[a * 3 + 2]! - swarm.positions[b * 3 + 2]!,
  )
}

describe('AgentSwarm', () => {
  it('is deterministic for a given seed', () => {
    const a = new AgentSwarm({ count: 24, seed: 42, bounds: 6 })
    const b = new AgentSwarm({ count: 24, seed: 42, bounds: 6 })
    const attractor = new THREE.Vector3(1, -1, 0.5)
    for (let step = 0; step < 60; step++) {
      a.update(1 / 60, attractor)
      b.update(1 / 60, attractor)
    }
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions))
  })

  it('pushes neighbours apart', () => {
    const swarm = new AgentSwarm({
      count: 2,
      seed: 7,
      bounds: 10,
      weights: { separation: 3, alignment: 0, cohesion: 0 },
      maxSpeed: 2,
    })
    place(swarm, [
      [0, 0, 0],
      [0.05, 0, 0],
    ])
    const before = distance(swarm, 0, 1)
    for (let step = 0; step < 40; step++) swarm.update(1 / 60)
    expect(distance(swarm, 0, 1)).toBeGreaterThan(before * 2)
  })

  it('pulls a group together when cohesion dominates', () => {
    const swarm = new AgentSwarm({
      count: 2,
      seed: 11,
      bounds: 10,
      weights: { separation: 0, alignment: 0, cohesion: 0.8 },
      maxSpeed: 3,
    })
    place(swarm, [
      [-1, 0, 0],
      [1, 0, 0],
    ])
    const before = distance(swarm, 0, 1)
    for (let step = 0; step < 180; step++) swarm.update(1 / 60)
    expect(distance(swarm, 0, 1)).toBeLessThan(before)
    expect(swarm.spread()).toBeLessThan(1)
  })

  it('seeks an attractor', () => {
    const swarm = new AgentSwarm({
      count: 1,
      seed: 3,
      bounds: 20,
      weights: { separation: 0, alignment: 0, cohesion: 0 },
      maxSpeed: 4,
    })
    place(swarm, [[8, 6, 4]])
    const target = new THREE.Vector3(0, 0, 0)
    const before = Math.hypot(8, 6, 4)
    for (let step = 0; step < 240; step++) swarm.update(1 / 60, target, 3)
    const after = Math.hypot(swarm.positions[0]!, swarm.positions[1]!, swarm.positions[2]!)
    expect(after).toBeLessThan(before * 0.4)
  })

  it('moves equivalent arrangements identically regardless of array order', () => {
    const options: SwarmOptions = {
      count: 16,
      seed: 2024,
      bounds: 9,
      maxSpeed: 3,
      maxForce: 6,
      neighborRadius: 4,
      separationRadius: 1.4,
      weights: { separation: 1.7, alignment: 0.9, cohesion: 0.65 },
    }
    const ordered = new AgentSwarm(options)
    const reversed = new AgentSwarm({ ...options, seed: 99 })

    // Give both swarms one arrangement, then reverse the array order of the second.
    const rng = mulberry32(4242)
    const order = Array.from({ length: options.count }, (_, i) => options.count - 1 - i)
    order.forEach((from, to) => {
      for (let axis = 0; axis < 3; axis++) {
        const position = (rng() - 0.5) * 8
        const velocity = (rng() - 0.5) * 1.2
        ordered.positions[from * 3 + axis] = position
        ordered.velocities[from * 3 + axis] = velocity
        reversed.positions[to * 3 + axis] = position
        reversed.velocities[to * 3 + axis] = velocity
      }
    })

    const attractor = new THREE.Vector3(0.5, -0.25, 0.75)
    for (let step = 0; step < 12; step++) {
      ordered.update(1 / 60, attractor)
      reversed.update(1 / 60, attractor)
    }

    order.forEach((from, to) => {
      for (let axis = 0; axis < 3; axis++) {
        expect(reversed.positions[to * 3 + axis]!).toBeCloseTo(ordered.positions[from * 3 + axis]!, 6)
        expect(reversed.velocities[to * 3 + axis]!).toBeCloseTo(ordered.velocities[from * 3 + axis]!, 6)
      }
    })
  })

  it('never exceeds max speed and stays inside the world bounds', () => {
    const swarm = new AgentSwarm({
      count: 48,
      seed: 99,
      bounds: 3,
      maxSpeed: 2.5,
      maxForce: 20,
      initialSpread: 3,
    })
    const attractor = new THREE.Vector3(0, 0, 0)
    for (let step = 0; step < 400; step++) {
      swarm.update(1 / 60, attractor)
      for (let i = 0; i < swarm.count; i++) {
        const speed = Math.hypot(
          swarm.velocities[i * 3]!,
          swarm.velocities[i * 3 + 1]!,
          swarm.velocities[i * 3 + 2]!,
        )
        expect(speed).toBeLessThanOrEqual(2.5 + 1e-6)
        expect(Math.abs(swarm.positions[i * 3]!)).toBeLessThanOrEqual(3 + 1e-4)
        expect(Math.abs(swarm.positions[i * 3 + 1]!)).toBeLessThanOrEqual(3 + 1e-4)
        expect(Math.abs(swarm.positions[i * 3 + 2]!)).toBeLessThanOrEqual(3 + 1e-4)
      }
    }
  })
})
