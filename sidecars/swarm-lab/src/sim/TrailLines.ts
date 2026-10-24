import * as THREE from 'three'

/**
 * Position-history trails for the CPU agent worlds. Each agent contributes a
 * short ribbon of line segments that fades toward the tail.
 */
export class TrailLines {
  readonly line: THREE.LineSegments
  private readonly count: number
  private readonly segments: number
  private readonly history: Float32Array
  private readonly vertices: Float32Array
  private readonly fades: Float32Array
  private readonly material: THREE.ShaderMaterial

  constructor(count: number, segments = 8, color: THREE.ColorRepresentation = '#3fe0c0', opacity = 0.4) {
    this.count = count
    this.segments = Math.max(2, segments)
    const pairs = this.count * (this.segments - 1) * 2
    this.history = new Float32Array(this.count * this.segments * 3)
    this.vertices = new Float32Array(pairs * 3)
    this.fades = new Float32Array(pairs)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3))
    geometry.setAttribute('aFade', new THREE.BufferAttribute(this.fades, 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      },
      vertexShader: /* glsl */ `
        attribute float aFade;
        varying float vFade;
        void main() {
          vFade = aFade;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vFade;
        void main() {
          gl_FragColor = vec4(uColor, vFade * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    this.line = new THREE.LineSegments(geometry, this.material)
    this.line.frustumCulled = false
  }

  update(positions: Float32Array): void {
    const { count, segments, history, vertices, fades } = this
    for (let i = 0; i < count; i++) {
      const base = i * segments * 3
      for (let s = segments - 1; s > 0; s--) {
        const dst = base + s * 3
        const src = base + (s - 1) * 3
        history[dst] = history[src]!
        history[dst + 1] = history[src + 1]!
        history[dst + 2] = history[src + 2]!
      }
      history[base] = positions[i * 3]!
      history[base + 1] = positions[i * 3 + 1]!
      history[base + 2] = positions[i * 3 + 2]!
    }

    let v = 0
    let f = 0
    for (let i = 0; i < count; i++) {
      const base = i * segments * 3
      for (let s = 0; s < segments - 1; s++) {
        const a = base + s * 3
        const b = base + (s + 1) * 3
        vertices[v++] = history[a]!
        vertices[v++] = history[a + 1]!
        vertices[v++] = history[a + 2]!
        vertices[v++] = history[b]!
        vertices[v++] = history[b + 1]!
        vertices[v++] = history[b + 2]!

        const head = 1 - s / (segments - 1)
        const tail = 1 - (s + 1) / (segments - 1)
        fades[f++] = head
        fades[f++] = tail
      }
    }

    const geometry = this.line.geometry
    geometry.attributes.position!.needsUpdate = true
    geometry.attributes.aFade!.needsUpdate = true
  }

  dispose(): void {
    this.line.geometry.dispose()
    this.material.dispose()
  }
}
