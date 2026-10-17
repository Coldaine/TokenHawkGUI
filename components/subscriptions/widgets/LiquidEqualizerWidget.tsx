'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AISubscription } from '@/types/subscriptions';
import { Clock, Zap, RotateCcw } from 'lucide-react';

interface WidgetProps {
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetSubscription: (id: string) => void;
}

export default function LiquidEqualizerWidget({
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
            className="absolute right-[calc(100%+12px)] bottom-0 w-60 bg-[#090d16]/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs z-50 pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
              <span className="font-bold text-slate-100 truncate">{activeSub.name}</span>
              <span className="font-mono text-xs font-bold text-[#76b900]">
                {Math.round((activeSub.remaining / activeSub.totalAllowance) * 100)}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining:</span>
                <span>
                  {activeSub.remaining.toLocaleString()} / {activeSub.totalAllowance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cycle:</span>
                <span className="text-[#10b981]">{activeSub.resetCountdown}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() =>
                  onUpdateRemaining(
                    activeSub.id,
                    Math.max(0, activeSub.remaining - (activeSub.totalAllowance > 1000 ? 500 : 1))
                  )
                }
                className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-200"
              >
                <Zap className="w-3 h-3 text-amber-400" />
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
        className="bg-[#0b0f19]/90 border border-slate-800 rounded-xl p-2.5 shadow-xl backdrop-blur-md flex items-center gap-2 hover:border-slate-700"
      >
        <div className="flex flex-col items-center pr-2 border-r border-slate-800/80">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">01</span>
          <span className="text-[8px] font-mono text-[#76b900]">Liquid</span>
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
              if (isCrit) return 'from-red-600 via-rose-500 to-red-400';
              if (isMod) return 'from-amber-600 via-amber-500 to-yellow-400';
              return 'from-emerald-600 to-[#76b900]';
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
                <span
                  className={`text-[9px] font-mono font-bold tabular-nums mb-1 ${
                    isCrit ? 'text-red-400' : isMod ? 'text-amber-400' : 'text-[#10b981]'
                  }`}
                >
                  {pct}%
                </span>
                <div className="relative w-2.5 h-14 bg-slate-950 rounded-sm p-[1px] border border-slate-800 flex flex-col justify-end shadow-inner overflow-hidden group-hover:border-slate-600">
                  <div
                    className={`w-full rounded-xs bg-gradient-to-t ${getGrad()} transition-all duration-300`}
                    style={{ height: `${Math.max(6, pct)}%` }}
                  >
                    <div className="w-full h-0.5 bg-white/70 rounded-full" />
                  </div>
                </div>
                <span className="text-[8px] font-mono text-slate-400 mt-1">{label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {!isExpanded && (
          <span className="text-[9px] font-mono font-bold text-[#76b900] pl-1 border-l border-slate-800">
            +{subscriptions.length - 3}
          </span>
        )}
      </motion.div>
    </div>
  );
}
