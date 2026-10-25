// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const stage = vi.hoisted(() => ({ frames: 0, captures: 0 }))

vi.mock('../src/engine/Renderer', () => {
  class StageRenderer {
    renderer = { info: { render: { calls: 0, points: 0 } } }
    resize(): void {}
    beginFrame(): void {
      stage.frames += 1
    }
    drawSlot(): void {}
    drawFull(): void {}
    prepareFull(): void {}
    capture(): string {
      stage.captures += 1
      return 'data:image/png;base64,'
    }
    dispose(): void {}
  }
  return { StageRenderer }
})

vi.mock('../src/engine/post', () => ({
  createBloom: () => ({ setScene() {}, setSize() {}, render() {}, dispose() {} }),
}))

import { App } from '../src/app/App'

function setReducedMotion(reduced: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        matches: reduced && query.includes('reduced-motion'),
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  })
}

function build(): App {
  const canvas = document.querySelector<HTMLCanvasElement>('#gl')!
  const root = document.querySelector<HTMLElement>('#app')!
  return new App(canvas, root)
}

function pauseActive(): boolean {
  return document.querySelector<HTMLElement>('[data-act="pause"]')!.dataset.active === 'true'
}

function goTo(hash: string): void {
  window.location.hash = hash
  window.dispatchEvent(new Event('hashchange'))
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let app: App | null = null

beforeEach(() => {
  stage.frames = 0
  stage.captures = 0
  window.location.hash = ''
  // happy-dom has no 2D canvas; world 2 paints its glow sprite through one.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    createRadialGradient: () => ({ addColorStop() {} }),
    fillRect() {},
    fillStyle: '',
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext
  document.body.innerHTML = `
    <div id="stage"><canvas id="gl"></canvas></div>
    <div id="app"></div>
    <div id="live"></div>
  `
})

afterEach(() => {
  app?.destroy()
  app = null
  document.body.innerHTML = ''
})

describe('reduced motion', () => {
  it('starts frozen for reduced-motion visitors with one still frame on screen', async () => {
    setReducedMotion(true)
    app = build()
    await wait(90)

    expect(pauseActive()).toBe(true)
    expect(stage.frames).toBe(1)
  })

  it('runs normally when motion is not reduced', async () => {
    setReducedMotion(false)
    app = build()
    await wait(90)

    expect(pauseActive()).toBe(false)
    expect(stage.frames).toBeGreaterThan(1)
  })
})

describe('pause state across worlds', () => {
  it('keeps a reduced-motion visitor frozen after opening a world', async () => {
    setReducedMotion(true)
    app = build()
    await wait(60)
    expect(pauseActive()).toBe(true)

    goTo('#/world/6')
    await wait(60)

    expect(pauseActive()).toBe(true)
  })

  it('still shows the paused state after returning to the lab', async () => {
    setReducedMotion(false)
    app = build()
    await wait(50)
    goTo('#/world/3')
    await wait(60)

    document.querySelector<HTMLElement>('[data-act="pause"]')!.click()
    expect(pauseActive()).toBe(true)
    const before = stage.frames

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wait(90)

    expect(window.location.hash.startsWith('#/?')).toBe(true)
    expect(pauseActive()).toBe(true)
    expect(stage.frames).toBe(before + 1)
  })

  it('resumes motion when the visitor explicitly starts the tour', async () => {
    setReducedMotion(true)
    app = build()
    await wait(60)
    expect(pauseActive()).toBe(true)

    document.querySelector<HTMLElement>('[data-act="tour"]')!.click()
    await wait(80)

    expect(pauseActive()).toBe(false)
    expect(window.location.hash).toContain('#/world/')
  })

  it('keeps an explicit pause through a world change and paints exactly one extra frame', async () => {
    setReducedMotion(false)
    app = build()
    await wait(60)
    document.querySelector<HTMLElement>('[data-act="pause"]')!.click()

    expect(pauseActive()).toBe(true)
    await wait(40)
    const before = stage.frames

    goTo('#/world/3')
    await wait(90)

    expect(pauseActive()).toBe(true)
    expect(stage.frames).toBe(before + 1)
  })
})

describe('snapshot while frozen', () => {
  it('captures on demand without resuming the loop', async () => {
    setReducedMotion(false)
    app = build()
    await wait(50)

    document.querySelector<HTMLElement>('[data-act="pause"]')!.click()
    expect(pauseActive()).toBe(true)
    const frozen = stage.frames
    await wait(40)
    expect(stage.frames).toBe(frozen)

    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      document.querySelector<HTMLElement>('[data-act="snapshot"]')!.click()
      expect(stage.captures).toBe(1)
      expect(stage.frames).toBe(frozen + 1)
      expect(pauseActive()).toBe(true)
      expect(document.querySelector('#live')!.textContent).toContain('Snapshot saved as moosegoose-swarmlab-lab-')

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))
      expect(stage.captures).toBe(2)
      expect(stage.frames).toBe(frozen + 2)

      // The capture painted one frame; it did not put the loop back to work.
      await wait(90)
      expect(stage.frames).toBe(frozen + 2)
      expect(pauseActive()).toBe(true)
    } finally {
      anchorClick.mockRestore()
    }
  })
})

describe('keyboard ownership', () => {
  it('lets a focused card keep Enter instead of opening the selected card', async () => {
    setReducedMotion(false)
    app = build()
    await wait(40)

    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.card'))
    expect(cards).toHaveLength(12)
    const card = cards[4]!
    card.focus()
    expect(document.activeElement).toBe(card)

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(window.location.hash).toBe('')

    card.click()
    expect(window.location.hash).toContain('#/world/5')
  })

  it('moves focus with the selection so Enter opens the newly selected card', async () => {
    setReducedMotion(false)
    app = build()
    await wait(40)

    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.card'))
    cards[4]!.focus()
    cards[4]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(document.activeElement).toBe(cards[5])

    // A browser turns Enter on a focused button into a click; the app leaves that to the button.
    cards[5]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(window.location.hash).toBe('')
    cards[5]!.click()
    expect(window.location.hash).toContain('#/world/6')
  })

  it('uses the selected-card shortcut when focus is outside any control', async () => {
    setReducedMotion(false)
    app = build()
    await wait(40)

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(window.location.hash).toContain('#/world/1')
  })

  it('does not freeze motion when space activates a focused card', async () => {
    setReducedMotion(false)
    app = build()
    await wait(40)

    const card = document.querySelector<HTMLButtonElement>('.card')!
    card.focus()
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

    expect(pauseActive()).toBe(false)
  })
})
