import * as THREE from 'three'
import type { EffectRuntime } from './types'

export interface SlotRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * One WebGL context for the whole page. Gallery cards are drawn into DOM
 * rectangles with scissor/viewport so twelve effects never cost twelve contexts.
 */
export class StageRenderer {
  readonly renderer: THREE.WebGLRenderer
  private width = 1
  private height = 1

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.autoClear = false
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width))
    this.height = Math.max(1, Math.floor(height))
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.renderer.setSize(this.width, this.height, false)
  }

  /** Clear the whole overlay to transparent so page chrome shows through. */
  beginFrame(): void {
    const r = this.renderer
    r.setScissorTest(false)
    r.setViewport(0, 0, this.width, this.height)
    r.setClearColor(0x000000, 0)
    r.clear(true, true, true)
  }

  /** Draw one runtime into a viewport-coordinate rectangle. */
  drawSlot(rect: SlotRect, runtime: EffectRuntime, clear = 0x07070a): void {
    const x = Math.max(0, Math.round(rect.left))
    const y = Math.max(0, Math.round(this.height - (rect.top + rect.height)))
    const w = Math.min(Math.round(rect.width), this.width - x)
    const h = Math.min(Math.round(rect.height), this.height - y)
    if (w < 4 || h < 4) return

    const r = this.renderer
    r.setScissorTest(true)
    r.setViewport(x, y, w, h)
    r.setScissor(x, y, w, h)
    r.setClearColor(clear, 1)
    r.clear(true, true, true)
    r.render(runtime.scene, runtime.camera)
  }

  /** Full-bleed draw, used by focus mode before the bloom composite. */
  prepareFull(clear = 0x000000): void {
    const r = this.renderer
    r.setScissorTest(false)
    r.setViewport(0, 0, this.width, this.height)
    r.setClearColor(clear, 1)
    r.clear(true, true, true)
  }

  drawFull(runtime: EffectRuntime, clear = 0x050506): void {
    this.prepareFull(clear)
    this.renderer.render(runtime.scene, runtime.camera)
  }

  capture(): string {
    return this.renderer.domElement.toDataURL('image/png')
  }

  dispose(): void {
    this.renderer.dispose()
  }
}
