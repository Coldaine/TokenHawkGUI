'use client';

import React from 'react';
import { Lock, Sparkles, ShieldAlert, Cpu } from 'lucide-react';

interface DivisionSplitMeterProps {
  progress: number;
  isDimmed: boolean;
}

export default function DivisionSplitMeter({
  progress,
  isDimmed,
}: DivisionSplitMeterProps) {
  // During Act 2 & 4, model attempts to touch state and scripts flare
  const isFlaring = (progress >= 0.22 && progress <= 0.35) || (progress >= 0.62 && progress <= 0.72);

  // Division ratio: 78% Deterministic Python Scripts, 22% Ephemeral Model Reasoning
  const scriptPercent = 78;
  const modelPercent = 22;

  return (
    <aside
      className={`fixed top-16 right-6 z-30 w-80 pointer-events-auto transition-opacity duration-300 ${
        isDimmed ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-[#0b0f19]/90 border rounded-lg p-4 shadow-xl backdrop-blur-md transition-colors duration-300 ${
          isFlaring
            ? 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
            : 'border-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-xs font-semibold text-slate-200">
              Division of Labor
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Gradient of Control
          </span>
        </div>

        {/* Dual Gauge Bar */}
        <div className="py-3">
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <div className="flex items-center gap-1.5 text-[#10b981]">
              <Lock className="w-3 h-3" />
              <span className="font-semibold">SCRIPTS ({scriptPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <Sparkles className="w-3 h-3" />
              <span className="font-semibold">MODEL ({modelPercent}%)</span>
            </div>
          </div>

          {/* Split Bar with protective flare */}
          <div className="relative h-3 w-full bg-slate-900 rounded-sm overflow-hidden flex border border-slate-800">
            <div
              className={`h-full transition-all duration-300 flex items-center justify-end pr-1 ${
                isFlaring
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_12px_#ef4444]'
                  : 'bg-gradient-to-r from-emerald-600 to-[#76b900]'
              }`}
              style={{ width: `${scriptPercent}%` }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            </div>
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500"
              style={{ width: `${modelPercent}%` }}
            />
          </div>

          {/* Protective flare banner when model attempts state access */}
          {isFlaring && (
            <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 bg-red-950/80 border border-red-800/70 rounded text-[11px] text-red-300 animate-in fade-in duration-200">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Guard active: Model mutation blocked by flock()</span>
            </div>
          )}
        </div>

        {/* Two-column role breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-tight">
          <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
            <span className="text-[#10b981] font-semibold block mb-0.5 font-mono">
              Deterministic
            </span>
            <span>State machine, disk I/O, mathematical parsing, KPI gates.</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
            <span className="text-purple-400 font-semibold block mb-0.5 font-mono">
              Ephemeral
            </span>
            <span>Natural language routing, parameter translation, RCA reasoning.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
