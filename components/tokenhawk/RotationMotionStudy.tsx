'use client';

import React, { useState, useCallback } from 'react';
import {
  IdleEffectLevel,
  MeterStyle,
  MotionTreatment,
  PreviewBackdropMode,
  QuotaInstrumentItem,
  RotationMode,
  TokenHawkDisplayPreferences,
  WindowMode,
} from '@/types/tokenhawk';
import { DEFAULT_TOKENHAWK_PREFERENCES } from '@/lib/tokenhawk/designTokens';
import {
  FIXTURE_18_ACCOUNTS,
  FIXTURE_30_ACCOUNTS,
  FIXTURE_3_ACCOUNTS,
  FIXTURE_8_ACCOUNTS,
} from '@/lib/tokenhawk/fixtures';
import CompactRotatingWidget from '@/components/tokenhawk/CompactRotatingWidget';
import PreviewBackdropStage from '@/components/tokenhawk/PreviewBackdropStage';
import {
  RotateCw,
  Sparkles,
  Layers,
  Pin,
  Clock,
  Sliders,
  RefreshCcw,
} from 'lucide-react';

type FixtureScale = '3' | '8' | '18' | '30';

export default function RotationMotionStudy() {
  const [backdrop, setBackdrop] = useState<PreviewBackdropMode>('dark');
  const [fixtureScale, setFixtureScale] = useState<FixtureScale>('18');
  const [preferences, setPreferences] = useState<TokenHawkDisplayPreferences>(
    DEFAULT_TOKENHAWK_PREFERENCES
  );

  // Maintain mutable workbench copies of the selected fixture inventory for interactive testing
  const [customInventories, setCustomInventories] = useState<
    Record<FixtureScale, QuotaInstrumentItem[]>
  >(() => ({
    '3': FIXTURE_3_ACCOUNTS,
    '8': FIXTURE_8_ACCOUNTS,
    '18': FIXTURE_18_ACCOUNTS,
    '30': FIXTURE_30_ACCOUNTS,
  }));

  const activeInventory = customInventories[fixtureScale];

  const handleUpdatePreferences = useCallback(
    (partial: Partial<TokenHawkDisplayPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...partial };
        // Update default interval when switching between Group/Favorite (8s) and Relay (3s)
        if (partial.rotationMode && partial.rotationIntervalSec === undefined) {
          next.rotationIntervalSec = partial.rotationMode === 'relay' ? 3 : 8;
        }
        return next;
      });
    },
    []
  );

  const handleAdjustDemoRemaining = useCallback(
    (instrumentId: string, delta: number) => {
      setCustomInventories((prev) => ({
        ...prev,
        [fixtureScale]: prev[fixtureScale].map((item) => {
          if (item.instrumentId !== instrumentId) return item;
          const curRem = item.primaryWindow.remaining ?? 0;
          const nextRem = Math.max(0, Number((curRem + delta).toFixed(2)));
          const limit = item.primaryWindow.limit;
          const nextPct =
            item.primaryWindow.unit === 'percent'
              ? Math.min(100, nextRem)
              : limit && limit > 0
              ? Math.min(100, (nextRem / limit) * 100)
              : null;

          return {
            ...item,
            primaryWindow: {
              ...item.primaryWindow,
              remaining: nextRem,
              percentRemaining: nextPct,
              isExhausted: nextRem <= 0,
            },
            capacityState:
              nextRem <= 0
                ? 'exhausted'
                : nextPct !== null && nextPct <= 25
                ? 'warning'
                : item.measurementMode === 'prepaid_no_max'
                ? 'unbounded'
                : 'nominal',
          };
        }),
      }));
    },
    [fixtureScale]
  );

  const handleResetDemoInstrument = useCallback(
    (instrumentId: string) => {
      const sourceList =
        fixtureScale === '3'
          ? FIXTURE_3_ACCOUNTS
          : fixtureScale === '8'
          ? FIXTURE_8_ACCOUNTS
          : fixtureScale === '30'
          ? FIXTURE_30_ACCOUNTS
          : FIXTURE_18_ACCOUNTS;
      const original = sourceList.find((i) => i.instrumentId === instrumentId);
      if (!original) return;

      setCustomInventories((prev) => ({
        ...prev,
        [fixtureScale]: prev[fixtureScale].map((item) =>
          item.instrumentId === instrumentId ? original : item
        ),
      }));
    },
    [fixtureScale]
  );

  const handleRestoreAllFixtures = useCallback(() => {
    setCustomInventories({
      '3': FIXTURE_3_ACCOUNTS,
      '8': FIXTURE_8_ACCOUNTS,
      '18': FIXTURE_18_ACCOUNTS,
      '30': FIXTURE_30_ACCOUNTS,
    });
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 font-sans">
      {/* Study 3 Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0b0f19]/90 border border-slate-800 rounded-xl px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#76b900] font-bold">
              Study 03 · Rotation, Motion &amp; Multi-Account Fixtures
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-400">
              3-Slot Compact Widget · Whole-Assembly Transitions
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
            Group, Relay &amp; Favorite Rotation with Carousel, Reel, and Depth Shuffle Motion
          </h1>
        </div>

        {/* Inventory Scale Selector (3, 8, 18, 30 Accounts) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <span className="text-slate-500 px-1.5 text-[10px]">Fixture Inventory:</span>
            {(
              [
                { id: '3', label: '3 Accts' },
                { id: '8', label: '8 Accts [3,3,2]' },
                { id: '18', label: '18 Accts (Default)' },
                { id: '30', label: '30 Accts' },
              ] as const
            ).map((scale) => (
              <button
                key={scale.id}
                type="button"
                onClick={() => setFixtureScale(scale.id)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap shrink-0 ${
                  fixtureScale === scale.id
                    ? 'bg-[#76b900] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scale.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRestoreAllFixtures}
            title="Reset sample fixtures"
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split: Left = Isolated Preview Stage with the Compact Widget; Right = Separate Workbench Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 7 COLS: Preview Backdrop Stage containing ONLY the Compact Widget */}
        <PreviewBackdropStage
          backdrop={backdrop}
          onChangeBackdrop={setBackdrop}
          title={`Compact Overlay Widget (${activeInventory.length} Sample Accounts)`}
          subtitle="Hover, focus, or expand to pause rotation"
          className="lg:col-span-7"
        >
          <CompactRotatingWidget
            instruments={activeInventory}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onAdjustDemoRemaining={handleAdjustDemoRemaining}
            onResetDemoInstrument={handleResetDemoInstrument}
            showDemoQuickActions={true}
          />
        </PreviewBackdropStage>

        {/* RIGHT 5 COLS: Separate Workbench Animation & Display Preferences Panel */}
        <div className="lg:col-span-5 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#76b900]" />
              <span className="font-bold text-slate-100">
                External Preview &amp; Motion Controls
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Outside Widget</span>
          </div>

          {/* 1. Rotation Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <RotateCw className="w-3 h-3 text-[#76b900]" />
                <span>Rotation Mode</span>
              </span>
              <span className="text-slate-400">
                Interval: {preferences.rotationIntervalSec}s
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
              {(
                [
                  { id: 'group', label: 'Group', desc: 'All 3 (8s)' },
                  { id: 'relay', label: 'Relay', desc: '1 L→R (3s)' },
                  { id: 'favorite', label: 'Favorite', desc: '1 Pin + 2 (8s)' },
                ] as const
              ).map((rm) => {
                const active = preferences.rotationMode === rm.id;
                return (
                  <button
                    key={rm.id}
                    type="button"
                    onClick={() => handleUpdatePreferences({ rotationMode: rm.id })}
                    className={`flex flex-col items-center py-1.5 px-2 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800 border-[#76b900] text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{rm.label}</span>
                    <span className="text-[8.5px] text-slate-400 mt-0.5">{rm.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Adjustable Interval Slider & Favorite Pin Picker */}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 font-mono text-[10px]">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Reading Interval:</span>
                  </span>
                  <span className="text-[#76b900] font-bold">
                    {preferences.rotationIntervalSec}s
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={preferences.rotationIntervalSec}
                  onChange={(e) =>
                    handleUpdatePreferences({
                      rotationIntervalSec: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-1 bg-slate-800 rounded appearance-none accent-[#76b900] cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Pin className="w-3 h-3 text-slate-500" />
                  <span>Pinned Favorite:</span>
                </span>
                <select
                  value={preferences.pinnedInstrumentId || activeInventory[0]?.instrumentId}
                  onChange={(e) =>
                    handleUpdatePreferences({
                      pinnedInstrumentId: e.target.value,
                      rotationMode: 'favorite',
                    })
                  }
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 font-mono"
                >
                  {activeInventory.map((item) => (
                    <option key={item.instrumentId} value={item.instrumentId}>
                      {item.accountLabel} ({item.primaryWindow.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Motion Treatment Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Whole-Assembly Motion Treatment</span>
              </span>
              <span className="text-[10px] text-slate-500">Zero value morphing</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
              {(
                [
                  { id: 'carousel_glide', label: 'Carousel Glide', desc: 'Horiz Spring' },
                  { id: 'instrument_reel', label: 'Instrument Reel', desc: 'Vert Stagger' },
                  { id: 'depth_shuffle', label: 'Depth Shuffle', desc: 'Z-Focus Shift' },
                ] as const
              ).map((mt) => {
                const active = preferences.motionTreatment === mt.id;
                return (
                  <button
                    key={mt.id}
                    type="button"
                    onClick={() => handleUpdatePreferences({ motionTreatment: mt.id })}
                    className={`flex flex-col items-center py-1.5 px-2 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800 border-cyan-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{mt.label}</span>
                    <span className="text-[8.5px] text-slate-400 mt-0.5">{mt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Restrained Idle Effects Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Idle Micro-Effects</span>
              </span>
              <span className="text-[10px] text-slate-500">Never alters values</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
              {(
                [
                  { id: 'off', label: 'Off', desc: 'Static' },
                  { id: 'subtle', label: 'Subtle (Default)', desc: 'Soft Shimmer' },
                  { id: 'playful', label: 'Playful', desc: 'Lively Sheen' },
                ] as const
              ).map((ie: { id: IdleEffectLevel; label: string; desc: string }) => {
                const active = preferences.idleEffect === ie.id;
                return (
                  <button
                    key={ie.id}
                    type="button"
                    onClick={() => handleUpdatePreferences({ idleEffect: ie.id })}
                    className={`flex flex-col items-center py-1.5 px-2 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800 border-amber-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{ie.label}</span>
                    <span className="text-[8.5px] text-slate-400 mt-0.5">{ie.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Window Mode, Prepaid Treatment & Meter Style */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 font-mono text-[10px]">
            <div>
              <span className="text-slate-400 block mb-1">Quota Window Mode:</span>
              <select
                value={preferences.windowMode}
                onChange={(e) =>
                  handleUpdatePreferences({ windowMode: e.target.value as WindowMode })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
              >
                <option value="long">Long period (Default)</option>
                <option value="stacked">Stacked (5H + Weekly)</option>
                <option value="companion">Overlaid Companion</option>
                <option value="short">Short period only</option>
              </select>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Meter Visual Style:</span>
              <select
                value={preferences.meterStyle}
                onChange={(e) =>
                  handleUpdatePreferences({ meterStyle: e.target.value as MeterStyle })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
              >
                <option value="liquid">Liquid Equalizer</option>
                <option value="segmented">Segmented LED VU</option>
                <option value="needle">Micro-Needle</option>
                <option value="capsule">Glass Capsule</option>
                <option value="dotmatrix">Matrix (Dot-Matrix)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
