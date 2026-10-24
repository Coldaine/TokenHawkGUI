/**
 * Shared palette. Every world picks an accent from here so the lab reads as
 * one system rather than twelve unrelated demos.
 */
export const PALETTE = {
  amber: '#ffb342',
  ember: '#ff6a3d',
  bone: '#f2ead8',
  acid: '#c8f04a',
  teal: '#3fe0c0',
  magenta: '#e26ad6',
  ice: '#7fb2ff',
  green: '#7dff9a',
  violet: '#b58cff',
} as const

export type PaletteName = keyof typeof PALETTE
