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
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 26000
const CENTRE_X = 0.6
const CENTRE_Z = -1.2
const FLOOR_Y = -2.2

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
${NOISE_GLSL}
void main() {
  vec3 p = position;

  vec3 flow = flowNoise(vec3(p.x * 0.17, p.z * 0.17, uTime * 0.06 + aSeed.x * 3.0));
  p.xz += flow.xz * (0.55 + aSeed.y * 0.9);

  // Everything drifts toward the tower, swirling as it goes.
  vec2 rel = p.xz - vec2(${CENTRE_X.toFixed(2)}, ${CENTRE_Z.toFixed(2)});
  float angle = atan(rel.y, rel.x) + uTime * (0.05 + aSeed.z * 0.12);
  float radius = length(rel);
  radius = mix(radius, 0.3, 0.1 + aSeed.y * 0.1);
  p.xz = vec2(cos(angle), sin(angle)) * radius + vec2(${CENTRE_X.toFixed(2)}, ${CENTRE_Z.toFixed(2)});

  p.y += sin(uTime * 0.8 + aSeed.w * 6.2831) * 0.12;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.5 + aSeed.w * 1.0);

  float depthFade = smoothstep(-24.0, -2.0, mv.z);
  vAlpha = depthFade * (0.16 + aSeed.y * 0.8);
  vMix = aSeed.z * 0.7;
}
`

function buildGrid(): THREE.BufferGeometry {
  const half = 10
  const divisions = 12
  const step = (half * 2) / divisions
  const vertices: number[] = []
  for (let i = 0; i <= divisions; i++) {
    const v = -half + i * step
    vertices.push(-half, 0, v, half, 0, v)
    vertices.push(v, 0, -half, v, 0, half)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  return geometry
}

export const effect: EffectDefinition = {
  number: 3,
  id: 'moosegoose-world',
  name: 'MOOSE.GOOSE WORLD',
  category: 'grid / traffic',
  blurb: 'A green plane of traffic. Everything on it is trying to reach the tower.',
  accent: PALETTE.green,
  count: COUNT,
  cardBudget: 6000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x03a0c0de))

    const { geometry, count } = makeCloud(COUNT, rng, {
      spread: [19, 1.1, 19],
      scale: [0.3, 1.05],
      centre: [0, FLOOR_Y + 0.55, 0],
    })

    const uniforms = baseUniforms(ctx, PALETTE.green)
    uniforms.uSize!.value = 1.35

    const material = particleMaterial(VERTEX, uniforms)
    const points = pointsFrom(geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const grid = new THREE.LineSegments(
      buildGrid(),
      new THREE.LineBasicMaterial({
        color: PALETTE.green,
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    grid.position.y = FLOOR_Y
    grid.frustumCulled = false
    scene.add(grid)

    const tower = wireMesh(new THREE.BoxGeometry(1.0, 5.4, 1.0), PALETTE.green, 0.4)
    tower.position.set(CENTRE_X, FLOOR_Y + 2.7, CENTRE_Z)
    scene.add(tower)

    const crown = wireMesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), PALETTE.green, 0.55)
    crown.position.set(CENTRE_X, FLOOR_Y + 5.95, CENTRE_Z)
    scene.add(crown)

    const camera = makeCamera(10.6)
    camera.position.set(0, 0.9, 10.6)
    camera.lookAt(0.3, -0.9, -0.8)

    return {
      scene,
      camera,
      particleCount: count,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        const t = elapsed * 0.07
        camera.position.x = Math.sin(t) * 1.3 + pointer.x * 0.6
        camera.position.y = 0.9 + Math.cos(t * 0.7) * 0.25 - pointer.y * 0.2
        camera.position.z = 10.6 + Math.cos(t * 0.5) * 0.4
        camera.lookAt(0.3, -0.9, -0.8)

        crown.rotation.y = elapsed * 0.4
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
