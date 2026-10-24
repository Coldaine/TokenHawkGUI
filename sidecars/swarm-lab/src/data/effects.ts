import type { EffectDefinition } from '../engine/types'

import { effect as computeCathedral } from '../effects/01-compute-cathedral'
import { effect as livingModel } from '../effects/02-living-model'
import { effect as moosegooseWorld } from '../effects/03-moosegoose-world'
import { effect as letThereBeLight } from '../effects/04-let-there-be-light'
import { effect as computationalZoom } from '../effects/05-computational-zoom'
import { effect as tokenStorm } from '../effects/06-token-storm'
import { effect as agentBuilder } from '../effects/07-agent-builder'
import { effect as monument } from '../effects/08-monument'
import { effect as searchParty } from '../effects/09-search-party'
import { effect as lattice } from '../effects/10-lattice'
import { effect as cauldron } from '../effects/11-cauldron'
import { effect as dispersal } from '../effects/12-dispersal'

export const EFFECTS: EffectDefinition[] = [
  computeCathedral,
  livingModel,
  moosegooseWorld,
  letThereBeLight,
  computationalZoom,
  tokenStorm,
  agentBuilder,
  monument,
  searchParty,
  lattice,
  cauldron,
  dispersal,
].sort((a, b) => a.number - b.number)

export function effectByNumber(number: number): EffectDefinition | null {
  return EFFECTS.find((effect) => effect.number === number) ?? null
}

export function effectByIndex(index: number): EffectDefinition {
  const clamped = ((index % EFFECTS.length) + EFFECTS.length) % EFFECTS.length
  return EFFECTS[clamped]!
}
