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

const COUNT = 48000
const BASE_Y = -3.2
const HEIGHT = 7
const CYCLE = 24

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
attribute vec3 aTarget;
uniform float uAssemble;

void main() {
  float stagger = clamp((uAssemble - (1.0 - aSeed.x) * 0.4) / 0.6, 0.0, 1.0);
  float ease = stagger * stagger * (3.0 - 2.0 * stagger);

  vec3 p = mix(position, aTarget, ease);

  vec3 dir = normalize(aTarget - position + vec3(0.0001));
  p += dir * sin(ease * 3.14159265) * (0.28 + aSeed.y * 0.5);

  p += vec3(
    sin(uTime * 0.5 + aSeed.z * 6.2831),
    cos(uTime * 0.4 + aSeed.w * 6.2831),
    sin(uTime * 0.33 + aSeed.y * 6.2831)
  ) * 0.025 * ease;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.45 + aSeed.w * 0.9);
  vAlpha = (0.24 + aSeed.y * 0.76) * smoothstep(-34.0, -4.0, mv.z);
  vMix = aSeed.z;
}
`

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

export const effect: EffectDefinition = {
  number: 8,
  id: 'monument',
  name: 'THE MONUMENT',
  category: 'assemblage / spring',
  blurb: 'A cloud decides to become a monument, holds, then forgets.',
  accent: PALETTE.bone,
  count: COUNT,
  cardBudget: 8000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x08b10c))
    const cloud = makeCloud(COUNT, rng, { spread: [15, 10, 12], scale: [0.35, 1] })

    const targets = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const v = rng()
      const y = BASE_Y + v * HEIGHT
      const halfWidth = 1.18 - v * 0.5
      const halfDepth = 0.48 - v * 0.16

      const edge = rng()
      let x: number
      let z: number

      if (edge < 0.12) {
        // Hard vertical corners hold the silhouette.
        x = (rng() < 0.5 ? -1 : 1) * halfWidth
        z = (rng() < 0.5 ? -1 : 1) * halfDepth
      } else if (edge < 0.88) {
        // Front and back faces.
        x = (rng() - 0.5) * 2 * halfWidth
        z = (rng() < 0.5 ? -1 : 1) * halfDepth
      } else {
        // Side faces.
        x = (rng() < 0.5 ? -1 : 1) * halfWidth
        z = (rng() - 0.5) * 2 * halfDepth
      }

      targets[i * 3] = x + (rng() - 0.5) * 0.035
      targets[i * 3 + 1] = y + (rng() - 0.5) * 0.035
      targets[i * 3 + 2] = z + (rng() - 0.5) * 0.035
    }

    cloud.geometry.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3))

    const uniforms = baseUniforms(ctx, PALETTE.bone)
    uniforms.uSize!.value = 1.8
    uniforms.uAssemble = { value: 0 }

    const points = pointsFrom(cloud.geometry, particleMaterial(VERTEX, uniforms))
    const scene = new THREE.Scene()
    scene.add(points)

    const camera = makeCamera(11.2)
    camera.lookAt(0, 0, 0)

    return {
      scene,
      camera,
      particleCount: COUNT,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const phase = elapsed % CYCLE
        let assemble = 0
        if (phase < 5.5) assemble = smoothstep(phase / 5.5)
        else if (phase < 13) assemble = 1
        else if (phase < 19.5) assemble = 1 - smoothstep((phase - 13) / 6.5)
        uniforms.uAssemble!.value = assemble

        const orbit = elapsed * 0.055
        camera.position.x = Math.sin(orbit) * 2.6 + pointer.x * 0.7
        camera.position.y = 0.65 + Math.sin(orbit * 0.7) * 0.5 - pointer.y * 0.45
        camera.position.z = 11.2 - Math.cos(orbit) * 1.1
        camera.lookAt(0, 0, 0)
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
