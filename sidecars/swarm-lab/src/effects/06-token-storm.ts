import * as THREE from 'three'
import { hashSeed, mulberry32 } from '../engine/rng'
import {
  applyViewport,
  baseUniforms,
  disposeScene,
  makeCamera,
  makeCloud,
  makeSegments,
  particleMaterial,
  pointsFrom,
  wireMesh,
  NOISE_GLSL,
  PARTICLE_HEADER,
  RADIAL_MASK_GLSL,
} from '../engine/particles'
import { PALETTE } from '../engine/palette'
import type { EffectDefinition, EffectRuntime } from '../engine/types'

const COUNT = 40000
/** Camera parallax, kept low here: the storm is dense and reads as slosh at higher gains. */
const PARALLAX_X = 0.06
const PARALLAX_Y = 0.035

const VERTEX = /* glsl */ `
${PARTICLE_HEADER}
${NOISE_GLSL}
void main() {
  vec3 p = position;

  vec3 flow = flowNoise(p * 0.135 + vec3(0.0, uTime * 0.05, uTime * 0.022));
  p += flow * (2.1 + aSeed.y * 1.5);

  float angle = uTime * 0.06 + aSeed.x * 0.9;
  float c = cos(angle);
  float s = sin(angle);
  p.xz = mat2(c, -s, s, c) * p.xz;

  // Cursor influence is deliberately tiny; the eased uniform arrives already smoothed.
  // Kept far below the other worlds so forty thousand points do not drag as one sheet.
  p.xy += uPointer * (0.07 + aSeed.z * 0.08);
  p.y += sin(uTime * 0.55 + aSeed.w * 6.2831) * 0.28;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = softSize(mv.z) * (0.55 + aSeed.w * 1.15);

  float depthFade = smoothstep(-26.0, -3.0, mv.z);
  vAlpha = depthFade * (0.28 + aSeed.y * 0.82);
  vMix = aSeed.z;
}
`

const FRAGMENT = /* glsl */ `
${RADIAL_MASK_GLSL}
uniform vec3 uAccent;
uniform vec3 uEmber;
uniform float uOpacity;
varying float vAlpha;
varying float vMix;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = radialMask(d);
  float glow = pow(core, 2.15);
  vec3 col = mix(uEmber, uAccent, vMix);
  col = mix(col, vec3(1.0), pow(core, 6.0) * 0.85);
  gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
}
`

interface NodeSpec {
  position: [number, number, number]
  geometry: THREE.BufferGeometry
  spin: number
}

export const effect: EffectDefinition = {
  number: 6,
  id: 'token-storm',
  name: 'THE TOKEN STORM',
  category: 'flow field',
  blurb: 'Forty thousand tokens moving as weather. The wireframes are where the work happens.',
  accent: PALETTE.amber,
  count: COUNT,
  cardBudget: 8000,
  create(ctx): EffectRuntime {
    const rng = mulberry32(hashSeed(ctx.seed ^ 0x06f1a6))

    const { geometry, count } = makeCloud(COUNT, rng, {
      spread: [17, 7.5, 11],
      scale: [0.45, 1.45],
      centre: [0, 0, 0],
    })

    const uniforms = baseUniforms(ctx, PALETTE.amber)
    uniforms.uSize!.value = 2.15
    uniforms.uEmber = { value: new THREE.Color(PALETTE.ember) }

    const material = particleMaterial(VERTEX, uniforms, FRAGMENT)
    const points = pointsFrom(geometry, material)

    const scene = new THREE.Scene()
    scene.add(points)

    const nodes: NodeSpec[] = [
      { position: [-3.7, 0.85, 1.1], geometry: new THREE.IcosahedronGeometry(1.05, 0), spin: 0.18 },
      { position: [3.05, 0.35, 0.1], geometry: new THREE.OctahedronGeometry(0.95, 0), spin: -0.24 },
      { position: [0.55, 1.95, -1.5], geometry: new THREE.BoxGeometry(1.15, 1.15, 1.15), spin: 0.12 },
      { position: [-1.35, -1.5, 0.55], geometry: new THREE.DodecahedronGeometry(0.82, 0), spin: 0.3 },
      { position: [3.35, -1.25, 1.5], geometry: new THREE.TorusGeometry(0.72, 0.045, 5, 28), spin: -0.16 },
    ]

    const wireframes: THREE.LineSegments[] = []
    const cores: THREE.Mesh[] = []
    for (const node of nodes) {
      const wire = wireMesh(node.geometry, node.position[1] > 0 ? PALETTE.amber : PALETTE.ember, 0.5)
      wire.position.set(...node.position)
      scene.add(wire)
      wireframes.push(wire)

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 10),
        new THREE.MeshBasicMaterial({
          color: PALETTE.amber,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      core.position.set(...node.position)
      scene.add(core)
      cores.push(core)
    }

    // Faint links between nodes, like the screenshot's traced connections.
    const linkVertices: number[] = []
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]!.position
      const b = nodes[(i + 2) % nodes.length]!.position
      linkVertices.push(a[0], a[1], a[2], b[0], b[1], b[2])
    }
    const links = makeSegments(new Float32Array(linkVertices), PALETTE.ember, 0.22)
    scene.add(links)

    const camera = makeCamera(10.2)
    camera.position.y = 0.35
    camera.lookAt(0, 0.1, 0)

    return {
      scene,
      camera,
      particleCount: count,
      update(_dt, elapsed, pointer) {
        uniforms.uTime!.value = elapsed
        ;(uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)

        nodes.forEach((node, i) => {
          const wire = wireframes[i]!
          wire.rotation.x = elapsed * node.spin * 0.7
          wire.rotation.y = elapsed * node.spin
          wire.rotation.z = elapsed * node.spin * 0.35
        })

        const sway = elapsed * 0.05
        camera.position.x = Math.sin(sway) * 1.15 + pointer.x * PARALLAX_X
        camera.position.y = 0.35 + Math.cos(sway * 0.8) * 0.32 - pointer.y * PARALLAX_Y
        camera.position.z = 10.2 - Math.cos(sway * 0.6) * 0.4
        camera.lookAt(0, 0.1, 0)
      },
      resize(width, height) {
        applyViewport(camera, uniforms, ctx.pixelRatio, width, height)
      },
      setBudget(n) {
        geometry.setDrawRange(0, Math.max(0, Math.min(n, count)))
      },
      dispose() {
        disposeScene(scene)
        nodes.forEach((node) => node.geometry.dispose())
      },
    }
  },
}
