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
  RADIAL_MASK_GLSL,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 50000

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
${NOISE_GLSL}
void main() {
  // Re-shape the seeded box cloud into a spiral funnel.
  vec3 base = position;
  float angle0 = atan(base.z, base.x) + aSeed.y * 6.2831;

  float life = fract(aSeed.x + uTime * 0.042 + aSeed.w * 0.15);
  float radius = mix(7.4, 0.28, pow(life, 0.85));
  float angle = angle0 + uTime * (1.15 / (0.7 + radius)) + life * 2.6;

  float x = cos(angle) * radius;
  float z = sin(angle) * radius;

  float floorY = -1.75 + radius * 0.17;
  float lift = pow(life, 2.4) * 2.9;
  vec3 f = flowNoise(vec3(x * 0.16, uTime * 0.1 + life * 0.4, z * 0.16));

  vec3 p = vec3(x, floorY + lift, z) + vec3(f.x, 0.0, f.z) * (0.45 + life * 1.1);
  p.y += f.y * 0.35;

  float centreFade = smoothstep(0.05, 1.35, radius);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.55 + aSeed.w * 0.9) * (0.55 + centreFade * 0.45);

  float depthFade = smoothstep(-30.0, -2.0, mv.z);
  vAlpha = depthFade * (0.16 + aSeed.y * 0.7) * centreFade;
  vMix = aSeed.z;
}
`

const FRAGMENT = /* glsl */ `
${RADIAL_MASK_GLSL}
uniform vec3 uAccent;
uniform vec3 uHot;
uniform float uOpacity;
varying float vAlpha;
varying float vMix;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = radialMask(d);
  float glow = pow(core, 2.2);
  vec3 col = mix(uAccent, uHot, vMix * 0.85);
  col = mix(col, vec3(1.0), pow(core, 7.0) * 0.7);
  gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
}
`

const ORBIT_RADIUS = 10.8
const TILT = 0.62

export const effect: EffectDefinition = {
  number: 11,
  id: 'cauldron',
  name: 'THE CAULDRON',
  category: 'vortex / buoyancy',
  blurb: 'A whirlpool of embers feeding a drain that is not visible.',
  accent: PALETTE.ember,
  count: COUNT,
  cardBudget: 8000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x0caa1d40))
    const { geometry, count } = makeCloud(COUNT, rng, {
      spread: [18, 6, 18],
      scale: [0.35, 1.1],
    })

    const uniforms = baseUniforms(ctx, PALETTE.ember)
    uniforms.uSize!.value = 2.3
    uniforms.uHot = { value: new THREE.Color(PALETTE.amber) }

    const material = particleMaterial(VERTEX, uniforms, FRAGMENT)
    const points = pointsFrom(geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const camera = makeCamera(ORBIT_RADIUS)
    camera.position.set(0, Math.sin(TILT) * ORBIT_RADIUS, Math.cos(TILT) * ORBIT_RADIUS)
    camera.lookAt(0, -0.2, 0)

    return {
      scene,
      camera,
      particleCount: count,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const orbit = elapsed * 0.06
        const horizontal = Math.cos(TILT) * ORBIT_RADIUS
        camera.position.x = Math.sin(orbit) * horizontal + pointer.x * 0.6
        camera.position.y = Math.sin(TILT) * ORBIT_RADIUS + 0.4 - pointer.y * 0.4
        camera.position.z = Math.cos(orbit) * horizontal
        camera.lookAt(0, -0.2, 0)
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
