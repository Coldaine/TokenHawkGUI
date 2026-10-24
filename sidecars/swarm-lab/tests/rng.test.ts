import { describe, expect, it } from 'vitest'
import { hashSeed, mulberry32, randomSeed, seedFromHex, seedHex } from '../src/engine/rng'

describe('rng', () => {
  it('produces the same stream for the same seed', () => {
    const a = mulberry32(0x123456)
    const b = mulberry32(0x123456)
    const first = Array.from({ length: 32 }, () => a())
    const second = Array.from({ length: 32 }, () => b())
    expect(first).toEqual(second)
  })

  it('produces a different stream for a different seed', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    expect(a()).not.toBe(b())
  })

  it('stays inside [0, 1)', () => {
    const rng = mulberry32(0xdead)
    for (let i = 0; i < 500; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('round-trips a seed through six-digit hex', () => {
    const seed = 0xa57e7b
    expect(seedHex(seed)).toBe('A57E7B')
    expect(seedFromHex(seedHex(seed))).toBe(seed)
  })

  it('falls back to the lab seed for junk input', () => {
    expect(seedFromHex('not-a-seed')).toBe(0xa57e7b)
    expect(seedFromHex('')).toBe(0xa57e7b)
  })

  it('hashes strings deterministically and never to zero', () => {
    expect(hashSeed('moose.goose')).toBe(hashSeed('moose.goose'))
    expect(hashSeed('moose.goose')).not.toBe(hashSeed('goose.moose'))
    expect(hashSeed(0)).not.toBe(0)
  })

  it('randomSeed stays inside 24 bits', () => {
    for (let i = 0; i < 20; i++) {
      const seed = randomSeed()
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(0x1000000)
    }
  })
})
