'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AISubscription } from '@/types/subscriptions';
import { Zap, RotateCcw } from 'lucide-react';

interface WidgetProps {
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetSubscription: (id: string) => void;
}

export default function SegmentedLEDWidget({
  subscriptions,
  onUpdateRemaining,
  onResetSubscription,
}: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sortedSubs = [...subscriptions].sort((a, b) => {
    return a.remaining / a.totalAllowance - b.remaining / b.totalAllowance;
  });

  const displayed = isExpanded ? sortedSubs : sortedSubs.slice(0, 3);
  const activeSub = subscriptions.find((s) => s.id === hoveredId);

  const TOTAL_SEGMENTS = 8;

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHoveredId(null);
      }}
      className="relative select-none font-sans"
    >
      {/* Tooltip Disclosure */}
      <AnimatePresence>
        {activeSub && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-[calc(100%+12px)] bottom-0 w-60 bg-[#070b12]/95 border border-cyan-800/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs z-50 pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-900/60 font-mono">
              <span className="font-bold text-cyan-300 truncate">{activeSub.name}</span>
              <span className="text-xs font-bold text-cyan-400">
                {Math.round((activeSub.remaining / activeSub.totalAllowance) * 100)}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining:</span>
                <span>
                  {activeSub.remaining.toLocaleString()} {activeSub.unit.split('/')[0]}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Reset:</span>
                <span className="text-cyan-400">{activeSub.resetCountdown}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-cyan-950">
              <button
                onClick={() =>
                  onUpdateRemaining(
                    activeSub.id,
                    Math.max(0, activeSub.remaining - (activeSub.totalAllowance > 1000 ? 500 : 1))
                  )
                }
                className="flex items-center justify-center gap-1 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded font-mono text-[10px] text-cyan-200"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>-1 Prompt</span>
              </button>
              <button
                onClick={() => onResetSubscription(activeSub.id)}
                className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-300"
              >
                <RotateCcw className="w-3 h-3 text-[#10b981]" />
                <span>Reset</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Box */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        className="bg-[#070b14]/90 border border-cyan-900/50 rounded-xl p-2.5 shadow-xl backdrop-blur-md flex items-center gap-2 hover:border-cyan-700/70"
      >
        <div className="flex flex-col items-center pr-2 border-r border-cyan-950">
          <span className="text-[9px] font-mono font-bold text-cyan-600 uppercase">02</span>
          <span className="text-[8px] font-mono text-cyan-400">LED VU</span>
        </div>

        <motion.div layout className="flex items-end gap-1.5 py-0.5">
          {displayed.map((sub) => {
            const pct = Math.max(
              0,
              Math.min(100, Math.round((sub.remaining / sub.totalAllowance) * 100))
            );
            const activeSegments = Math.round((pct / 100) * TOTAL_SEGMENTS);

            const label = sub.name.includes('Claude')
              ? 'Cl'
              : sub.name.includes('Cursor')
              ? 'Cu'
              : sub.name.includes('ChatGPT')
              ? 'GPT'
              : sub.name.includes('Midjourney')
              ? 'Mj'
              : sub.name.includes('Perplexity')
              ? 'Px'
              : sub.name.includes('Eleven')
              ? '11L'
              : sub.name.includes('Copilot')
              ? 'GH'
              : 'API';

            return (
              <motion.div
                key={sub.id}
                layout
                onMouseEnter={() => setHoveredId(sub.id)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <span className="text-[9px] font-mono font-bold text-cyan-400 mb-1 tabular-nums">
                  {pct}%
                </span>

                {/* 8-segment LED ladder */}
                <div className="flex flex-col gap-[2px] p-[2px] bg-slate-950 rounded-sm border border-cyan-950/80 group-hover:border-cyan-800">
                  {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
                    const segmentIndexFromBottom = TOTAL_SEGMENTS - 1 - idx;
                    const isLit = segmentIndexFromBottom < activeSegments;

                    let segColor = 'bg-cyan-500 shadow-[0_0_4px_#06b6d4]';
                    if (idx < 2) segColor = 'bg-red-500 shadow-[0_0_4px_#ef4444]'; // top 2 segments
                    else if (idx < 4) segColor = 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'; // middle

                    return (
                      <div
                        key={idx}
                        className={`w-2.5 h-1.5 rounded-[1px] transition-colors ${
                          isLit ? segColor : 'bg-slate-900/60'
                        }`}
                      />
                    );
                  })}
                </div>

                <span className="text-[8px] font-mono text-cyan-600 mt-1">{label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {!isExpanded && (
          <span className="text-[9px] font-mono font-bold text-cyan-400 pl-1 border-l border-cyan-950">
            +{subscriptions.length - 3}
          </span>
        )}
      </motion.div>
    </div>
  );
}
