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

const COUNT = 55000
const TUNNEL_DEPTH = 59
const FAR_EDGE = -60

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
void main() {
  vec3 p = position;

  float speed = 5.0 + aSeed.y * 15.0;
  float z = ${FAR_EDGE.toFixed(1)} + mod(p.z + ${Math.abs(FAR_EDGE).toFixed(1)} + uTime * speed, ${TUNNEL_DEPTH.toFixed(1)});
  p.z = z;

  // Slow barrel roll with distance, so the wall of streaks never feels flat.
  float spin = uTime * (0.03 + aSeed.z * 0.05) + z * 0.012;
  float c = cos(spin);
  float s = sin(spin);
  p.xy = mat2(c, -s, s, c) * p.xy * (1.0 + 0.0018 * (z - ${FAR_EDGE.toFixed(1)}));

  // Pointer tilts the tunnel axis.
  p.xy += uPointer * (0.6 + aSeed.w * 1.5) * (1.0 - smoothstep(-34.0, -4.0, z));

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float stretch = 0.45 + aSeed.y * 0.85 + speed * 0.045;
  gl_PointSize = min(softSize(mv.z) * stretch, 34.0);

  float farFade = smoothstep(-62.0, -32.0, mv.z);
  float nearFade = 1.0 - smoothstep(-7.0, -1.4, mv.z);
  vAlpha = farFade * nearFade * (0.24 + aSeed.x * 0.7);
  vMix = mix(0.15, 1.0, aSeed.z);
}
`

export const effect: EffectDefinition = {
  number: 5,
  id: 'computational-zoom',
  name: 'INFINITE COMPUTATIONAL ZOOM',
  category: 'tunnel / velocity',
  blurb: 'A tunnel of streaks with no end. The camera is falling forward.',
  accent: PALETTE.ice,
  count: COUNT,
  cardBudget: 8000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x05070e))

    const cloud = makeCloud(COUNT, rng, { spread: [1, 1, 1], scale: [0.3, 1.25] })
    const attributes = cloud.geometry.getAttribute('position')
    const positions = attributes.array as Float32Array

    // Reshape the random cloud into a long hollow cylinder around the view axis.
    for (let i = 0; i < COUNT; i++) {
      const radius = 0.7 + Math.pow(rng(), 0.7) * 5.3
      const angle = rng() * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.sin(angle) * radius
      positions[i * 3 + 2] = FAR_EDGE + rng() * TUNNEL_DEPTH
    }
    attributes.needsUpdate = true

    const uniforms = baseUniforms(ctx, PALETTE.ice)
    uniforms.uSize!.value = 1.9

    const material = particleMaterial(VERTEX, uniforms)
    const points = pointsFrom(cloud.geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const camera = makeCamera(1)
    camera.fov = 68
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateProjectionMatrix()

    return {
      scene,
      camera,
      particleCount: cloud.count,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        camera.lookAt(pointer.x * 0.9, pointer.y * 0.5, -1)
        camera.rotateZ(Math.sin(elapsed * 0.07) * 0.12)
      },
      resize(width, height) {
        applyViewport(camera, uniforms, ctx.pixelRatio, width, height)
      },
      setBudget(n) {
        cloud.geometry.setDrawRange(0, Math.max(0, Math.min(n, cloud.count)))
      },
      dispose() {
        disposeScene(scene)
      },
    }
  },
}
