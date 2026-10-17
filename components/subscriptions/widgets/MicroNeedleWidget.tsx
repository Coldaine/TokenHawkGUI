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

export default function MicroNeedleWidget({
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
            className="absolute right-[calc(100%+12px)] bottom-0 w-60 bg-[#09090b]/95 border border-zinc-800 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs z-50 pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800">
              <span className="font-medium text-zinc-100 truncate">{activeSub.name}</span>
              <span className="font-mono text-xs font-semibold text-white">
                {Math.round((activeSub.remaining / activeSub.totalAllowance) * 100)}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className="text-zinc-200">
                  {activeSub.remaining.toLocaleString()} / {activeSub.totalAllowance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resets in:</span>
                <span className="text-zinc-300">{activeSub.resetCountdown}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-zinc-850">
              <button
                onClick={() =>
                  onUpdateRemaining(
                    activeSub.id,
                    Math.max(0, activeSub.remaining - (activeSub.totalAllowance > 1000 ? 500 : 1))
                  )
                }
                className="flex items-center justify-center gap-1 py-1 bg-zinc-900 hover:bg-zinc-800 rounded font-mono text-[10px] text-zinc-200"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>-1 Use</span>
              </button>
              <button
                onClick={() => onResetSubscription(activeSub.id)}
                className="flex items-center justify-center gap-1 py-1 bg-zinc-900 hover:bg-zinc-800 rounded font-mono text-[10px] text-zinc-300"
              >
                <RotateCcw className="w-3 h-3 text-zinc-400" />
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
        className="bg-[#09090b]/90 border border-zinc-800 rounded-xl p-2.5 shadow-xl backdrop-blur-md flex items-center gap-2 hover:border-zinc-700"
      >
        <div className="flex flex-col items-center pr-2 border-r border-zinc-850">
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">03</span>
          <span className="text-[8px] font-mono text-zinc-400">Needle</span>
        </div>

        <motion.div layout className="flex items-end gap-2 py-0.5 px-1">
          {displayed.map((sub) => {
            const pct = Math.max(
              0,
              Math.min(100, Math.round((sub.remaining / sub.totalAllowance) * 100))
            );
            const isCrit = pct <= 25;

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
                <span
                  className={`text-[8px] font-mono tabular-nums mb-1 font-semibold ${
                    isCrit ? 'text-rose-400' : 'text-zinc-300'
                  }`}
                >
                  {pct}%
                </span>

                {/* 2px Hairline Track with floating indicator dot */}
                <div className="relative w-1.5 h-14 bg-zinc-900 rounded-full flex flex-col justify-end items-center group-hover:bg-zinc-800">
                  <div
                    className={`w-full rounded-full transition-all duration-300 ${
                      isCrit ? 'bg-rose-500 shadow-[0_0_5px_#f43f5e]' : 'bg-white'
                    }`}
                    style={{ height: `${Math.max(8, pct)}%` }}
                  />
                  {/* Floating Needle bead */}
                  <div
                    className="absolute w-2 h-2 rounded-full bg-white shadow-sm -translate-y-1/2 pointer-events-none"
                    style={{ bottom: `calc(${pct}% - 4px)` }}
                  />
                </div>

                <span className="text-[8px] font-mono text-zinc-500 group-hover:text-zinc-300 mt-1">
                  {label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {!isExpanded && (
          <span className="text-[9px] font-mono font-bold text-zinc-400 pl-1 border-l border-zinc-800">
            +{subscriptions.length - 3}
          </span>
        )}
      </motion.div>
    </div>
  );
}
