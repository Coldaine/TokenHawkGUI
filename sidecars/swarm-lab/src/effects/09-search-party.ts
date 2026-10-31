import * as THREE from 'three'
import { hashSeed, mulberry32 } from '../engine/rng'
import {
  applyViewport,
  baseUniforms,
  disposeScene,
  makeCamera,
  makeCloud,
  particleMaterial,
  pointsFrom,
  wireMesh,
  PARTICLE_HEADER,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import { AgentSwarm } from '../sim/AgentSwarm'
import { TrailLines } from '../sim/TrailLines'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const DUST = 12000
const AGENTS = 120
const COUNT = DUST + AGENTS
const PROBE_COUNT = 5
const SWITCH_EVERY = 4

const DUST_VERTEX = /* glsl */ `
${PARTICLE_HEADER}
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.24 + aSeed.x * 6.2831) * 0.36;
  p.y += cos(uTime * 0.29 + aSeed.y * 6.2831) * 0.36;
  p.z += sin(uTime * 0.19 + aSeed.z * 6.2831) * 0.3;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.4 + aSeed.w * 0.8);

  vAlpha = 0.1 + aSeed.y * 0.26;
  vMix = aSeed.z * 0.5;
}
`

const AGENT_VERTEX = /* glsl */ `
${PARTICLE_HEADER}
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.7 + aSeed.x * 0.7);
  vAlpha = 0.72 + aSeed.y * 0.28;
  vMix = 0.85;
}
`

export const effect: EffectDefinition = {
  number: 9,
  id: 'search-party',
  name: 'THE SEARCH PARTY',
  category: 'agents / convergence',
  blurb: 'Agents fan out across probes, compare, and collapse onto the best answer.',
  accent: PALETTE.teal,
  count: COUNT,
  cardBudget: 4000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x09a11e))

    const dustUniforms = baseUniforms(ctx, PALETTE.teal)
    dustUniforms.uSize!.value = 1.2
    const dustCloud = makeCloud(DUST, rng, { spread: [14, 8, 10], scale: [0.25, 0.7] })
    const dustMaterial = particleMaterial(DUST_VERTEX, dustUniforms)
    const dust = pointsFrom(dustCloud.geometry, dustMaterial)

    const agentUniforms = baseUniforms(ctx, PALETTE.teal)
    agentUniforms.uSize!.value = 2.7
    const agentCloud = makeCloud(AGENTS, rng, { spread: [0, 0, 0], scale: [1.3, 2.1] })
    const agentMaterial = particleMaterial(AGENT_VERTEX, agentUniforms)
    const agentPoints = pointsFrom(agentCloud.geometry, agentMaterial)

    const scene = new THREE.Scene()
    scene.add(dust)
    scene.add(agentPoints)

    const swarm = new AgentSwarm({
      count: AGENTS,
      seed: hashSeed(ctx.seed ^ 0x09b01d),
      bounds: 6,
      maxSpeed: 3.4,
      weights: { separation: 2.1, alignment: 0.85, cohesion: 0.6 },
    })

    const trails = new TrailLines(AGENTS, 10, PALETTE.teal, 0.34)
    scene.add(trails.line)

    // Probe arc.
    const probePositions: THREE.Vector3[] = []
    const probeRings: THREE.LineSegments[] = []
    const probeCores: THREE.Mesh[] = []
    for (let i = 0; i < PROBE_COUNT; i++) {
      const pos = new THREE.Vector3(
        -4.4 + i * 2.2,
        0.2 + Math.sin(i * 1.1) * 0.55,
        -0.7 + Math.cos(i * 0.9) * 0.35,
      )
      probePositions.push(pos)

      const source = new THREE.TorusGeometry(0.42, 0.016, 4, 44)
      const ring = wireMesh(source, PALETTE.teal, 0.3)
      source.dispose()
      ring.position.copy(pos)
      scene.add(ring)
      probeRings.push(ring)

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 8),
        new THREE.MeshBasicMaterial({
          color: PALETTE.teal,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      core.position.copy(pos)
      scene.add(core)
      probeCores.push(core)
    }

    const linkGeometry = new THREE.BufferGeometry()
    linkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    linkGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)
    const linkMaterial = new THREE.LineBasicMaterial({
      color: PALETTE.teal,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const link = new THREE.Line(linkGeometry, linkMaterial)
    link.frustumCulled = false
    scene.add(link)

    const camera = makeCamera(10.6)
    camera.position.y = 0.35
    camera.lookAt(0, 0.1, 0)

    const centre = new THREE.Vector3()
    const current = new THREE.Vector3()
    let active = 0
    let switchTimer = 0

    const choose = (next: number): void => {
      active = next
      for (let i = 0; i < PROBE_COUNT; i++) {
        const ringMat = probeRings[i]!.material as THREE.LineBasicMaterial
        const coreMat = probeCores[i]!.material as THREE.MeshBasicMaterial
        ringMat.opacity = i === active ? 0.9 : 0.26
        coreMat.opacity = i === active ? 1 : 0.4
      }
      // A short outward impulse reads as the party fanning out to look again.
      const target = probePositions[active]!
      const { positions, velocities, count } = swarm
      for (let i = 0; i < count; i++) {
        const dx = positions[i * 3]! - target.x
        const dy = positions[i * 3 + 1]! - target.y
        const dz = positions[i * 3 + 2]! - target.z
        const len = Math.hypot(dx, dy, dz) || 1
        velocities[i * 3] = velocities[i * 3]! + (dx / len) * 0.85
        velocities[i * 3 + 1] = velocities[i * 3 + 1]! + (dy / len) * 0.55
        velocities[i * 3 + 2] = velocities[i * 3 + 2]! + (dz / len) * 0.85
      }
    }
    choose(0)

    return {
      scene,
      camera,
      particleCount: COUNT,
      update(dt, elapsed, pointer) {
        dustUniforms.uTime!.value = elapsed
        agentUniforms.uTime!.value = elapsed
        ;(dustUniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)
        ;(agentUniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        switchTimer += dt
        if (switchTimer >= SWITCH_EVERY) {
          switchTimer = 0
          choose((active + 1) % PROBE_COUNT)
        }

        swarm.update(dt, probePositions[active]!, 2.6)
        swarm.centroid(centre)

        const positions = agentCloud.geometry.attributes.position as THREE.BufferAttribute
        ;(positions.array as Float32Array).set(swarm.positions)
        positions.needsUpdate = true
        trails.update(swarm.positions)

        const linkAttr = linkGeometry.attributes.position as THREE.BufferAttribute
        const linkArray = linkAttr.array as Float32Array
        current.copy(probePositions[active]!)
        linkArray[0] = centre.x
        linkArray[1] = centre.y
        linkArray[2] = centre.z
        linkArray[3] = current.x
        linkArray[4] = current.y
        linkArray[5] = current.z
        linkAttr.needsUpdate = true

        for (let i = 0; i < PROBE_COUNT; i++) {
          const pulse = i === active ? 1 + Math.sin(elapsed * 2.4) * 0.1 : 1
          probeRings[i]!.scale.setScalar(pulse)
        }

        const sway = elapsed * 0.05
        camera.position.x = Math.sin(sway) * 1.3 + pointer.x * 0.7
        camera.position.y = 0.35 + Math.cos(sway * 0.8) * 0.3 - pointer.y * 0.4
        camera.position.z = 10.6 - Math.cos(sway * 0.6) * 0.4
        camera.lookAt(0, 0.1, 0)
      },
      resize(width, height) {
        applyViewport(camera, dustUniforms, ctx.pixelRatio, width, height)
        applyViewport(camera, agentUniforms, ctx.pixelRatio, width, height)
      },
      setBudget(n) {
        // Agent heads are always drawn, so the budget is split rather than
        // spent on dust alone and topped up with the party.
        const total = Math.max(0, Math.min(n, COUNT))
        const agents = Math.min(AGENTS, total)
        dustCloud.geometry.setDrawRange(0, total - agents)
        agentCloud.geometry.setDrawRange(0, agents)
      },
      dispose() {
        disposeScene(scene)
      },
    }
  },
}
