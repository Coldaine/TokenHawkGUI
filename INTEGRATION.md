# TokenHawk Integration & Quickshell Handoff Guide

## 1. Repository Role & Integration Strategy

- **Permanent AI Studio Repository**: `TokenHawkGUI` (`https://github.com/Coldaine/TokenHawkGUI`) remains the active visual workbench and design repository written by Google AI Studio.
- **No Automatic Two-Way Sync**: Downstream consumers (`MooseGooseWebsiteServices` and `coldaine-configurations`) integrate changes via **reviewed imports of a recorded git revision** from `TokenHawkGUI`.
- **Clean Boundary**: All portable TokenHawk presentation code lives in isolated directories (`types/tokenhawk.ts`, `lib/tokenhawk/`, `components/tokenhawk/`, `components/icons/AIToolLogos.tsx`, and `quickshell/`). Unrelated DEFT/3D showcase files (`components/ThreeStage.tsx`, `components/hud/*`, `lib/deftData.ts`) are never imported by the TokenHawk package.

---

## 2. What Moves into `MooseGooseWebsiteServices/services/ai-usage`

Import the following self-contained web modules when embedding TokenHawk into `services/ai-usage`:

| Source Path in `TokenHawkGUI` | Purpose in `services/ai-usage` |
| :--- | :--- |
| `types/tokenhawk.ts` | Normalized `QuotaInstrumentItem`, `QuotaWindowReading`, decoupled `CapacityState` + `ObservationStatus`, and `TokenHawkDisplayPreferences`. |
| `lib/tokenhawk/designTokens.ts` | Centralized palette, slot dimensions (`68px` slot, `26×92px` housing), and spring motion presets. |
| `lib/tokenhawk/serviceAdapter.ts` | `adaptAiUsageServiceToInstruments()` translating `/api/quota`, `/api/quota/health`, and `/api/subscriptions` without silent demo fallbacks or unfounded cap/pool inference. |
| `components/icons/AIToolLogos.tsx` | Verified SVG brand icons + `InitialsFallbackLogo` (`getVerifiedProviderIcon`) so unknown providers get an honest 2-letter monospaced badge. |
| `components/tokenhawk/MeterCore.tsx` | Single-slot instrument supporting `long` (default), `stacked`, `companion`, and `short` windows plus all monetary states (`included_credit`, `prepaid_no_max` Alt A/B, `enforced_cap`, `personal_budget`, `metered_uncapped`). |
| `components/tokenhawk/CompactRotatingWidget.tsx` | 3-slot rotating overlay component with Group, Relay, and Favorite modes, whole-assembly transitions, off-screen warning strip, and full-inventory expansion. |

### Required NPM Dependencies for Web Import
- `react` / `react-dom`
- `motion` (`import { motion, AnimatePresence } from 'motion/react'`)
- `lucide-react`
- Tailwind CSS v4 utility classes

### Optional Upstream API Extensions for `services/ai-usage`
The adapter works immediately with current `/api/quota` and `/api/quota/health` payloads. To unlock richer monetary and pool distinctions without heuristics, `services/ai-usage` can optionally include:
1. `limitKind?: 'included_credit' | 'enforced_cap' | 'personal_budget' | 'metered_uncapped'` on `/api/subscriptions` or `/api/quota` rows (otherwise dollar limits map conservatively to `'included_credit'` labeled `'LIMIT'`).
2. `creditPoolId?: string` and `sharedKeyCount?: number` when multiple API keys draw from a single organization/account credit balance.

---

## 3. What Moves into `coldaine-configurations` (Quickshell / Hyprland / Omarchy)

The `quickshell/` directory contains the isolated Qt Quick / Quickshell implementation:

| File | Description |
| :--- | :--- |
| `quickshell/shell.qml` | `ShellRoot` + `PanelWindow` entry point configured with `WlrLayer.Top`, `WlrKeyboardFocus.None`, `ExclusionMode.Ignore`, and `mask: Region { item: overlayWidget }`. |
| `quickshell/TokenHawkOverlay.qml` | 3-position rotating container with Group/Relay/Favorite timer, hover/expanded pause, and partial-group slot handling. |
| `quickshell/QuotaSlotItem.qml` | Whole-assembly provider slot with decoupled `observationStatus` (`STALE`, `AUTH`, `FAIL`) and `capacityState`. |
| `quickshell/MeterHousing.qml` | Vertical equalizer and monetary instrument housing matching `MeterCore.tsx`. |
| `quickshell/ThemeTokens.qml` | Singleton QML theme and geometry tokens matching `lib/tokenhawk/designTokens.ts`. |
| `quickshell/fixtures/sample_instruments.json` | 8-account normalized JSON fixture for standalone testing. |

### Running QML in Isolation (Manual Verification Only)
Nothing in this repository installs or activates the overlay on the live desktop. To inspect the QML widget in an isolated window when ready:

```bash
quickshell -p ./quickshell/shell.qml
```

---

## 4. Verification Status Matrix

- **Source Implemented**:
  - Typed data model separating `capacityState` from `observationStatus`, with nullable reset timestamps and nullable companion windows.
  - Pure `services/ai-usage` adapter (`lib/tokenhawk/serviceAdapter.ts`) with zero silent fallback.
  - Study 1 (`QuotaWindowsStudy`), Study 2 (`DollarBalancesStudy`), Study 3 (`RotationMotionStudy` + `CompactRotatingWidget` with 3/8/18/30 fixtures), and concrete QML files in `quickshell/`.
- **Browser Behavior Verified**:
  - Next.js TypeScript compilation (`compile_applet`) and interactive workbench verification across Light, Dark, and Busy preview backgrounds.
- **Native QML Checked in Isolation**:
  - QML component hierarchy, property bindings, and JSON fixture schema verified against `quickshell/fixtures/sample_instruments.json`.
- **Native Desktop Behavior Not Yet Tested** *(requires live Wayland / Hyprland session)*:
  - Compositor click-through behavior outside `mask: Region` across fractional HiDPI outputs.
  - Verification that `WlrLayer.Top` remains hidden beneath `ext-session-lock-v1` (Hyprlock / swaylock).
  - Live polling bridge from `services/ai-usage` local daemon into the Quickshell `FileView` / `Process` runner.
