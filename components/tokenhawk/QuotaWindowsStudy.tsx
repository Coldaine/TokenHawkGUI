'use client';

import React, { useState } from 'react';
import {
  MeterStyle,
  PreviewBackdropMode,
  WindowMode,
} from '@/types/tokenhawk';
import {
  STUDY_1_QUOTA_WINDOW_NORMAL,
  STUDY_1_QUOTA_WINDOW_SHORT_EXHAUSTED,
  STUDY_1_QUOTA_WINDOW_SHORT_UNAVAILABLE,
} from '@/lib/tokenhawk/fixtures';
import MeterCore from '@/components/tokenhawk/MeterCore';
import PreviewBackdropStage from '@/components/tokenhawk/PreviewBackdropStage';
import { ZoomIn, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

export default function QuotaWindowsStudy() {
  const [backdrop, setBackdrop] = useState<PreviewBackdropMode>('dark');
  const [selectedPreference, setSelectedPreference] = useState<WindowMode>('long');
  const [meterStyle, setMeterStyle] = useState<MeterStyle>('liquid');
  const [glassOpacity, setGlassOpacity] = useState(0.88);
  const [loupeState, setLoupeState] = useState<'normal' | 'exhausted' | 'unavailable'>('normal');

  const treatments: Array<{
    code: 'A' | 'B' | 'C';
    mode: WindowMode;
    title: string;
    subtitle: string;
    rationale: string;
  }> = [
    {
      code: 'A',
      mode: 'long',
      title: 'A — Long-period only (Default)',
      subtitle: 'Single primary vertical meter: WEEKLY 62% · resets 3d',
      rationale:
        'Cleanest baseline reading. Short-window fluctuations stay hidden unless the user opts in or a short window is actively throttling.',
    },
    {
      code: 'B',
      mode: 'stacked',
      title: 'B — Vertically stacked',
      subtitle: 'Upper 5H (28% · 1h40m) + Lower WEEKLY (62% · 3d)',
      rationale:
        'Two independently scaled chambers separated by a recessed structural Collar so the values never look additive. Weekly remains visually primary.',
    },
    {
      code: 'C',
      mode: 'companion',
      title: 'C — Overlaid companion',
      subtitle: 'Full-height WEEKLY 62% + narrow 5H edge track',
      rationale:
        'Preserves 100% of the vertical weekly scale while placing a 5px cyan/crimson short-window rail with a top cap pip along the right edge.',
    },
  ];

  const activeLoupeFixture =
    loupeState === 'normal'
      ? STUDY_1_QUOTA_WINDOW_NORMAL
      : loupeState === 'exhausted'
      ? STUDY_1_QUOTA_WINDOW_SHORT_EXHAUSTED
      : STUDY_1_QUOTA_WINDOW_SHORT_UNAVAILABLE;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 font-sans">
      {/* Study Header & Workbench Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0b0f19]/90 border border-slate-800 rounded-xl px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#76b900] font-bold">
              Study 01 · Quota Windows
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-400">
              Illustrative Data · Single Provider Comparison
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
            Single, Vertically Stacked, and Overlaid Companion Meters
          </h1>
        </div>

        {/* External Workbench Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            {(
              [
                { id: 'liquid', label: 'Liquid' },
                { id: 'segmented', label: 'LED' },
                { id: 'needle', label: 'Needle' },
                { id: 'capsule', label: 'Capsule' },
                { id: 'dotmatrix', label: 'Matrix' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setMeterStyle(s.id)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap shrink-0 ${
                  meterStyle === s.id
                    ? 'bg-[#76b900] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <span className="text-slate-400 text-[10px]">Surface Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="0.95"
              step="0.05"
              value={glassOpacity}
              onChange={(e) => setGlassOpacity(parseFloat(e.target.value))}
              className="w-14 h-1 bg-slate-800 rounded appearance-none accent-[#76b900] cursor-pointer"
            />
            <span className="text-slate-200 text-[10px] tabular-nums w-7">
              {Math.round(glassOpacity * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Comparison Grid: Left = Realistic 1:1 Compact Comparison Matrix; Right = 2x Detail Loupe & Preference Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 7 COLS: 1:1 Compact Widget Comparison (Normal vs Short-Window Exhausted) */}
        <PreviewBackdropStage
          backdrop={backdrop}
          onChangeBackdrop={setBackdrop}
          title="1:1 Realistic Compact Desktop Size"
          subtitle="Normal (5H 28%) vs. Short-Window Exhausted (5H 0% · avail 22m)"
          className="lg:col-span-7"
        >
          <div className="flex flex-col gap-5 items-center w-full">
            {/* ROW 1: NORMAL STATE (WEEKLY 62%, 5H 28%) */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-950/85 border border-slate-800 px-2.5 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                <span>Normal State: WEEKLY 62% (resets 3d) · 5H 28% (resets 1h40m)</span>
              </div>

              {/* Exportable Compact Housing */}
              <div
                className="rounded-[14px] border p-3 shadow-2xl backdrop-blur-xl flex items-end gap-4 transition-colors"
                style={{
                  backgroundColor: `rgba(11, 15, 25, ${glassOpacity})`,
                  borderColor: `rgba(30, 41, 59, ${Math.min(1, glassOpacity + 0.15)})`,
                }}
              >
                {treatments.map((t) => (
                  <div key={`normal-${t.code}`} className="flex flex-col items-center">
                    <span className="text-[9px] font-mono font-bold text-slate-400 mb-1">
                      {t.code} · {t.mode.toUpperCase()}
                    </span>
                    <MeterCore
                      instrument={STUDY_1_QUOTA_WINDOW_NORMAL}
                      windowMode={t.mode}
                      meterStyle={meterStyle}
                      scale="compact"
                      isSelected={selectedPreference === t.mode && loupeState === 'normal'}
                      onSelect={() => {
                        setSelectedPreference(t.mode);
                        setLoupeState('normal');
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2: SHORT-WINDOW EXHAUSTED STATE (WEEKLY 62%, 5H 0% · avail 22m) */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-red-300 bg-red-950/80 border border-red-800/70 px-2.5 py-0.5 rounded-md">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span>Short-Window Exhausted: WEEKLY still 62% · 5H 0% (avail 22m)</span>
              </div>

              {/* Exportable Compact Housing */}
              <div
                className="rounded-[14px] border p-3 shadow-2xl backdrop-blur-xl flex items-end gap-4 transition-colors"
                style={{
                  backgroundColor: `rgba(11, 15, 25, ${glassOpacity})`,
                  borderColor: `rgba(30, 41, 59, ${Math.min(1, glassOpacity + 0.15)})`,
                }}
              >
                {treatments.map((t) => (
                  <div key={`exhausted-${t.code}`} className="flex flex-col items-center">
                    <span className="text-[9px] font-mono font-bold text-slate-400 mb-1">
                      {t.code} · {t.mode.toUpperCase()}
                    </span>
                    <MeterCore
                      instrument={STUDY_1_QUOTA_WINDOW_SHORT_EXHAUSTED}
                      windowMode={t.mode}
                      meterStyle={meterStyle}
                      scale="compact"
                      isSelected={selectedPreference === t.mode && loupeState === 'exhausted'}
                      onSelect={() => {
                        setSelectedPreference(t.mode);
                        setLoupeState('exhausted');
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PreviewBackdropStage>

        {/* RIGHT 5 COLS: 2x Detail Enlargement + Display Preference Widget */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {/* 2x Detail Enlargement Loupe */}
          <div className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-[#76b900]" />
                <span className="text-xs font-bold text-slate-100">
                  2x Detail Enlargement ({selectedPreference.toUpperCase()})
                </span>
              </div>

              {/* State Switcher for Loupe */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
                {(
                  [
                    { id: 'normal', label: 'Normal (28%)' },
                    { id: 'exhausted', label: '5H 0% (22m)' },
                    { id: 'unavailable', label: '5H Null' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setLoupeState(st.id)}
                    className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 ${
                      loupeState === st.id
                        ? 'bg-slate-800 text-[#76b900] font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Side-by-Side 1x Compact vs 2x Loupe */}
            <div className="flex items-center justify-around py-3 bg-[#060911] rounded-xl border border-slate-800/70 my-auto">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400">1x Compact</span>
                <div
                  className="p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: `rgba(11, 15, 25, ${glassOpacity})`,
                    borderColor: 'rgba(30, 41, 59, 0.9)',
                  }}
                >
                  <MeterCore
                    instrument={activeLoupeFixture}
                    windowMode={selectedPreference}
                    meterStyle={meterStyle}
                    scale="compact"
                  />
                </div>
              </div>

              <div className="h-32 w-px bg-slate-800" />

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#76b900] font-semibold">
                  2x Enlargement
                </span>
                <div
                  className="p-3 rounded-xl border"
                  style={{
                    backgroundColor: `rgba(11, 15, 25, ${glassOpacity})`,
                    borderColor: 'rgba(51, 65, 85, 0.9)',
                  }}
                >
                  <MeterCore
                    instrument={activeLoupeFixture}
                    windowMode={selectedPreference}
                    meterStyle={meterStyle}
                    scale="loupe"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mt-3 font-mono">
              {selectedPreference === 'long' &&
                'Long-period (Default): Focuses strictly on the 62% weekly allowance resetting in 3d without visual clutter.'}
              {selectedPreference === 'stacked' &&
                'Stacked: Upper 5H chamber (33% height) and lower Weekly chamber (62% height) have a structural collar separator so 28% + 62% never appear additive.'}
              {selectedPreference === 'companion' &&
                'Overlaid Companion: Full-height weekly fill paired with a 5px right-edge track and white/red top marker so both windows remain distinct.'}
              {selectedPreference === 'short' &&
                'Short-period only: Switches the main housing to the 5H rolling window while noting WEEKLY 62% in metadata.'}
            </p>
          </div>

          {/* Display Preference Settings Example Component */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#76b900]" />
                <span className="text-xs font-bold text-slate-100">
                  Widget Display Preference (Per-User Setting)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Not separate subscriptions
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-[11px]">
              {(
                [
                  { id: 'long', label: 'Long period', badge: 'Default' },
                  { id: 'stacked', label: 'Stacked', badge: 'Dual' },
                  { id: 'companion', label: 'Companion', badge: 'Edge' },
                  { id: 'short', label: 'Short period', badge: '5H' },
                ] as const
              ).map((opt) => {
                const active = selectedPreference === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPreference(opt.id)}
                    className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800/90 border-[#76b900] text-white font-bold shadow-sm'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`text-[9px] mt-0.5 ${
                        active ? 'text-[#76b900]' : 'text-slate-500'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
