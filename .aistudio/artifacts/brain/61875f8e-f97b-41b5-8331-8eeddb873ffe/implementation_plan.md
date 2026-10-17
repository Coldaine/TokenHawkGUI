# TokenHawk — Multi-Window Instruments, Monetary Balances, Live Rotation & Quickshell Implementation

Evolve TokenHawk into a modular, reusable quota telemetry instrument family while preserving its signature vertical equalizer aesthetic. This update delivers three interactive visual design studies, a verified adapter boundary for `MooseGooseWebsiteServices` (`services/ai-usage`), and a concrete, isolated Qt Quick / Quickshell (QML) implementation inside `TokenHawkGUI`.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Repository & Desktop Safety Boundary**: `TokenHawkGUI` remains Google AI Studio's permanent working repository. Reusable presentation components, portable assets, and native QML files are authored here for downstream integration into `MooseGooseWebsiteServices` (`services/ai-usage`) and `coldaine-configurations` via **reviewed imports of a recorded git revision**—never via repository relocation or an automated two-way sync system. **No native overlay will be installed, activated, or launched on the live desktop, and no live Hyprland/Omarchy settings will be modified.**

- **Full Scope Implementation**: Build all three visual studies (Quota Windows, Dollar Balances, and Rotation & Motion), the `services/ai-usage` adapter with **3, 8, 18, and 30 account fixtures**, and the concrete Quickshell/QML implementation files in this pass.
- **Workbench Organization**: Keep the current Focused Vertical Equalizer view as the default entry tab, with top workbench tabs for the three visual studies and the Connected Service Adapter / Quickshell QML inspector.
- **Default Window Mode (`windowMode: 'long'`)**: Long-period allowances are explicitly the default display focus (`'long'`). Vertically stacked (`'stacked'`), overlaid companion (`'companion'`), and short-window only (`'short'`) are user-selectable display preferences.
- **Uncapped Prepaid Balance Treatment (Proposed Default)**: Study 2 displays **both** uncapped prepaid treatments **side by side simultaneously** for direct comparison (**Alternative A: Vertical Digital Readout with currency badge and understated framing** vs. **Alternative B: Split Stacked Dollars & Cents Counter**), while the compact rotating widget uses Alternative A as its proposed default with a preference selector to switch between them.
- **Honest Telemetry & Adapter Discipline**:
  - Separate **capacity state** from **data freshness / authentication status** so an instrument can be simultaneously **exhausted (`0%`) and stale** without one state overwriting the other.
  - Make reset timestamps and companion-window readings nullable so prepaid credit without a reset and unavailable short windows are never coerced into `0%`.
  - The `services/ai-usage` adapter maps actual API fields (`/api/quota`, `/api/quota/health`, `/api/subscriptions`) without guessing or inferring that a dollar limit is an enforced cap or that separate rows share a credit pool merely because they share a provider name or `$` unit.

---

### 1. Overview & Core Concept

- **What It Does**: Provides a compact, gently transparent quota monitor and interactive design workbench that communicates remaining capacity across heterogeneous AI subscriptions and API credit pools—covering rolling/weekly/monthly percentages, discrete unit allowances, included monthly dollar credits, prepaid balances without known maximums, enforced spending caps, personal budgets, uncapped metered accounts, and stale/failing/auth-required states.
- **Target Audience / Persona**: Developers and Linux desktop users (Hyprland / Omarchy / Quickshell) who monitor multiple AI coding, reasoning, media, and API accounts across workspaces and need an honest, compact capacity instrument above application windows.
- **Key Value**: Resolves how multi-window quotas, non-percentage dollar balances, and multi-account inventories coexist inside one cohesive hardware-inspired instrument family, backed by clean TypeScript and native QML implementations.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Default Equalizer Stage**: Opens directly to the preserved Focused Vertical Equalizer view with all five existing bar styles (`Liquid`, `LED VU`, `Needle`, `Capsule`, `Matrix`), spring physics sliders, and corner stack previews intact.
  2. **Study 1 — Quota Windows (Single, Stacked & Overlaid)**: Side-by-side close-up comparison of one provider's quota meter across three treatments:
     - **A — Long-Period Only** (`windowMode: 'long'`, **Default**): Single vertical meter showing `WEEKLY 62%` remaining, resetting in `3d`.
     - **B — Vertically Stacked** (`windowMode: 'stacked'`): One housing divided into two independently scaled compartments with a clear structural separator—lower, larger primary compartment (`WEEKLY 62% · resets 3d`) and upper, smaller compartment (`5H 28% · resets 1h40m`).
     - **C — Overlaid Companion** (`windowMode: 'companion'`): Full-height weekly meter with a narrow, distinctly colored short-window indicator along one edge of the same housing.
     - Each treatment is shown in both **Normal State** (`WEEKLY 62%`, `5H 28%`) and **Short-Window Exhausted State** (`WEEKLY 62%`, `5H 0% · avail 22m`), at realistic compact desktop-widget size alongside a 2x detail enlargement and a live display preference selector (`Long period / Stacked / Companion / Short period`).
  3. **Study 2 — Dollar Balances & Monetary Instruments**: A compact widget study with uniform slot width, icon alignment, and typography across all monetary instrument types:
     - *Slot 1 (Included Monthly Allowance)*: `$24.80` remaining from a `$100` monthly credit allowance (`resets 12d`) with a proportional remaining-capacity meter.
     - *Slot 2 (Prepaid Balance with No Known Maximum — Side-by-Side Comparison)*: `$24.80` available credit with no meaningful percentage and no reset (`resetsAt: null`). Renders **both** visual alternatives side by side for comparison (**Alt A: Slim Vertical Digital Readout** with vertically arranged amount, currency, provider icon, and understated framing—no quantitative calibration ticks that imply a scale; **Alt B: Split Stacked Dollars & Cents Counter** inside the recessed meter slot).
     - *Slot 3 (Enforced Spending Cap vs. Personal Budget)*: `$25` remaining before a `$100` monthly limit (`resets 12d`), shown both as a provider-enforced **CAP** and as a user-defined **BUDGET** so personal thresholds never imply provider enforcement.
     - *Slot 4 (Uncapped Pay-As-You-Go)*: Deliberate, understated **METERED · No cap configured** instrument slot with no invented remaining capacity or full green bar.
  4. **Study 3 — Live Rotation, Motion & 3 / 8 / 18 / 30 Account Fixtures**: Interactive 3-position compact widget exercising selectable **3, 8, 18, and 30 account inventories** (where the **8-account fixture** specifically tests a partially filled final group of 2 slots in a 3-slot widget, alongside long account names, multiple accounts per provider, shared credit pools represented once per pool, and simultaneous exhausted + stale states):
     - *Rotation Modes*: **Group** (all 3 positions advance together every `8s` default), **Relay** (one position advances every `3s` default, moving left to right), and **Favorite** (one pinned instrument stays visible while the other two positions rotate every `8s` default), plus an adjustable interval control (`rotationIntervalSec`).
     - *Motion Treatments*: **Carousel Glide** (horizontal slide with restrained spring settle), **Instrument Reel** (vertical roll into position with subtle group stagger), and **Depth Shuffle** (outgoing assemblies gently recede while replacements move forward into focus). Every provider assembly (logo, account name, value, period, reset, and meter) moves as one unit—never morphing one provider's balance into another's.
     - *Restrained Idle Effects*: Selectable **Off / Subtle (default) / Playful** effects (liquid surface shimmer, lit LED sheen, passing highlight on capsule/needle housings, tiny arrival icon settle) that respect `prefers-reduced-motion` and never alter the indicated allowance.
     - *Navigation & Off-Screen Warnings*: Discreet previous, next, and pause controls; compact provider icons for direct selection with persistent warning markers for off-screen accounts that are low, exhausted, stale, or need authentication; and an expanded full-inventory view that automatically pauses rotation.
     - *Preview Backdrops*: External workbench selector to inspect the transparent widget over **Light**, **Dark**, and **Busy** backgrounds without baking those backgrounds into the widget component.
  5. **Connected Service Adapter & Concrete Quickshell Implementation View**:
     - Interactive adapter harness testing actual-shaped `services/ai-usage` responses (`/api/quota`, `/api/quota/health`, `/api/subscriptions`), explicitly documenting which fields exist today versus optional upstream extensions, and demonstrating zero silent fallback to demo fixtures.
     - Browsable inspector for the concrete Quickshell/QML source files, portable tokens/SVGs, standalone QML fixture runner instructions, and verification status breakdown.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Precision hardware audio/telemetry instrument with dark translucent surfaces, crisp 1px structural borders, and calibrated phosphor accents.
  - *Color & Contrast Discipline*:
    - 60% Neutral Canvas (`#07090E` workbench; configurable `glassOpacity` `0.15–0.95` on the widget surface).
    - 30% Structural Surfaces (`#0B0F19` housing, `#05070B` recessed meter chambers, `#1E293B` hairlines).
    - 10% Semantic Accents (`#76B900` / `#10B981` nominal, `#F59E0B` warning, `#EF4444` critical/exhausted, `#06B6D4` short-window companion). Every state pairs with explicit text/icon markers (`CAP`, `BUDGET`, `METERED`, `STALE`, `AUTH`, `FAIL`, `0% · 22m`) so state is never communicated by hue alone.
  - *Typography*: Clean technical sans (`Plus Jakarta Sans`) paired with tabular monospace (`JetBrains Mono` / `font-mono tabular-nums`) for all numeric readings, currencies, percentages, and countdowns.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Decoupled Capacity State and Observation/Freshness Status**:
  - *Chosen Approach*: `QuotaInstrumentItem` carries both `capacityState` (`'nominal' | 'warning' | 'exhausted' | 'unbounded' | 'unknown'`) and `observationStatus` (`'working' | 'stale' | 'failing' | 'auth_required' | 'unknown'`).
  - *Why*: In real operation, an account can reach `0%` remaining (`exhausted`) and subsequently fail to refresh (`stale` or `failing`). Combining them into one enum loses critical truth. Decoupling allows the meter to show the last observed `0%` capacity while simultaneously badging the reading as `STALE`.
- **Decision 2: Honest Adapter Mapping Without Unfounded Inference**:
  - *Chosen Approach*: The `services/ai-usage` adapter maps the fields actually returned by `/api/quota`, `/api/quota/health`, and `/api/subscriptions` (account label, entitlement label, remaining, limit, unit, reset timestamp, and `working | stale | failing` health). It generates stable deterministic `instrumentId` keys from `(accountLabel, entitlementLabel)` and only applies richer classifications (`enforced_cap` vs. `personal_budget`, or shared `creditPoolId`) when explicitly present in optional metadata/extensions—never guessing from provider names or `$` units.
  - *Why*: Prevents silent misclassifications (such as mistaking a personal budget for an enforced provider cap or merging two separate OpenAI project balances into one).
- **Decision 3: Concrete Quickshell/QML Implementation with Strict Live-Desktop Non-Interference**:
  - *Chosen Approach*: Deliver complete, modular QML source files (`shell.qml`, `TokenHawkOverlay.qml`, `QuotaSlotItem.qml`, `MeterHousing.qml`, `ThemeTokens.qml`, and JSON fixture loader) inside `TokenHawkGUI` alongside an integration guide, without executing desktop installation or modifying user window-manager configs.
  - *Why*: Gives downstream `coldaine-configurations` and `WebsiteServices` a faithful, ready-to-run Qt Quick implementation while strictly respecting the user's live desktop environment.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### System Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                  TOKENHAWKGUI WORKBENCH SHELL (AI Studio Repo)                   │
│  [Tab 0: Focused Equalizer] [Tab 1: Quota Windows] [Tab 2: Dollar Instruments]   │
│  [Tab 3: Live Rotation & Fixtures] [Tab 4: Service Adapter & Quickshell QML]     │
└───────────────┬──────────────────────────────────────────────────┬───────────────┘
                │                                                  │
                ▼                                                  ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────────┐
│     WORKBENCH FIXTURE CONTROLLER      │  │   SERVICES/AI-USAGE ADAPTER LAYER     │
│  • 3 / 8 / 18 / 30 Account Fixtures   │  │  • Translates actual /api/quota,      │
│    (8-account tests [3,3,2] partial)  │  │    /api/quota/health & /subscriptions │
│  • Manual -1 / Exhaust / Refill Sim   │  │  • Documents current vs optional      │
│  • Light / Dark / Busy Backdrop Stage │  │    upstream schema fields             │
└───────────────────┬───────────────────┘  └───────────────────┬───────────────────┘
                    │                                          │
                    └────────────────────┬─────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                  PORTABLE TOKENHAWK PRESENTATION LAYER (Typed)                   │
│                                                                                  │
│  ┌─────────────────────────┐ ┌─────────────────────────┐ ┌────────────────────┐  │
│  │ Design Tokens & Icons   │ │ Multi-Window Meter Core │ │ Monetary & Status  │  │
│  │ • Verified Provider SVGs│ │ • Long-Period (Default) │ │ Instruments        │  │
│  │ • Honest Initials Badge │ │ • Vertically Stacked    │ │ • Included $ Credit│  │
│  │ • Centralized Geometry, │ │ • Overlaid Companion    │ │ • Prepaid Alt A & B│  │
│  │   Colors & Spring Math  │ │ • Short-Window Only     │ │   (No Fake Scale)  │  │
│  │ • 5 Styles: Liquid, LED,│ │ • Nullable Resets &     │ │ • CAP vs BUDGET    │  │
│  │   Needle, Capsule,      │ │   Nullable Short Window │ │ • METERED / STALE  │  │
│  │   Matrix (dotmatrix)    │ └─────────────────────────┘ └────────────────────┘  │
│  └─────────────────────────┘                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │ Compact Rotating Overlay Widget (3 Slots + Expanded Full Inventory)        │  │
│  │ • Stable Instrument IDs (1 instrument per shared pool, partial last group) │  │
│  │ • Rotation: Group (8s) | Relay (3s L→R) | Favorite (pinnedId + 2 rotating) │  │
│  │ • Motion: Carousel Glide | Instrument Reel | Depth Shuffle (Whole Assembly)│  │
│  │ • Idle Effects: Off | Subtle (Default) | Playful (Reduced-Motion Safe)     │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│              CONCRETE QUICKSHELL / QT QUICK (QML) IMPLEMENTATION                 │
│  • Actual QML files: shell.qml, TokenHawkOverlay.qml, QuotaSlotItem.qml,         │
│    MeterHousing.qml, ThemeTokens.qml, plus portable SVG assets & JSON fixtures   │
│  • Wayland LayerShell / PanelWindow config: WlrLayer.Top, non-focus-stealing,    │
│    explicit input mask Region, multi-screen scale aware, lock-screen safe        │
│  • Isolated verification & launch docs (never installed/started on live desktop) │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & State

- **`QuotaWindowReading` (Nullable-Safe Window Model)**:
  - `windowId`: `'long' | 'short' | string`
  - `label`: `string` (e.g., `'WEEKLY'`, `'MONTHLY'`, `'5H'`, `'3H'`)
  - `remaining`: `number | null` (`null` when unknown, unavailable, or uncapped metered)
  - `limit`: `number | null` (`null` when prepaid without known maximum or uncapped metered)
  - `unit`: `'percent' | 'usd' | 'requests' | 'tokens' | 'hours' | 'chars' | string`
  - `percentRemaining`: `number | null` (only populated when `limit` is a meaningful positive denominator; never fabricated for prepaid or unavailable readings)
  - `resetsAt`: `string | null` (ISO timestamp or `null` for prepaid/no-reset balances)
  - `resetLabel`: `string | null` (e.g., `'resets 3d'`, `'avail 22m'`, or `null` when no reset applies)
  - `isExhausted`: `boolean` (`true` only when a known allowance is genuinely `0`)
  - `windowStatus`: `'working' | 'stale' | 'unavailable'`

- **`QuotaInstrumentItem` (Normalized Presentation Input)**:
  - `instrumentId`: `string` (stable identity used by rotation, pinning, and React/QML keys; represents one account/entitlement or one shared credit pool rather than duplicating per API key)
  - `accountLabel`: `string` (e.g., `'Anthropic Work'`, `'OpenAI Tier 4 Pool'`)
  - `entitlementLabel`: `string` (e.g., `'Claude Max'`, `'Prepaid Credits'`)
  - `providerId`: `string` (maps to verified SVG icon or triggers honest 2-letter initials fallback)
  - `providerName`: `string`
  - `sharedKeyCount` (optional): `number` (when multiple API keys share one credit pool, surfaced as metadata in expanded detail rather than separate meters)
  - `measurementMode`: `'percentage'` | `'unit_allowance'` | `'included_credit'` | `'prepaid_no_max'` | `'enforced_cap'` | `'personal_budget'` | `'metered_uncapped'`
  - `primaryWindow`: `QuotaWindowReading`
  - `companionWindow`: `QuotaWindowReading | null` (nullable; an unavailable short window has `remaining: null, percentRemaining: null, windowStatus: 'unavailable'`, never `0%`)
  - `capacityState`: `'nominal' | 'warning' | 'exhausted' | 'unbounded' | 'unknown'` (strictly reflects remaining allowance capacity)
  - `observationStatus`: `'working' | 'stale' | 'failing' | 'auth_required' | 'unknown'` (strictly reflects data freshness and collector health; can coexist with any `capacityState`, e.g., `capacityState: 'exhausted'` + `observationStatus: 'stale'`)
  - `observedAt`: `string | null`
  - `errorDetail`: `string | null`

- **`TokenHawkDisplayPreferences` (Complete User Presentation Settings)**:
  - `windowMode`: `'long' | 'stacked' | 'companion' | 'short'` (Default: `'long'`)
  - `prepaidTreatment`: `'digital_readout' | 'split_counter'` (Proposed Default: `'digital_readout'`)
  - `meterStyle`: `'liquid' | 'segmented' | 'needle' | 'capsule' | 'dotmatrix'` (Default: `'liquid'`, preserving `'dotmatrix'` / Matrix from existing view)
  - `rotationMode`: `'group' | 'relay' | 'favorite'` (Default: `'group'`)
  - `rotationIntervalSec`: `number` (Adjustable interval in seconds; defaults to `8` for Group/Favorite and `3` for Relay, user-configurable from `2s` to `30s`)
  - `pinnedInstrumentId`: `string | null` (Selected `instrumentId` kept pinned in Slot 1 when `rotationMode === 'favorite'`)
  - `motionTreatment`: `'carousel_glide' | 'instrument_reel' | 'depth_shuffle'` (Default: `'carousel_glide'`)
  - `idleEffect`: `'off' | 'subtle' | 'playful'` (Default: `'subtle'`, automatically disabled when `prefers-reduced-motion` is active)
  - `glassOpacity`: `number` (`0.15` to `0.95`, Default: `0.85`)

#### Service Adapter Mapping & Verification (`services/ai-usage`)

- **What `services/ai-usage` Currently Provides**:
  - `/api/quota`: Quota observation rows with account/provider labels, entitlement/window labels, `remaining`, `limit`, `unit`, `resetAt` / countdown, and observation timestamp/error text.
  - `/api/quota/health`: Collector health status per target reporting `working`, `stale`, or `failing` (plus auth/error reason when failing).
  - `/api/subscriptions`: Configured subscription/account metadata.
- **How the Adapter Translates Actual Payloads**:
  - Builds a deterministic `instrumentId` from normalized `(accountLabel, entitlementLabel)` (or explicit `instrumentId`/`creditPoolId` if provided).
  - Pairs long-period and short-period observations for the same `(accountLabel, entitlementLabel)` into `primaryWindow` and `companionWindow` without coercing missing short windows to zero.
  - Maps `/api/quota/health` states (`working`, `stale`, `failing`) directly onto `observationStatus` (mapping auth failure messages to `'auth_required'`), completely independent of `capacityState`.
  - When a row has `unit === 'usd'` and `limit === null`, maps to `'prepaid_no_max'`. When `limit !== null`, maps conservatively to `'included_credit'` unless explicit metadata specifies `'enforced_cap'` or `'personal_budget'`—never guessing cap enforcement or shared pools from provider names.
- **Documented Upstream Gap & Integration Note**:
  - Includes a clear contract table in the Adapter & Integration view detailing which fields are directly mapped from `services/ai-usage` today versus optional non-breaking fields (`creditPoolId`, `limitKind: 'included' | 'enforced_cap' | 'personal_budget'`, `sharedKeyCount`) that `WebsiteServices` can optionally emit later, plus a concise integration guide explaining what imports into `MooseGooseWebsiteServices/services/ai-usage` and what moves into `coldaine-configurations`.
