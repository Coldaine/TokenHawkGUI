import * as THREE from 'three'
import type { RNG } from './rng'
import type { EffectContext } from './types'
import { NOISE_GLSL } from './noise.glsl'

/**
 * Uniforms every world shares. Effects add their own on top of these.
 */
export function baseUniforms(ctx: EffectContext, accent = '#ffb342'): Record<string, THREE.IUniform> {
  return {
    uTime: { value: 0 },
    uPixelRatio: { value: ctx.pixelRatio },
    uSize: { value: 1.8 },
    uOpacity: { value: 1 },
    uAccent: { value: new THREE.Color(accent) },
    uSeed: { value: (ctx.seed % 997) / 997 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uDrift: { value: 1 },
  }
}

/**
 * Declarations for a particle vertex shader. Point size is scaled so full-bleed
 * focus mode and small gallery cards keep a consistent apparent dust size.
 */
export const PARTICLE_HEADER = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uOpacity;
uniform vec3 uAccent;
uniform float uSeed;
uniform vec2 uPointer;
attribute vec4 aSeed;
attribute float aScale;

varying float vAlpha;
varying float vMix;

float softSize(float viewZ) {
  return uSize * aScale * uPixelRatio * (20.0 / max(0.4, -viewZ));
}
`

/**
 * Round-sprite falloff shared by every glowing point. GLSL leaves smoothstep
 * undefined when its edges descend; the earlier falloff passed the centre
 * radius then zero, which rendered as hard-edged dots on some drivers.
 */
export const RADIAL_MASK_GLSL = /* glsl */ `
float radialMask(float dist) {
  return 1.0 - smoothstep(0.0, 0.5, dist);
}
`

/** Soft additive dot with a white-hot core. */
export const GLOW_FRAGMENT = /* glsl */ `
${RADIAL_MASK_GLSL}
uniform vec3 uAccent;
uniform float uOpacity;
varying float vAlpha;
varying float vMix;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = radialMask(d);
  float glow = pow(core, 2.35);
  vec3 col = mix(uAccent, vec3(1.0), pow(core, 7.0) * vMix);
  gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
}
`

export interface CloudOptions {
  /** Full extents of the random cloud; positions run from -spread/2 to +spread/2. */
  spread?: [number, number, number]
  /** Per-particle size multiplier range. */
  scale?: [number, number]
  /** Optional centre offset. */
  centre?: [number, number, number]
}

export interface Cloud {
  geometry: THREE.BufferGeometry
  count: number
}

export function makeCloud(count: number, rng: RNG, opts: CloudOptions = {}): Cloud {
  const [sx, sy, sz] = opts.spread ?? [1, 1, 1]
  const [smin, smax] = opts.scale ?? [0.4, 1]
  const [cx, cy, cz] = opts.centre ?? [0, 0, 0]

  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count * 4)
  const scales = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = cx + (rng() - 0.5) * sx
    positions[i * 3 + 1] = cy + (rng() - 0.5) * sy
    positions[i * 3 + 2] = cz + (rng() - 0.5) * sz

    seeds[i * 4] = rng()
    seeds[i * 4 + 1] = rng()
    seeds[i * 4 + 2] = rng()
    seeds[i * 4 + 3] = rng()

    scales[i] = smin + rng() * (smax - smin)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)

  return { geometry, count }
}

/** Attach a geometry that displaces beyond its bounds. */
export function pointsFrom(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Points {
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return points
}

export function particleMaterial(
  vertexShader: string,
  uniforms: Record<string, THREE.IUniform>,
  fragmentShader: string = GLOW_FRAGMENT,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
}

/** Wireframe line copy of any geometry, additive. Edges only: no triangle diagonals. */
export function wireMesh(
  geometry: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  opacity = 0.45,
): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(geometry, 12)
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const lines = new THREE.LineSegments(edges, material)
  lines.frustumCulled = false
  return lines
}

/** Build line segments from a flat list of point pairs. */
export function makeSegments(
  vertices: Float32Array,
  color: THREE.ColorRepresentation,
  opacity = 0.3,
): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const lines = new THREE.LineSegments(geometry, material)
  lines.frustumCulled = false
  return lines
}

/** Thin additive plane used for light shafts. */
export function lightShaft(
  width: number,
  height: number,
  color: THREE.ColorRepresentation,
  opacity = 0.22,
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, height)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geometry, material)
}

/** Soft radial glow sprite, used for the hot cores. */
export function softOrb(color: THREE.ColorRepresentation, size: number, opacity = 0.9): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.16, 'rgba(255,255,255,0.86)')
  gradient.addColorStop(0.38, 'rgba(255,255,255,0.3)')
  gradient.addColorStop(0.68, 'rgba(255,255,255,0.08)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.setScalar(size)
  return sprite
}

/** Standard camera used by every world. */
export function makeCamera(distance = 9): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 200)
  camera.position.set(0, 0, distance)
  camera.lookAt(0, 0, 0)
  return camera
}

/** Resize bookkeeping shared by every runtime: camera aspect + point scale. */
export function applyViewport(
  camera: THREE.PerspectiveCamera,
  uniforms: Record<string, THREE.IUniform>,
  pixelRatio: number,
  width: number,
  height: number,
): void {
  camera.aspect = width / Math.max(1, height)
  camera.updateProjectionMatrix()
  const scale = Math.min(1, Math.max(0.5, height / 900))
  const pr = uniforms.uPixelRatio
  if (pr) pr.value = pixelRatio * scale
}

/** Common disposal for a whole scene. */
export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    const disposeMaterial = (m: THREE.Material): void => {
      const mapped = m as THREE.Material & { map?: THREE.Texture | null }
      mapped.map?.dispose()
      m.dispose()
    }
    if (Array.isArray(material)) material.forEach(disposeMaterial)
    else if (material) disposeMaterial(material)
  })
}

export { NOISE_GLSL }
