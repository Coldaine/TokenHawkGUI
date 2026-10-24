import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { AgentSwarm } from '../src/sim/AgentSwarm'

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
