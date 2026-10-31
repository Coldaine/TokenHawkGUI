import type { EffectDefinition } from '../engine/types'

export interface FocusView {
  root: HTMLElement
  telemetry: HTMLElement | null
  big: HTMLElement | null
}

export function renderFocus(effect: EffectDefinition): FocusView {
  const root = document.createElement('section')
  root.className = 'focus'
  root.style.setProperty('--accent', effect.accent)
  root.innerHTML = /* html */ `
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>

    <div class="focus-left">
      <span class="focus-eyebrow">WORLD ${String(effect.number).padStart(2, '0')} &mdash; ${effect.category}</span>
      <p class="focus-blurb">${effect.blurb}</p>
      <div class="focus-channels"><span>request</span><span>compute</span><span>token</span></div>
    </div>

    <div class="focus-telemetry">
      <span class="big" data-fps>--<small>FPS</small></span>
      <span><b data-particles>${effect.count.toLocaleString('en-US')}</b> particles</span>
      <span><b data-sim>--</b> sim ms &middot; <b data-dpr>--</b> dpr</span>
    </div>

    <div class="focus-hintline">click the field &middot; space to freeze &middot; r to reseed</div>
  `

  return {
    root,
    telemetry: root.querySelector<HTMLElement>('[data-fps]'),
    big: root.querySelector<HTMLElement>('[data-fps]'),
  }
}
