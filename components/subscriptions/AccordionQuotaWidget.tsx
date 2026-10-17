'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AISubscription } from '@/types/subscriptions';
import {
  Clock,
  Zap,
  RotateCcw,
  Plus,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
} from 'lucide-react';

interface AccordionQuotaWidgetProps {
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetSubscription: (id: string) => void;
  onOpenEdit: (sub: AISubscription) => void;
  onOpenAdd: () => void;
}

export default function AccordionQuotaWidget({
  subscriptions,
  onUpdateRemaining,
  onResetSubscription,
  onOpenEdit,
  onOpenAdd,
}: AccordionQuotaWidgetProps) {
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const [hoveredSubId, setHoveredSubId] = useState<string | null>(null);

  // Default shows 3 bars (the ones needing most attention / lowest %),
  // expanding shows all bars
  const sortedSubs = [...subscriptions].sort((a, b) => {
    const pA = a.remaining / a.totalAllowance;
    const pB = b.remaining / b.totalAllowance;
    return pA - pB;
  });

  const displayedSubs = isAccordionExpanded ? sortedSubs : sortedSubs.slice(0, 3);
  const hiddenCount = Math.max(0, sortedSubs.length - 3);

  // Active hovered subscription for disclosure card
  const activeSub = subscriptions.find((s) => s.id === hoveredSubId) || null;

  return (
    <div
      onMouseEnter={() => setIsAccordionExpanded(true)}
      onMouseLeave={() => {
        setIsAccordionExpanded(false);
        setHoveredSubId(null);
      }}
      className="fixed bottom-6 right-6 z-50 select-none font-sans"
    >
      {/* MOUSEOVER DISCLOSURE POPOVER CARD */}
      <AnimatePresence>
        {activeSub && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[calc(100%+10px)] right-0 w-64 bg-[#090d16]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeSub.color }}
                />
                <span className="font-bold text-slate-100 truncate">
                  {activeSub.name}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-300 ml-2">
                {Math.round((activeSub.remaining / activeSub.totalAllowance) * 100)}%
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-sans">Remaining:</span>
                <span className="font-bold text-slate-100">
                  {typeof activeSub.remaining === 'number' && activeSub.remaining % 1 !== 0
                    ? activeSub.remaining.toFixed(1)
                    : activeSub.remaining.toLocaleString()}{' '}
                  <span className="text-slate-400 font-normal">
                    / {activeSub.totalAllowance.toLocaleString()}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="font-sans">Unit:</span>
                <span className="text-slate-300 truncate max-w-[140px]">
                  {activeSub.unit}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="font-sans flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Cycle Reset:</span>
                </span>
                <span className="text-[#76b900] truncate max-w-[140px]">
                  {activeSub.resetCountdown}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="font-sans">Burn Rate:</span>
                <span className="text-slate-300">{activeSub.burnRate}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateRemaining(
                    activeSub.id,
                    Math.max(0, activeSub.remaining - (activeSub.totalAllowance > 1000 ? 500 : 1))
                  );
                }}
                className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded font-mono text-[10px] transition-colors"
                title="Log 1 prompt / generation"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>-1 Use</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResetSubscription(activeSub.id);
                }}
                className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded font-mono text-[10px] transition-colors"
                title="Refill to 100%"
              >
                <RotateCcw className="w-3 h-3 text-[#10b981]" />
                <span>Reset</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEdit(activeSub);
                }}
                className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded font-mono text-[10px] transition-colors"
                title="Edit subscription limits"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPACT CORNER WIDGET CONTAINER */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-[#0b0f19]/95 border border-slate-800 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 flex items-center gap-2 cursor-pointer hover:border-slate-700"
      >
        {/* Left Mini Badge */}
        <div className="flex flex-col items-center justify-center px-1 border-r border-slate-800/80 pr-2">
          <span className="w-2 h-2 rounded-full bg-[#76b900] shadow-[0_0_6px_#76b900] mb-1" />
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            AI
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            {subscriptions.length}
          </span>
        </div>

        {/* ACCORDION BARS ROW (Closer together: gap-1.5) */}
        <motion.div layout className="flex items-end gap-1.5 py-0.5">
          {displayedSubs.map((sub) => {
            const pct = Math.max(
              0,
              Math.min(100, Math.round((sub.remaining / sub.totalAllowance) * 100))
            );
            const isCrit = pct <= 25;
            const isMod = pct > 25 && pct <= 50;
            const isHovered = hoveredSubId === sub.id;

            // Fill gradient
            const getGradient = () => {
              if (isCrit) return 'from-red-600 via-rose-500 to-red-400';
              if (isMod) return 'from-amber-600 via-amber-500 to-yellow-400';
              return 'from-emerald-600 via-emerald-500 to-[#76b900]';
            };

            const getTextColor = () => {
              if (isCrit) return 'text-red-400';
              if (isMod) return 'text-amber-400';
              return 'text-[#10b981]';
            };

            // 2-3 letter abbreviation
            const shortLabel = sub.name.includes('Claude')
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => setHoveredSubId(sub.id)}
                className={`flex flex-col items-center group relative px-0.5 py-1 rounded-md transition-colors ${
                  isHovered ? 'bg-slate-800/80' : 'hover:bg-slate-900/60'
                }`}
              >
                {/* Percentage number above bar */}
                <span
                  className={`text-[9px] font-mono font-bold tabular-nums leading-none mb-1 transition-transform group-hover:scale-110 ${getTextColor()}`}
                >
                  {pct}%
                </span>

                {/* Tight Vertical Bar (Width: 9px, Height: 58px) */}
                <div className="relative w-2.5 h-[58px] bg-slate-950 rounded-[3px] p-[1.5px] border border-slate-800/90 flex flex-col justify-end shadow-inner overflow-hidden group-hover:border-slate-600">
                  {/* Subtle tick markers at 25%, 50%, 75% */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1 px-0.5 opacity-40">
                    <div className="border-b border-slate-800 w-full" />
                    <div className="border-b border-slate-800 w-full" />
                    <div className="border-b border-slate-800 w-full" />
                  </div>

                  {/* Vertical Liquid Fill */}
                  <div
                    className={`w-full rounded-[2px] bg-gradient-to-t ${getGradient()} transition-all duration-300 relative`}
                    style={{
                      height: `${Math.max(6, pct)}%`,
                      boxShadow: isCrit
                        ? '0 0 6px rgba(239,68,68,0.6)'
                        : '0 0 5px rgba(118,185,0,0.3)',
                    }}
                  >
                    <div className="w-full h-1 bg-white/70 rounded-full" />
                  </div>
                </div>

                {/* Short Tool Label below bar */}
                <span
                  className={`text-[8px] font-mono mt-1 transition-colors leading-none ${
                    isHovered
                      ? 'text-white font-bold'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {shortLabel}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ACCORDION EXPAND INDICATOR / BUTTON */}
        {!isAccordionExpanded && hiddenCount > 0 && (
          <button
            onClick={() => setIsAccordionExpanded(true)}
            className="flex flex-col items-center justify-center pl-1 pr-1.5 py-1 text-slate-400 hover:text-slate-200 border-l border-slate-800/80 transition-colors"
            title={`Expand all ${subscriptions.length} subscriptions`}
          >
            <span className="text-[9px] font-mono font-bold text-[#76b900]">
              +{hiddenCount}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-500 mt-0.5" />
          </button>
        )}

        {/* Add subscription button when expanded */}
        {isAccordionExpanded && (
          <button
            onClick={onOpenAdd}
            className="flex flex-col items-center justify-center p-1.5 ml-1 border-l border-slate-800 text-slate-400 hover:text-[#76b900] transition-colors"
            title="Add another subscription"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
