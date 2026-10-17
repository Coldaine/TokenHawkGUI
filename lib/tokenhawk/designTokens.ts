import {
  CapacityState,
  MotionTreatment,
  ObservationStatus,
  TokenHawkDisplayPreferences,
} from '@/types/tokenhawk';

/**
 * Centralized design tokens shared between the web prototype and the
 * native Qt Quick / Quickshell (QML) implementation (`quickshell/ThemeTokens.qml`).
 */
export const TOKENHAWK_DESIGN_TOKENS = {
  colors: {
    canvasObsidian: '#07090e',
    surfaceHousing: '#0b0f19',
    chamberRecessed: '#05070b',
    borderStructural: '#1e293b',
    borderSubtle: '#0f172a',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',

    // Calibrated capacity accents
    nominalPrimary: '#76b900',
    nominalEmerald: '#10b981',
    warningAmber: '#f59e0b',
    warningYellow: '#facc15',
    criticalRed: '#ef4444',
    criticalRose: '#f43f5e',

    // Companion short-window & special instrument accents
    companionCyan: '#06b6d4',
    companionSky: '#38bdf8',
    prepaidIndigo: '#818cf8',
    budgetViolet: '#a78bfa',
    meteredSlate: '#64748b',
  },

  dimensions: {
    compactSlotWidthPx: 68,
    compactSlotGapPx: 10,
    compactMeterHeightPx: 92,
    compactMeterWidthPx: 26,
    stackedUpperRatio: 0.34, // Upper 5h compartment is 34%, lower weekly is 66%
    stackedSeparatorPx: 3,
    companionTrackWidthPx: 5,
    widgetPaddingPx: 12,
    widgetBorderRadiusPx: 14,
    meterBorderRadiusPx: 6,
  },

  typography: {
    sansFamily: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
    monoFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
  },
} as const;

export const DEFAULT_TOKENHAWK_PREFERENCES: TokenHawkDisplayPreferences = {
  windowMode: 'long', // Long-period allowances are explicitly the default
  prepaidTreatment: 'digital_readout', // Proposed default (Confirmed in Phase 1)
  meterStyle: 'liquid',
  rotationMode: 'group',
  rotationIntervalSec: 8,
  pinnedInstrumentId: 'anth-work-max',
  motionTreatment: 'carousel_glide',
  idleEffect: 'subtle',
  glassOpacity: 0.88,
};

export function getCapacityColors(state: CapacityState): {
  fillGradient: string;
  barHex: string;
  textClass: string;
  glowCss: string;
  badgeText: string;
} {
  switch (state) {
    case 'exhausted':
      return {
        fillGradient: 'from-red-700 via-red-600 to-rose-500',
        barHex: '#ef4444',
        textClass: 'text-red-400',
        glowCss: '0 0 10px rgba(239, 68, 68, 0.45)',
        badgeText: '0%',
      };
    case 'warning':
      return {
        fillGradient: 'from-amber-600 via-amber-500 to-yellow-400',
        barHex: '#f59e0b',
        textClass: 'text-amber-400',
        glowCss: '0 0 10px rgba(245, 158, 11, 0.35)',
        badgeText: 'LOW',
      };
    case 'unbounded':
      return {
        fillGradient: 'from-slate-700 via-slate-600 to-slate-500',
        barHex: '#94a3b8',
        textClass: 'text-slate-200',
        glowCss: 'none',
        badgeText: 'OPEN',
      };
    case 'unknown':
      return {
        fillGradient: 'from-slate-800 to-slate-700',
        barHex: '#475569',
        textClass: 'text-slate-400',
        glowCss: 'none',
        badgeText: 'UNK',
      };
    case 'nominal':
    default:
      return {
        fillGradient: 'from-emerald-600 via-emerald-500 to-[#76b900]',
        barHex: '#76b900',
        textClass: 'text-[#10b981]',
        glowCss: '0 0 10px rgba(118, 185, 0, 0.3)',
        badgeText: 'OK',
      };
  }
}

export function getObservationBadge(status: ObservationStatus): {
  show: boolean;
  label: string;
  shortLabel: string;
  className: string;
  dotClassName: string;
} {
  switch (status) {
    case 'stale':
      return {
        show: true,
        label: 'STALE READING',
        shortLabel: 'STALE',
        className: 'text-amber-300 bg-amber-950/90 border-amber-700/70',
        dotClassName: 'bg-amber-400',
      };
    case 'auth_required':
      return {
        show: true,
        label: 'AUTH NEEDED',
        shortLabel: 'AUTH',
        className: 'text-rose-300 bg-rose-950/90 border-rose-700/70',
        dotClassName: 'bg-rose-400',
      };
    case 'failing':
      return {
        show: true,
        label: 'COLLECTOR FAIL',
        shortLabel: 'FAIL',
        className: 'text-red-300 bg-red-950/90 border-red-700/70',
        dotClassName: 'bg-red-400',
      };
    case 'unknown':
      return {
        show: true,
        label: 'NO DATA',
        shortLabel: 'UNK',
        className: 'text-slate-300 bg-slate-900/90 border-slate-700',
        dotClassName: 'bg-slate-400',
      };
    case 'working':
    default:
      return {
        show: false,
        label: 'LIVE',
        shortLabel: 'OK',
        className: 'text-emerald-300 bg-emerald-950/80 border-emerald-800/60',
        dotClassName: 'bg-emerald-400',
      };
  }
}

export function getMotionVariants(treatment: MotionTreatment, reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.12 },
    };
  }

  switch (treatment) {
    case 'instrument_reel':
      return {
        initial: { opacity: 0, y: 26, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -26, scale: 0.96 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.75 },
      };
    case 'depth_shuffle':
      return {
        initial: { opacity: 0, scale: 0.84, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.82, y: -6 },
        transition: { type: 'spring' as const, stiffness: 340, damping: 26, mass: 0.8 },
      };
    case 'carousel_glide':
    default:
      return {
        initial: { opacity: 0, x: 28, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -28, scale: 0.98 },
        transition: { type: 'spring' as const, stiffness: 410, damping: 30, mass: 0.7 },
      };
  }
}
