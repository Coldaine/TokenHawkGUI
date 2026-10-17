'use client';

import React, { useState } from 'react';
import { Network, Info } from 'lucide-react';
import { SKILL_SPECTRUM } from '@/lib/deftData';

interface RepoGradientMapProps {
  isDimmed: boolean;
}

export default function RepoGradientMap({ isDimmed }: RepoGradientMapProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>('spec-5');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const activeItem = SKILL_SPECTRUM.find((s) => s.id === selectedSkill) || SKILL_SPECTRUM[4];

  return (
    <aside
      className={`fixed top-16 right-96 z-30 pointer-events-auto transition-opacity duration-300 hidden xl:block ${
        isDimmed ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-md w-72">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-[#76b900]" />
            <span className="text-xs font-semibold text-slate-200">
              Skill Gradient Spectrum
            </span>
          </div>

          <button
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className="text-slate-400 hover:text-slate-200"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Gradient Spectrum Bar */}
        <div className="py-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
            <span>Prose-Only</span>
            <span>Checklists</span>
            <span>DEFT Runtime</span>
          </div>

          <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
            <div className="h-full w-full bg-gradient-to-r from-slate-700 via-sky-600 to-[#76b900]" />
          </div>

          {/* Interactive Nodes across spectrum */}
          <div className="relative w-full h-3 mt-1">
            {SKILL_SPECTRUM.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedSkill(item.id);
                  setIsPopoverOpen(true);
                }}
                className={`absolute top-0 -translate-x-1/2 w-2 h-2 rounded-full transition-transform ${
                  item.isTarget
                    ? 'bg-[#76b900] shadow-[0_0_8px_#76b900] scale-150'
                    : 'bg-slate-500 hover:bg-slate-300'
                }`}
                style={{ left: `${item.complexityWeight}%` }}
                title={item.name}
              />
            ))}
          </div>
        </div>

        {/* Active Selected Skill Details */}
        <div className="mt-1 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-semibold text-slate-200 truncate">
              {activeItem.name}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                activeItem.isTarget
                  ? 'bg-emerald-950 text-[#10b981] border border-emerald-800'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              {activeItem.type}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {activeItem.summary}
          </p>
        </div>
      </div>
    </aside>
  );
}
