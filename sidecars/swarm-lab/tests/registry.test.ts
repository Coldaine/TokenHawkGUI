import { describe, expect, it } from 'vitest'
import { EFFECTS, effectByIndex, effectByNumber } from '../src/data/effects'

describe('effect registry', () => {
  it('ships exactly twelve worlds, numbered 1-12 in order', () => {
    expect(EFFECTS).toHaveLength(12)
    expect(EFFECTS.map((effect) => effect.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('has unique ids and names', () => {
    expect(new Set(EFFECTS.map((effect) => effect.id)).size).toBe(12)
    expect(new Set(EFFECTS.map((effect) => effect.name)).size).toBe(12)
  })

  it('keeps card budgets inside the full particle count', () => {
    for (const effect of EFFECTS) {
      expect(effect.count).toBeGreaterThan(0)
      expect(effect.cardBudget).toBeGreaterThan(0)
      expect(effect.cardBudget).toBeLessThanOrEqual(effect.count)
    }
  })

  it('gives every world an accent, category and blurb', () => {
    for (const effect of EFFECTS) {
      expect(effect.accent).toMatch(/^#[0-9a-f]{6}$/i)
      expect(effect.category.length).toBeGreaterThan(2)
      expect(effect.blurb.length).toBeGreaterThan(20)
      expect(effect.name).toBe(effect.name.toUpperCase())
    }
  })

  it('looks worlds up by number and wraps indices', () => {
    expect(effectByNumber(6)?.id).toBe('token-storm')
    expect(effectByNumber(99)).toBeNull()
    expect(effectByIndex(0).number).toBe(1)
    expect(effectByIndex(12).number).toBe(1)
    expect(effectByIndex(-1).number).toBe(12)
  })
})
