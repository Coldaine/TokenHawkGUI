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
  softOrb,
  NOISE_GLSL,
  PARTICLE_HEADER,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 32000

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
${NOISE_GLSL}
void main() {
  vec3 dir = normalize(position);

  float breath = sin(uTime * 0.95 + dir.y * 2.4 + aSeed.x * 1.4) * 0.5 + 0.5;
  float radius = 2.2 + breath * 0.5 + aSeed.y * 0.28;
  vec3 p = dir * radius;
  p += flowNoise(dir * 1.7 + uTime * 0.12) * 0.09;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.45 + aSeed.w * 1.1);

  float depthFade = smoothstep(-16.0, -3.0, mv.z);
  vAlpha = depthFade * (0.26 + aSeed.z * 0.9);
  vMix = 0.35 + aSeed.y * 0.45;
}
`

export const effect: EffectDefinition = {
  number: 2,
  id: 'living-model',
  name: 'THE LIVING MODEL',
  category: 'shell / pulse',
  blurb: 'A body that breathes: a shell of light opening and closing around a hot core.',
  accent: PALETTE.magenta,
  count: COUNT,
  cardBudget: 6000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x02b10f1e))

    const { geometry, count } = makeCloud(COUNT, rng, {
      spread: [4.4, 4.4, 4.4],
      scale: [0.3, 1.05],
    })

    // Pull the random volume onto a shell.
    const position = geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const x = position.getX(i)
      const y = position.getY(i)
      const z = position.getZ(i)
      const len = Math.hypot(x, y, z) || 1
      const radius = 2.25 + rng() * 0.25
      position.setXYZ(i, (x / len) * radius, (y / len) * radius, (z / len) * radius)
    }
    position.needsUpdate = true

    const uniforms = baseUniforms(ctx, PALETTE.magenta)
    uniforms.uSize!.value = 2.1

    const material = particleMaterial(VERTEX, uniforms)
    const points = pointsFrom(geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const core = softOrb(PALETTE.magenta, 3.6, 0.95)
    scene.add(core)

    const camera = makeCamera(9)
    camera.position.set(0, 0.6, 9)
    camera.lookAt(0, 0, 0)

    return {
      scene,
      camera,
      particleCount: count,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const t = elapsed * 0.11
        camera.position.x = Math.sin(t) * 2.4 + pointer.x * 0.4
        camera.position.y = 0.6 + Math.cos(t * 0.62) * 0.55 - pointer.y * 0.3
        camera.position.z = 9 + Math.cos(t * 0.4) * 0.6
        camera.lookAt(0, 0, 0)

        const pulse = Math.sin(elapsed * 0.95) * 0.1
        core.scale.setScalar(0.94 + pulse)
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
