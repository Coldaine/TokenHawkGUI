'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  IdleEffectLevel,
  MeterStyle,
  PrepaidTreatment,
  QuotaInstrumentItem,
  WindowMode,
} from '@/types/tokenhawk';
import {
  getCapacityColors,
  getObservationBadge,
  TOKENHAWK_DESIGN_TOKENS,
} from '@/lib/tokenhawk/designTokens';
import { getVerifiedProviderIcon } from '@/components/icons/AIToolLogos';
import { AlertTriangle, KeyRound, Lock, ShieldCheck } from 'lucide-react';

export interface MeterCoreProps {
  instrument: QuotaInstrumentItem;
  windowMode?: WindowMode;
  prepaidTreatment?: PrepaidTreatment;
  meterStyle?: MeterStyle;
  idleEffect?: IdleEffectLevel;
  scale?: 'compact' | 'loupe';
  isPinned?: boolean;
  isSelected?: boolean;
  onSelect?: (instrument: QuotaInstrumentItem) => void;
}

function formatPrimaryReading(
  instrument: QuotaInstrumentItem,
  effectiveWindowMode: WindowMode
): {
  primaryText: string;
  periodBadge: string;
  resetText: string;
  secondaryBanner?: string | null;
} {
  const { measurementMode, primaryWindow, companionWindow, observationStatus } = instrument;

  if (observationStatus === 'auth_required' && primaryWindow.remaining === null) {
    return {
      primaryText: 'AUTH',
      periodBadge: primaryWindow.label,
      resetText: primaryWindow.resetLabel || 're-auth',
      secondaryBanner: null,
    };
  }

  if (observationStatus === 'failing' && primaryWindow.remaining === null) {
    return {
      primaryText: 'ERR',
      periodBadge: primaryWindow.label,
      resetText: primaryWindow.resetLabel || 'offline',
      secondaryBanner: null,
    };
  }

  // Short-window-only display preference when companion window exists
  if (effectiveWindowMode === 'short' && companionWindow) {
    if (companionWindow.windowStatus === 'unavailable' || companionWindow.percentRemaining === null) {
      return {
        primaryText: 'N/A',
        periodBadge: companionWindow.label,
        resetText: 'unobserved',
        secondaryBanner: `${primaryWindow.label} ${primaryWindow.percentRemaining ?? '--'}%`,
      };
    }
    return {
      primaryText: `${Math.round(companionWindow.percentRemaining)}%`,
      periodBadge: companionWindow.label,
      resetText: companionWindow.resetLabel || 'rolling',
      secondaryBanner: `${primaryWindow.label} ${Math.round(primaryWindow.percentRemaining ?? 0)}%`,
    };
  }

  switch (measurementMode) {
    case 'included_credit': {
      const amt =
        primaryWindow.remaining !== null ? `$${primaryWindow.remaining.toFixed(2)}` : '$--';
      return {
        primaryText: amt,
        periodBadge: primaryWindow.label || 'INCLUDED',
        resetText: primaryWindow.resetLabel || 'monthly',
      };
    }
    case 'prepaid_no_max': {
      const amt =
        primaryWindow.remaining !== null ? `$${primaryWindow.remaining.toFixed(2)}` : '$--';
      return {
        primaryText: amt,
        periodBadge: 'PREPAID',
        resetText: 'No reset',
      };
    }
    case 'enforced_cap': {
      const amt =
        primaryWindow.remaining !== null
          ? primaryWindow.remaining % 1 === 0
            ? `$${primaryWindow.remaining.toFixed(0)}`
            : `$${primaryWindow.remaining.toFixed(2)}`
          : '$--';
      return {
        primaryText: amt,
        periodBadge: 'CAP',
        resetText: primaryWindow.resetLabel || 'monthly',
      };
    }
    case 'personal_budget': {
      const amt =
        primaryWindow.remaining !== null
          ? primaryWindow.remaining % 1 === 0
            ? `$${primaryWindow.remaining.toFixed(0)}`
            : `$${primaryWindow.remaining.toFixed(2)}`
          : '$--';
      return {
        primaryText: amt,
        periodBadge: 'BUDGET',
        resetText: primaryWindow.resetLabel || 'monthly',
      };
    }
    case 'metered_uncapped': {
      return {
        primaryText: 'METERED',
        periodBadge: 'PAYG',
        resetText: primaryWindow.resetLabel || 'No cap configured',
      };
    }
    case 'unit_allowance': {
      const pct =
        primaryWindow.percentRemaining !== null
          ? `${Math.round(primaryWindow.percentRemaining)}%`
          : '--%';
      return {
        primaryText: pct,
        periodBadge: primaryWindow.label,
        resetText: primaryWindow.resetLabel || 'cycle',
      };
    }
    case 'percentage':
    default: {
      const pct =
        primaryWindow.percentRemaining !== null
          ? `${Math.round(primaryWindow.percentRemaining)}%`
          : '--%';
      return {
        primaryText: pct,
        periodBadge: primaryWindow.label,
        resetText: primaryWindow.resetLabel || 'cycle',
      };
    }
  }
}

/**
 * Reusable Single-Slot Quota & Monetary Instrument (`MeterCore`).
 * Preserves TokenHawk's slim vertical equalizer visual language across:
 * - Long-period only, Vertically stacked, Overlaid companion, and Short-period windows
 * - Dollar allowances, Prepaid balances without max (Alt A & Alt B), CAP vs BUDGET, and METERED
 * - Independent CapacityState and ObservationStatus badges (so 0% + STALE coexist cleanly)
 */
export default function MeterCore({
  instrument,
  windowMode = 'long',
  prepaidTreatment = 'digital_readout',
  meterStyle = 'liquid',
  idleEffect = 'subtle',
  scale = 'compact',
  isPinned = false,
  isSelected = false,
  onSelect,
}: MeterCoreProps) {
  const prefersReducedMotion = useReducedMotion();
  const effectiveIdle: IdleEffectLevel = prefersReducedMotion ? 'off' : idleEffect;

  const isLoupe = scale === 'loupe';
  const slotWidth = isLoupe ? 128 : TOKENHAWK_DESIGN_TOKENS.dimensions.compactSlotWidthPx;
  const meterHeight = isLoupe ? 168 : TOKENHAWK_DESIGN_TOKENS.dimensions.compactMeterHeightPx;
  const meterWidth = isLoupe ? 46 : TOKENHAWK_DESIGN_TOKENS.dimensions.compactMeterWidthPx;

  const {
    measurementMode,
    primaryWindow,
    companionWindow,
    capacityState,
    observationStatus,
  } = instrument;

  const capColors = getCapacityColors(capacityState);
  const obsBadge = getObservationBadge(observationStatus);
  const readout = formatPrimaryReading(instrument, windowMode);

  // Determine active fill percentage when a meaningful denominator exists
  const primaryPct =
    primaryWindow.percentRemaining !== null
      ? Math.max(0, Math.min(100, Math.round(primaryWindow.percentRemaining)))
      : null;

  const companionPct =
    companionWindow && companionWindow.percentRemaining !== null
      ? Math.max(0, Math.min(100, Math.round(companionWindow.percentRemaining)))
      : null;

  const isCompanionExhausted = Boolean(
    companionWindow &&
      companionWindow.windowStatus !== 'unavailable' &&
      (companionWindow.isExhausted || companionPct === 0)
  );

  const isCompanionUnavailable = Boolean(
    companionWindow &&
      (companionWindow.windowStatus === 'unavailable' || companionWindow.percentRemaining === null)
  );

  // Split dollar and cents for Prepaid Alternative B
  const wholeDollars =
    primaryWindow.remaining !== null ? Math.floor(primaryWindow.remaining) : 0;
  const centsFormatted =
    primaryWindow.remaining !== null
      ? `.${Math.round((primaryWindow.remaining - wholeDollars) * 100)
          .toString()
          .padStart(2, '0')}`
      : '.00';

  // Helper to render standard proportional fill inside a compartment
  const renderProportionalFill = (
    pct: number | null,
    isShortWindowCompartment = false
  ) => {
    if (pct === null) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-950/90 text-[8px] font-mono text-slate-500">
          N/A
        </div>
      );
    }

    const isZero = pct <= 0;
    const isCrit = pct <= 20;
    const isMod = pct > 20 && pct <= 45;

    const fillGrad = isShortWindowCompartment
      ? isZero
        ? 'from-red-600 to-rose-500'
        : isCrit
        ? 'from-amber-500 to-orange-400'
        : 'from-cyan-600 via-sky-500 to-cyan-300'
      : isCrit
      ? 'from-red-600 via-rose-500 to-red-400'
      : isMod
      ? 'from-amber-600 via-amber-500 to-yellow-400'
      : measurementMode === 'personal_budget'
      ? 'from-violet-600 via-purple-500 to-fuchsia-400'
      : 'from-emerald-600 via-emerald-500 to-[#76b900]';

    if (meterStyle === 'segmented' && !isShortWindowCompartment) {
      const segments = isLoupe ? 12 : 10;
      const litCount = isZero ? 0 : Math.max(1, Math.round((pct / 100) * segments));
      return (
        <div className="w-full h-full flex flex-col justify-between p-[2px] relative overflow-hidden">
          {Array.from({ length: segments }).map((_, idx) => {
            const fromBottom = segments - 1 - idx;
            const isLit = fromBottom < litCount;
            return (
              <div
                key={idx}
                className={`w-full flex-1 my-[0.5px] rounded-[1px] transition-colors ${
                  isLit
                    ? isCrit
                      ? 'bg-red-500 shadow-[0_0_4px_#ef4444]'
                      : isMod
                      ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'
                      : 'bg-[#76b900] shadow-[0_0_4px_#76b900]'
                    : 'bg-slate-900/60'
                }`}
              />
            );
          })}
          {effectiveIdle !== 'off' && litCount > 0 && (
            <motion.div
              animate={{ y: ['100%', '-100%'] }}
              transition={{
                duration: effectiveIdle === 'playful' ? 2.4 : 4.2,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-x-0 h-5 bg-gradient-to-b from-transparent via-white/15 to-transparent pointer-events-none"
            />
          )}
        </div>
      );
    }

    if (meterStyle === 'needle' && !isShortWindowCompartment) {
      return (
        <div className="w-full h-full flex flex-col justify-end items-center relative py-1">
          <div className="w-1.5 h-full bg-slate-900 rounded-full relative flex flex-col justify-end">
            <div
              className={`w-full rounded-full transition-all duration-300 ${
                isZero
                  ? 'bg-red-500/50'
                  : isCrit
                  ? 'bg-rose-500'
                  : 'bg-emerald-400'
              }`}
              style={{ height: isZero ? '2px' : `${Math.max(6, pct)}%` }}
            />
            <div
              className={`absolute w-3.5 h-2 rounded-full -translate-x-1/2 left-1/2 border ${
                isZero
                  ? 'bg-red-500 border-red-200 shadow-[0_0_8px_#ef4444]'
                  : 'bg-white border-slate-200 shadow-[0_0_8px_#ffffff]'
              }`}
              style={{ bottom: `calc(${pct}% - 4px)` }}
            />
          </div>
          {effectiveIdle !== 'off' && (
            <motion.div
              animate={{ opacity: [0.1, 0.35, 0.1] }}
              transition={{
                duration: effectiveIdle === 'playful' ? 2 : 3.6,
                repeat: Infinity,
              }}
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
            />
          )}
        </div>
      );
    }

    if (meterStyle === 'capsule' && !isShortWindowCompartment) {
      return (
        <div className="w-full h-full flex flex-col justify-end p-[2px] rounded-full relative overflow-hidden">
          {!isZero ? (
            <div
              className={`w-full rounded-full bg-gradient-to-t ${fillGrad} transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
              style={{ height: `${Math.max(8, pct)}%` }}
            >
              <div className="w-full h-1 bg-white/80 rounded-full" />
            </div>
          ) : (
            <div className="w-full h-1.5 bg-red-500/90 rounded-full shadow-[0_0_8px_#ef4444]" />
          )}
          {effectiveIdle !== 'off' && (
            <motion.div
              animate={{ y: ['-110%', '120%'] }}
              transition={{
                duration: effectiveIdle === 'playful' ? 2.8 : 4.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-white/15 to-transparent pointer-events-none"
            />
          )}
        </div>
      );
    }

    if (meterStyle === 'dotmatrix' && !isShortWindowCompartment) {
      const rows = isLoupe ? 14 : 11;
      const litRows = isZero ? 0 : Math.max(1, Math.round((pct / 100) * rows));
      return (
        <div className="w-full h-full flex flex-col justify-between items-center py-1 px-0.5">
          {Array.from({ length: rows }).map((_, rIdx) => {
            const fromBottom = rows - 1 - rIdx;
            const isLit = fromBottom < litRows;
            return (
              <div key={rIdx} className="flex items-center gap-0.5">
                {[0, 1].map((col) => (
                  <div
                    key={col}
                    className={`rounded-full ${
                      isLoupe ? 'w-2 h-1.5' : 'w-1.5 h-1'
                    } ${
                      isLit
                        ? isCrit
                          ? 'bg-red-400 shadow-[0_0_3px_#ef4444]'
                          : isMod
                          ? 'bg-amber-400'
                          : 'bg-[#76b900] shadow-[0_0_3px_#76b900]'
                        : 'bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    // Default: Liquid Equalizer style
    return (
      <div className="relative w-full h-full flex flex-col justify-end overflow-hidden">
        {/* Subtle 25/50/75 reference hairlines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2 px-0.5 opacity-30">
          <div className="border-b border-slate-700 w-full" />
          <div className="border-b border-slate-700 w-full" />
          <div className="border-b border-slate-700 w-full" />
        </div>

        {isZero ? (
          /* Genuine Zero State: Explicit empty chamber with crimson floor marker */
          <div className="w-full h-full flex flex-col justify-between items-center pt-1.5 pb-0.5">
            <span
              className={`font-mono font-bold text-red-400/90 tracking-tighter ${
                isLoupe ? 'text-[10px]' : 'text-[7px]'
              }`}
            >
              0%
            </span>
            <div className="w-full h-[3px] bg-red-500 shadow-[0_0_8px_#ef4444] rounded-xs" />
          </div>
        ) : (
          <div
            className={`w-full rounded-[3px] bg-gradient-to-t ${fillGrad} transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
            style={{
              height: `${Math.max(7, pct)}%`,
              boxShadow: capColors.glowCss,
            }}
          >
            {/* Liquid meniscus highlight */}
            <div className="w-full h-[2px] bg-white/85 rounded-full shrink-0" />

            {/* Optional subtle surface shimmer inside liquid fill */}
            {effectiveIdle !== 'off' && (
              <motion.div
                animate={{
                  y: ['100%', '-100%'],
                  opacity: effectiveIdle === 'playful' ? [0.15, 0.38, 0.15] : [0.08, 0.22, 0.08],
                }}
                transition={{
                  duration: effectiveIdle === 'playful' ? 2.4 : 4.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-full h-6 bg-gradient-to-t from-transparent via-white/30 to-transparent pointer-events-none"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelect?.(instrument)}
      style={{ width: `${slotWidth}px` }}
      className={`flex flex-col items-center select-none group relative rounded-xl transition-colors ${
        onSelect ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'bg-slate-800/60 ring-1 ring-[#76b900]/70 p-1.5'
          : 'p-1 hover:bg-slate-900/40'
      }`}
    >
      {/* Top Status Row: Observation Freshness / Pinned / Shared Pool */}
      <div className="h-4 flex items-center justify-center gap-1 mb-0.5 w-full">
        {obsBadge.show ? (
          <span
            className={`px-1 py-[1px] text-[8px] font-mono font-bold rounded border leading-none tracking-tight ${obsBadge.className}`}
            title={instrument.errorDetail || obsBadge.label}
          >
            {obsBadge.shortLabel}
          </span>
        ) : isCompanionExhausted && windowMode !== 'long' ? (
          <span
            className="px-1 py-[1px] text-[8px] font-mono font-bold rounded border border-red-700/80 bg-red-950/90 text-red-300 leading-none tracking-tight"
            title={`Short window (${companionWindow?.label}) exhausted: ${companionWindow?.resetLabel}`}
          >
            {companionWindow?.label} 0%
          </span>
        ) : instrument.sharedKeyCount && instrument.sharedKeyCount > 1 ? (
          <span
            className="inline-flex items-center gap-0.5 text-[8px] font-mono text-slate-400"
            title={`${instrument.sharedKeyCount} API keys share this single account balance`}
          >
            <KeyRound className="w-2.5 h-2.5 text-slate-500" />
            <span>{instrument.sharedKeyCount}k</span>
          </span>
        ) : isPinned ? (
          <span className="text-[8px] font-mono text-[#76b900] font-semibold">PIN</span>
        ) : (
          <span className="text-[8px] font-mono text-slate-500 truncate max-w-full">
            {readout.periodBadge}
          </span>
        )}
      </div>

      {/* Primary Numeric / Status Readout */}
      <div
        className={`font-mono font-extrabold tabular-nums leading-none tracking-tight mb-0.5 ${
          isLoupe ? 'text-base' : 'text-[11px]'
        } ${
          measurementMode === 'prepaid_no_max'
            ? 'text-indigo-300'
            : measurementMode === 'personal_budget'
            ? 'text-violet-300'
            : measurementMode === 'metered_uncapped'
            ? 'text-slate-300'
            : capColors.textClass
        }`}
      >
        {readout.primaryText}
      </div>

      {/* Period / Classification Sub-Label (Always visible when top row has STALE/AUTH badge) */}
      <div
        className={`font-mono uppercase tracking-wider leading-none mb-1.5 ${
          isLoupe ? 'text-[10px]' : 'text-[8px]'
        } ${
          measurementMode === 'enforced_cap'
            ? 'text-amber-300 font-bold'
            : measurementMode === 'personal_budget'
            ? 'text-violet-300 font-bold'
            : measurementMode === 'prepaid_no_max'
            ? 'text-indigo-300/90'
            : 'text-slate-400'
        }`}
      >
        {readout.periodBadge}
      </div>

      {/* ==================================================================== */}
      {/* THE INSTRUMENT HOUSING                                               */}
      {/* ==================================================================== */}
      <div
        style={{
          height: `${meterHeight}px`,
          width: `${meterWidth}px`,
        }}
        className={`relative rounded-[6px] p-[2px] bg-[#05070b] border flex flex-col justify-end shadow-inner overflow-hidden transition-colors ${
          observationStatus === 'auth_required' || observationStatus === 'failing'
            ? 'border-red-800/80'
            : observationStatus === 'stale'
            ? 'border-amber-700/80 border-dashed'
            : measurementMode === 'personal_budget'
            ? 'border-violet-700/70 border-dashed'
            : measurementMode === 'enforced_cap'
            ? 'border-amber-600/70'
            : 'border-slate-800 group-hover:border-slate-600'
        }`}
      >
        {/* CASE 1: PREPAID BALANCE WITH NO KNOWN MAXIMUM (2 Alternatives) */}
        {measurementMode === 'prepaid_no_max' ? (
          prepaidTreatment === 'digital_readout' ? (
            /* Alternative A: Slim Vertical Digital Readout with Currency Badge & Understated Framing */
            <div className="w-full h-full flex flex-col items-center justify-between py-1.5 px-0.5 bg-gradient-to-b from-indigo-950/35 via-slate-950 to-indigo-950/35 rounded-[4px] border border-indigo-500/20">
              <span
                className={`font-mono font-bold text-indigo-300/90 tracking-widest uppercase border-b border-indigo-500/25 w-full text-center pb-0.5 ${
                  isLoupe ? 'text-[9px]' : 'text-[6.5px]'
                }`}
              >
                USD
              </span>

              {/* Vertically stacked numeric characters so slot stays narrow */}
              <div
                className={`flex flex-col items-center justify-center font-mono font-extrabold text-slate-100 leading-[1.05] tabular-nums my-auto ${
                  isLoupe ? 'text-xs' : 'text-[8.5px]'
                }`}
              >
                <span>${wholeDollars}</span>
                <span className="text-indigo-300">{centsFormatted}</span>
              </div>

              {/* Understated corner frame accent (NOT a quantitative scale) */}
              <div className="w-3 h-[2px] rounded-full bg-indigo-400/40" />
            </div>
          ) : (
            /* Alternative B: Split Stacked Dollars & Cents Counter Drum */
            <div className="w-full h-full flex flex-col justify-between p-0.5 bg-slate-950 rounded-[4px]">
              <div className="flex-1 flex flex-col items-center justify-center rounded-t-[3px] bg-slate-900/90 border border-slate-800/90">
                <span
                  className={`font-mono text-slate-400 leading-none ${
                    isLoupe ? 'text-[9px]' : 'text-[6px]'
                  }`}
                >
                  $
                </span>
                <span
                  className={`font-mono font-extrabold text-white tabular-nums leading-tight ${
                    isLoupe ? 'text-sm' : 'text-[9.5px]'
                  }`}
                >
                  {wholeDollars}
                </span>
              </div>
              <div className="h-[1px] w-full bg-indigo-500/40 my-[1px]" />
              <div className="h-[38%] flex flex-col items-center justify-center rounded-b-[3px] bg-indigo-950/50 border border-indigo-800/50">
                <span
                  className={`font-mono font-bold text-indigo-300 tabular-nums leading-none ${
                    isLoupe ? 'text-xs' : 'text-[8px]'
                  }`}
                >
                  {centsFormatted}
                </span>
                <span
                  className={`font-mono text-indigo-400/70 uppercase leading-none mt-0.5 ${
                    isLoupe ? 'text-[7px]' : 'text-[5.5px]'
                  }`}
                >
                  CR
                </span>
              </div>
            </div>
          )
        ) : measurementMode === 'metered_uncapped' ? (
          /* CASE 2: UNCAPPED PAY-AS-YOU-GO (METERED) — No invented capacity or green bar */
          <div className="w-full h-full flex flex-col items-center justify-between py-1.5 px-0.5 bg-gradient-to-b from-slate-900/70 via-slate-950 to-slate-900/70 rounded-[4px] border border-slate-800/80">
            <span
              className={`font-mono font-bold text-slate-400 tracking-widest ${
                isLoupe ? 'text-[8px]' : 'text-[6px]'
              }`}
            >
              PAYG
            </span>
            <div className="flex flex-col items-center gap-1 my-auto">
              <div className="w-2.5 h-[1.5px] bg-slate-600 rounded-full" />
              <span
                className={`font-mono font-bold text-slate-300 tracking-tighter [writing-mode:vertical-rl] rotate-180 ${
                  isLoupe ? 'text-[10px]' : 'text-[7.5px]'
                }`}
              >
                METERED
              </span>
              <div className="w-2.5 h-[1.5px] bg-slate-600 rounded-full" />
            </div>
            <span
              className={`font-mono text-slate-500 ${
                isLoupe ? 'text-[8px]' : 'text-[6px]'
              }`}
            >
              OPEN
            </span>
          </div>
        ) : windowMode === 'stacked' && companionWindow ? (
          /* CASE 3: VERTICALLY STACKED DUAL COMPARTMENTS (Upper 5H + Lower Weekly) */
          <div className="w-full h-full flex flex-col justify-between overflow-hidden">
            {/* Upper smaller compartment: Short window (34% height) */}
            <div
              style={{ height: '33%' }}
              className="w-full rounded-t-[4px] bg-slate-950 border-b border-slate-800 relative flex flex-col justify-end overflow-hidden"
              title={`${companionWindow.label}: ${
                companionPct !== null ? `${companionPct}%` : 'Unavailable'
              } (${companionWindow.resetLabel || 'no reset'})`}
            >
              {isCompanionUnavailable ? (
                <div className="w-full h-full flex items-center justify-center text-[6.5px] font-mono text-slate-500">
                  --
                </div>
              ) : (
                renderProportionalFill(companionPct, true)
              )}
              <span
                className={`absolute top-0.5 inset-x-0 text-center font-mono font-bold leading-none pointer-events-none drop-shadow ${
                  isLoupe ? 'text-[9px]' : 'text-[6.5px]'
                } ${
                  isCompanionExhausted ? 'text-red-300' : 'text-cyan-200'
                }`}
              >
                {companionWindow.label}
              </span>
            </div>

            {/* Distinct structural separator so compartments never look additive */}
            <div className="h-[4px] w-full bg-[#0b0f19] border-y border-slate-700/90 shrink-0 flex items-center justify-center">
              <div className="w-2/3 h-[1px] bg-slate-500/60" />
            </div>

            {/* Lower larger compartment: Primary Weekly window (62% height) */}
            <div
              style={{ height: '62%' }}
              className="w-full rounded-b-[4px] bg-slate-950 relative flex flex-col justify-end overflow-hidden"
            >
              {renderProportionalFill(primaryPct, false)}
            </div>
          </div>
        ) : windowMode === 'companion' && companionWindow ? (
          /* CASE 4: OVERLAID EDGE COMPANION (Full-height primary + narrow edge indicator) */
          <div className="w-full h-full flex items-stretch gap-[2px] overflow-hidden">
            {/* Main full-height primary meter */}
            <div className="flex-1 h-full flex flex-col justify-end overflow-hidden rounded-l-[3px]">
              {renderProportionalFill(primaryPct, false)}
            </div>

            {/* Narrow right-edge short-window companion track */}
            <div
              style={{ width: isLoupe ? '9px' : '5px' }}
              className="h-full bg-slate-950 border-l border-slate-800/90 flex flex-col justify-end relative rounded-r-[3px] shrink-0"
              title={`${companionWindow.label}: ${
                companionPct !== null ? `${companionPct}%` : 'Unavailable'
              } (${companionWindow.resetLabel || 'no reset'})`}
            >
              {isCompanionUnavailable ? (
                <div className="w-full h-full border-r border-dashed border-slate-700" />
              ) : isCompanionExhausted ? (
                /* Exhausted short window: distinct bottom crimson pip + top hollow triangle/dot */
                <div className="w-full h-full flex flex-col justify-between items-center py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full border border-red-400 bg-red-950" />
                  <div className="w-full h-1.5 bg-red-500 shadow-[0_0_6px_#ef4444]" />
                </div>
              ) : (
                <div
                  className="w-full bg-gradient-to-t from-cyan-600 via-sky-400 to-cyan-200 rounded-r-[2px] relative"
                  style={{ height: `${Math.max(8, companionPct ?? 0)}%` }}
                >
                  {/* Distinct notch pip at top of companion bar so reading does not rely on color alone */}
                  <div className="w-full h-[2px] bg-white" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CASE 5: STANDARD SINGLE FULL-HEIGHT METER (Long-period default or Short-only) */
          <div className="w-full h-full flex flex-col justify-end relative overflow-hidden">
            {renderProportionalFill(
              windowMode === 'short' && companionWindow ? companionPct : primaryPct,
              windowMode === 'short'
            )}

            {/* Explicit CAP vs BUDGET top bar marker inside housing */}
            {(measurementMode === 'enforced_cap' || measurementMode === 'personal_budget') && (
              <div
                className={`absolute top-0 inset-x-0 h-[2px] ${
                  measurementMode === 'enforced_cap'
                    ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'
                    : 'border-t border-dashed border-violet-400'
                }`}
              />
            )}
          </div>
        )}
      </div>

      {/* Companion Short-Window Micro Readout (When in Stacked or Companion mode) */}
      {(windowMode === 'stacked' || windowMode === 'companion') && companionWindow && (
        <div
          className={`mt-1 font-mono tabular-nums leading-none text-center truncate w-full ${
            isLoupe ? 'text-[10px]' : 'text-[8px]'
          } ${
            isCompanionUnavailable
              ? 'text-slate-500'
              : isCompanionExhausted
              ? 'text-red-400 font-bold'
              : 'text-cyan-300'
          }`}
        >
          {isCompanionUnavailable
            ? `${companionWindow.label} --`
            : isCompanionExhausted
            ? `${companionWindow.label} 0% · ${companionWindow.resetLabel || 'wait'}`
            : `${companionWindow.label} ${companionPct}%`}
        </div>
      )}

      {/* Provider Icon & Account Name Assembly */}
      <motion.div
        initial={effectiveIdle !== 'off' ? { y: -2 } : false}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="mt-1.5 flex items-center justify-center p-1 rounded-md bg-slate-900/95 border border-slate-800 group-hover:border-slate-700 relative"
      >
        {getVerifiedProviderIcon(
          instrument.providerId,
          instrument.providerName,
          isLoupe ? 20 : 14
        )}

        {/* Tiny semantic corner badge on icon if CAP / BUDGET / AUTH */}
        {measurementMode === 'enforced_cap' && (
          <span
            title="Provider-Enforced Spending Cap"
            className="absolute -top-1 -right-1 bg-slate-950 rounded-full p-[1px]"
          >
            <Lock className="w-2.5 h-2.5 text-amber-400" />
          </span>
        )}
        {measurementMode === 'personal_budget' && (
          <span
            title="Personal Budget Alert (Not Provider Enforced)"
            className="absolute -top-1 -right-1 bg-slate-950 rounded-full p-[1px]"
          >
            <ShieldCheck className="w-2.5 h-2.5 text-violet-400" />
          </span>
        )}
        {(observationStatus === 'auth_required' || observationStatus === 'failing') && (
          <span
            title={instrument.errorDetail || 'Attention required'}
            className="absolute -top-1 -right-1 bg-slate-950 rounded-full p-[1px]"
          >
            <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
          </span>
        )}
      </motion.div>

      {/* Concise Account Label */}
      <span
        className={`font-sans font-semibold text-slate-200 truncate w-full text-center mt-1 leading-tight ${
          isLoupe ? 'text-xs' : 'text-[9.5px]'
        }`}
        title={`${instrument.accountLabel} · ${instrument.entitlementLabel}`}
      >
        {instrument.accountLabel}
      </span>

      {/* Reset Countdown / Status Footer */}
      <span
        className={`font-mono tabular-nums truncate w-full text-center leading-tight mt-0.5 ${
          isLoupe ? 'text-[10px]' : 'text-[8px]'
        } ${
          isCompanionExhausted && (windowMode === 'stacked' || windowMode === 'companion')
            ? 'text-slate-400'
            : capacityState === 'exhausted'
            ? 'text-red-400 font-semibold'
            : 'text-slate-400'
        }`}
      >
        {readout.resetText}
      </span>
    </div>
  );
}
