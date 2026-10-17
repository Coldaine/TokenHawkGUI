'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { AISubscription } from '@/types/subscriptions';
import {
  X,
  Activity,
  Flame,
  ShieldAlert,
  Sliders,
  Sparkles,
  Zap,
  TrendingDown,
  RefreshCw,
  Gauge,
} from 'lucide-react';

interface GlobalConsumptionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetAll: () => void;
}

type WeightingMode = 'cost' | 'frequency' | 'equal';

export default function GlobalConsumptionOverlay({
  isOpen,
  onClose,
  subscriptions,
  onUpdateRemaining,
  onResetAll,
}: GlobalConsumptionOverlayProps) {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [weightingMode, setWeightingMode] = useState<WeightingMode>('cost');
  const [activeTab, setActiveTab] = useState<'concentric' | 'radar'>('concentric');

  // Multi-Aggregate Math Engine
  const aggregation = useMemo(() => {
    const categories: Record<
      string,
      {
        totalCapacity: number;
        remainingCapacity: number;
        costSum: number;
        count: number;
        subs: AISubscription[];
      }
    > = {
      chat: { totalCapacity: 0, remainingCapacity: 0, costSum: 0, count: 0, subs: [] },
      coding: { totalCapacity: 0, remainingCapacity: 0, costSum: 0, count: 0, subs: [] },
      media: { totalCapacity: 0, remainingCapacity: 0, costSum: 0, count: 0, subs: [] },
      api: { totalCapacity: 0, remainingCapacity: 0, costSum: 0, count: 0, subs: [] },
    };

    let totalCost = 0;
    subscriptions.forEach((sub) => {
      const cat = categories[sub.category] || categories.chat;
      cat.totalCapacity += sub.totalAllowance;
      cat.remainingCapacity += sub.remaining;

      // Extract approximate numeric cost (e.g. "$20/mo" -> 20)
      const costNum = parseFloat(sub.cost.replace(/[^0-9.]/g, '')) || 20;
      cat.costSum += costNum;
      totalCost += costNum;
      cat.count += 1;
      cat.subs.push(sub);
    });

    // Compute consumption % (Usage = 100 - Remaining%)
    const catStats = Object.entries(categories).map(([key, data]) => {
      const remainingPercent =
        data.subs.length > 0
          ? data.subs.reduce((acc, s) => acc + (s.remaining / s.totalAllowance) * 100, 0) /
            data.subs.length
          : 0;

      const usagePercent = Math.max(0, Math.min(100, Math.round(100 - remainingPercent)));
      const costWeight = totalCost > 0 ? data.costSum / totalCost : 0.25;

      // Frequency multipliers: chat/coding used heavily every hour
      const freqWeight =
        key === 'chat' ? 0.35 : key === 'coding' ? 0.35 : key === 'media' ? 0.15 : 0.15;

      return {
        category: key,
        label:
          key === 'chat'
            ? 'Chat & Reasoning'
            : key === 'coding'
            ? 'Code & Dev'
            : key === 'media'
            ? 'Media & Voice'
            : 'APIs & Credits',
        usagePercent,
        remainingPercent: Math.round(remainingPercent),
        costSum: data.costSum,
        costWeight,
        freqWeight,
        count: data.count,
        tools: data.subs.map((s) => s.name.split('(')[0].trim()),
      };
    });

    // Compute global weighted consumption based on selected mode
    let globalUsage = 0;
    if (weightingMode === 'cost') {
      globalUsage = catStats.reduce((acc, c) => acc + c.usagePercent * c.costWeight, 0);
    } else if (weightingMode === 'frequency') {
      globalUsage = catStats.reduce((acc, c) => acc + c.usagePercent * c.freqWeight, 0);
    } else {
      globalUsage =
        catStats.reduce((acc, c) => acc + c.usagePercent, 0) / (catStats.length || 1);
    }

    const roundedGlobal = Math.round(globalUsage);
    const globalRemaining = 100 - roundedGlobal;

    return {
      catStats,
      globalUsage: roundedGlobal,
      globalRemaining,
      totalCost,
    };
  }, [subscriptions, weightingMode]);

  if (!isOpen) return null;

  // Concentric Rings Data (from outer to inner)
  // Recharts RadialBarChart: innermost is first or last depending on order
  const radialData = [
    {
      name: 'Global Weighted',
      value: aggregation.globalUsage,
      fill: aggregation.globalUsage > 75 ? '#ef4444' : aggregation.globalUsage > 50 ? '#f59e0b' : '#76b900',
    },
    {
      name: 'Chat & Reasoning',
      value: aggregation.catStats[0]?.usagePercent ?? 0,
      fill: '#10b981',
    },
    {
      name: 'Code & Dev',
      value: aggregation.catStats[1]?.usagePercent ?? 0,
      fill: '#3b82f6',
    },
    {
      name: 'Media & Voice',
      value: aggregation.catStats[2]?.usagePercent ?? 0,
      fill: '#ec4899',
    },
    {
      name: 'APIs & Credits',
      value: aggregation.catStats[3]?.usagePercent ?? 0,
      fill: '#06b6d4',
    },
  ];

  // Radar Data for Multi-Axis Pentagon/Tetragon
  const radarData = aggregation.catStats.map((c) => ({
    subject: c.label,
    consumption: c.usagePercent,
    remaining: c.remainingPercent,
    fullMark: 100,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#070b12] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0b101b]/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#76b900]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Global AI Quota Consumption Matrix</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-[#10b981] border border-emerald-800/60 font-semibold uppercase">
                  Multi-Aggregate Monster
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Weighted composite consumption across all AI reasoning, dev, media, and API tools.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Weighting Selector & Quick Simulation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/60 border-b border-slate-850 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Weighting Engine:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {(
                [
                  { id: 'cost', label: 'Cost-Weighted ($)' },
                  { id: 'frequency', label: 'Frequency (Usage Rate)' },
                  { id: 'equal', label: 'Equal Weight' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setWeightingMode(mode.id)}
                  className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                    weightingMode === mode.id
                      ? 'bg-slate-800 text-[#76b900] font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stress-Test Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Stress Test:</span>
            <button
              onClick={() => {
                subscriptions.forEach((s) => {
                  onUpdateRemaining(
                    s.id,
                    Math.max(0, s.remaining - Math.round(s.totalAllowance * 0.1))
                  );
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-950/50 hover:bg-red-950 border border-red-900/60 rounded text-red-300 text-[11px] transition-colors"
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>Simulate Burn (+10%)</span>
            </button>

            <button
              onClick={onResetAll}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-slate-300 text-[11px] transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-[#10b981]" />
              <span>Refill All</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* LEFT: THE RECHARTS RADIAL CONCENTRIC MONSTROSITY */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            {/* View Tab Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 mb-2 z-10 text-[11px] font-mono">
              <button
                onClick={() => setActiveTab('concentric')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'concentric'
                    ? 'bg-[#76b900] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Concentric Rings
              </button>
              <button
                onClick={() => setActiveTab('radar')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'radar'
                    ? 'bg-[#76b900] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Polar Radar
              </button>
            </div>

            {/* The 260px Chart Container */}
            <div className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center">
              {mounted && activeTab === 'concentric' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="25%"
                    outerRadius="100%"
                    barSize={12}
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      dataKey="value"
                      cornerRadius={6}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#090d16] border border-slate-700 p-2 rounded-lg text-xs font-mono shadow-xl text-slate-200">
                              <span className="font-bold block" style={{ color: data.fill }}>
                                {data.name}
                              </span>
                              <span>Burned: {data.value}%</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              )}

              {mounted && activeTab === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis
                      dataKey="subject"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                    <Radar
                      name="Consumption %"
                      dataKey="consumption"
                      stroke="#76b900"
                      fill="#76b900"
                      fillOpacity={0.35}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: 8,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}

              {/* Glowing Center Readout for Concentric Rings */}
              {activeTab === 'concentric' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Global Burn
                  </span>
                  <div
                    className={`text-3xl sm:text-4xl font-extrabold font-mono tabular-nums leading-none my-0.5 ${
                      aggregation.globalUsage > 75
                        ? 'text-red-400'
                        : aggregation.globalUsage > 50
                        ? 'text-amber-400'
                        : 'text-[#76b900]'
                    }`}
                  >
                    {aggregation.globalUsage}%
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {aggregation.globalRemaining}% Runway Left
                  </span>
                </div>
              )}
            </div>

            {/* Radial Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-1 text-[11px] font-mono text-slate-400">
              {radialData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span>
                    {item.name}: <strong className="text-slate-200">{item.value}%</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: MULTI-AGGREGATE MONSTROSITY BREAKDOWN MATRIX */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Category Breakdown &amp; Weighted Impact
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Stack Cost: ~${aggregation.totalCost}/mo
              </span>
            </div>

            <div className="space-y-2.5">
              {aggregation.catStats.map((cat, idx) => {
                const colors = ['#10b981', '#3b82f6', '#ec4899', '#06b6d4'];
                const accentColor = colors[idx % colors.length];

                return (
                  <div
                    key={cat.category}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 hover:border-slate-750 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span className="font-semibold text-xs text-slate-200 font-mono">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({cat.count} tools)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-slate-400">
                          Burn: <strong className="text-slate-200">{cat.usagePercent}%</strong>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-emerald-400">
                          {cat.remainingPercent}% Left
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800/80 mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.usagePercent}%`,
                          backgroundColor: accentColor,
                          boxShadow: `0 0 8px ${accentColor}`,
                        }}
                      />
                    </div>

                    {/* Tools in this cluster */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="truncate max-w-[260px]">
                        Active: {cat.tools.join(', ')}
                      </span>
                      <span>
                        Weight: {Math.round(weightingMode === 'cost' ? cat.costWeight * 100 : cat.freqWeight * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Health Assessment / Runaway Forecast */}
            <div className="mt-1 p-3 rounded-xl bg-emerald-950/25 border border-emerald-900/40 flex items-start gap-2.5 text-xs text-slate-300">
              <ShieldAlert className="w-4 h-4 text-[#76b900] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#76b900] block mb-0.5 font-mono">
                  Multi-Aggregate Health Assessment:
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {aggregation.globalUsage > 75
                    ? 'Warning: High global burn rate detected. Chat and API quotas are approaching throttling thresholds. Consider pacing requests or switching to tier fallbacks.'
                    : aggregation.globalUsage > 50
                    ? 'Moderate runway velocity. Coding and reasoning subscriptions are at mid-capacity with ~12 days remaining in the billing cycle.'
                    : 'Optimal runway. Quota health across all 4 tool clusters is well within baseline targets with zero imminent rate limits.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-500 font-mono">
          <span>Recharts Polar &amp; Radial Aggregation Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg transition-colors font-sans"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
