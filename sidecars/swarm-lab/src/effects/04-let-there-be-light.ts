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
  PARTICLE_HEADER,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 14000

interface Cone {
  apex: [number, number, number]
  height: number
  radius: number
}

const CONES: Cone[] = [
  { apex: [-3.3, 5.2, -1.6], height: 8.4, radius: 1.55 },
  { apex: [0.35, 5.9, 0.4], height: 8.8, radius: 1.85 },
  { apex: [3.4, 4.8, -1.1], height: 8.0, radius: 1.45 },
]

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
void main() {
  vec3 p = position;
  float t = uTime * 0.22 + aSeed.x * 6.2831;
  p.x += sin(t) * 0.09;
  p.z += cos(t * 0.83) * 0.09;
  p.y += sin(uTime * 0.3 + aSeed.y * 6.2831) * 0.05;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.35 + aSeed.w * 2.4);

  float depthFade = smoothstep(-22.0, -3.0, mv.z);
  vAlpha = depthFade * (0.05 + pow(aSeed.y, 2.0) * 0.95);
  vMix = 0.4 + aSeed.z * 0.5;
}
`

export const effect: EffectDefinition = {
  number: 4,
  id: 'let-there-be-light',
  name: 'LET THERE BE LIGHT',
  category: 'volume / shafts',
  blurb: 'Sparse columns of warm light. Nothing else needs to exist.',
  accent: PALETTE.bone,
  count: COUNT,
  cardBudget: 4000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x04b0a7e5))

    const { geometry, count } = makeCloud(COUNT, rng, {
      spread: [1, 1, 1],
      scale: [0.3, 1.7],
    })

    // Re-shape the random box into three fallen cones of light.
    const position = geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const cone = CONES[Math.floor(rng() * CONES.length)] ?? CONES[0]!
      const t = Math.pow(rng(), 0.72)
      const angle = rng() * Math.PI * 2
      const radius = t * cone.radius * (0.65 + rng() * 0.35)
      const x = cone.apex[0] + Math.cos(angle) * radius
      const y = cone.apex[1] - t * cone.height + (rng() - 0.5) * 0.2
      const z = cone.apex[2] + Math.sin(angle) * radius
      position.setXYZ(i, x, y, z)
    }
    position.needsUpdate = true

    const uniforms = baseUniforms(ctx, PALETTE.bone)
    uniforms.uSize!.value = 1.6

    const material = particleMaterial(VERTEX, uniforms)
    const points = pointsFrom(geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const camera = makeCamera(10.4)
    camera.position.set(0, 0.7, 10.4)
    camera.lookAt(0, 0.4, 0)

    return {
      scene,
      camera,
      particleCount: count,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const t = elapsed * 0.045
        camera.position.x = Math.sin(t) * 0.85 + pointer.x * 0.55
        camera.position.y = 0.7 + Math.cos(t * 0.8) * 0.25 - pointer.y * 0.25
        camera.position.z = 10.4 + Math.cos(t * 0.6) * 0.35
        camera.lookAt(0, 0.4, 0)
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
