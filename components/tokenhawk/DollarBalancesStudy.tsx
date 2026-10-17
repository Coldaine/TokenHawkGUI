'use client';

import React, { useState } from 'react';
import {
  MeterStyle,
  PrepaidTreatment,
  PreviewBackdropMode,
} from '@/types/tokenhawk';
import { STUDY_2_DOLLAR_SLOTS } from '@/lib/tokenhawk/fixtures';
import MeterCore from '@/components/tokenhawk/MeterCore';
import PreviewBackdropStage from '@/components/tokenhawk/PreviewBackdropStage';
import { Lock, ShieldCheck, KeyRound, DollarSign } from 'lucide-react';

interface DollarBalancesStudyProps {
  preferredPrepaid?: PrepaidTreatment;
  onChangePreferredPrepaid?: (treatment: PrepaidTreatment) => void;
}

export default function DollarBalancesStudy({
  preferredPrepaid = 'digital_readout',
  onChangePreferredPrepaid,
}: DollarBalancesStudyProps) {
  const [backdrop, setBackdrop] = useState<PreviewBackdropMode>('dark');
  const [meterStyle, setMeterStyle] = useState<MeterStyle>('liquid');
  const [glassOpacity, setGlassOpacity] = useState(0.88);
  const [slot3Mode, setSlot3Mode] = useState<'enforced_cap' | 'personal_budget'>('enforced_cap');

  const buildFourSlots = () => [
    STUDY_2_DOLLAR_SLOTS.includedAllowance,
    STUDY_2_DOLLAR_SLOTS.prepaidNoMax,
    slot3Mode === 'enforced_cap'
      ? STUDY_2_DOLLAR_SLOTS.enforcedCap
      : STUDY_2_DOLLAR_SLOTS.personalBudget,
    STUDY_2_DOLLAR_SLOTS.uncappedMetered,
  ];

  const fourSlots = buildFourSlots();

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 font-sans">
      {/* Study Header & Workbench Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0b0f19]/90 border border-slate-800 rounded-xl px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#76b900] font-bold">
              Study 02 · Dollar Balances &amp; Limits
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-400">
              Illustrative Data · Uniform 4-Slot Instrument Family
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
            Included Credits, Uncapped Prepaid Balances, Enforced Caps vs. Budgets, and Metered PAYG
          </h1>
        </div>

        {/* External Workbench Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Toggle Slot 3 between CAP and BUDGET */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <span className="text-slate-500 px-1.5 text-[10px]">Slot 3 Limit:</span>
            <button
              type="button"
              onClick={() => setSlot3Mode('enforced_cap')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap shrink-0 ${
                slot3Mode === 'enforced_cap'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enforced CAP
            </button>
            <button
              type="button"
              onClick={() => setSlot3Mode('personal_budget')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap shrink-0 ${
                slot3Mode === 'personal_budget'
                  ? 'bg-violet-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Personal BUDGET
            </button>
          </div>

          {/* Style Switcher */}
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
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON OF BOTH PREPAID ALTERNATIVES IN FULL 4-SLOT CONTEXT */}
      <PreviewBackdropStage
        backdrop={backdrop}
        onChangeBackdrop={setBackdrop}
        title="Side-by-Side 4-Slot Instrument Comparison (Prepaid Alternative A vs. Alternative B)"
        subtitle="Consistent slot width (68px), icon placement, and typography across all four monetary states"
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full max-w-5xl items-center justify-items-center">
          {/* ALTERNATIVE A ASSEMBLY */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono">
              <span className="font-bold text-indigo-300">
                Prepaid Alt A · Vertical Digital Readout
              </span>
              <span className="text-[10px] text-slate-400">(Proposed Default)</span>
              {onChangePreferredPrepaid && (
                <button
                  type="button"
                  onClick={() => onChangePreferredPrepaid('digital_readout')}
                  className={`ml-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
                    preferredPrepaid === 'digital_readout'
                      ? 'bg-[#76b900] text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {preferredPrepaid === 'digital_readout' ? 'Selected' : 'Use in Widget'}
                </button>
              )}
            </div>

            {/* Exportable 4-Slot Compact Widget (Alt A) */}
            <div
              className="rounded-[14px] border p-3 shadow-2xl backdrop-blur-xl flex items-end gap-2.5"
              style={{
                backgroundColor: `rgba(11, 15, 25, ${glassOpacity})`,
                borderColor: `rgba(30, 41, 59, ${Math.min(1, glassOpacity + 0.15)})`,
              }}
            >
              {fourSlots.map((slot, idx) => (
                <div key={`alt-a-${slot.instrumentId}`} className="flex flex-col items-center">
                  <span className="text-[8px] font-mono text-slate-500 mb-0.5">
                    0{idx + 1}
                  </span>
                  <MeterCore
                    instrument={slot}
                    prepaidTreatment="digital_readout"
                    meterStyle={meterStyle}
                    scale="compact"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ALTERNATIVE B ASSEMBLY */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono">
              <span className="font-bold text-indigo-300">
                Prepaid Alt B · Split Dollars &amp; Cents Counter
              </span>
              {onChangePreferredPrepaid && (
                <button
                  type="button"
                  onClick={() => onChangePreferredPrepaid('split_counter')}
                  className={`ml-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
                    preferredPrepaid === 'split_counter'
                      ? 'bg-[#76b900] text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {preferredPrepaid === 'split_counter' ? 'Selected' : 'Use in Widget'}
                </button>
              )}
            </div>

            {/* Exportable 4-Slot Compact Widget (Alt B) */}
            <div
              className="rounded-[14px] border p-3 shadow-2xl backdrop-blur-xl flex items-end gap-2.5"
              style={{
                backgroundColor: `rgba(11, 15, 25, ${glassOpacity})`,
                borderColor: `rgba(30, 41, 59, ${Math.min(1, glassOpacity + 0.15)})`,
              }}
            >
              {fourSlots.map((slot, idx) => (
                <div key={`alt-b-${slot.instrumentId}`} className="flex flex-col items-center">
                  <span className="text-[8px] font-mono text-slate-500 mb-0.5">
                    0{idx + 1}
                  </span>
                  <MeterCore
                    instrument={slot}
                    prepaidTreatment="split_counter"
                    meterStyle={meterStyle}
                    scale="compact"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PreviewBackdropStage>

      {/* Bottom Row: Side-by-Side CAP vs BUDGET Enlargement + 4-Slot Specification Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CAP vs BUDGET Direct Comparison */}
        <div className="lg:col-span-5 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-100">
                Slot 3 Close-Up: Enforced CAP vs. Personal BUDGET
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">2x Detail</span>
          </div>

          <div className="flex items-center justify-around py-3 bg-[#060911] rounded-xl border border-slate-800/80 my-auto">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 font-bold">
                <Lock className="w-3 h-3" />
                <span>Provider CAP</span>
              </div>
              <MeterCore
                instrument={STUDY_2_DOLLAR_SLOTS.enforcedCap}
                meterStyle={meterStyle}
                scale="loupe"
              />
            </div>

            <div className="h-36 w-px bg-slate-800" />

            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1 text-[10px] font-mono text-violet-300 font-bold">
                <ShieldCheck className="w-3 h-3" />
                <span>Personal BUDGET</span>
              </div>
              <MeterCore
                instrument={STUDY_2_DOLLAR_SLOTS.personalBudget}
                meterStyle={meterStyle}
                scale="loupe"
              />
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 mt-3 leading-relaxed">
            Provider-enforced limits display a solid amber housing border, lock badge, and{' '}
            <strong className="text-amber-300">CAP</strong> label. Personal alert thresholds use a
            dashed violet housing border and <strong className="text-violet-300">BUDGET</strong>{' '}
            label so they never imply provider cutoffs.
          </p>
        </div>

        {/* 4-Slot Design Rationale & Pool Discipline */}
        <div className="lg:col-span-7 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <span className="text-xs font-bold text-slate-100">
              Monetary Instrument Family Rules (Illustrated in Slots 01–04)
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
              <KeyRound className="w-3 h-3 text-[#76b900]" />
              <span>1 Pool = 1 Instrument</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-mono font-bold text-slate-200 mb-1">
                01 · Included Monthly Allowance ($24.80 / $100)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Denominator ($100) and reset (`resets 12d`) are known. Uses the standard
                proportional remaining-capacity meter with `$24.80` as the primary reading.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-mono font-bold text-indigo-300 mb-1">
                02 · Prepaid Balance ($24.80 · No Known Max)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No meaningful percentage and no reset. Fits the exact 26px × 92px meter slot
                using either the Vertical Digital Readout (Alt A) or Split Counter (Alt B)
                without fake fill levels or quantitative scale ticks.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-mono font-bold text-amber-300 mb-1">
                03 · Enforced Cap vs. Personal Budget ($25 / $100)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Communicates remaining spending headroom before a limit (`resets 12d`),
                explicitly distinguishing provider-enforced `CAP` from user-defined `BUDGET`.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-mono font-bold text-slate-300 mb-1">
                04 · Uncapped Pay-As-You-Go (METERED)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Displays `METERED` and `No cap configured` inside a recessed vertical chamber—
                never inventing remaining capacity or showing a misleading 100% green bar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
