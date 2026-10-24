import type { EffectDefinition } from '../engine/types'

export interface CardHandle {
  effect: EffectDefinition
  el: HTMLElement
}

export interface GalleryView {
  root: HTMLElement
  cards: CardHandle[]
}

const CATALOG = [
  'flow fields',
  'boids',
  'vortices',
  'morph targets',
  'GPU points',
  'agent swarms',
]

export function renderGallery(effects: EffectDefinition[], visited: Set<number>): GalleryView {
  const explored = String(visited.size).padStart(2, '0')
  const root = document.createElement('main')
  root.className = 'page'
  root.innerHTML = /* html */ `
    <section class="hero" aria-labelledby="hero-title">
      <div class="eyebrow">Internal exploration &mdash; 12 worlds</div>
      <h1 id="hero-title">The swarm is<br /><em>the interface</em></h1>
      <p class="lede">
        Twelve particle studies in one dark room. Flow fields, flocking, vortices and
        collapse &mdash; every world rendered live in <b>WebGL2</b> on a single canvas, no video,
        no shaders baked into a PNG. The numbers on screen are measured on this machine.
      </p>
      <div class="chips">
        <span class="chip"><span class="led green"></span><b>WebGL2</b> / GLSL</span>
        <span class="chip"><b>12</b> worlds</span>
        <span class="chip"><b>${effects.reduce((sum, e) => sum + e.count, 0).toLocaleString('en-US')}</b> particles max</span>
        <span class="chip"><b>1</b> canvas</span>
        <span class="chip"><b>R</b> reseed</span>
      </div>
    </section>

    <section class="worlds" aria-labelledby="worlds-title">
      <div class="worlds-head">
        <span class="label" id="worlds-title">The worlds</span>
        <span class="count">EXPLORED <b data-explored>${explored} / 12</b></span>
      </div>
      <div class="grid" data-grid></div>
    </section>

    <div class="colophon">
      <span>
        <b>MOOSE.GOOSE SWARM LAB</b><br />
        ${CATALOG.join(' &middot; ')}
      </span>
      <span>
        <b>MOTION</b> live &middot; bloom is focus-only<br />
        <b>SEED</b> deterministic &middot; share the hash
      </span>
      <span>
        <b>TELEMETRY</b> measured, not scripted<br />
        <b>BUILD</b> three.js / vite / typescript
      </span>
    </div>
  `

  const grid = root.querySelector<HTMLElement>('[data-grid]')!
  const cards: CardHandle[] = effects.map((effect) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'card'
    el.dataset.number = String(effect.number)
    el.dataset.visited = String(visited.has(effect.number))
    el.style.setProperty('--accent', effect.accent)
    el.setAttribute('aria-label', `Open world ${effect.number}: ${effect.name}`)
    el.innerHTML = /* html */ `
      <span class="frame"></span>
      <span class="scan"></span>
      <span class="card-top">
        <span class="num">${String(effect.number).padStart(2, '0')}</span>
        <span class="state" data-visited="${visited.has(effect.number)}">${visited.has(effect.number) ? 'VISITED &#10003;' : 'UNVISITED'}</span>
      </span>
      <span class="meta">
        <span class="cat">${effect.category}</span>
        <span class="name">${effect.name}</span>
        <span class="blurb">${effect.blurb}</span>
      </span>
      <span class="enter">ENTER &#8594;</span>
    `
    grid.appendChild(el)
    return { effect, el }
  })

  return { root, cards }
}

export function updateGalleryExplored(root: HTMLElement, visited: Set<number>): void {
  root.querySelectorAll<HTMLElement>('[data-explored]').forEach((el) => {
    el.textContent = `${String(visited.size).padStart(2, '0')} / 12`
  })
  root.querySelectorAll<HTMLElement>('.card').forEach((card) => {
    const number = Number(card.dataset.number)
    const seen = visited.has(number)
    card.dataset.visited = String(seen)
    const state = card.querySelector<HTMLElement>('.state')
    if (state) {
      state.dataset.visited = String(seen)
      state.innerHTML = seen ? 'VISITED &#10003;' : 'UNVISITED'
    }
  })
}
