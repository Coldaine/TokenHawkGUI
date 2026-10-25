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
  NOISE_GLSL,
  PARTICLE_HEADER,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import { AgentSwarm } from '../sim/AgentSwarm'
import { TrailLines } from '../sim/TrailLines'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const AGENTS = 160
const DUST = 20000
const COUNT = AGENTS + DUST

const DUST_VERTEX = /* glsl */ `
${PARTICLE_HEADER}
${NOISE_GLSL}
uniform float uBuild;
void main() {
  vec3 p = position;
  vec3 flow = flowNoise(p * 0.115 + vec3(0.0, uTime * 0.04, 0.0));
  p += flow * 1.35;
  p.y += uBuild * 0.9 * aSeed.x;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.4 + aSeed.w * 0.9);
  vAlpha = (0.08 + aSeed.y * 0.4) * smoothstep(-36.0, -4.0, mv.z);
  vMix = aSeed.z;
}
`

const AGENT_VERTEX = /* glsl */ `
${PARTICLE_HEADER}
uniform float uBuild;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (2.0 + aSeed.w * 1.3);
  vAlpha = 0.55 + uBuild * 0.45;
  vMix = 0.9;
}
`

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

export const effect: EffectDefinition = {
  number: 7,
  id: 'agent-builder',
  name: 'THE AGENT BUILDS THE WORLD',
  category: 'boids / construction',
  blurb: 'A hundred and sixty agents carrying dust into a structure that should not exist yet.',
  accent: PALETTE.amber,
  count: COUNT,
  cardBudget: 5000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x07b017d))
    const scene = new THREE.Scene()

    const swarm = new AgentSwarm({
      count: AGENTS,
      seed: hashSeed(ctx.seed ^ 0x07a9e17),
      bounds: 5.2,
      initialSpread: 4.6,
      maxSpeed: 3.4,
      weights: { separation: 1.6, alignment: 0.7, cohesion: 0.9 },
    })

    const uniforms = baseUniforms(ctx, PALETTE.amber)
    uniforms.uSize!.value = 1.4
    uniforms.uBuild = { value: 0 }

    // Ambient construction dust.
    const dust = makeCloud(DUST, rng, { spread: [18, 10, 18], scale: [0.3, 1] })
    dust.geometry.setDrawRange(0, DUST)
    const dustPoints = pointsFrom(dust.geometry, particleMaterial(DUST_VERTEX, uniforms))
    scene.add(dustPoints)

    // The agents themselves: bright moving heads.
    const agentCloud = makeCloud(AGENTS, rng, { spread: [1, 1, 1], scale: [0.9, 1.5] })
    const agentAttribute = agentCloud.geometry.getAttribute('position') as THREE.BufferAttribute
    ;(agentAttribute.array as Float32Array).set(swarm.positions)
    agentAttribute.needsUpdate = true
    const agentPoints = pointsFrom(agentCloud.geometry, particleMaterial(AGENT_VERTEX, uniforms))
    scene.add(agentPoints)

    const trails = new TrailLines(AGENTS, 8, PALETTE.amber, 0.26)
    scene.add(trails.line)

    // The structure under construction.
    const structure = new THREE.Group()
    structure.position.y = -2.6
    const structureMeshes: THREE.LineSegments[] = []
    const sourceGeometries: THREE.BufferGeometry[] = []
    const sizes: Array<[number, number, number]> = [
      [3.4, 4.8, 3.4],
      [2.4, 3.5, 2.4],
      [1.4, 2.3, 1.4],
    ]
    sizes.forEach(([w, h, d], index) => {
      const source = new THREE.BoxGeometry(w, h, d, 1, 3, 1)
      const wire = wireMesh(source, PALETTE.amber, 0.32 - index * 0.05)
      wire.position.y = h / 2
      structure.add(wire)
      structureMeshes.push(wire)
      sourceGeometries.push(source)
    })

    scene.add(structure)

    const camera = makeCamera(12)
    camera.lookAt(0, 0.4, 0)
    const attractor = new THREE.Vector3()
    // Construction runs on the world's own clock. The app-level elapsed time
    // starts when the page opens, so using it would hand a world opened later
    // an already-finished build.
    let age = 0

    return {
      scene,
      camera,
      particleCount: COUNT,
      update(dt, elapsed, pointer) {
        age += dt
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const build = smoothstep(age / 24)
        uniforms.uBuild!.value = build
        const breathe = 1 + Math.sin(elapsed * 0.5) * 0.015
        structure.scale.setScalar((0.06 + 0.94 * build) * breathe)
        structureMeshes.forEach((mesh, index) => {
          const material = mesh.material as THREE.LineBasicMaterial
          material.opacity = (0.32 - index * 0.05) * (0.25 + 0.75 * build)
        })

        attractor.set(
          Math.cos(elapsed * 0.34) * 3.4,
          1.1 + Math.sin(elapsed * 0.23) * 1.7,
          Math.sin(elapsed * 0.34) * 3.4,
        )
        swarm.update(dt, attractor, 3.6)

        ;(agentAttribute.array as Float32Array).set(swarm.positions)
        agentAttribute.needsUpdate = true
        trails.update(swarm.positions)

        const sway = elapsed * 0.06
        camera.position.x = Math.sin(sway) * 1.9 + pointer.x * 0.8
        camera.position.y = 0.5 + Math.cos(sway * 0.8) * 0.4 - pointer.y * 0.4
        camera.position.z = 12 - Math.cos(sway) * 0.7
        camera.lookAt(0, 0.4, 0)
      },
      resize(width, height) {
        applyViewport(camera, uniforms, ctx.pixelRatio, width, height)
      },
      setBudget(n) {
        // The agents are always in the scene, so they spend part of the budget
        // instead of being added on top of it.
        const total = Math.max(0, Math.min(n, COUNT))
        const agents = Math.min(AGENTS, total)
        dust.geometry.setDrawRange(0, total - agents)
        agentCloud.geometry.setDrawRange(0, agents)
      },
      dispose() {
        disposeScene(scene)
        sourceGeometries.forEach((geometry) => geometry.dispose())
      },
    }
  },
}
