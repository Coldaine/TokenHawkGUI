import * as THREE from 'three'
import { mulberry32, type RNG } from '../engine/rng'

export interface SwarmWeights {
  separation?: number
  alignment?: number
  cohesion?: number
}

export interface SwarmOptions {
  count: number
  seed: number
  /** Half-extent of the cubic world the agents live in. */
  bounds: number
  maxSpeed?: number
  maxForce?: number
  neighborRadius?: number
  separationRadius?: number
  weights?: SwarmWeights
  damping?: number
  /** Initial distribution radius. Defaults to the world bounds. */
  initialSpread?: number
}

/**
 * Small CPU boids simulation. 160-ish agents with an O(n^2) neighbour loop is
 * comfortably inside a frame; the GPU handles the dust around them.
 */
export class AgentSwarm {
  readonly count: number
  readonly positions: Float32Array
  readonly velocities: Float32Array
  readonly bounds: number
  readonly maxSpeed: number
  readonly maxForce: number
  readonly neighborRadius: number
  readonly separationRadius: number
  readonly weights: Required<SwarmWeights>
  readonly damping: number
  private readonly rng: RNG

  constructor(options: SwarmOptions) {
    this.count = Math.max(1, Math.floor(options.count))
    this.bounds = options.bounds
    this.maxSpeed = options.maxSpeed ?? 3
    this.maxForce = options.maxForce ?? 7
    this.neighborRadius = options.neighborRadius ?? 2.5
    this.separationRadius = options.separationRadius ?? 0.9
    this.damping = options.damping ?? 0.995
    this.weights = {
      separation: options.weights?.separation ?? 1.5,
      alignment: options.weights?.alignment ?? 0.8,
      cohesion: options.weights?.cohesion ?? 0.7,
    }
    this.rng = mulberry32(options.seed)
    this.positions = new Float32Array(this.count * 3)
    this.velocities = new Float32Array(this.count * 3)

    const spread = options.initialSpread ?? this.bounds
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (this.rng() - 0.5) * 2 * spread
      this.positions[i * 3 + 1] = (this.rng() - 0.5) * 2 * spread
      this.positions[i * 3 + 2] = (this.rng() - 0.5) * 2 * spread

      this.velocities[i * 3] = (this.rng() - 0.5) * 1.2
      this.velocities[i * 3 + 1] = (this.rng() - 0.5) * 1.2
      this.velocities[i * 3 + 2] = (this.rng() - 0.5) * 1.2
    }
  }

  update(dt: number, attractor: THREE.Vector3 | null = null, seekStrength = 2.2): void {
    const { count, positions, velocities, bounds, maxSpeed, maxForce, weights } = this
    const neighborRadiusSq = this.neighborRadius * this.neighborRadius
    const separationRadiusSq = this.separationRadius * this.separationRadius
    const step = Math.min(dt, 0.05)
    const drag = Math.pow(this.damping, step * 60)

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const px = positions[ix]!
      const py = positions[ix + 1]!
      const pz = positions[ix + 2]!
      const vx = velocities[ix]!
      const vy = velocities[ix + 1]!
      const vz = velocities[ix + 2]!

      let sepX = 0
      let sepY = 0
      let sepZ = 0
      let alignX = 0
      let alignY = 0
      let alignZ = 0
      let cohX = 0
      let cohY = 0
      let cohZ = 0
      let neighbours = 0

      for (let j = 0; j < count; j++) {
        if (j === i) continue
        const jx = j * 3
        const dx = positions[jx]! - px
        const dy = positions[jx + 1]! - py
        const dz = positions[jx + 2]! - pz
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 > neighborRadiusSq || d2 < 1e-8) continue

        neighbours += 1
        alignX += velocities[jx]!
        alignY += velocities[jx + 1]!
        alignZ += velocities[jx + 2]!
        cohX += positions[jx]!
        cohY += positions[jx + 1]!
        cohZ += positions[jx + 2]!

        if (d2 < separationRadiusSq) {
          const inv = 1 / d2
          sepX -= dx * inv
          sepY -= dy * inv
          sepZ -= dz * inv
        }
      }

      let ax = sepX * weights.separation
      let ay = sepY * weights.separation
      let az = sepZ * weights.separation

      if (neighbours > 0) {
        const inv = 1 / neighbours
        ax += (alignX * inv - vx) * weights.alignment
        ay += (alignY * inv - vy) * weights.alignment
        az += (alignZ * inv - vz) * weights.alignment
        ax += (cohX * inv - px) * weights.cohesion
        ay += (cohY * inv - py) * weights.cohesion
        az += (cohZ * inv - pz) * weights.cohesion
      }

      if (attractor) {
        const dx = attractor.x - px
        const dy = attractor.y - py
        const dz = attractor.z - pz
        const len = Math.hypot(dx, dy, dz) || 1
        const pull = seekStrength * Math.min(1, 4 / len)
        ax += (dx / len) * pull
        ay += (dy / len) * pull
        az += (dz / len) * pull
      }

      const forceMag = Math.hypot(ax, ay, az)
      if (forceMag > maxForce) {
        const scale = maxForce / forceMag
        ax *= scale
        ay *= scale
        az *= scale
      }

      let nvx = (vx + ax * step) * drag
      let nvy = (vy + ay * step) * drag
      let nvz = (vz + az * step) * drag

      const speed = Math.hypot(nvx, nvy, nvz)
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed
        nvx *= scale
        nvy *= scale
        nvz *= scale
      }

      let nx = px + nvx * step
      let ny = py + nvy * step
      let nz = pz + nvz * step

      if (nx > bounds || nx < -bounds) {
        nx = Math.max(-bounds, Math.min(bounds, nx))
        nvx *= -0.55
      }
      if (ny > bounds || ny < -bounds) {
        ny = Math.max(-bounds, Math.min(bounds, ny))
        nvy *= -0.55
      }
      if (nz > bounds || nz < -bounds) {
        nz = Math.max(-bounds, Math.min(bounds, nz))
        nvz *= -0.55
      }

      velocities[ix] = nvx
      velocities[ix + 1] = nvy
      velocities[ix + 2] = nvz
      positions[ix] = nx
      positions[ix + 1] = ny
      positions[ix + 2] = nz
    }
  }

  centroid(target = new THREE.Vector3()): THREE.Vector3 {
    target.set(0, 0, 0)
    for (let i = 0; i < this.count; i++) {
      target.x += this.positions[i * 3]!
      target.y += this.positions[i * 3 + 1]!
      target.z += this.positions[i * 3 + 2]!
    }
    return target.multiplyScalar(1 / this.count)
  }

  /** Mean distance from the centroid: a useful test/telemetry measure of spread. */
  spread(): number {
    const centre = this.centroid()
    let total = 0
    for (let i = 0; i < this.count; i++) {
      total += Math.hypot(
        this.positions[i * 3]! - centre.x,
        this.positions[i * 3 + 1]! - centre.y,
        this.positions[i * 3 + 2]! - centre.z,
      )
    }
    return total / this.count
  }
}
