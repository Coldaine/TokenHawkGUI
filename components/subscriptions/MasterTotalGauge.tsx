'use client';

import React, { useMemo } from 'react';
import { AISubscription } from '@/types/subscriptions';
import {
  Flame,
  ShieldCheck,
  Zap,
  RotateCcw,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Layers,
  Clock,
} from 'lucide-react';

interface MasterTotalGaugeProps {
  subscriptions: AISubscription[];
  onGlobalBurn: (percent: number) => void;
  onResetAll: () => void;
  onUpdateRemaining: (id: string, newRemaining: number) => void;
}

export default function MasterTotalGauge({
  subscriptions,
  onGlobalBurn,
  onResetAll,
  onUpdateRemaining,
}: MasterTotalGaugeProps) {
  // Compute true aggregate metrics
  const aggregate = useMemo(() => {
    let totalCap = 0;
    let totalRem = 0;
    let totalMonthlyCost = 0;
    let weightedRemainingSum = 0;

    // Track lowest / fastest depleting tool
    let lowestTool: AISubscription | null = null;
    let lowestPct = 101;

    subscriptions.forEach((sub) => {
      const pct = (sub.remaining / sub.totalAllowance) * 100;
      totalCap += sub.totalAllowance;
      totalRem += sub.remaining;

      const cost = parseFloat(sub.cost.replace(/[^0-9.]/g, '')) || 20;
      totalMonthlyCost += cost;

      // Cost-weighted capacity contribution
      weightedRemainingSum += pct * cost;

      if (pct < lowestPct) {
        lowestPct = pct;
        lowestTool = sub;
      }
    });

    const weightedAvgRemaining = totalMonthlyCost > 0
      ? Math.round(weightedRemainingSum / totalMonthlyCost)
      : Math.round((totalRem / (totalCap || 1)) * 100);

    const weightedAvgBurn = Math.max(0, Math.min(100, 100 - weightedAvgRemaining));

    // Estimated composite runway in days (based on 30 day standard cycle)
    const runwayDays = Math.max(1, Math.round((weightedAvgRemaining / 100) * 30));

    return {
      weightedAvgRemaining,
      weightedAvgBurn,
      totalMonthlyCost,
      runwayDays,
      lowestTool,
      lowestPct: Math.round(lowestPct),
      totalTools: subscriptions.length,
      criticalCount: subscriptions.filter((s) => (s.remaining / s.totalAllowance) * 100 <= 25).length,
    };
  }, [subscriptions]);

  // Radial SVG Arc calculations
  const size = 280;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Render a 260-degree open gauge arc
  const arcLength = circumference * 0.72;
  const strokeDashoffset = arcLength * (1 - aggregate.weightedAvgRemaining / 100);

  // Dynamic status color
  const isCritical = aggregate.weightedAvgRemaining <= 25;
  const isModerate = aggregate.weightedAvgRemaining > 25 && aggregate.weightedAvgRemaining <= 50;

  const statusColor = isCritical ? '#ef4444' : isModerate ? '#f59e0b' : '#76b900';
  const statusLabel = isCritical
    ? 'CRITICAL DEFCON 1'
    : isModerate
    ? 'MODERATE VELOCITY'
    : 'OPTIMAL RUNWAY';

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-[#090d16]/85 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl max-w-xl w-full mx-auto my-auto select-none font-sans">
      {/* Top Badge */}
      <div className="flex items-center justify-between w-full pb-3 mb-2 border-b border-slate-800/80 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ color: statusColor, backgroundColor: statusColor }}
          />
          <span className="font-bold text-slate-200 tracking-wider">
            TOTAL AI CONSUMPTION GAUGE
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded font-bold text-[10px]"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            border: `1px solid ${statusColor}50`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* THE MASTER RADIAL TOTAL GAUGE */}
      <div className="relative w-[280px] h-[240px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-220deg] overflow-visible"
        >
          {/* Background Track Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Glowing Active Radial Total Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(0 0 10px ${statusColor}80)`,
            }}
          />
        </svg>

        {/* Big Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center pointer-events-none">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
            Combined Remaining
          </span>

          <div
            className="text-5xl font-extrabold font-mono tabular-nums leading-none my-1 tracking-tight"
            style={{ color: statusColor }}
          >
            {aggregate.weightedAvgRemaining}%
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono mt-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong>{aggregate.weightedAvgBurn}%</strong> Global Burn
            </span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono mt-1">
            Across {aggregate.totalTools} Active Subscriptions
          </span>
        </div>
      </div>

      {/* Primary Aggregate Metric Summary Strip */}
      <div className="grid grid-cols-3 gap-3 w-full my-4 font-mono text-center">
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
          <span className="text-[10px] text-slate-400 block mb-0.5">PROJECTED RUNWAY</span>
          <span className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-[#76b900]" />
            ~{aggregate.runwayDays} Days
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
          <span className="text-[10px] text-slate-400 block mb-0.5">STACK MONTHLY SPEND</span>
          <span className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1">
            <DollarSign className="w-3 h-3 text-cyan-400" />
            ${aggregate.totalMonthlyCost}/mo
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
          <span className="text-[10px] text-slate-400 block mb-0.5">CRITICAL QUOTAS</span>
          <span
            className={`text-sm font-bold flex items-center justify-center gap-1 ${
              aggregate.criticalCount > 0 ? 'text-red-400' : 'text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            {aggregate.criticalCount} Tools
          </span>
        </div>
      </div>

      {/* Fastest Depleting Warning Callout */}
      {aggregate.lowestTool && (
        <div className="w-full p-2.5 mb-4 rounded-xl bg-slate-950/50 border border-slate-850 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400 font-mono text-[11px]">Primary Bottleneck:</span>
            <span className="font-semibold text-slate-200 truncate">
              {(aggregate.lowestTool as AISubscription).name}
            </span>
          </div>
          <span className="font-mono text-red-400 font-bold shrink-0 ml-2">
            {aggregate.lowestPct}% Left
          </span>
        </div>
      )}

      {/* Live Interactive Action Controls */}
      <div className="flex items-center justify-between w-full pt-3 border-t border-slate-800 text-xs">
        <span className="text-slate-400 font-mono text-[11px]">Live Stress Controls:</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onGlobalBurn(5)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 font-mono text-xs rounded-lg transition-colors shadow-sm"
            title="Simulate prompt/request burn across stack"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Burn (-5%)</span>
          </button>

          <button
            onClick={onResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[#76b900] font-mono text-xs rounded-lg transition-colors shadow-sm"
            title="Refill all subscriptions to 100%"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Refill All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
