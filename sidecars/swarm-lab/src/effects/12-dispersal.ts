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
  NOISE_GLSL,
  PARTICLE_HEADER,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 42000
const BURST_DECAY = 0.38

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
${NOISE_GLSL}
uniform float uBurst;

void main() {
  vec3 dir = normalize(position + vec3(0.0001));
  float radius = 1.15 + aSeed.x * 3.4;
  vec3 p = dir * radius;

  float impulse = sin(clamp(uBurst, 0.0, 1.0) * 3.14159265);
  p += dir * impulse * (3.6 + aSeed.y * 5.4);

  float swirl = impulse * (1.2 + aSeed.z * 1.8);
  float c = cos(swirl);
  float s = sin(swirl);
  p.xy = mat2(c, -s, s, c) * p.xy;

  vec3 f = flowNoise(p * 0.22 + vec3(0.0, uTime * 0.04, 0.0));
  p += f * 0.55;
  p.y += sin(uTime * 0.5 + aSeed.w * 6.2831) * 0.18;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.6 + aSeed.w * 0.9);

  float depthFade = smoothstep(-30.0, -2.0, mv.z);
  vAlpha = depthFade * (0.3 + aSeed.y * 0.75);
  vMix = aSeed.z;
}
`

export const effect: EffectDefinition = {
  number: 12,
  id: 'dispersal',
  name: 'THE DISPERSAL',
  category: 'impulse / return',
  blurb: 'One impulse, forty thousand trajectories, and then the slow return.',
  accent: PALETTE.magenta,
  count: COUNT,
  cardBudget: 8000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x0d15be5a))
    const { geometry, count } = makeCloud(COUNT, rng, {
      spread: [2, 2, 2],
      scale: [0.3, 1.05],
    })

    const uniforms = baseUniforms(ctx, PALETTE.magenta)
    uniforms.uSize!.value = 2.4
    uniforms.uBurst = { value: 1 }

    const material = particleMaterial(VERTEX, uniforms)
    const points = pointsFrom(geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: PALETTE.magenta,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.016, 6, 128), ringMaterial)
    scene.add(ring)

    const camera = makeCamera(10.4)
    camera.lookAt(0, 0, 0)

    let burst = 1
    let wasDown = false

    return {
      scene,
      camera,
      particleCount: count,
      update(dt, elapsed, pointer) {
        if (pointer.down && !wasDown) burst = 1
        wasDown = pointer.down
        burst = Math.max(0, burst - dt * BURST_DECAY)

        uniforms.uTime!.value = elapsed
        uniforms.uBurst!.value = burst
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const impulse = Math.sin(burst * Math.PI)
        ring.scale.setScalar(1 + impulse * 8.5)
        ringMaterial.opacity = impulse * 0.55
        ring.rotation.z = elapsed * 0.12

        const orbit = elapsed * 0.05
        camera.position.x = Math.sin(orbit) * 1.6 + pointer.x * 0.5
        camera.position.y = Math.cos(orbit * 0.8) * 0.7 + 0.3 - pointer.y * 0.4
        camera.position.z = 10.4 - Math.cos(orbit * 0.6) * 0.3
        camera.lookAt(0, 0, 0)
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
