'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AISubscription } from '@/types/subscriptions';
import { getToolLogo } from '@/components/icons/AIToolLogos';
import {
  Clock,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

interface FocusedBarsStageProps {
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetSubscription: (id: string) => void;
  onOpenEdit: (sub: AISubscription) => void;
}

export default function FocusedBarsStage({
  subscriptions,
  onUpdateRemaining,
  onResetSubscription,
  onOpenEdit,
}: FocusedBarsStageProps) {
  // Widget Opacity state (from 0.15 to 0.95)
  const [glassOpacity, setGlassOpacity] = useState(0.85);

  // Bar Size: compact (110px), standard (160px), jumbo (220px)
  const [barScale, setBarScale] = useState<'compact' | 'standard' | 'jumbo'>('standard');

  // Accordion mode: default 3 bars -> expand to all
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [hoveredSubId, setHoveredSubId] = useState<string | null>(null);

  // Height and width configurations
  const barDimensions = {
    compact: { height: 110, width: 22 },
    standard: { height: 160, width: 28 },
    jumbo: { height: 220, width: 36 },
  }[barScale];

  // Sort: lowest remaining first so the top 3 are the most critical
  const sortedSubs = [...subscriptions].sort((a, b) => {
    return a.remaining / a.totalAllowance - b.remaining / b.totalAllowance;
  });

  const shouldShowAll = isAccordionExpanded || pinnedExpanded;
  const displayedSubs = shouldShowAll ? sortedSubs : sortedSubs.slice(0, 3);
  const hiddenCount = Math.max(0, sortedSubs.length - 3);

  // Active hovered subscription for disclosure popover
  const activeSub = subscriptions.find((s) => s.id === hoveredSubId) || null;

  // Global weighted average
  const avgPercent = Math.round(
    subscriptions.reduce(
      (acc, s) => acc + (s.remaining / s.totalAllowance) * 100,
      0
    ) / (subscriptions.length || 1)
  );

  return (
    <div className="relative flex flex-col items-center justify-center select-none font-sans my-auto w-full max-w-4xl px-4">
      {/* Top Controls Header: Opacity Slider, Bar Scale & Accordion Pin */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full mb-4 px-2 text-xs font-mono">
        {/* Composite Total Badge */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#76b900] shadow-[0_0_8px_#76b900]" />
          <span className="font-bold text-slate-100 uppercase tracking-wider">
            Combined Runway:
          </span>
          <span
            className={`font-bold tabular-nums text-sm ${
              avgPercent > 50
                ? 'text-[#10b981]'
                : avgPercent > 25
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {avgPercent}%
          </span>
          <span className="text-slate-500 hidden sm:inline">
            ({subscriptions.length} AI tools)
          </span>
        </div>

        {/* Interactive Opacity & Sizing Controls */}
        <div className="flex items-center gap-4 bg-[#0b0f19]/90 border border-slate-800 rounded-xl px-3 py-1.5 backdrop-blur-md">
          {/* Opacity Slider */}
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Glass Opacity:</span>
            <input
              type="range"
              min="0.15"
              max="0.98"
              step="0.05"
              value={glassOpacity}
              onChange={(e) => setGlassOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded appearance-none accent-[#76b900] cursor-pointer"
            />
            <span className="text-slate-300 text-[10px] tabular-nums w-7">
              {Math.round(glassOpacity * 100)}%
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Bar Scale Selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Size:</span>
            {(['compact', 'standard', 'jumbo'] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setBarScale(scale)}
                className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                  barScale === scale
                    ? 'bg-[#76b900] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scale}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Accordion Pin Toggle */}
          <button
            onClick={() => setPinnedExpanded(!pinnedExpanded)}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
              pinnedExpanded
                ? 'bg-slate-800 text-[#76b900] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {pinnedExpanded ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Show 3</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>Show All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* THE MAIN FOCUSED VERTICAL BARS STAGE */}
      <div
        onMouseEnter={() => {
          if (!pinnedExpanded) setIsAccordionExpanded(true);
        }}
        onMouseLeave={() => {
          if (!pinnedExpanded) {
            setIsAccordionExpanded(false);
            setHoveredSubId(null);
          }
        }}
        className="relative border rounded-2xl p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 w-full flex flex-col items-center"
        style={{
          backgroundColor: `rgba(11, 15, 25, ${glassOpacity})`,
          borderColor: `rgba(51, 65, 85, ${Math.min(1, glassOpacity + 0.15)})`,
          boxShadow: `0 20px 50px rgba(0, 0, 0, ${glassOpacity * 0.9})`,
        }}
      >
        {/* MOUSEOVER DISCLOSURE POPOVER CARD */}
        <AnimatePresence>
          {activeSub && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 rounded-xl p-3.5 shadow-2xl backdrop-blur-2xl border text-xs z-50 pointer-events-auto"
              style={{
                backgroundColor: `rgba(9, 13, 22, ${Math.max(0.92, glassOpacity)})`,
                borderColor: activeSub.color,
                boxShadow: `0 0 24px ${activeSub.color}30`,
              }}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800">
                    {getToolLogo(activeSub.name, 16)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-xs">
                      {activeSub.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeSub.provider} · {activeSub.plan}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="font-mono text-base font-extrabold"
                    style={{ color: activeSub.color }}
                  >
                    {Math.round((activeSub.remaining / activeSub.totalAllowance) * 100)}%
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block">Left</span>
                </div>
              </div>

              {/* Exact Metrics */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mb-2">
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-850">
                  <span className="text-[9px] text-slate-500 block">REMAINING UNITS</span>
                  <span className="font-bold text-slate-200">
                    {typeof activeSub.remaining === 'number' && activeSub.remaining % 1 !== 0
                      ? activeSub.remaining.toFixed(1)
                      : activeSub.remaining.toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      / {activeSub.totalAllowance.toLocaleString()}
                    </span>
                  </span>
                </div>

                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-850">
                  <span className="text-[9px] text-slate-500 block">RESET COUNTDOWN</span>
                  <span className="font-bold text-[#10b981] truncate block">
                    {activeSub.resetCountdown}
                  </span>
                </div>
              </div>

              {/* Interactive -1 / Reset buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateRemaining(
                      activeSub.id,
                      Math.max(0, activeSub.remaining - (activeSub.totalAllowance > 1000 ? 500 : 1))
                    );
                  }}
                  className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded font-mono text-[10px] transition-colors"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>-1 Use</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetSubscription(activeSub.id);
                  }}
                  className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded font-mono text-[10px] transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-[#10b981]" />
                  <span>Refill</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEdit(activeSub);
                  }}
                  className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded font-mono text-[10px] transition-colors"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BARS CONTAINER (Closer together: gap-2 or gap-3) */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="flex items-end justify-center gap-3 sm:gap-4 py-2 overflow-x-auto max-w-full"
        >
          {displayedSubs.map((sub) => {
            const pct = Math.max(
              0,
              Math.min(100, Math.round((sub.remaining / sub.totalAllowance) * 100))
            );
            const isCrit = pct <= 25;
            const isMod = pct > 25 && pct <= 50;
            const isHovered = hoveredSubId === sub.id;

            // Fill gradient matching tool brand and health
            const getFillColor = () => {
              if (isCrit) return 'from-red-600 via-rose-500 to-red-400';
              if (isMod) return 'from-amber-600 via-amber-500 to-yellow-400';
              return 'from-emerald-600 via-emerald-500 to-[#76b900]';
            };

            const getGlow = () => {
              if (isCrit) return '0 0 16px rgba(239, 68, 68, 0.5)';
              if (isMod) return '0 0 14px rgba(245, 158, 11, 0.4)';
              return '0 0 14px rgba(118, 185, 0, 0.4)';
            };

            const getTextColor = () => {
              if (isCrit) return 'text-red-400';
              if (isMod) return 'text-amber-400';
              return 'text-[#10b981]';
            };

            return (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => setHoveredSubId(sub.id)}
                onClick={() => setHoveredSubId(isHovered ? null : sub.id)}
                className={`flex flex-col items-center cursor-pointer group relative p-1 rounded-xl transition-all ${
                  isHovered ? 'scale-105' : 'hover:scale-[1.02]'
                }`}
              >
                {/* Bold percentage readout directly on top */}
                <span
                  className={`font-mono font-extrabold tabular-nums mb-1.5 transition-transform ${getTextColor()}`}
                  style={{
                    fontSize: barScale === 'jumbo' ? '14px' : barScale === 'standard' ? '12px' : '10px',
                  }}
                >
                  {pct}%
                </span>

                {/* THE TALL TACTILE VERTICAL GLASS CHAMBER */}
                <div
                  className="relative rounded-lg p-[2px] border flex flex-col justify-end shadow-inner overflow-hidden transition-all"
                  style={{
                    height: `${barDimensions.height}px`,
                    width: `${barDimensions.width}px`,
                    backgroundColor: `rgba(6, 10, 18, ${Math.max(0.6, glassOpacity)})`,
                    borderColor: isHovered
                      ? sub.color
                      : `rgba(51, 65, 85, ${glassOpacity})`,
                    boxShadow: isHovered ? `0 0 15px ${sub.color}40` : 'none',
                  }}
                >
                  {/* Subtle tick markers at 25%, 50%, 75% */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2 px-1 opacity-30">
                    <div className="border-b border-slate-700 w-full" />
                    <div className="border-b border-slate-700 w-full" />
                    <div className="border-b border-slate-700 w-full" />
                  </div>

                  {/* Liquid Fuel Fill Column with Glowing Meniscus */}
                  <div
                    className={`w-full rounded-md bg-gradient-to-t ${getFillColor()} transition-all duration-400 ease-out flex flex-col justify-between`}
                    style={{
                      height: `${Math.max(5, pct)}%`,
                      boxShadow: getGlow(),
                    }}
                  >
                    {/* Glowing meniscus line at the surface */}
                    <div className="w-full h-1.5 bg-white/80 rounded-full blur-[0.5px]" />
                    <div className="w-full h-full bg-white/10" />
                  </div>
                </div>

                {/* Tool Logo Icon below the bar */}
                <div
                  className="mt-2.5 p-1 rounded-md bg-slate-900 border border-slate-800 transition-colors group-hover:border-slate-700"
                  title={sub.name}
                >
                  {getToolLogo(sub.name, barScale === 'jumbo' ? 18 : 15)}
                </div>

                {/* Tool Short Label */}
                <span
                  className="text-[10px] font-mono mt-1 text-slate-400 group-hover:text-slate-100 truncate max-w-[42px] text-center"
                >
                  {sub.name.split(' ')[0]}
                </span>
              </motion.div>
            );
          })}

          {/* Accordion expand indicator button */}
          {!shouldShowAll && hiddenCount > 0 && (
            <button
              onClick={() => setIsAccordionExpanded(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-[#76b900] text-slate-400 hover:text-slate-200 transition-all ml-1 self-center"
              title={`Accordion expand to see all ${subscriptions.length} subscriptions`}
            >
              <span className="text-xs font-mono font-bold text-[#76b900]">
                +{hiddenCount}
              </span>
              <span className="text-[9px] font-mono text-slate-500">More</span>
              <ChevronRight className="w-4 h-4 text-[#76b900] mt-1" />
            </button>
          )}
        </motion.div>

        {/* Bottom Helper Hint */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Hover any bar for mouseover disclosure &amp; -1 use controls</span>
          <span>{subscriptions.length} AI subscriptions active</span>
        </div>
      </div>
    </div>
  );
}
