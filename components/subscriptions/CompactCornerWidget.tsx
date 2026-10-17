'use client';

import React, { useState } from 'react';
import { AISubscription } from '@/types/subscriptions';
import {
  Zap,
  RotateCcw,
  Clock,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Plus,
  AlertTriangle,
  Move,
} from 'lucide-react';

interface CompactCornerWidgetProps {
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetSubscription: (id: string) => void;
  onOpenEdit: (sub: AISubscription) => void;
  onOpenAdd: () => void;
  onExpandToFull?: () => void;
}

export default function CompactCornerWidget({
  subscriptions,
  onUpdateRemaining,
  onResetSubscription,
  onOpenEdit,
  onOpenAdd,
  onExpandToFull,
}: CompactCornerWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [cornerPosition, setCornerPosition] = useState<'top-right' | 'bottom-right'>('top-right');

  // Summary stats
  const total = subscriptions.length;
  const critical = subscriptions.filter(
    (s) => (s.remaining / s.totalAllowance) * 100 <= 25
  );
  const avg = Math.round(
    subscriptions.reduce(
      (acc, s) => acc + (s.remaining / s.totalAllowance) * 100,
      0
    ) / (total || 1)
  );

  const positionClass =
    cornerPosition === 'top-right'
      ? 'top-16 right-6'
      : 'bottom-24 right-6';

  return (
    <aside
      className={`fixed ${positionClass} z-50 pointer-events-auto transition-all duration-300 font-sans`}
      style={{ maxWidth: '440px' }}
    >
      <div className="bg-[#0b0f19]/95 border border-slate-800 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Compact Widget Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#76b900] shadow-[0_0_8px_#76b900]" />
            <h2 className="text-xs font-bold text-slate-100 tracking-wide">
              AI Quota Equalizer
            </h2>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                critical.length > 0
                  ? 'bg-red-950 text-red-300 border border-red-800/60 font-semibold'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              {critical.length > 0 ? `${critical.length} Low` : `Avg ${avg}%`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            {/* Corner position switcher */}
            <button
              onClick={() =>
                setCornerPosition(
                  cornerPosition === 'top-right' ? 'bottom-right' : 'top-right'
                )
              }
              title={`Move widget to ${
                cornerPosition === 'top-right' ? 'bottom' : 'top'
              } corner`}
              className="p-1 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            >
              <Move className="w-3 h-3" />
            </button>

            {/* Expand to Full View */}
            {onExpandToFull && (
              <button
                onClick={onExpandToFull}
                title="Expand to Full Dashboard"
                className="p-1 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Widget' : 'Minimize Widget'}
              className="p-1 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            >
              {isCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* MINIMIZED BAR STRIP (If collapsed) */}
        {isCollapsed && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-mono">
              {subscriptions.length} Subscriptions:
            </span>
            <div className="flex items-center gap-1.5">
              {subscriptions.map((s) => {
                const pct = Math.round((s.remaining / s.totalAllowance) * 100);
                const isCrit = pct <= 25;
                return (
                  <span
                    key={s.id}
                    title={`${s.name}: ${pct}% remaining`}
                    className={`font-mono text-[10px] font-bold ${
                      isCrit ? 'text-red-400' : 'text-[#76b900]'
                    }`}
                  >
                    {pct}%
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* EXPANDED COMPACT VERTICAL BARS RACK */}
        {!isCollapsed && (
          <div>
            {/* The Vertical Equalizer Bars Row */}
            <div className="flex items-end justify-between gap-2.5 pt-1 pb-2">
              {subscriptions.map((sub) => {
                const rawPercent = (sub.remaining / sub.totalAllowance) * 100;
                const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
                const isCritical = percent <= 25;
                const isModerate = percent > 25 && percent <= 50;
                const isHovered = activeTooltipId === sub.id;

                // Color gradients
                const getGradient = () => {
                  if (isCritical) return 'from-red-600 to-red-400';
                  if (isModerate) return 'from-amber-600 to-yellow-400';
                  return 'from-emerald-600 to-[#76b900]';
                };

                const getTextColor = () => {
                  if (isCritical) return 'text-red-400';
                  if (isModerate) return 'text-amber-400';
                  return 'text-[#10b981]';
                };

                // Short 3-letter badge
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
                  <div
                    key={sub.id}
                    onMouseEnter={() => setActiveTooltipId(sub.id)}
                    onMouseLeave={() => setActiveTooltipId(null)}
                    onClick={() => setActiveTooltipId(isHovered ? null : sub.id)}
                    className="flex flex-col items-center cursor-pointer group relative"
                  >
                    {/* Percentage on top */}
                    <span
                      className={`text-[10px] font-mono font-bold tabular-nums mb-1 transition-transform group-hover:scale-110 ${getTextColor()}`}
                    >
                      {percent}%
                    </span>

                    {/* Compact Vertical Bar (Width: 10px, Height: 78px) */}
                    <div className="relative w-2.5 sm:w-3 h-20 bg-slate-950 rounded-sm p-[1.5px] border border-slate-800/90 flex flex-col justify-end shadow-inner overflow-hidden group-hover:border-slate-600">
                      {/* Background tick marks at 25%, 50%, 75% */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1 px-0.5">
                        <div className="border-b border-slate-800/70 w-full" />
                        <div className="border-b border-slate-800/70 w-full" />
                        <div className="border-b border-slate-800/70 w-full" />
                      </div>

                      {/* Liquid Fuel Fill Column */}
                      <div
                        className={`w-full rounded-xs bg-gradient-to-t ${getGradient()} transition-all duration-300 flex flex-col justify-between`}
                        style={{
                          height: `${Math.max(6, percent)}%`,
                          boxShadow: isCritical
                            ? '0 0 8px rgba(239,68,68,0.5)'
                            : '0 0 6px rgba(118,185,0,0.3)',
                        }}
                      >
                        <div className="w-full h-1 bg-white/70 rounded-full" />
                      </div>
                    </div>

                    {/* Short Tool Label */}
                    <span
                      className={`text-[9px] font-mono mt-1 transition-colors ${
                        isHovered
                          ? 'text-white font-bold'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {shortLabel}
                    </span>

                    {/* Interactive Flyout Popover on Hover/Click */}
                    {isHovered && (
                      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-48 bg-[#07090e] border border-slate-700 rounded-lg p-2.5 shadow-2xl z-50 text-left pointer-events-auto">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-100 truncate">
                            {sub.name.split('(')[0]}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold ${getTextColor()}`}
                          >
                            {percent}%
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-300 font-mono mb-1">
                          {typeof sub.remaining === 'number' && sub.remaining % 1 !== 0
                            ? sub.remaining.toFixed(1)
                            : sub.remaining.toLocaleString()}{' '}
                          /{' '}
                          {sub.totalAllowance.toLocaleString()} {sub.unit.split('/')[0]}
                        </div>

                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono mb-2">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          <span>{sub.resetCountdown}</span>
                        </div>

                        {/* Quick -1 & Reset buttons */}
                        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateRemaining(
                                sub.id,
                                Math.max(0, sub.remaining - (sub.totalAllowance > 1000 ? 500 : 1))
                              );
                            }}
                            className="flex items-center justify-center gap-1 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded text-[9px] font-mono"
                          >
                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                            <span>-1 Use</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResetSubscription(sub.id);
                            }}
                            className="flex items-center justify-center gap-1 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-[9px] font-mono"
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-[#10b981]" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Footer Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-[10px] text-slate-400">
              <button
                onClick={() => {
                  subscriptions.forEach((s) => {
                    onUpdateRemaining(s.id, Math.max(0, s.remaining - 1));
                  });
                }}
                className="hover:text-slate-200 flex items-center gap-1 font-mono"
              >
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                <span>Simulate -1</span>
              </button>

              <button
                onClick={onOpenAdd}
                className="hover:text-[#76b900] flex items-center gap-1 font-mono text-[#10b981]"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Add Tool</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
