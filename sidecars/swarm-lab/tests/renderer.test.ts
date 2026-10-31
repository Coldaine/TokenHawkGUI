import { describe, expect, it } from 'vitest'
import { slotClip, StageRenderer, type SlotRect } from '../src/engine/Renderer'
import type { EffectRuntime } from '../src/engine/types'

const WIDTH = 800
const HEIGHT = 600

function clip(rect: SlotRect) {
  return slotClip(rect, WIDTH, HEIGHT)
}

describe('slotClip', () => {
  it('gives a fully visible card one viewport and matching scissor', () => {
    expect(clip({ left: 100, top: 80, width: 300, height: 200 })).toEqual({
      viewport: { x: 100, y: 320, width: 300, height: 200 },
      scissor: { x: 100, y: 320, width: 300, height: 200 },
    })
  })

  it('keeps the full-card viewport when the card hangs off the left edge', () => {
    expect(clip({ left: -40, top: 80, width: 300, height: 200 })).toEqual({
      viewport: { x: -40, y: 320, width: 300, height: 200 },
      scissor: { x: 0, y: 320, width: 260, height: 200 },
    })
  })

  it('clips cards scrolled above the canvas without shrinking the viewport', () => {
    expect(clip({ left: 100, top: -50, width: 300, height: 200 })).toEqual({
      viewport: { x: 100, y: 450, width: 300, height: 200 },
      scissor: { x: 100, y: 450, width: 300, height: 150 },
    })
  })

  it('clips cards straddling the bottom edge to the visible rows', () => {
    expect(clip({ left: 100, top: 500, width: 300, height: 200 })).toEqual({
      viewport: { x: 100, y: -100, width: 300, height: 200 },
      scissor: { x: 100, y: 0, width: 300, height: 100 },
    })
  })

  it('clips a card straddling two edges to its visible corner', () => {
    expect(clip({ left: -40, top: -30, width: 300, height: 200 })).toEqual({
      viewport: { x: -40, y: 430, width: 300, height: 200 },
      scissor: { x: 0, y: 430, width: 260, height: 170 },
    })
  })

  it('trims cards wider or taller than the canvas to the canvas', () => {
    expect(clip({ left: -100, top: -100, width: 1200, height: 900 })).toEqual({
      viewport: { x: -100, y: -200, width: 1200, height: 900 },
      scissor: { x: 0, y: 0, width: 800, height: 600 },
    })
  })

  it('rounds once so the viewport and scissor share edges', () => {
    expect(clip({ left: 10.4, top: 20.6, width: 100.2, height: 50.2 })).toEqual({
      viewport: { x: 10, y: 529, width: 101, height: 50 },
      scissor: { x: 10, y: 529, width: 101, height: 50 },
    })
  })

  it('returns no scissor when no part of the card is on screen', () => {
    expect(clip({ left: 800, top: 100, width: 300, height: 200 }).scissor).toBeNull()
    expect(clip({ left: -400, top: 100, width: 300, height: 200 }).scissor).toBeNull()
    expect(clip({ left: 100, top: -300, width: 300, height: 200 }).scissor).toBeNull()
    expect(clip({ left: 100, top: 700, width: 300, height: 200 }).scissor).toBeNull()
  })

  it('returns no scissor for a collapsed card', () => {
    expect(clip({ left: 100, top: 100, width: 0, height: 200 }).scissor).toBeNull()
    expect(clip({ left: 100, top: 100, width: 200, height: 0 }).scissor).toBeNull()
  })

  it('sets the full card as viewport and only clips the scissor', () => {
    const calls: Array<[string, ...number[]]> = []
    const renderer = {
      setScissorTest() {},
      setViewport(...args: number[]) {
        calls.push(['viewport', ...args])
      },
      setScissor(...args: number[]) {
        calls.push(['scissor', ...args])
      },
      setClearColor() {},
      clear() {},
      render() {
        calls.push(['render'])
      },
    }
    const stage = { width: WIDTH, height: HEIGHT, renderer } as unknown as StageRenderer

    StageRenderer.prototype.drawSlot.call(
      stage,
      { left: -40, top: -30, width: 300, height: 200 },
      {} as EffectRuntime,
    )

    expect(calls).toEqual([
      ['viewport', -40, 430, 300, 200],
      ['scissor', 0, 430, 260, 170],
      ['render'],
    ])
  })

  it('skips drawing when no part of the card is visible', () => {
    const calls: string[] = []
    const renderer = {
      setScissorTest() {},
      setViewport() {
        calls.push('viewport')
      },
      setScissor() {
        calls.push('scissor')
      },
      setClearColor() {},
      clear() {},
      render() {
        calls.push('render')
      },
    }
    const stage = { width: WIDTH, height: HEIGHT, renderer } as unknown as StageRenderer

    StageRenderer.prototype.drawSlot.call(
      stage,
      { left: 100, top: 900, width: 300, height: 200 },
      {} as EffectRuntime,
    )

    expect(calls).toEqual([])
  })

  it('treats a card exactly matching the canvas as fully visible', () => {
    expect(clip({ left: 0, top: 0, width: WIDTH, height: HEIGHT })).toEqual({
      viewport: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      scissor: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    })
  })
})
