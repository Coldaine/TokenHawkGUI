'use client';

import React, { useState } from 'react';
import { Layers, FileCode, ArrowDownRight } from 'lucide-react';
import { PROGRESSIVE_CARDS } from '@/lib/deftData';

interface ContextThermometerProps {
  progress: number;
  isDimmed: boolean;
}

export default function ContextThermometer({
  progress,
  isDimmed,
}: ContextThermometerProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Progressive disclosure stages:
  // t: 0.0 - 0.2: 1 card
  // t: 0.2 - 0.4: 2 cards
  // t: 0.4 - 0.6: 3 cards (Act 3 Progressive Disclosure)
  // t: 0.6 - 0.8: 4 cards
  // t: 0.8 - 1.0: 5-6 cards
  const activeCount = Math.min(Math.floor(progress * PROGRESSIVE_CARDS.length) + 1, PROGRESSIVE_CARDS.length);

  const activeTokens = PROGRESSIVE_CARDS.slice(0, activeCount).reduce(
    (acc, card) => acc + card.tokenCount,
    0
  );
  const monolithicTokens = 38500;
  const tokenSavingsPercent = Math.round(
    ((monolithicTokens - activeTokens) / monolithicTokens) * 100
  );

  return (
    <aside
      className={`fixed top-64 right-6 z-30 w-80 pointer-events-auto transition-opacity duration-300 ${
        isDimmed ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-4 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="text-xs font-semibold text-slate-200">
              Context Thermometer
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#10b981]">
            -{tokenSavingsPercent}% Over Monolithic
          </span>
        </div>

        {/* Thermometer Bar & Token Count */}
        <div className="py-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>Just-In-Time Context</span>
            <span className="text-slate-200 tabular-nums font-semibold">
              {activeTokens.toLocaleString()} / 8,000 tokens
            </span>
          </div>

          {/* Visual multi-segment bar */}
          <div className="h-2.5 w-full bg-slate-900 rounded-sm overflow-hidden flex gap-[2px] p-[2px] border border-slate-800">
            {PROGRESSIVE_CARDS.map((card, idx) => {
              const isLoaded = idx < activeCount;
              return (
                <div
                  key={card.id}
                  className={`h-full flex-1 rounded-xs transition-all duration-300 ${
                    isLoaded
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#10b981] shadow-[0_0_6px_#06b6d4]'
                      : 'bg-slate-800/60'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Loaded Card Modules List */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
            Active Stage References ({activeCount}/{PROGRESSIVE_CARDS.length})
          </span>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {PROGRESSIVE_CARDS.map((card, idx) => {
              const isLoaded = idx < activeCount;
              const isHovered = hoveredCardId === card.id;

              return (
                <div
                  key={card.id}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className={`px-2 py-1.5 rounded border transition-all text-xs cursor-pointer ${
                    isLoaded
                      ? isHovered
                        ? 'bg-slate-800/90 border-[#06b6d4]/80 text-slate-100'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode
                        className={`w-3 h-3 shrink-0 ${
                          isLoaded ? 'text-[#06b6d4]' : 'text-slate-600'
                        }`}
                      />
                      <span className="font-mono text-[11px] truncate">
                        {card.fileName}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
                      +{card.tokenCount}t
                    </span>
                  </div>

                  {isHovered && isLoaded && (
                    <p className="text-[10px] text-slate-400 mt-1 pl-4 leading-normal">
                      {card.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
