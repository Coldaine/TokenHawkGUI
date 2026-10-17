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

export default function GlassCapsuleWidget({
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
            className="absolute right-[calc(100%+12px)] bottom-0 w-60 bg-[#0f0b18]/95 border border-purple-800/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs z-50 pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-purple-900/60 font-mono">
              <span className="font-bold text-purple-200 truncate">{activeSub.name}</span>
              <span className="text-xs font-bold text-purple-400">
                {Math.round((activeSub.remaining / activeSub.totalAllowance) * 100)}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining:</span>
                <span className="text-purple-100">
                  {activeSub.remaining.toLocaleString()} {activeSub.unit.split('/')[0]}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cycle:</span>
                <span className="text-purple-300">{activeSub.resetCountdown}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-purple-950">
              <button
                onClick={() =>
                  onUpdateRemaining(
                    activeSub.id,
                    Math.max(0, activeSub.remaining - (activeSub.totalAllowance > 1000 ? 500 : 1))
                  )
                }
                className="flex items-center justify-center gap-1 py-1 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 rounded font-mono text-[10px] text-purple-200"
              >
                <Zap className="w-3 h-3 text-purple-400" />
                <span>-1 Use</span>
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
        className="bg-[#0e0918]/90 border border-purple-900/50 rounded-xl p-2.5 shadow-xl backdrop-blur-md flex items-center gap-2 hover:border-purple-700/70"
      >
        <div className="flex flex-col items-center pr-2 border-r border-purple-950">
          <span className="text-[9px] font-mono font-bold text-purple-600 uppercase">04</span>
          <span className="text-[8px] font-mono text-purple-400">Capsule</span>
        </div>

        <motion.div layout className="flex items-end gap-1.5 py-0.5">
          {displayed.map((sub) => {
            const pct = Math.max(
              0,
              Math.min(100, Math.round((sub.remaining / sub.totalAllowance) * 100))
            );
            const isCrit = pct <= 25;
            const isMod = pct > 25 && pct <= 50;

            const getGrad = () => {
              if (isCrit) return 'from-rose-600 to-pink-500 shadow-[0_0_8px_#f43f5e]';
              if (isMod) return 'from-purple-600 to-indigo-400 shadow-[0_0_8px_#a855f7]';
              return 'from-violet-600 to-cyan-400 shadow-[0_0_8px_#06b6d4]';
            };

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
                <span className="text-[9px] font-mono font-bold text-purple-300 mb-1 tabular-nums">
                  {pct}%
                </span>

                {/* Rounded Pill Capsule Cylinder */}
                <div className="relative w-3.5 h-14 bg-slate-950/80 rounded-full p-[1.5px] border border-purple-900/80 flex flex-col justify-end shadow-inner overflow-hidden group-hover:border-purple-600">
                  <div
                    className={`w-full rounded-full bg-gradient-to-t ${getGrad()} transition-all duration-300`}
                    style={{ height: `${Math.max(12, pct)}%` }}
                  >
                    <div className="w-full h-1 bg-white/70 rounded-full" />
                  </div>
                </div>

                <span className="text-[8px] font-mono text-purple-400 mt-1">{label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {!isExpanded && (
          <span className="text-[9px] font-mono font-bold text-purple-400 pl-1 border-l border-purple-950">
            +{subscriptions.length - 3}
          </span>
        )}
      </motion.div>
    </div>
  );
}
