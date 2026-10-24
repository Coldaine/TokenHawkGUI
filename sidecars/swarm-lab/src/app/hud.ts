import { seedHex } from '../engine/rng'
import type { EffectDefinition } from '../engine/types'

export type Mode = 'gallery' | 'focus'

export interface TopBarOptions {
  mode: Mode
  seed: number
  explored: number
  world?: EffectDefinition
}

export function topBar(opts: TopBarOptions): string {
  const seed = seedHex(opts.seed)
  if (opts.mode === 'focus' && opts.world) {
    return /* html */ `
      <header class="topbar">
        <div class="topbar-left">
          <button class="focus-back" data-act="back" type="button">&#8592; LAB</button>
          <span class="brand small">MOOSE<span class="dot">.</span>GOOSE</span>
        </div>
        <div class="topbar-center">
          <span class="idx">WORLD <b>${String(opts.world.number).padStart(2, '0')}</b> / 12</span>
          <b class="world-name">${opts.world.name}</b>
        </div>
        <div class="topbar-meta">
          <span>SEED <b data-seed>${seed}</b></span>
          <span class="hide-sm" data-clock>--:--:--</span>
        </div>
      </header>
    `
  }

  return /* html */ `
    <header class="topbar">
      <a class="brand" href="#/">MOOSE<span class="dot">.</span>GOOSE <i>SWARM LAB</i></a>
      <div class="topbar-meta">
        <span class="pulse">LIVE</span>
        <span class="hide-sm">WORLDS <b>12</b></span>
        <span class="hide-sm">EXPLORED <b data-explored>${String(opts.explored).padStart(2, '0')} / 12</b></span>
        <span>SEED <b data-seed>${seed}</b></span>
        <span class="hide-sm" data-clock>--:--:--</span>
      </div>
    </header>
  `
}

export function footer(mode: Mode): string {
  const right =
    mode === 'focus'
      ? `<span class="telemetry" data-focus-telemetry>PARTICLES ---- &middot; SIM --MS &middot; --FPS</span>`
      : `<span class="telemetry" data-gallery-telemetry>12 WORLDS &middot; -- LIVE &middot; --FPS</span>`

  const hints =
    mode === 'focus'
      ? `<span class="key"><kbd>&#8592;</kbd><kbd>&#8594;</kbd> switch world</span>
         <span class="key"><kbd>SPACE</kbd> freeze</span>
         <span class="key"><kbd>R</kbd> reseed</span>
         <span class="key"><kbd>S</kbd> snapshot</span>
         <span class="key"><kbd>F</kbd> fullscreen</span>
         <span class="key"><kbd>ESC</kbd> back to lab</span>`
      : `<span class="key"><kbd>CLICK</kbd> open</span>
         <span class="key"><kbd>1&#8211;9</kbd> jump</span>
         <span class="key"><kbd>T</kbd> tour</span>
         <span class="key"><kbd>R</kbd> reseed</span>
         <span class="key"><kbd>S</kbd> snapshot</span>
         <span class="key"><kbd>?</kbd> keys</span>`

  return /* html */ `<footer class="hints">${hints}<span class="spacer"></span>${right}</footer>`
}

export function rail(mode: Mode): string {
  return /* html */ `
    <nav class="rail" aria-label="Lab controls">
      <button type="button" data-act="prev" title="Previous world" aria-label="Previous world">&#8249;</button>
      <button type="button" data-act="next" title="Next world" aria-label="Next world">&#8250;</button>
      <span class="rail-sep"></span>
      <button type="button" data-act="tour" title="Auto tour" aria-label="Auto tour">&#9678;</button>
      <button type="button" data-act="snapshot" title="Snapshot PNG" aria-label="Snapshot PNG">&#9635;</button>
      <button type="button" data-act="pause" title="Freeze motion" aria-label="Freeze motion">&#10074;&#10074;</button>
      <button type="button" data-act="help" title="Keys" aria-label="Keys">?</button>
      ${mode === 'focus' ? '<span class="rail-sep"></span><button type="button" data-act="back" title="Back to lab" aria-label="Back to lab">&#8592;</button>' : ''}
    </nav>
  `
}

export function helpSheet(): string {
  return /* html */ `
    <div class="overlay" id="help" hidden>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <h2 id="help-title">Lab keys</h2>
        <p class="sub">Twelve worlds &middot; one canvas &middot; no plugins</p>
        <div class="keys">
          <div><span>Open a world</span><b>CLICK / ENTER</b></div>
          <div><span>Jump to world</span><b>1&#8211;9</b></div>
          <div><span>Move selection</span><b>ARROWS</b></div>
          <div><span>Next / previous</span><b>&#8592; &#8594;</b></div>
          <div><span>Auto tour</span><b>T</b></div>
          <div><span>Freeze motion</span><b>SPACE</b></div>
          <div><span>Reseed</span><b>R</b></div>
          <div><span>Snapshot PNG</span><b>S</b></div>
          <div><span>Fullscreen</span><b>F</b></div>
          <div><span>Back to lab</span><b>ESC</b></div>
        </div>
        <button class="close" data-act="help-close" type="button">Close &#10005;</button>
      </div>
    </div>
  `
}

export function startClock(): () => void {
  const tick = (): void => {
    const now = new Date()
    const text = now.toTimeString().slice(0, 8)
    document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => {
      el.textContent = text
    })
  }
  tick()
  const id = window.setInterval(tick, 1000)
  return () => window.clearInterval(id)
}
