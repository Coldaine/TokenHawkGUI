import * as THREE from 'three'
import { hashSeed, mulberry32, type RNG } from '../engine/rng'
import {
  applyViewport,
  baseUniforms,
  disposeScene,
  makeCamera,
  makeCloud,
  particleMaterial,
  pointsFrom,
  NOISE_GLSL,
  PARTICLE_HEADER,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 45000
const CYCLE = 12
const GRID_X = 16
const GRID_Y = 12
const GRID_Z = 10

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
${NOISE_GLSL}
attribute vec3 aTarget;
uniform float uMorph;

void main() {
  float m = smoothstep(0.0, 1.0, uMorph * 1.35 - aSeed.x * 0.35);

  vec3 p = mix(position, aTarget, m);
  p += flowNoise(position * 0.18 + vec3(0.0, uTime * 0.05, 0.0)) * (0.42 * (1.0 - m));
  p.y += sin(uTime * 0.7 + aSeed.y * 6.2831) * 0.05 * (1.0 - m * 0.75);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.6 + aSeed.z * 0.8) * (1.0 + m * 0.3);

  vAlpha = (0.22 + m * 0.7 + aSeed.w * 0.12) * smoothstep(-26.0, -3.0, mv.z);
  vMix = 0.35 + m * 0.65;
}
`

function buildTargets(count: number, rng: RNG): Float32Array {
  const targets = new Float32Array(count * 3)
  const nodes = GRID_X * GRID_Y * GRID_Z

  for (let i = 0; i < count; i++) {
    const node = i % nodes
    const ix = node % GRID_X
    const iy = Math.floor(node / GRID_X) % GRID_Y
    const iz = Math.floor(node / (GRID_X * GRID_Y))

    targets[i * 3] = (ix - (GRID_X - 1) / 2) * 0.62 + (rng() - 0.5) * 0.05
    targets[i * 3 + 1] = (iy - (GRID_Y - 1) / 2) * 0.5 + (rng() - 0.5) * 0.05
    targets[i * 3 + 2] = (iz - (GRID_Z - 1) / 2) * 0.55 + (rng() - 0.5) * 0.05
  }

  return targets
}

function smooth(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

export const effect: EffectDefinition = {
  number: 10,
  id: 'lattice',
  name: 'THE LATTICE',
  category: 'morph / crystal',
  blurb: 'Noise snaps into crystal, holds one beat, and dissolves again.',
  accent: PALETTE.acid,
  count: COUNT,
  cardBudget: 8000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x10a771))
    const cloud = makeCloud(COUNT, rng, { spread: [12, 9, 12], scale: [0.35, 0.95] })
    cloud.geometry.setAttribute('aTarget', new THREE.BufferAttribute(buildTargets(COUNT, rng), 3))

    const uniforms = baseUniforms(ctx, PALETTE.acid)
    uniforms.uSize!.value = 1.32
    uniforms.uMorph = { value: 0 }

    const material = particleMaterial(VERTEX, uniforms)
    const points = pointsFrom(cloud.geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const camera = makeCamera(10.6)
    camera.position.y = 0.5
    camera.lookAt(0, 0, 0)

    let clock = 0
    let wasDown = false

    return {
      scene,
      camera,
      particleCount: COUNT,
      update(dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed

        if (pointer.down && !wasDown) clock = 0
        wasDown = pointer.down
        clock += dt

        const phase = (clock % CYCLE) / CYCLE
        let morph: number
        if (phase < 0.25) morph = smooth(phase / 0.25)
        else if (phase < 0.58) morph = 1
        else if (phase < 0.8) morph = 1 - smooth((phase - 0.58) / 0.22)
        else morph = 0

        uniforms.uMorph!.value = morph

        const orbit = elapsed * 0.075
        camera.position.x = Math.sin(orbit) * 2.4 + pointer.x * 0.5
        camera.position.y = 0.5 + Math.cos(orbit * 0.7) * 0.55 - pointer.y * 0.35
        camera.position.z = 10.6 + Math.cos(orbit) * 1.1
        camera.lookAt(0, 0, 0)
        points.rotation.y = elapsed * 0.02
      },
      resize(width, height) {
        applyViewport(camera, uniforms, ctx.pixelRatio, width, height)
      },
      setBudget(n) {
        cloud.geometry.setDrawRange(0, Math.max(0, Math.min(n, COUNT)))
      },
      dispose() {
        disposeScene(scene)
      },
    }
  },
}
