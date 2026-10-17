'use client';

import React, { useState } from 'react';
import { AISubscription, ToolCategory } from '@/types/subscriptions';
import {
  Clock,
  Zap,
  RotateCcw,
  Plus,
  AlertTriangle,
  ArrowDownCircle,
  ExternalLink,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

interface VerticalBarRackProps {
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetSubscription: (id: string) => void;
  onOpenEdit: (sub: AISubscription) => void;
  onOpenAdd: () => void;
}

export default function VerticalBarRack({
  subscriptions,
  onUpdateRemaining,
  onResetSubscription,
  onOpenEdit,
  onOpenAdd,
}: VerticalBarRackProps) {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [sortBy, setSortBy] = useState<'lowest' | 'highest' | 'reset' | 'name'>('lowest');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter subscriptions
  const filtered = subscriptions.filter((sub) => {
    if (selectedCategory === 'all') return true;
    return sub.category === selectedCategory;
  });

  // Sort subscriptions
  const sorted = [...filtered].sort((a, b) => {
    const percentA = (a.remaining / a.totalAllowance) * 100;
    const percentB = (b.remaining / b.totalAllowance) * 100;

    if (sortBy === 'lowest') return percentA - percentB;
    if (sortBy === 'highest') return percentB - percentA;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  // KPI summaries
  const totalSubs = subscriptions.length;
  const criticalSubs = subscriptions.filter(
    (s) => (s.remaining / s.totalAllowance) * 100 <= 25
  );
  const avgPercent = Math.round(
    subscriptions.reduce(
      (acc, s) => acc + (s.remaining / s.totalAllowance) * 100,
      0
    ) / (totalSubs || 1)
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Header Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-3.5 backdrop-blur-md">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">
            ACTIVE SUBSCRIPTIONS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100 font-mono tabular-nums">
              {totalSubs}
            </span>
            <span className="text-xs text-slate-500 font-sans">monitored tools</span>
          </div>
        </div>

        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-3.5 backdrop-blur-md">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">
            AVERAGE RUNWAY REMAINING
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                avgPercent > 50
                  ? 'text-[#10b981]'
                  : avgPercent > 25
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {avgPercent}%
            </span>
            <span className="text-xs text-slate-500 font-sans">across stack</span>
          </div>
        </div>

        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-3.5 backdrop-blur-md">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">
            CRITICAL QUOTAS (&le;25%)
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                criticalSubs.length > 0 ? 'text-red-400' : 'text-slate-300'
              }`}
            >
              {criticalSubs.length}
            </span>
            <span className="text-xs text-slate-500 font-sans">
              {criticalSubs.length > 0 ? 'near rate limit' : 'all healthy'}
            </span>
          </div>
        </div>

        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-3.5 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              SUBSCRIPTION ACTIONS
            </span>
            <span className="text-xs text-slate-300 font-medium">Add Custom AI Tool</span>
          </div>
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#76b900] hover:bg-[#68a400] text-slate-950 text-xs font-bold rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tool</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
          {(
            [
              { id: 'all', label: 'All Subscriptions' },
              { id: 'chat', label: 'Chat & Reasoning' },
              { id: 'coding', label: 'Code & Dev' },
              { id: 'media', label: 'Media & Voice' },
              { id: 'api', label: 'APIs & Credits' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#76b900]"
          >
            <option value="lowest">Lowest % Remaining First</option>
            <option value="highest">Highest % Remaining First</option>
            <option value="name">Alphabetical (Name)</option>
          </select>
        </div>
      </div>

      {/* THE HERO: VERTICAL EQUALIZER BARS RACK */}
      <div className="bg-[#0b0f19]/70 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Subscription Remaining Capacity Rack
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live vertical fuel gauges calibrated to active rolling sessions and monthly allowances.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 hidden sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
              &gt;50% Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              25-50% Burning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              &lt;25% Low / Critical
            </span>
          </div>
        </div>

        {/* Horizontal scroll container for the vertical columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pt-4">
          {sorted.map((sub) => {
            const rawPercent = (sub.remaining / sub.totalAllowance) * 100;
            const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
            const isCritical = percent <= 25;
            const isModerate = percent > 25 && percent <= 50;
            const isHovered = hoveredId === sub.id;

            // Bar fill color grading
            const getFillColor = () => {
              if (isCritical) return 'from-red-600 via-rose-500 to-red-400';
              if (isModerate) return 'from-amber-600 via-amber-500 to-yellow-400';
              return 'from-emerald-700 via-emerald-500 to-[#76b900]';
            };

            const getGlowShadow = () => {
              if (isCritical) return '0 0 16px rgba(239, 68, 68, 0.4)';
              if (isModerate) return '0 0 16px rgba(245, 158, 11, 0.3)';
              return '0 0 16px rgba(118, 185, 0, 0.3)';
            };

            return (
              <div
                key={sub.id}
                onMouseEnter={() => setHoveredId(sub.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex flex-col items-center bg-[#07090e]/80 border rounded-xl p-3 transition-all duration-200 relative ${
                  isHovered
                    ? 'border-slate-600 bg-slate-900/60 shadow-xl'
                    : isCritical
                    ? 'border-red-900/60'
                    : 'border-slate-800/90'
                }`}
              >
                {/* Critical Warning Badge */}
                {isCritical && (
                  <div className="absolute top-2 right-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                  </div>
                )}

                {/* Big Percentage Header */}
                <div className="text-center mb-2">
                  <div
                    className={`text-xl font-bold font-mono tabular-nums leading-none ${
                      isCritical
                        ? 'text-red-400'
                        : isModerate
                        ? 'text-amber-400'
                        : 'text-[#10b981]'
                    }`}
                  >
                    {percent}%
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                    Remaining
                  </span>
                </div>

                {/* THE TALL VERTICAL GAUGE BAR */}
                <div className="relative w-12 h-64 bg-slate-950 rounded-lg p-1.5 border border-slate-800/90 flex flex-col justify-end shadow-inner overflow-hidden my-1">
                  {/* Background tick lines (0%, 25%, 50%, 75%) */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2 px-1">
                    <div className="border-b border-slate-800/60 w-full" />
                    <div className="border-b border-slate-800/60 w-full" />
                    <div className="border-b border-slate-800/60 w-full" />
                    <div className="border-b border-slate-800/60 w-full" />
                  </div>

                  {/* Vertical Liquid Fill Column */}
                  <div
                    className={`w-full rounded-md bg-gradient-to-t ${getFillColor()} transition-all duration-500 ease-out flex flex-col justify-between items-center relative overflow-hidden`}
                    style={{
                      height: `${Math.max(4, percent)}%`,
                      boxShadow: getGlowShadow(),
                    }}
                  >
                    {/* Glowing surface meniscus */}
                    <div className="w-full h-1.5 bg-white/70 rounded-full blur-[0.5px]" />
                    {/* Inner pulse */}
                    <div className="w-full h-full bg-white/10" />
                  </div>
                </div>

                {/* Tool Name & Specs */}
                <div className="w-full text-center mt-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-xs font-semibold text-slate-200 truncate"
                      title={sub.name}
                    >
                      {sub.name.split('(')[0].trim()}
                    </h3>
                    <span className="text-[10px] text-slate-400 block truncate font-mono">
                      {sub.provider}
                    </span>
                  </div>

                  {/* Exact Units Left */}
                  <div className="my-2 py-1.5 px-2 bg-slate-950/70 border border-slate-850 rounded text-center">
                    <span className="text-xs font-mono font-bold text-slate-200 tabular-nums block">
                      {typeof sub.remaining === 'number' && sub.remaining % 1 !== 0
                        ? sub.remaining.toFixed(1)
                        : sub.remaining.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate leading-tight">
                      of {sub.totalAllowance.toLocaleString()} {sub.unit.split('/')[0]}
                    </span>
                  </div>

                  {/* Reset Countdown */}
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate" title={`Reset: ${sub.resetCountdown}`}>
                      {sub.resetCountdown.split('(')[0]}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-1 mt-2.5 pt-2 border-t border-slate-850 w-full">
                    <button
                      onClick={() =>
                        onUpdateRemaining(
                          sub.id,
                          Math.max(0, sub.remaining - (sub.totalAllowance > 1000 ? 500 : 1))
                        )
                      }
                      title="Simulate prompt/request usage"
                      className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-mono transition-colors"
                    >
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      <span>-1</span>
                    </button>

                    <button
                      onClick={() => onResetSubscription(sub.id)}
                      title="Refill quota to 100%"
                      className="flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-[10px] font-mono transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5 text-[#10b981]" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Edit link */}
                  <button
                    onClick={() => onOpenEdit(sub)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 mt-1 underline decoration-dotted"
                  >
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
