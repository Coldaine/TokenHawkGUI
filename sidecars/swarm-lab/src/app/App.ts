import { EFFECTS, effectByIndex, effectByNumber } from '../data/effects'
import { Loop } from '../engine/Loop'
import { createBloom, type Bloom } from '../engine/post'
import { StageRenderer } from '../engine/Renderer'
import { randomSeed, seedHex } from '../engine/rng'
import type { EffectDefinition, EffectRuntime, PointerState } from '../engine/types'
import { renderFocus } from './Focus'
import { renderGallery, updateGalleryExplored, type CardHandle } from './Gallery'
import { footer, helpSheet, rail, startClock, topBar, type Mode } from './hud'
import { DEFAULT_SEED, parseRoute, routeHash } from './routes'

const VISITED_KEY = 'moosegoose.swarmlab.visited'
const TOUR_MS = 7000

export class App {
  private readonly stage: StageRenderer
  private readonly loop: Loop
  private readonly root: HTMLElement
  private readonly live: HTMLElement
  private readonly helpEl: HTMLElement
  private readonly stopClock: () => void

  private mode: Mode = 'gallery'
  private seed = DEFAULT_SEED
  private visited = new Set<number>()
  private current: EffectDefinition | null = null
  private runtimes = new Map<number, EffectRuntime>()
  private cards: CardHandle[] = []
  private visible = new Set<number>()
  private bloom: Bloom | null = null
  private pointer: PointerState = { x: 0, y: 0, down: false, active: false }
  private rawPointer: PointerState = { x: 0, y: 0, down: false, active: false }
  private selected = 0
  private rendered = false
  private snapshotWanted = false
  private tourActive = false
  private nextTourAt = 0
  private helpOpen = false
  private telemetryClock = 0
  private elapsed = 0
  private readonly reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor(canvas: HTMLCanvasElement, root: HTMLElement) {
    this.stage = new StageRenderer(canvas)
    this.root = root
    this.live = document.querySelector<HTMLElement>('#live') ?? document.body
    this.loop = new Loop((dt) => this.frame(dt))
    this.stopClock = startClock()

    document.body.insertAdjacentHTML('beforeend', helpSheet())
    this.helpEl = document.querySelector<HTMLElement>('#help')!

    this.loadVisited()
    this.stage.resize(window.innerWidth, window.innerHeight)

    window.addEventListener('resize', this.onResize)
    window.addEventListener('hashchange', this.onHashChange)
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
    document.addEventListener('click', this.onClick)

    this.applyRoute()
    this.loop.start()

    if (this.reduced) {
      window.setTimeout(() => {
        this.loop.setPaused(true)
        this.updatePauseUI()
        this.announce('Motion reduced. Press space to run the simulation.')
      }, 120)
    }
  }

  /* ------------------------------------------------------------------ routing */

  private onHashChange = (): void => {
    this.applyRoute()
  }

  private applyRoute(): void {
    const route = parseRoute(window.location.hash)
    const effect = route.world !== null ? effectByNumber(route.world) : null
    const seedChanged = route.seed !== this.seed

    this.seed = route.seed
    if (seedChanged) {
      this.disposeBloom()
      this.disposeRuntimes()
    }

    if (effect) {
      if (this.mode === 'focus' && this.current?.number === effect.number && !seedChanged) {
        this.updateChrome()
        return
      }
      this.showFocus(effect)
      return
    }

    if (this.mode === 'gallery' && !seedChanged && this.rendered) {
      this.updateChrome()
      return
    }
    this.showGallery()
  }

  private navigate(world: number | null, replace = false): void {
    const hash = routeHash(world, this.seed)
    if (window.location.hash === hash) {
      this.applyRoute()
      return
    }
    if (replace) {
      window.history.replaceState(null, '', hash)
      this.applyRoute()
      return
    }
    window.location.hash = hash
  }

  /* ------------------------------------------------------------------- views */

  private showGallery(): void {
    this.mode = 'gallery'
    this.current = null
    this.disposeBloom()
    this.visible.clear()
    this.cards = []

    this.root.innerHTML =
      topBar({ mode: 'gallery', seed: this.seed, explored: this.visited.size }) + rail('gallery')
    const view = renderGallery(EFFECTS, this.visited)
    this.root.appendChild(view.root)
    this.root.insertAdjacentHTML('beforeend', footer('gallery'))

    this.rendered = true
    this.cards = view.cards
    this.selected = Math.min(this.selected, Math.max(0, this.cards.length - 1))
    this.updateSelection()
    this.updateTourUI()
    this.updateChrome()
    this.announce('The lab. Twelve worlds. Use the arrow keys and enter.')
  }

  private showFocus(effect: EffectDefinition): void {
    this.mode = 'focus'
    this.current = effect
    this.visible.clear()
    this.cards = []

    this.rendered = true
    this.visited.add(effect.number)
    this.persistVisited()

    this.root.innerHTML =
      topBar({ mode: 'focus', seed: this.seed, explored: this.visited.size, world: effect }) + rail('focus')
    const view = renderFocus(effect)
    this.root.appendChild(view.root)
    this.root.insertAdjacentHTML('beforeend', footer('focus'))

    this.disposeBloom()
    const runtime = this.ensureRuntime(effect)
    this.bloom = createBloom(this.stage.renderer, window.innerWidth, window.innerHeight)
    this.bloom.setScene(runtime.scene, runtime.camera)

    this.loop.setPaused(false)
    this.updatePauseUI()
    this.updateTourUI()
    this.updateChrome()
    this.announce(`${effect.name}. World ${effect.number} of twelve.`)
  }

  /* ------------------------------------------------------------------ render */

  private frame(dt: number): void {
    this.elapsed += dt
    const elapsed = this.elapsed

    // One eased pointer for every world: camera parallax and shader offsets
    // trail the cursor instead of snapping to it.
    const ease = Math.min(1, dt * 3.2)
    this.pointer.x += (this.rawPointer.x - this.pointer.x) * ease
    this.pointer.y += (this.rawPointer.y - this.pointer.y) * ease
    this.pointer.down = this.rawPointer.down

    this.stage.beginFrame()

    if (this.mode === 'focus' && this.current) {
      const runtime = this.ensureRuntime(this.current)
      runtime.resize(window.innerWidth, window.innerHeight)
      runtime.setBudget(this.current.count)
      runtime.update(dt, elapsed, this.pointer)

      if (this.bloom) {
        this.bloom.setScene(runtime.scene, runtime.camera)
        this.stage.prepareFull()
        this.bloom.render()
      } else {
        this.stage.drawFull(runtime)
      }
    } else {
      for (const card of this.cards) {
        const rect = card.el.getBoundingClientRect()
        const near = rect.bottom > -180 && rect.top < window.innerHeight + 180
        if (near) this.visible.add(card.effect.number)
        else this.visible.delete(card.effect.number)
        if (!near || rect.right < 0 || rect.left > window.innerWidth) continue
        if (rect.width < 4 || rect.height < 4) continue

        const runtime = this.ensureRuntime(card.effect)
        runtime.resize(rect.width, rect.height)
        runtime.setBudget(card.effect.cardBudget)
        runtime.update(dt, elapsed, this.pointer)
        this.stage.drawSlot(
          { left: rect.left + 1, top: rect.top + 1, width: rect.width - 2, height: rect.height - 2 },
          runtime,
        )
      }
    }

    if (this.tourActive && this.elapsed >= this.nextTourAt) {
      this.nextTourAt = this.elapsed + TOUR_MS / 1000
      this.advance(1)
    }

    this.telemetryClock += dt
    if (this.telemetryClock >= 0.2) {
      this.telemetryClock = 0
      this.updateTelemetry()
    }

    if (this.snapshotWanted) {
      this.snapshotWanted = false
      this.capture()
    }
  }

  private ensureRuntime(effect: EffectDefinition): EffectRuntime {
    const existing = this.runtimes.get(effect.number)
    if (existing) return existing

    const runtime = effect.create({
      seed: this.seed,
      quality: this.mode === 'focus' ? 'focus' : 'card',
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      reducedMotion: this.reduced,
    })
    this.runtimes.set(effect.number, runtime)
    return runtime
  }

  /* -------------------------------------------------------------------- chrome */

  private updateChrome(): void {
    const seed = seedHex(this.seed)
    document.querySelectorAll<HTMLElement>('[data-seed]').forEach((el) => {
      el.textContent = seed
    })
    updateGalleryExplored(this.root, this.visited)
    this.updateTelemetry()
  }

  private updateTelemetry(): void {
    const fps = Math.round(this.loop.fps)
    const sim = this.loop.frameMs.toFixed(1)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5).toFixed(1)

    document.querySelectorAll<HTMLElement>('[data-fps]').forEach((el) => {
      el.innerHTML = `${fps}<small>FPS</small>`
    })
    document.querySelectorAll<HTMLElement>('[data-sim]').forEach((el) => {
      el.textContent = sim
    })
    document.querySelectorAll<HTMLElement>('[data-dpr]').forEach((el) => {
      el.textContent = dpr
    })

    const gallery = document.querySelector<HTMLElement>('[data-gallery-telemetry]')
    if (gallery) {
      gallery.textContent = `12 WORLDS · ${String(this.visible.size).padStart(2, '0')} LIVE · ${fps}FPS`
    }

    const focus = document.querySelector<HTMLElement>('[data-focus-telemetry]')
    if (focus && this.current) {
      focus.textContent = `PARTICLES ${String(this.current.count).padStart(6, '0')} · SIM ${sim}MS · ${fps}FPS`
    }
  }

  private updateSelection(): void {
    this.cards.forEach((card, index) => {
      card.el.dataset.selected = String(index === this.selected)
    })
  }

  private updatePauseUI(): void {
    const paused = this.loop.isPaused
    document.querySelectorAll<HTMLElement>('[data-act="pause"]').forEach((el) => {
      el.dataset.active = String(paused)
      el.innerHTML = paused ? '&#9654;' : '&#10074;&#10074;'
    })
    document.querySelector('.focus')?.classList.toggle('is-paused', paused)
  }

  /* ------------------------------------------------------------------ actions */

  private open(number: number): void {
    this.stopTour()
    this.navigate(number)
  }

  private step(delta: number): void {
    this.stopTour()
    this.advance(delta)
  }

  /** Move between worlds without cancelling an active tour. */
  private advance(delta: number): void {
    if (this.mode === 'focus' && this.current) {
      const index = EFFECTS.findIndex((effect) => effect.number === this.current?.number)
      this.navigate(effectByIndex(index + delta).number)
      return
    }
    const card = this.cards[this.selected]
    const base = card ? EFFECTS.findIndex((effect) => effect.number === card.effect.number) : 0
    this.navigate(effectByIndex(base + delta).number)
  }

  private moveSelection(delta: number): void {
    if (this.cards.length === 0) return
    this.selected = (this.selected + delta + this.cards.length) % this.cards.length
    this.updateSelection()
    this.cards[this.selected]?.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  private reseed(): void {
    this.stopTour()
    this.seed = randomSeed()
    const world = this.mode === 'focus' ? this.current?.number ?? null : null
    window.history.replaceState(null, '', routeHash(world, this.seed))
    this.disposeBloom()
    this.disposeRuntimes()
    if (this.current) this.showFocus(this.current)
    else this.showGallery()
    this.announce(`Reseeded to ${seedHex(this.seed)}.`)
  }

  private togglePause(): void {
    this.loop.setPaused(!this.loop.isPaused)
    this.updatePauseUI()
    this.announce(this.loop.isPaused ? 'Motion frozen.' : 'Motion running.')
  }

  private toggleTour(): void {
    if (this.tourActive) {
      this.stopTour()
      this.announce('Tour stopped.')
      return
    }
    this.tourActive = true
    this.nextTourAt = this.elapsed + TOUR_MS / 1000
    this.updateTourUI()
    if (this.mode === 'gallery') this.advance(1)
    this.announce('Auto tour started. Any key stops it.')
  }

  private stopTour(): void {
    this.tourActive = false
    this.updateTourUI()
  }

  private updateTourUI(): void {
    document.querySelectorAll<HTMLElement>('[data-act="tour"]').forEach((el) => {
      el.dataset.active = String(this.tourActive)
    })
  }

  private toggleHelp(force?: boolean): void {
    this.helpOpen = force ?? !this.helpOpen
    this.helpEl.hidden = !this.helpOpen
    if (this.helpOpen) this.stopTour()
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        this.announce('Fullscreen is not available here.')
      })
    }
  }

  private capture(): void {
    try {
      const link = document.createElement('a')
      const world = this.current ? String(this.current.number).padStart(2, '0') : 'lab'
      link.href = this.stage.capture()
      link.download = `moosegoose-swarmlab-${world}-${seedHex(this.seed)}.png`
      link.click()
      this.announce(`Snapshot saved as ${link.download}.`)
    } catch {
      this.announce('Snapshot failed in this browser.')
    }
  }

  /* ------------------------------------------------------------------ events */

  private onResize = (): void => {
    this.stage.resize(window.innerWidth, window.innerHeight)
    this.bloom?.setSize(window.innerWidth, window.innerHeight)
    if (this.mode === 'focus' && this.current) {
      this.ensureRuntime(this.current).resize(window.innerWidth, window.innerHeight)
    }
  }

  private onPointerMove = (event: PointerEvent): void => {
    this.rawPointer.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1
    this.rawPointer.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1)
    this.rawPointer.active = true
  }

  private onPointerDown = (): void => {
    this.rawPointer.down = true
    this.pointer.down = true
  }

  private onPointerUp = (): void => {
    this.rawPointer.down = false
    this.pointer.down = false
  }

  private onClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null
    if (!target) return
    const action = target.closest<HTMLElement>('[data-act]')
    const card = target.closest<HTMLElement>('[data-number]')

    if (!action && card?.dataset.number) {
      this.open(Number(card.dataset.number))
      return
    }
    if (!action) return

    switch (action.dataset.act) {
      case 'back':
        this.navigate(null)
        break
      case 'prev':
        this.step(-1)
        break
      case 'next':
        this.step(1)
        break
      case 'tour':
        this.toggleTour()
        break
      case 'snapshot':
        this.snapshotWanted = true
        break
      case 'pause':
        this.togglePause()
        break
      case 'help':
        this.toggleHelp()
        break
      case 'help-close':
        this.toggleHelp(false)
        break
      default:
        break
    }
  }

  private onKey = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return
    }
    const key = event.key

    if (this.tourActive && key.toLowerCase() !== 't') this.stopTour()

    if (key === '?' || (key === '/' && event.shiftKey)) {
      event.preventDefault()
      this.toggleHelp()
      return
    }

    if (key === 'Escape') {
      if (this.helpOpen) {
        this.toggleHelp(false)
        return
      }
      if (this.mode === 'focus') this.navigate(null)
      return
    }

    if (key === 'r' || key === 'R') {
      this.reseed()
      return
    }
    if (key === 's' || key === 'S') {
      this.snapshotWanted = true
      return
    }
    if (key === 't' || key === 'T') {
      this.toggleTour()
      return
    }
    if (key === 'f' || key === 'F') {
      this.toggleFullscreen()
      return
    }
    if (key === ' ') {
      event.preventDefault()
      this.togglePause()
      return
    }

    if (this.mode === 'focus') {
      if (key === 'ArrowRight') this.step(1)
      if (key === 'ArrowLeft') this.step(-1)
      return
    }

    if (/^[1-9]$/.test(key)) {
      this.open(Number(key))
      return
    }
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      this.moveSelection(1)
      return
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      this.moveSelection(-1)
      return
    }
    if (key === 'Enter') {
      const card = this.cards[this.selected]
      if (card) this.open(card.effect.number)
    }
  }

  /* ------------------------------------------------------------------ helpers */

  private disposeBloom(): void {
    this.bloom?.dispose()
    this.bloom = null
  }

  private disposeRuntimes(): void {
    this.disposeBloom()
    this.runtimes.forEach((runtime) => runtime.dispose())
    this.runtimes.clear()
  }

  private loadVisited(): void {
    try {
      const raw = window.localStorage.getItem(VISITED_KEY)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        parsed.forEach((value) => {
          if (typeof value === 'number') this.visited.add(value)
        })
      }
    } catch {
      /* storage is optional */
    }
  }

  private persistVisited(): void {
    try {
      window.localStorage.setItem(VISITED_KEY, JSON.stringify([...this.visited]))
    } catch {
      /* storage is optional */
    }
  }

  private announce(message: string): void {
    this.live.textContent = message
  }

  /** Render a single frame synchronously (dev tooling and snapshot capture). */
  renderOnce(dt = 1 / 60): void {
    this.frame(dt)
  }

  stats(): {
    fps: number
    frameMs: number
    calls: number
    points: number
    world: string | null
    particles: number
  } {
    const info = this.stage.renderer.info.render
    return {
      fps: Math.round(this.loop.fps),
      frameMs: Number(this.loop.frameMs.toFixed(2)),
      calls: info.calls,
      points: info.points,
      world: this.current?.name ?? null,
      particles: this.current?.count ?? 0,
    }
  }

  destroy(): void {
    this.stopTour()
    this.stopClock()
    this.loop.stop()
    this.disposeRuntimes()
    this.stage.dispose()
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('hashchange', this.onHashChange)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    document.removeEventListener('click', this.onClick)
    this.helpEl.remove()
  }
}
