# NVIDIA DEFT Autonomous Skill Architecture — Cinematic Interactive Showcase

An auto-presenting, cinematic 3D architectural showcase and mission control interface that visualizes NVIDIA's Data-Efficient Fine-Tuning (DEFT) autonomous skill runtime (`tao-run-deft-aoi`), disk-backed state machine, cryptographic commit gates, and progressive disclosure cards.

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural visuals are 100% grounded in real NVIDIA skill mechanisms (`deft_state.json`, `commit_stage.py`, `driver.sh`, and sub-skill nodes). All requested side overlays and timeline controls will be implemented without stubs.

- **Confirmed Centerpiece Mechanism**: Direct 1-to-1 visual correspondence with real DEFT skill operations:
  - **Scene 1 (Architecture Blueprint)**: Living Topology connecting `driver.sh`, deterministic Python scripts boundary, the central `deft_state.json` crystal, and peripheral model routers.
  - **Scene 2 (Division of Labor & Immutable Core)**: The 3D crystalline state core protected by script-guarded locks, visually repelling unauthorized model mutations.
  - **Scene 3 (Progressive Disclosure)**: Modular card compilation assembly where reference cards (`evaluate.md`, `sdg.md`, `mine.md`) fly in and compress into dense runtime context on demand.
  - **Scene 4 (Commit Gates & Evidence Verification)**: The KPI Math Iris (`commit_stage.py`) where hallucinated ungrounded outputs shatter and verified metrics (`FAR`, `Recall`, `eval.csv`) lock the stage.
  - **Scene 5 (Sub-Skill Constellation)**: Closed-loop multi-agent feedback loop across the 5 underlying skills (`Evaluate` → `RCA` → `SDG` → `Mine` → `Retrain`).
- **Confirmed Playback Engine**: Auto-playing cinematic master timeline with pause/play, scrub bar, chapter markers, playback speed (0.5x, 1x, 2x), and a 3D Orbit Inspection toggle.
- **Confirmed Side HUD Overlays**: All 5 overlays active simultaneously with a cinematic dim toggle:
  1. *Live State Radar* (real-time `deft_state.json` stage radar + evidence toasts).
  2. *Division-of-Labor Split Meter* (Scripts/Evidence locks vs Model/Route ephemeral tokens).
  3. *Token & Context Thermometer* (progressive disclosure context cache fill/deplete).
  4. *Failure Ghost Log* (historical hallucination rejections shattered by `commit_stage.py`).
  5. *Repo Gradient Mini-Map* (skill spectrum positioning `tao-run-deft-aoi` at the far right).

---

### 1. Overview & Core Concept

- **What It Does**: Presents a rich, interactive 3D WebGL and motion-driven walkthrough of how heavy autonomous skills work in practice—explaining how NVIDIA eliminates agent drift, infinite loops, and hallucinated state mutations by separating deterministic script execution from generative reasoning.
- **Target Audience / Persona**: AI Engineers, ML Platform architects, enterprise agent developers, and technical leaders evaluating autonomous skill execution, air-gap deployments, and stateful agent systems.
- **Key Value**: Replaces abstract documentation with an unforgettable, tactile, cinematic visualization grounded in real Python commit receipts and state schemas.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Cinematic Auto-Tour**: The application opens in auto-presentation mode, smoothly sweeping the 3D camera across 5 acts with synchronized narrative captions and stage transitions.
  2. **Chapter Scrubbing & Playback**: Users can pause at any moment, scrub the timeline forward or backward, jump between acts, or adjust playback speed.
  3. **3D Free Orbit**: Toggling "Free Orbit" unlocks damped OrbitControls to inspect the state crystal, topology nodes, and particle flows from any angle.
  4. **Blueprint Mode & Receipts**: Toggling Blueprint Mode transforms the aesthetic into high-contrast cyan line-work with real code references (`scripts/commit_stage.py:88`).
  5. **Live HUD Telemetry**: Interactive side HUDs display real-time telemetry, expandable rejected prompt traces, and token budgets.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Dark cybernetic architecture, precision aerospace telemetry, and studio PBR lighting. Obsidian neutral canvas (`#080A0F`) with NVIDIA emerald accents (`#10B981` / `#76B900`), blueprint cyan (`#06B6D4`), and rejection crimson (`#EF4444`).
  - *Color Discipline*: 60% deep obsidian canvas, 30% structural glass surfaces and hairline borders, 10% high-intent glowing emissive nodes and gate irises.
  - *Typography*: High-legibility technical pairing—`Plus Jakarta Sans` for titles and narrative prose, paired with `JetBrains Mono` / tabular numerals for state keys, metrics, and script receipts.
  - *Ergonomics*: Full-bleed 3D WebGL canvas (`100vw x 100vh`) with a collapsible unified bottom timeline dock (`bottom: 24px`, $\le 15\%$ viewport height) and non-occluding flank HUDs.

- **Interactive Feedback & Motion**:
  - Damped 60fps WebGL loop (`1 - Math.exp(-k * dt)`) with studio `RoomEnvironment`, soft contact shadows, and horizon fog.
  - Framer Motion reactive state transitions for HUDs and toasts with zero UI layout shift.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Three.js over Heavy React-Three-Fiber Wrappers**:
  - *Chosen Approach*: Direct Three.js WebGL canvas inside a stable `useRef` container, combined with Framer Motion for DOM overlays.
  - *Why*: Eliminates R3F reconciler overhead, avoids React re-render stalls on high-density geometry, and strictly adheres to the Three.js skill mandates (procedural geometries, zero external 404 assets, unified PBR render loop).
- **Decision 2: Synchronized State Engine & Timeline**:
  - *Chosen Approach*: Centralized presentation state machine (`usePresentationStore`) that drives both 3D node activations, camera splines, and HUD overlays from a single normalized timestamp `t ∈ [0, 1]`.
  - *Why*: Ensures zero desynchronization between the 3D visual effects, narrative captions, and telemetry panels during scrubbing or speed changes.
- **Decision 3: Zero-Dependency Procedural Shaders & Geometries**:
  - *Chosen Approach*: Procedural multi-faceted crystal geometry, glowing particle pipelines, and canvas normal textures built entirely in code.
  - *Why*: Guaranteed hermetic runtime with zero external `.glb`, `.hdr`, or image 404 risks.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### System Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CINEMATIC MAIN STAGE                             │
│                                                                             │
│  ┌───────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │
│  │ Live State Radar      │  │ Top Navigation      │  │ Repo Gradient Map │  │
│  │ (deft_state.json ring)│  │ (Brand · Acts · CTA)│  │ (Skill Spectrum)  │  │
│  └───────────────────────┘  └─────────────────────┘  └───────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │               THREE.JS WEBGL VIEWPORT (Full Bleed)                    │  │
│  │                                                                       │  │
│  │   [Scene 1: Topology]     [Scene 2: State Crystal]  [Scene 3: Cards]  │  │
│  │   [Scene 4: Math Iris]    [Scene 5: Sub-Skill Loop]                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │
│  │ Failure Ghost Log     │  │ Division Split Meter│  │ Token Thermometer │  │
│  │ (Hallucination Replay)│  │ (Scripts vs Model)  │  │ (Card Cache Bar)  │  │
│  └───────────────────────┘  └─────────────────────┘  └───────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │       UNIFIED BOTTOM TIMELINE DOCK (Collapsible, <= 15% height)       │  │
│  │   [Play/Pause] [Scrubber] [Acts 1-5] [Speed] [Free Orbit] [Blueprint] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Presentation Acts & Schema

1. **Act 1: The Blueprint & Topology** (`t: 0.00 – 0.20`)
   - Camera: Wide establishing orbit.
   - Core visual: `driver.sh` entry, deterministic Python scripts boundary, glowing central state node.
   - Mechanism: Demonstrates strict boundary—model never touches bash directly.
2. **Act 2: The Immutable State Crystal** (`t: 0.20 – 0.40`)
   - Camera: Dolly-in macro focus on the 3D multifaceted crystal.
   - Core visual: `deft_state.json` rotating with holographic stage fields (`active_stage`, `kpi_metrics`, `pass_rate`). Model access repelled by energy shield; script key unlocks iteration.
3. **Act 3: Progressive Disclosure & Card Pack** (`t: 0.40 – 0.60`)
   - Camera: Elevated oblique view.
   - Core visual: Markdown cards (`pipeline-and-state.md`, `evaluate.md`, `sdg.md`) stream in and compress into an on-demand memory block.
   - Context thermometer updates in real time.
4. **Act 4: The KPI Math Iris & Hallucination Shatter** (`t: 0.60 – 0.80`)
   - Camera: Frontal iris alignment.
   - Core visual: Simulated hallucinated text ("Wrote TODO metrics") shatters into red shards upon failing `commit_stage.py`. Authentic parsed float values (`FAR: 0.012`, `Recall: 0.984`) pass the evidence gate.
5. **Act 5: Autonomous Sub-Skill Constellation** (`t: 0.80 – 1.00`)
   - Camera: Sweeping dynamic multi-node orbit.
   - Core visual: 5 sub-skill satellite nodes (`Evaluate`, `RCA`, `SDG`, `Mine`, `Retrain`) cycling closed-loop data packets until target convergence.

#### Interactive Component & State Mapping

- `PresentationController`: Controls `currentTime`, `isPlaying`, `speed`, `activeAct`, `isOrbiting`, `isBlueprintMode`, `isHudDimmed`.
- `ThreeStage`: Initializes Three.js scene, camera spline interpolation, procedural models (`StateCrystalGroup`, `TopologyGroup`, `CardPackGroup`, `GateIrisGroup`, `ConstellationGroup`), and particle systems.
- `StateRadarOverlay`: Subscribes to timeline, highlights active stage (`Evaluate` → `RCA` → `SDG` → `Mine` → `Retrain` → `Gate`), fires evidence toasts.
- `DivisionSplitMeter`: Renders locked script vs dynamic model ratios with animated lock and flare shaders.
- `ContextThermometer`: Visualizes token load and active file citations (`references/*.md`).
- `FailureGhostLog`: Renders timestamped rejection traces and commit exit codes.
- `RepoGradientMap`: Visualizes lightweight skills through heavy DEFT runtimes.
- `DirectorCommentaryModal`: Toggleable overlay displaying actual Python/Bash code snippets and line receipts.
