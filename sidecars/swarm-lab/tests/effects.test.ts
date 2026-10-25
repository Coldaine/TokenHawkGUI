import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { effect as livingModel, coreScale } from '../src/effects/02-living-model'
import { effect as tokenStorm } from '../src/effects/06-token-storm'
import { effect as agentBuilder } from '../src/effects/07-agent-builder'
import { effect as searchParty } from '../src/effects/09-search-party'
import type { EffectRuntime, PointerState } from '../src/engine/types'

const context = { seed: 1234, quality: 'card', pixelRatio: 1, reducedMotion: false } as const
const pointer = (x: number, y: number): PointerState => ({ x, y, down: false, active: true })

function drawnParticles(scene: THREE.Object3D): number {
  let total = 0
  scene.traverse((object) => {
    if (!(object instanceof THREE.Points)) return
    const position = object.geometry.getAttribute('position')
    if (!position) return
    const { count } = object.geometry.drawRange
    total += count === Infinity ? position.count : Math.min(count, position.count)
  })
  return total
}

function shaderUniform(runtime: EffectRuntime, name: string): THREE.IUniform | undefined {
  let found: THREE.IUniform | undefined
  runtime.scene.traverse((object) => {
    const material = (object as THREE.Mesh).material as THREE.ShaderMaterial | undefined
    found ??= material?.uniforms?.[name]
  })
  return found
}

describe('living model', () => {
  it('keeps its intended glowing-core size through the pulse', () => {
    // The core is a 3.6-unit orb breathing by 10%; it must not be replaced by
    // the ~1-unit sprite scale the pulse used to write.
    const quarterTurn = Math.PI / 2 / 0.95
    const peak = coreScale(quarterTurn)
    const trough = coreScale(3 * quarterTurn)

    expect(peak).toBeCloseTo(3.6 * 1.1, 10)
    expect(trough).toBeCloseTo(3.6 * 0.9, 10)
    expect((peak + trough) / 2).toBeCloseTo(3.6, 10)
    expect(coreScale(0)).toBe(3.6)

    for (let i = 0; i < 200; i++) {
      const scale = coreScale(i / 30)
      expect(scale).toBeGreaterThanOrEqual(3.24 - 1e-9)
      expect(scale).toBeLessThanOrEqual(3.96 + 1e-9)
    }
  })

  it('is still registered with its intended particle count', () => {
    expect(livingModel.count).toBe(32000)
  })
})

describe('token storm', () => {
  it('keeps cursor displacement and camera parallax well below the other worlds', () => {
    const runtime = tokenStorm.create(context)
    try {
      runtime.update(0, 10, pointer(1, 0))
      const right = runtime.camera.position.x
      runtime.update(0, 10, pointer(-1, 0))
      const left = runtime.camera.position.x

      expect(right - left).toBeGreaterThan(0)
      expect(right - left).toBeLessThan(0.2)

      let displacement: number | undefined
      runtime.scene.traverse((object) => {
        if (!(object instanceof THREE.Points)) return
        const material = object.material as THREE.ShaderMaterial
        const match = /uPointer \* \(([\d.]+)/.exec(material.vertexShader)
        if (match) displacement = Number(match[1])
      })
      expect(displacement).toBeDefined()
      expect(displacement!).toBeLessThan(0.1)
    } finally {
      runtime.dispose()
    }
  })
})

describe('agent builder', () => {
  it('starts construction when its world is created, not when the page opened', () => {
    const runtime = agentBuilder.create(context)
    try {
      // A page that has been open for fifteen minutes must not hand this world
      // a finished build on its first frame.
      runtime.update(1 / 60, 900, pointer(0, 0))
      expect(shaderUniform(runtime, 'uBuild')!.value as number).toBeLessThan(0.01)

      for (let step = 0; step < 24 * 60; step++) {
        runtime.update(1 / 60, 900 + step / 60, pointer(0, 0))
      }
      expect(shaderUniform(runtime, 'uBuild')!.value as number).toBeCloseTo(1, 3)
    } finally {
      runtime.dispose()
    }
  })
})

describe('particle budgets', () => {
  it('draws exactly the budgeted total, including always-on agents', () => {
    for (const effect of [agentBuilder, searchParty]) {
      const runtime = effect.create(context)
      try {
        expect(runtime.particleCount).toBe(effect.count)

        runtime.setBudget(effect.count)
        expect(drawnParticles(runtime.scene)).toBe(effect.count)

        runtime.setBudget(effect.cardBudget)
        expect(drawnParticles(runtime.scene)).toBe(effect.cardBudget)

        runtime.setBudget(0)
        expect(drawnParticles(runtime.scene)).toBe(0)
      } finally {
        runtime.dispose()
      }
    }
  })
})
