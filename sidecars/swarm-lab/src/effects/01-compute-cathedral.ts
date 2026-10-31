import * as THREE from 'three'
import { hashSeed, mulberry32, type RNG } from '../engine/rng'
import {
  applyViewport,
  baseUniforms,
  disposeScene,
  makeCamera,
  particleMaterial,
  pointsFrom,
  PARTICLE_HEADER,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import type { Cloud } from '../engine/particles'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 70000
const BAYS = 7
const BAY_DEPTH = 2.2
const NAVE_HALF_WIDTH = 3.15
const FLOOR = -2.8

function buildCathedral(rng: RNG): Cloud {
  const positions = new Float32Array(COUNT * 3)
  const seeds = new Float32Array(COUNT * 4)
  const scales = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    const roll = rng()
    let x: number
    let y: number
    let z: number

    if (roll < 0.5) {
      // Ribbed arches spanning the nave.
      const bay = Math.floor(rng() * BAYS)
      const t = rng()
      const arc = Math.sin(t * Math.PI)
      x = (t - 0.5) * (NAVE_HALF_WIDTH * 2 + 0.3) + (rng() - 0.5) * 0.14
      y = 0.25 + arc * 3.5 + (rng() - 0.5) * 0.12
      z = -((BAYS - 1) * BAY_DEPTH) / 2 + bay * BAY_DEPTH + (rng() - 0.5) * 0.2
    } else if (roll < 0.8) {
      // Columns and the dust clinging to them.
      const side = rng() < 0.5 ? -NAVE_HALF_WIDTH : NAVE_HALF_WIDTH
      x = side + (rng() - 0.5) * 0.3
      y = FLOOR + rng() * 3.2
      z = -((BAYS - 1) * BAY_DEPTH) / 2 + rng() * ((BAYS - 1) * BAY_DEPTH)
    } else {
      // Thin air.
      x = (rng() - 0.5) * 8
      y = FLOOR + rng() * 7.6
      z = -7.4 + rng() * 14.8
    }

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    seeds[i * 4] = rng()
    seeds[i * 4 + 1] = rng()
    seeds[i * 4 + 2] = rng()
    seeds[i * 4 + 3] = rng()
    scales[i] = 0.35 + rng() * 0.75
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)

  return { geometry, count: COUNT }
}

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
void main() {
  vec3 p = position;
  float t = uTime * 0.32 + aSeed.x * 6.2831;
  p.x += sin(t + p.y * 0.9) * (0.03 + aSeed.y * 0.05);
  p.z += cos(t * 0.8 + p.x * 0.7) * (0.03 + aSeed.z * 0.05);
  p.y += sin(uTime * 0.45 + p.z * 0.55 + aSeed.w * 6.2831) * 0.07;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.5 + aSeed.w * 0.95);

  float depthFade = smoothstep(-24.0, -4.0, mv.z);
  vAlpha = depthFade * (0.16 + aSeed.y * 0.72);
  vMix = aSeed.z;
}
`

export const effect: EffectDefinition = {
  number: 1,
  id: 'compute-cathedral',
  name: 'THE COMPUTE CATHEDRAL',
  category: 'structure / dust',
  blurb: 'A nave of standing light. Seventy thousand motes hold an arch that is not there.',
  accent: PALETTE.amber,
  count: COUNT,
  cardBudget: 9000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x01c0ffee))
    const { geometry, count } = buildCathedral(rng)
    const uniforms = baseUniforms(ctx, PALETTE.amber)
    uniforms.uSize!.value = 1.95

    const material = particleMaterial(VERTEX, uniforms)
    const points = pointsFrom(geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const camera = makeCamera(12.4)
    camera.position.y = 0.15
    camera.lookAt(0, 0.15, 0)

    return {
      scene,
      camera,
      particleCount: count,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const t = elapsed * 0.055
        camera.position.x = Math.sin(t) * 1.7 + pointer.x * 0.5
        camera.position.y = 0.15 + Math.cos(t * 0.72) * 0.38 - pointer.y * 0.28
        camera.position.z = 12.4 - Math.cos(t * 0.5) * 0.5
        camera.lookAt(0, 0.2, 0)
      },
      resize(width, height) {
        applyViewport(camera, uniforms, ctx.pixelRatio, width, height)
      },
      setBudget(n) {
        geometry.setDrawRange(0, Math.max(0, Math.min(n, count)))
      },
      dispose() {
        disposeScene(scene)
      },
    }
  },
}
