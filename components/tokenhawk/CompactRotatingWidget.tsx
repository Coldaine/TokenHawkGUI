'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  QuotaInstrumentItem,
  TokenHawkDisplayPreferences,
} from '@/types/tokenhawk';
import {
  getMotionVariants,
  getObservationBadge,
  TOKENHAWK_DESIGN_TOKENS,
} from '@/lib/tokenhawk/designTokens';
import MeterCore from '@/components/tokenhawk/MeterCore';
import { getVerifiedProviderIcon } from '@/components/icons/AIToolLogos';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Pin,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Clock,
  KeyRound,
} from 'lucide-react';

export interface CompactRotatingWidgetProps {
  instruments: QuotaInstrumentItem[];
  preferences: TokenHawkDisplayPreferences;
  onUpdatePreferences?: (partial: Partial<TokenHawkDisplayPreferences>) => void;
  onAdjustDemoRemaining?: (instrumentId: string, delta: number) => void;
  onResetDemoInstrument?: (instrumentId: string) => void;
  showDemoQuickActions?: boolean;
}

/**
 * Reusable 3-Position Compact Quota Overlay Widget (`CompactRotatingWidget`).
 *
 * Designed as the portable deliverable with its own transparent outer surface.
 * - Never computes a synthetic "Combined Runway" average across unrelated providers.
 * - Moves each provider's entire assembly (icon, name, reading, period, reset, meter)
 *   as a single keyed unit so one provider's balance never morphs into another's.
 * - Supports Group (including partially filled last groups like 8 accounts in 3 slots),
 *   Relay (left-to-right 1 slot at a time), and Favorite (1 pinned + 2 rotating).
 * - Automatically pauses on pointer hover, keyboard focus, manual pause, or expanded view,
 *   and resumes with a full reading interval.
 */
export default function CompactRotatingWidget({
  instruments,
  preferences,
  onUpdatePreferences,
  onAdjustDemoRemaining,
  onResetDemoInstrument,
  showDemoQuickActions = false,
}: CompactRotatingWidgetProps) {
  const prefersReducedMotion = useReducedMotion();

  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  // Group rotation state: current page index
  const [groupPage, setGroupPage] = useState(0);

  // Relay rotation state: deterministic step counter (moving left-to-right 1 slot per step)
  const [relayStep, setRelayStep] = useState(0);

  // Favorite rotation state: page index for the 2 non-pinned slots
  const [favPage, setFavPage] = useState(0);

  // Determine pinned instrument for Favorite mode
  const pinnedInstrument = useMemo(() => {
    if (instruments.length === 0) return null;
    return (
      instruments.find((i) => i.instrumentId === preferences.pinnedInstrumentId) ||
      instruments[0]
    );
  }, [instruments, preferences.pinnedInstrumentId]);

  const nonPinnedInstruments = useMemo(() => {
    if (!pinnedInstrument) return instruments;
    return instruments.filter((i) => i.instrumentId !== pinnedInstrument.instrumentId);
  }, [instruments, pinnedInstrument]);

  const totalGroupPages = Math.max(1, Math.ceil(instruments.length / 3));
  const totalFavPages = Math.max(1, Math.ceil(nonPinnedInstruments.length / 2));
  const relayNextSlotIndex = relayStep % 3;

  // Compute the 3 active slot items based on current rotationMode
  const visibleSlots: Array<QuotaInstrumentItem | null> = useMemo(() => {
    if (instruments.length === 0) return [null, null, null];

    if (preferences.rotationMode === 'relay') {
      if (instruments.length <= 3) {
        return [
          instruments[0] ?? null,
          instruments[1] ?? null,
          instruments[2] ?? null,
        ];
      }
      // Deterministic left-to-right relay progression across `relayStep` ticks
      const currentIndices = [0, 1, 2];
      let cursor = 3 % instruments.length;
      for (let s = 0; s < relayStep; s++) {
        const targetSlot = s % 3;
        currentIndices[targetSlot] = cursor;
        cursor = (cursor + 1) % instruments.length;
      }
      return [
        instruments[currentIndices[0]] ?? null,
        instruments[currentIndices[1]] ?? null,
        instruments[currentIndices[2]] ?? null,
      ];
    }

    if (preferences.rotationMode === 'favorite') {
      const safePage = favPage % totalFavPages;
      const start = safePage * 2;
      return [
        pinnedInstrument,
        nonPinnedInstruments[start] ?? null,
        nonPinnedInstruments[start + 1] ?? null,
      ];
    }

    // Default: 'group' mode — preserves partial final group (e.g., 8 accounts -> [3, 3, 2])
    const safePage = groupPage % totalGroupPages;
    const start = safePage * 3;
    return [
      instruments[start] ?? null,
      instruments[start + 1] ?? null,
      instruments[start + 2] ?? null,
    ];
  }, [
    instruments,
    preferences.rotationMode,
    relayStep,
    favPage,
    totalFavPages,
    pinnedInstrument,
    nonPinnedInstruments,
    groupPage,
    totalGroupPages,
  ]);

  const visibleIds = useMemo(
    () => new Set(visibleSlots.filter(Boolean).map((s) => s!.instrumentId)),
    [visibleSlots]
  );

  // Advance step handler
  const stepForward = useCallback(() => {
    if (instruments.length <= 3) return;

    if (preferences.rotationMode === 'group') {
      setGroupPage((prev) => (prev + 1) % totalGroupPages);
    } else if (preferences.rotationMode === 'favorite') {
      setFavPage((prev) => (prev + 1) % totalFavPages);
    } else if (preferences.rotationMode === 'relay') {
      setRelayStep((prev) => prev + 1);
    }
  }, [
    instruments.length,
    preferences.rotationMode,
    totalGroupPages,
    totalFavPages,
  ]);

  const stepBackward = useCallback(() => {
    if (instruments.length <= 3) return;

    if (preferences.rotationMode === 'group') {
      setGroupPage((prev) => (prev - 1 + totalGroupPages) % totalGroupPages);
    } else if (preferences.rotationMode === 'favorite') {
      setFavPage((prev) => (prev - 1 + totalFavPages) % totalFavPages);
    } else if (preferences.rotationMode === 'relay') {
      setRelayStep((prev) => Math.max(0, prev - 1));
    }
  }, [
    instruments.length,
    preferences.rotationMode,
    totalGroupPages,
    totalFavPages,
  ]);

  // Direct jump to any account from the compact navigation strip
  const jumpToInstrument = useCallback(
    (target: QuotaInstrumentItem) => {
      const idx = instruments.findIndex((i) => i.instrumentId === target.instrumentId);
      if (idx === -1) return;

      setInspectedId(target.instrumentId);

      if (preferences.rotationMode === 'group') {
        setGroupPage(Math.floor(idx / 3));
      } else if (preferences.rotationMode === 'favorite') {
        if (target.instrumentId === pinnedInstrument?.instrumentId) return;
        const nonPinIdx = nonPinnedInstruments.findIndex(
          (i) => i.instrumentId === target.instrumentId
        );
        if (nonPinIdx !== -1) {
          setFavPage(Math.floor(nonPinIdx / 2));
        }
      } else if (preferences.rotationMode === 'relay') {
        setRelayStep(Math.max(0, idx - 2));
      }
    },
    [instruments, preferences.rotationMode, pinnedInstrument, nonPinnedInstruments]
  );

  // Rotation pause condition: paused on pointer hover, keyboard focus, manual pause, or expanded details
  const isRotationPaused =
    isHovered ||
    isFocusedWithin ||
    isManuallyPaused ||
    isExpanded ||
    instruments.length <= 3;

  // Deterministic interval timer: resets to a FULL reading interval whenever resumed!
  useEffect(() => {
    if (isRotationPaused) return;
    const intervalMs = Math.max(1500, preferences.rotationIntervalSec * 1000);
    const timer = setInterval(() => {
      stepForward();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isRotationPaused, preferences.rotationIntervalSec, stepForward]);

  // Identify off-screen accounts that need attention (exhausted, warning, stale, auth_required, failing)
  const offScreenAttentionItems = useMemo(() => {
    return instruments.filter((item) => {
      if (visibleIds.has(item.instrumentId)) return false;
      return (
        item.capacityState === 'exhausted' ||
        item.capacityState === 'warning' ||
        item.observationStatus !== 'working' ||
        item.companionWindow?.isExhausted
      );
    });
  }, [instruments, visibleIds]);

  const inspectedInstrument = useMemo(
    () => instruments.find((i) => i.instrumentId === inspectedId) || null,
    [instruments, inspectedId]
  );

  const motionSpec = getMotionVariants(
    preferences.motionTreatment,
    Boolean(prefersReducedMotion)
  );

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocusedWithin(false);
        }
      }}
      className="relative inline-flex flex-col items-center select-none font-sans"
    >
      {/* THE PORTABLE TRANSPARENT WIDGET SURFACE */}
      <div
        className="rounded-[16px] border p-3 shadow-2xl backdrop-blur-2xl transition-colors duration-200 flex flex-col"
        style={{
          backgroundColor: `rgba(11, 15, 25, ${preferences.glassOpacity})`,
          borderColor: `rgba(30, 41, 59, ${Math.min(1, preferences.glassOpacity + 0.16)})`,
          boxShadow: `0 18px 42px rgba(0, 0, 0, ${preferences.glassOpacity * 0.85})`,
          minWidth: isExpanded ? '340px' : '252px',
        }}
      >
        {/* Discreet Widget Header: Mode Indicator, Off-Screen Alert Count, Prev/Pause/Next & Expand */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/85">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-200">
              TokenHawk
            </span>
            <span className="text-slate-600 text-[10px]">·</span>
            <span className="text-[9.5px] font-mono text-slate-400">
              {preferences.rotationMode === 'group'
                ? `GRP ${
                    instruments.length > 0 ? (groupPage % totalGroupPages) + 1 : 1
                  }/${totalGroupPages}`
                : preferences.rotationMode === 'relay'
                ? `RELAY S${relayNextSlotIndex + 1}`
                : 'FAV+2'}
            </span>

            {/* Persistent Off-Screen Warning Marker Summary */}
            {offScreenAttentionItems.length > 0 && !isExpanded && (
              <button
                type="button"
                onClick={() => jumpToInstrument(offScreenAttentionItems[0])}
                title={`${offScreenAttentionItems.length} off-screen account(s) need attention. Click to jump to ${offScreenAttentionItems[0].accountLabel}.`}
                className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded bg-amber-950/90 border border-amber-700/70 text-[9px] font-mono font-bold text-amber-300 hover:bg-amber-900/90 transition-colors"
              >
                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                <span>{offScreenAttentionItems.length}</span>
              </button>
            )}
          </div>

          {/* Discreet Rotation & Expand Controls */}
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              type="button"
              onClick={stepBackward}
              disabled={instruments.length <= 3 || isExpanded}
              title="Previous account / group"
              className="p-1 rounded hover:bg-slate-800/80 hover:text-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setIsManuallyPaused((p) => !p)}
              title={
                isManuallyPaused
                  ? 'Resume rotation (resets to full reading interval)'
                  : isHovered || isFocusedWithin
                  ? 'Auto-paused while interacting (click to lock pause)'
                  : 'Pause rotation'
              }
              className={`p-1 rounded transition-colors ${
                isManuallyPaused
                  ? 'bg-amber-500/20 text-amber-300'
                  : isHovered || isFocusedWithin
                  ? 'text-[#76b900]'
                  : 'hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              {isManuallyPaused || isHovered || isFocusedWithin || isExpanded ? (
                <Play className="w-2.5 h-2.5" />
              ) : (
                <Pause className="w-2.5 h-2.5" />
              )}
            </button>

            <button
              type="button"
              onClick={stepForward}
              disabled={instruments.length <= 3 || isExpanded}
              title="Next account / group"
              className="p-1 rounded hover:bg-slate-800/80 hover:text-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            <div className="h-3 w-px bg-slate-800 mx-0.5" />

            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              title={
                isExpanded
                  ? 'Collapse to 3-slot compact view (resumes rotation)'
                  : `Expand all ${instruments.length} accounts (pauses rotation)`
              }
              className={`p-1 rounded transition-colors ${
                isExpanded
                  ? 'bg-[#76b900]/20 text-[#76b900]'
                  : 'hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              {isExpanded ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* COMPACT 3-POSITION STAGE (Default) vs. EXPANDED INVENTORY GRID     */}
        {/* ================================================================== */}
        {!isExpanded ? (
          <div className="flex items-end justify-center gap-2.5 py-0.5 min-h-[168px]">
            {[0, 1, 2].map((slotIdx) => {
              const slotItem = visibleSlots[slotIdx];
              const isSlotPinned =
                preferences.rotationMode === 'favorite' && slotIdx === 0;

              return (
                <div
                  key={`slot-container-${slotIdx}`}
                  style={{
                    width: `${TOKENHAWK_DESIGN_TOKENS.dimensions.compactSlotWidthPx}px`,
                  }}
                  className="relative flex items-center justify-center"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {slotItem ? (
                      /* Keyed by instrumentId so the ENTIRE assembly transitions as one unit */
                      <motion.div
                        key={slotItem.instrumentId}
                        initial={motionSpec.initial}
                        animate={motionSpec.animate}
                        exit={motionSpec.exit}
                        transition={{
                          ...motionSpec.transition,
                          delay:
                            preferences.motionTreatment === 'instrument_reel' &&
                            preferences.rotationMode === 'group' &&
                            !prefersReducedMotion
                              ? slotIdx * 0.055
                              : 0,
                        }}
                        className="w-full flex flex-col items-center"
                      >
                        <MeterCore
                          instrument={slotItem}
                          windowMode={preferences.windowMode}
                          prepaidTreatment={preferences.prepaidTreatment}
                          meterStyle={preferences.meterStyle}
                          idleEffect={preferences.idleEffect}
                          scale="compact"
                          isPinned={isSlotPinned}
                          isSelected={inspectedId === slotItem.instrumentId}
                          onSelect={(inst) =>
                            setInspectedId((prev) =>
                              prev === inst.instrumentId ? null : inst.instrumentId
                            )
                          }
                        />
                      </motion.div>
                    ) : (
                      /* Partially filled final group slot (e.g., 8 accounts in 3 positions -> [3, 3, 2]) */
                      <motion.div
                        key={`empty-slot-${slotIdx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-[156px] rounded-xl border border-dashed border-slate-800/70 bg-slate-950/30 flex flex-col items-center justify-center p-2 text-center"
                        title="Unoccupied position in partially filled final group (preserves stable slot width without duplicating accounts)"
                      >
                        <span className="text-[8px] font-mono text-slate-600 uppercase">
                          Empty
                        </span>
                        <span className="text-[7.5px] font-mono text-slate-600 mt-1">
                          Slot {slotIdx + 1}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          /* EXPANDED FULL INVENTORY VIEW (Automatically pauses rotation) */
          <div className="max-h-[340px] overflow-y-auto pr-1 py-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 px-1">
              <span>All {instruments.length} Accounts (Rotation Paused)</span>
              <span>Click any slot to inspect or pin</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 justify-items-center">
              {instruments.map((inst) => (
                <MeterCore
                  key={`expanded-${inst.instrumentId}`}
                  instrument={inst}
                  windowMode={preferences.windowMode}
                  prepaidTreatment={preferences.prepaidTreatment}
                  meterStyle={preferences.meterStyle}
                  idleEffect={preferences.idleEffect}
                  scale="compact"
                  isPinned={
                    preferences.rotationMode === 'favorite' &&
                    pinnedInstrument?.instrumentId === inst.instrumentId
                  }
                  isSelected={inspectedId === inst.instrumentId}
                  onSelect={(clicked) =>
                    setInspectedId((prev) =>
                      prev === clicked.instrumentId ? null : clicked.instrumentId
                    )
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* COMPACT PROVIDER ICON STRIP FOR DIRECT NAVIGATION & PERSISTENT OFF-SCREEN WARNINGS */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 px-0.5">
            <span>
              {instruments.length} Accounts ·{' '}
              {isRotationPaused
                ? isExpanded
                  ? 'Paused (Expanded)'
                  : isManuallyPaused
                  ? 'Paused'
                  : 'Paused (Hover)'
                : `Every ${preferences.rotationIntervalSec}s`}
            </span>
            <span>Direct Jump &amp; Alerts</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 max-w-[260px] sm:max-w-[300px]">
            {instruments.map((item) => {
              const isVis = visibleIds.has(item.instrumentId);
              const isPin =
                preferences.rotationMode === 'favorite' &&
                pinnedInstrument?.instrumentId === item.instrumentId;
              const isExhaustedOrFail =
                item.capacityState === 'exhausted' ||
                item.observationStatus === 'auth_required' ||
                item.observationStatus === 'failing' ||
                item.companionWindow?.isExhausted;
              const isWarnOrStale =
                !isExhaustedOrFail &&
                (item.capacityState === 'warning' || item.observationStatus === 'stale');

              return (
                <button
                  key={`nav-${item.instrumentId}`}
                  type="button"
                  onClick={() => jumpToInstrument(item)}
                  title={`${item.accountLabel} (${item.entitlementLabel})${
                    !isVis && (isExhaustedOrFail || isWarnOrStale)
                      ? ' — Off-screen account needing attention'
                      : ''
                  }`}
                  className={`relative p-1 rounded-md border transition-all ${
                    isVis
                      ? 'bg-slate-800 border-slate-600 ring-1 ring-[#76b900]/50'
                      : 'bg-slate-950/70 border-slate-800/80 opacity-65 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  {getVerifiedProviderIcon(item.providerId, item.providerName, 11)}

                  {/* Persistent Warning Marker for Accounts (Especially Off-Screen) */}
                  {isExhaustedOrFail && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-slate-950"
                      aria-label="Critical or exhausted account"
                    />
                  )}
                  {isWarnOrStale && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-slate-950"
                      aria-label="Warning or stale account"
                    />
                  )}
                  {isPin && (
                    <span
                      className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#76b900] border border-slate-950"
                      aria-label="Pinned favorite"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* INSPECTED ACCOUNT DETAIL DRAWER (Pauses rotation while open) */}
        <AnimatePresence>
          {inspectedInstrument && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-300 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="truncate">
                  <span className="font-bold text-white">
                    {inspectedInstrument.accountLabel}
                  </span>{' '}
                  <span className="text-slate-400">
                    · {inspectedInstrument.entitlementLabel}
                  </span>
                </div>
                {onUpdatePreferences && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePreferences({
                        rotationMode: 'favorite',
                        pinnedInstrumentId: inspectedInstrument.instrumentId,
                      })
                    }
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] shrink-0 ${
                      preferences.rotationMode === 'favorite' &&
                      pinnedInstrument?.instrumentId === inspectedInstrument.instrumentId
                        ? 'bg-[#76b900]/20 border-[#76b900] text-[#76b900] font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Pin className="w-2.5 h-2.5" />
                    <span>Pin Fav</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-slate-400">
                <span>
                  Capacity:{' '}
                  <strong className="text-slate-200 uppercase">
                    {inspectedInstrument.capacityState}
                  </strong>
                </span>
                <span>
                  Status:{' '}
                  <strong
                    className={
                      getObservationBadge(inspectedInstrument.observationStatus).show
                        ? 'text-amber-300 uppercase'
                        : 'text-emerald-400 uppercase'
                    }
                  >
                    {inspectedInstrument.observationStatus}
                  </strong>
                </span>
                {inspectedInstrument.sharedKeyCount && (
                  <span className="inline-flex items-center gap-0.5 text-indigo-300">
                    <KeyRound className="w-2.5 h-2.5" />
                    <span>{inspectedInstrument.sharedKeyCount} keys share pool</span>
                  </span>
                )}
              </div>

              {inspectedInstrument.errorDetail && (
                <div className="mt-1 px-2 py-1 rounded bg-red-950/60 border border-red-800/60 text-red-300 text-[9px]">
                  {inspectedInstrument.errorDetail}
                </div>
              )}

              {/* Optional Workbench Demo Decrement/Refill Controls */}
              {showDemoQuickActions &&
                onAdjustDemoRemaining &&
                onResetDemoInstrument &&
                inspectedInstrument.primaryWindow.remaining !== null && (
                  <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
                    <span className="text-[9px] text-slate-500">Workbench Sim:</span>
                    <button
                      type="button"
                      onClick={() =>
                        onAdjustDemoRemaining(inspectedInstrument.instrumentId, -10)
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-[9px]"
                    >
                      -10% / -$5
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAdjustDemoRemaining(inspectedInstrument.instrumentId, -1000)
                      }
                      className="px-1.5 py-0.5 rounded bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-[9px]"
                    >
                      Exhaust (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onResetDemoInstrument(inspectedInstrument.instrumentId)
                      }
                      className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-[9px]"
                    >
                      Restore
                    </button>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
