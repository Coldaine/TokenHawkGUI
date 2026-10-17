'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Compass,
  Grid,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PRESENTATION_ACTS } from '@/lib/deftData';

interface TimelineDockProps {
  progress: number;
  isPlaying: boolean;
  speed: number;
  isOrbiting: boolean;
  isBlueprintMode: boolean;
  isHudDimmed: boolean;
  onTogglePlay: () => void;
  onSeek: (value: number) => void;
  onSetSpeed: (speed: number) => void;
  onToggleOrbit: () => void;
  onToggleBlueprint: () => void;
  onToggleDimHud: () => void;
  onReset: () => void;
}

export default function TimelineDock({
  progress,
  isPlaying,
  speed,
  isOrbiting,
  isBlueprintMode,
  isHudDimmed,
  onTogglePlay,
  onSeek,
  onSetSpeed,
  onToggleOrbit,
  onToggleBlueprint,
  onToggleDimHud,
  onReset,
}: TimelineDockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeActIndex = Math.min(
    Math.floor(progress * PRESENTATION_ACTS.length),
    PRESENTATION_ACTS.length - 1
  );
  const currentAct = PRESENTATION_ACTS[activeActIndex];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-auto">
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#0b0f19]/90 hover:bg-[#0b0f19] border-t border-x border-slate-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 rounded-t-md backdrop-blur-md transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#76b900]" />
              <span>Show Timeline</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Timeline</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Control Dock */}
      {!isCollapsed && (
        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-3.5 shadow-2xl backdrop-blur-md">
          {/* Active Act Narrative Headline */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-[11px] text-[#76b900] font-bold shrink-0">
                ACT {currentAct.id}/5
              </span>
              <span className="font-semibold text-slate-100 truncate">
                {currentAct.title}
              </span>
              <span className="text-slate-500 hidden md:inline truncate">
                — {currentAct.subtitle}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 shrink-0">
              <span className="tabular-nums font-semibold text-slate-200">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          {/* Interactive Scrub Bar with Act Range Dividers */}
          <div className="relative mb-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#76b900] transition-all"
            />

            {/* Act Step Markers */}
            <div className="flex justify-between px-0.5 mt-1">
              {PRESENTATION_ACTS.map((act) => {
                const isActive = activeActIndex === act.id - 1;
                return (
                  <button
                    key={act.id}
                    onClick={() => onSeek((act.id - 1) * 0.2 + 0.01)}
                    className={`text-[10px] font-mono transition-colors ${
                      isActive
                        ? 'text-[#76b900] font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Act {act.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#76b900] hover:bg-[#68a400] text-slate-950 font-bold rounded-md transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Auto-Play</span>
                  </>
                )}
              </button>

              <button
                onClick={onReset}
                title="Restart Presentation"
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Speed Multiplier Segment */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
                {[0.5, 1.0, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetSpeed(s)}
                    className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                      speed === s
                        ? 'bg-slate-800 text-[#76b900] font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Feature & Viewport Toggles */}
            <div className="flex items-center gap-2">
              {/* Free Orbit Inspection Toggle */}
              <button
                onClick={onToggleOrbit}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${
                  isOrbiting
                    ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isOrbiting ? 'Free Orbit (Active)' : 'Free Orbit'}</span>
              </button>

              {/* Blueprint Mode Toggle */}
              <button
                onClick={onToggleBlueprint}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${
                  isBlueprintMode
                    ? 'bg-emerald-950/80 border-[#10b981] text-[#10b981]'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Blueprint</span>
              </button>

              {/* Dim HUD Overlay Toggle */}
              <button
                onClick={onToggleDimHud}
                title={isHudDimmed ? 'Restore HUDs' : 'Dim Side HUDs'}
                className={`p-1.5 rounded-md border text-[11px] transition-colors ${
                  isHudDimmed
                    ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isHudDimmed ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
