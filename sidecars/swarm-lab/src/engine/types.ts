import type * as THREE from 'three'

export type Quality = 'card' | 'focus'

export interface PointerState {
  /** Normalised device coordinates, -1..1 on both axes. */
  x: number
  y: number
  down: boolean
  active: boolean
}

export interface EffectContext {
  seed: number
  quality: Quality
  pixelRatio: number
  reducedMotion: boolean
}

export interface EffectRuntime {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly particleCount: number
  update(dt: number, elapsed: number, pointer: PointerState): void
  resize(width: number, height: number): void
  /** Limit live particles for thumbnail cards. Must never exceed particleCount. */
  setBudget(count: number): void
  dispose(): void
}

export interface EffectDefinition {
  number: number
  id: string
  name: string
  category: string
  blurb: string
  accent: string
  /** Particle count used for full-bleed focus mode. */
  count: number
  /** Particle budget used in gallery cards. */
  cardBudget: number
  create(ctx: EffectContext): EffectRuntime
}
