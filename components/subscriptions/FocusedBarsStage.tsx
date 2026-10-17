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
  Gauge,
  Flame,
  Wand2,
} from 'lucide-react';

interface FocusedBarsStageProps {
  subscriptions: AISubscription[];
  onUpdateRemaining: (id: string, newRemaining: number) => void;
  onResetSubscription: (id: string) => void;
  onOpenEdit: (sub: AISubscription) => void;
}

type BarStyleMode = 'liquid' | 'segmented' | 'needle' | 'capsule' | 'dotmatrix';

interface SpringPreset {
  id: string;
  name: string;
  icon: string;
  stiffness: number;
  damping: number;
  mass: number;
}

const SPRING_PRESETS: SpringPreset[] = [
  { id: 'crisp', name: '⚡ Crisp Snap', icon: '⚡', stiffness: 650, damping: 36, mass: 0.6 },
  { id: 'bouncy', name: '🫧 Bouncy Spring', icon: '🫧', stiffness: 380, damping: 16, mass: 0.9 },
  { id: 'fluid', name: '🌊 Fluid Glide', icon: '🌊', stiffness: 180, damping: 26, mass: 1.2 },
  { id: 'synth', name: '🎛️ Studio Synthesizer', icon: '🎛️', stiffness: 450, damping: 30, mass: 0.8 },
];

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

  // Bar Visual Style (Liquid, Segmented, Needle, Capsule, Dot-Matrix)
  const [barStyle, setBarStyle] = useState<BarStyleMode>('liquid');

  // Accordion mode: default 3 bars -> expand to all
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [hoveredSubId, setHoveredSubId] = useState<string | null>(null);

  // Real-time Snap Physics Controls
  const [showPhysicsPanel, setShowPhysicsPanel] = useState(false);
  const [stiffness, setStiffness] = useState(450);
  const [damping, setDamping] = useState(30);
  const [mass, setMass] = useState(0.8);
  const [activePreset, setActivePreset] = useState('synth');

  // Apply a preset
  const applyPreset = (preset: SpringPreset) => {
    setActivePreset(preset.id);
    setStiffness(preset.stiffness);
    setDamping(preset.damping);
    setMass(preset.mass);
  };

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

  // Dynamic spring physics transition object passed to layout animations
  const springTransition = {
    type: 'spring' as const,
    stiffness,
    damping,
    mass,
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none font-sans my-auto w-full max-w-4xl px-4">
      {/* Top Controls Header: Opacity Slider, Bar Scale & Accordion Pin */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-3 px-1 text-xs font-mono">
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

        {/* Toolbar: Style Switcher, Physics Drawer Toggle, Opacity, Size */}
        <div className="flex flex-wrap items-center gap-2.5 bg-[#0b0f19]/90 border border-slate-800 rounded-xl px-3 py-1.5 backdrop-blur-md">
          {/* Style Selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] hidden md:inline">Style:</span>
            {(
              [
                { id: 'liquid', label: 'Liquid' },
                { id: 'segmented', label: 'LED VU' },
                { id: 'needle', label: 'Needle' },
                { id: 'capsule', label: 'Capsule' },
                { id: 'dotmatrix', label: 'Matrix' },
              ] as const
            ).map((style) => (
              <button
                key={style.id}
                onClick={() => setBarStyle(style.id)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  barStyle === style.id
                    ? 'bg-[#76b900] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Snap Physics Toggle */}
          <button
            onClick={() => setShowPhysicsPanel(!showPhysicsPanel)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              showPhysicsPanel
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 border border-slate-700/80 text-amber-300 hover:bg-slate-850'
            }`}
            title="Configure spring snap stiffness & damping"
          >
            <Gauge className="w-3 h-3" />
            <span>Snap Physics</span>
          </button>

          <div className="h-3 w-px bg-slate-800" />

          {/* Opacity Slider */}
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 text-[10px] hidden sm:inline">Opacity:</span>
            <input
              type="range"
              min="0.15"
              max="0.98"
              step="0.05"
              value={glassOpacity}
              onChange={(e) => setGlassOpacity(parseFloat(e.target.value))}
              className="w-14 h-1 bg-slate-800 rounded appearance-none accent-[#76b900] cursor-pointer"
            />
            <span className="text-slate-300 text-[10px] tabular-nums w-6">
              {Math.round(glassOpacity * 100)}%
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Bar Scale Selector */}
          <div className="flex items-center gap-1">
            {(['compact', 'standard', 'jumbo'] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setBarScale(scale)}
                className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition-colors ${
                  barScale === scale
                    ? 'bg-slate-800 text-[#76b900] font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scale[0].toUpperCase()}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Accordion Pin Toggle */}
          <button
            onClick={() => setPinnedExpanded(!pinnedExpanded)}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors ${
              pinnedExpanded
                ? 'bg-slate-800 text-[#76b900] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {pinnedExpanded ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>3</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SNAP PHYSICS LAB DRAWER (Sliders for speed, bounce, inertia) */}
      <AnimatePresence>
        {showPhysicsPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full mb-3 bg-[#080d17]/95 border border-amber-900/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl font-mono text-xs overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-100 text-xs">
                  Snap &amp; Spring Physics Configurator
                </span>
                <span className="text-[10px] text-slate-500">
                  Controls how fast and aggressively the accordion snaps open
                </span>
              </div>

              {/* Test snap trigger */}
              <button
                onClick={() => {
                  setIsAccordionExpanded((prev) => !prev);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] transition-colors"
              >
                Test Snap ({shouldShowAll ? 'Collapse' : 'Expand'})
              </button>
            </div>

            {/* Presets Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-slate-400 text-[11px]">Presets:</span>
              {SPRING_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
                    activePreset === p.id
                      ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {/* 3 Physical Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Stiffness Slider (Speed of snap) */}
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Stiffness (Snap Velocity):</span>
                  <span className="font-bold text-amber-400">{stiffness}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="900"
                  step="25"
                  value={stiffness}
                  onChange={(e) => {
                    setStiffness(parseInt(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 block mt-1">
                  Higher = faster, instantaneous snap
                </span>
              </div>

              {/* Damping Slider (Bounce reduction) */}
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Damping (Friction / Bounce):</span>
                  <span className="font-bold text-amber-400">{damping}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="2"
                  value={damping}
                  onChange={(e) => {
                    setDamping(parseInt(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 block mt-1">
                  Lower = more spring oscillations / bounce
                </span>
              </div>

              {/* Mass Slider (Weight & Momentum) */}
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Mass (Weight &amp; Inertia):</span>
                  <span className="font-bold text-amber-400">{mass}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={mass}
                  onChange={(e) => {
                    setMass(parseFloat(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-amber-400 cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 block mt-1">
                  Higher = heavy, deliberate physical inertia
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <h3 className="font-bold text-slate-100 text-xs truncate max-w-[170px]">
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

        {/* BARS CONTAINER ANIMATED WITH CUSTOM SPRING DYNAMICS */}
        <motion.div
          layout
          transition={springTransition}
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
                transition={springTransition}
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

                {/* --- RENDER CHOSEN BAR STYLE --- */}

                {/* STYLE 1: LIQUID EQUALIZER (Continuous cylinder with meniscus) */}
                {barStyle === 'liquid' && (
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
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2 px-1 opacity-30">
                      <div className="border-b border-slate-700 w-full" />
                      <div className="border-b border-slate-700 w-full" />
                      <div className="border-b border-slate-700 w-full" />
                    </div>
                    <div
                      className={`w-full rounded-md bg-gradient-to-t ${getFillColor()} transition-all duration-400 ease-out flex flex-col justify-between`}
                      style={{
                        height: `${Math.max(5, pct)}%`,
                        boxShadow: getGlow(),
                      }}
                    >
                      <div className="w-full h-1.5 bg-white/80 rounded-full blur-[0.5px]" />
                      <div className="w-full h-full bg-white/10" />
                    </div>
                  </div>
                )}

                {/* STYLE 2: SEGMENTED LED VU METER (10 discrete illuminated blocks) */}
                {barStyle === 'segmented' && (
                  <div
                    className="flex flex-col justify-between p-[2px] rounded-lg border bg-slate-950 transition-all"
                    style={{
                      height: `${barDimensions.height}px`,
                      width: `${barDimensions.width}px`,
                      borderColor: isHovered ? sub.color : 'rgba(30, 41, 59, 0.8)',
                    }}
                  >
                    {Array.from({ length: 10 }).map((_, segIdx) => {
                      const fromBottom = 9 - segIdx;
                      const isLit = fromBottom < Math.round((pct / 100) * 10);
                      const isTopTwo = segIdx < 2;
                      const isMid = segIdx >= 2 && segIdx < 5;

                      let colorClass = 'bg-slate-900/40';
                      if (isLit) {
                        colorClass = isTopTwo
                          ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                          : isMid
                          ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                          : 'bg-[#76b900] shadow-[0_0_6px_#76b900]';
                      }

                      return (
                        <div
                          key={segIdx}
                          className={`w-full flex-1 rounded-[1.5px] my-[1px] transition-colors ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* STYLE 3: SWISS CYBER MICRO-NEEDLE (Hairline track with bead) */}
                {barStyle === 'needle' && (
                  <div
                    className="relative flex flex-col justify-end items-center"
                    style={{
                      height: `${barDimensions.height}px`,
                      width: `${barDimensions.width}px`,
                    }}
                  >
                    <div className="w-1.5 h-full bg-zinc-900 rounded-full relative flex flex-col justify-end">
                      <div
                        className={`w-full rounded-full transition-all ${
                          isCrit ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-white'
                        }`}
                        style={{ height: `${Math.max(6, pct)}%` }}
                      />
                      {/* Floating needle marker */}
                      <div
                        className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#ffffff] -translate-x-1/2 left-1/2 pointer-events-none"
                        style={{ bottom: `calc(${pct}% - 6px)` }}
                      />
                    </div>
                  </div>
                )}

                {/* STYLE 4: SCI-FI GLASS CAPSULE (Pill chamber with purple glow) */}
                {barStyle === 'capsule' && (
                  <div
                    className="relative rounded-full p-[2px] border flex flex-col justify-end shadow-inner overflow-hidden transition-all"
                    style={{
                      height: `${barDimensions.height}px`,
                      width: `${barDimensions.width + 4}px`,
                      backgroundColor: 'rgba(15, 11, 24, 0.75)',
                      borderColor: isHovered ? sub.color : 'rgba(147, 51, 234, 0.4)',
                    }}
                  >
                    <div
                      className={`w-full rounded-full bg-gradient-to-t ${
                        isCrit
                          ? 'from-rose-600 to-pink-500'
                          : isMod
                          ? 'from-purple-600 to-indigo-400'
                          : 'from-violet-600 to-cyan-400'
                      } transition-all duration-300 flex flex-col justify-between`}
                      style={{
                        height: `${Math.max(10, pct)}%`,
                        boxShadow: `0 0 12px ${sub.color}`,
                      }}
                    >
                      <div className="w-full h-1.5 bg-white/70 rounded-full" />
                    </div>
                  </div>
                )}

                {/* STYLE 5: DOT-MATRIX SPECTROGRAPH (Audio frequency dot grid) */}
                {barStyle === 'dotmatrix' && (
                  <div
                    className="flex flex-col justify-between p-1 rounded-lg border bg-slate-950/90 transition-all items-center"
                    style={{
                      height: `${barDimensions.height}px`,
                      width: `${barDimensions.width}px`,
                      borderColor: isHovered ? sub.color : 'rgba(51, 65, 85, 0.6)',
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, dIdx) => {
                      const fromBottom = 11 - dIdx;
                      const isDotLit = fromBottom < Math.round((pct / 100) * 12);
                      return (
                        <div
                          key={dIdx}
                          className={`w-2.5 h-1.5 rounded-xs transition-colors ${
                            isDotLit
                              ? isCrit
                                ? 'bg-red-400 shadow-[0_0_4px_#ef4444]'
                                : 'bg-[#76b900] shadow-[0_0_4px_#76b900]'
                              : 'bg-slate-900/60'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Tool Logo Icon below the bar */}
                <div
                  className="mt-2.5 p-1 rounded-md bg-slate-900 border border-slate-800 transition-colors group-hover:border-slate-700"
                  title={sub.name}
                >
                  {getToolLogo(sub.name, barScale === 'jumbo' ? 18 : 15)}
                </div>

                {/* Tool Short Label */}
                <span className="text-[10px] font-mono mt-1 text-slate-400 group-hover:text-slate-100 truncate max-w-[42px] text-center">
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
          <span>
            Snap: {stiffness} stiffness · {damping} damping · {mass} mass
          </span>
          <span>Hover any bar for mouseover disclosure &amp; -1 use controls</span>
        </div>
      </div>
    </div>
  );
}
