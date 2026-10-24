export type FrameHandler = (dt: number, elapsed: number) => void

/**
 * One requestAnimationFrame loop for every world. dt is clamped so returning
 * from a paused tab does not teleport a simulation.
 */
export class Loop {
  fps = 60
  frameMs = 0
  private handle = 0
  private last = 0
  private running = false
  private paused = false

  constructor(private readonly onFrame: FrameHandler) {}

  start(): void {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const tick = (now: number): void => {
      const raw = now - this.last
      this.last = now
      const frameStart = performance.now()
      if (!this.paused) {
        const dt = Math.min(raw / 1000, 0.05)
        this.onFrame(dt, now / 1000)
      }
      const cost = performance.now() - frameStart
      this.frameMs = this.frameMs * 0.9 + cost * 0.1
      this.fps = this.fps * 0.9 + (1000 / Math.max(raw, 1)) * 0.1
      if (this.running) this.handle = requestAnimationFrame(tick)
    }
    this.handle = requestAnimationFrame(tick)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.handle)
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return
    this.paused = paused
    this.last = performance.now()
  }

  get isPaused(): boolean {
    return this.paused
  }
}
