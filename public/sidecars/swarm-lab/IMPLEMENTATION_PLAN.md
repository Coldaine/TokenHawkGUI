# MOOSE.GOOSE SWARM LAB — Implementation Plan

**Goal:** A dark, HUD-framed web page with twelve numbered, live particle/swarm worlds
in the visual language of the token-storm screenshots, each openable full-bleed.

**Architecture:** One Vite + TypeScript + Three.js app. A single full-viewport WebGL2
canvas draws every visible card with scissor/viewport rectangles into DOM slots; one
rAF loop, bloom only in focus mode. Simulation is tiered: stateless vertex-shader fields
for cheap 12k–70k point effects, and a small CPU boids engine (~160 agents) with
GPU-rendered trails for the true swarm pieces.

**Stack:** `three@^0.186`, `vite`, `typescript`, `vitest`. No React, no backend, no
external images.

## Global constraints

- No search field; browse, navigate and open by mouse + keyboard.
- Twelve effects. Eight carry the world names from the screenshots; four are new.
- Copy is lowercase-mono HUD telemetry, never marketing prose.
- One `WebGLRenderer`; no second WebGL context.
- DPR capped at 1.5; cards render without post-processing; bloom only on focus.
- `prefers-reduced-motion: reduce` starts frozen until the user presses Space.
- No runtime dependencies beyond three. Nothing deployed.

## Effects

| # | Name | Behaviour | Technique |
|---|------|-----------|-----------|
| 01 | The Compute Cathedral | Arch/column architecture of drifting motes | points on parametric arches + curled drift |
| 02 | The Living Model | Pulsing shell around a hot core | spherical shell + breath + soft orb |
| 03 | Moose.Goose World | Grid plane, traffic converging on a tower | grid lines + shader lanes |
| 04 | Let There Be Light | Sparse cones of warm light | points in three cones + bloom |
| 05 | Infinite Computational Zoom | Warp tunnel | cylinder shell + per-particle z speed |
| 06 | The Token Storm | 40k storm + wireframe nodes | flow noise + edges + links |
| 07 | The Agent Builds the World | 160 agents build a structure | CPU boids + trails + instanced boxes |
| 08 | The Monument | Cloud assembles into a monolith | `aTarget` + staggered spring |
| 09 | The Search Party | Agents fan out, collapse on best probe | CPU boids + probe scoring |
| 10 | The Lattice | Noise ⇄ crystal | two target buffers + morph |
| 11 | The Cauldron | Vortex inflow, rising embers | angular field + buoyancy |
| 12 | The Dispersal | Shockwave scatter and return | radial impulse + spring |

## Structure

```
package.json  tsconfig.json  vite.config.ts  index.html
src/main.ts
src/styles/{base,hud,gallery,focus}.css
src/app/{App,Gallery,Focus,hud,routes}.ts
src/data/effects.ts
src/engine/{Renderer,Loop,Texture,particles,post}.ts
src/engine/shaders/{noise.glsl.ts,particle.vert.ts,particle.frag.ts,grid.frag.ts}
src/sim/{AgentSwarm,TrailLines}.ts
src/effects/01-…-12-….ts
tests/{agentswarm,rng,registry}.test.ts
```

## Interaction

- Gallery: responsive 4→3→2→1 column grid; hover reveals `ENTER →`; visited state.
- `1…9`, arrows select; `Enter` opens; `Esc` returns; `T` tour; `R` reseed; `S`
  snapshot; `Space` pause; `F` fullscreen; `?` help.
- Deep links: `#/world/06?seed=A57E7B`; browser back works; visited persists.
- Telemetry: `PARTICLES · SIM MS · FPS · DPR · SEED`, measured.

## Performance rules

- Focus: ≤ 90k points, half-resolution bloom.
- Cards: ≤ 8k points each, no composer, only cards near the viewport animate.
- `dt` clamped to 50 ms; one resize handler.

## Verification

- `npm run typecheck`, `npm run test`, `npm run build` clean.
- Every world opens, draws and reports its particle count; no console shader errors.
- Keyboard, deep links, visited state and reseed exercised in Chromium.
- Cards checked at desktop and mobile widths; no horizontal overflow.

## Out of scope

Deployment, backend, real agent telemetry, audio, WebGPU, search input.
