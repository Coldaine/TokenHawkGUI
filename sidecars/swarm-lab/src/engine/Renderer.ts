import * as THREE from 'three'
import type { EffectRuntime } from './types'

export interface SlotRect {
  left: number
  top: number
  width: number
  height: number
}

export interface SlotBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SlotClip {
  /** The whole card in GL coordinates. It may sit outside the canvas. */
  viewport: SlotBox
  /** The on-screen part of that card, or null when none of it is visible. */
  scissor: SlotBox | null
}

/**
 * Project a DOM card rectangle onto the canvas. The viewport keeps the full
 * card so the scene stays aligned with it; only the scissor is trimmed to the
 * visible edges, which is what clips cards at the top/bottom/left/right.
 */
export function slotClip(rect: SlotRect, width: number, height: number): SlotClip {
  const left = Math.round(rect.left)
  const right = Math.round(rect.left + rect.width)
  const top = Math.round(rect.top)
  const bottom = Math.round(rect.top + rect.height)

  const viewport: SlotBox = {
    x: left,
    y: height - bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }

  const x0 = Math.max(0, viewport.x)
  const y0 = Math.max(0, viewport.y)
  const x1 = Math.min(width, viewport.x + viewport.width)
  const y1 = Math.min(height, viewport.y + viewport.height)
  const scissor = x1 > x0 && y1 > y0 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : null

  return { viewport, scissor }
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

  /** Draw one runtime into a DOM card rectangle, clipped to the canvas. */
  drawSlot(rect: SlotRect, runtime: EffectRuntime, clear = 0x07070a): void {
    const { viewport, scissor } = slotClip(rect, this.width, this.height)
    if (!scissor || scissor.width < 4 || scissor.height < 4) return

    const r = this.renderer
    r.setScissorTest(true)
    r.setViewport(viewport.x, viewport.y, viewport.width, viewport.height)
    r.setScissor(scissor.x, scissor.y, scissor.width, scissor.height)
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
