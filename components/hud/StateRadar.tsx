'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SkillStage } from '@/types/presentation';

interface StateRadarProps {
  progress: number; // 0 to 1
  isDimmed: boolean;
}

const STAGES: { key: SkillStage; label: string; desc: string }[] = [
  { key: 'EVALUATE', label: 'Evaluate', desc: 'Computes baseline FAR & Recall' },
  { key: 'RCA', label: 'RCA', desc: 'Root cause false-alarm defect clusters' },
  { key: 'SDG', label: 'SDG', desc: 'Synthetic generator defect simulation' },
  { key: 'MINE', label: 'Mine', desc: 'Hard negative mining against embeddings' },
  { key: 'RETRAIN', label: 'Retrain', desc: 'TAO fine-tuning batch checkpoint' },
  { key: 'GATE', label: 'Gate', desc: 'Evidence threshold verification' },
];

export default function StateRadar({ progress, isDimmed }: StateRadarProps) {
  // Determine active stage from progress
  const stageIndex = Math.min(Math.floor(progress * STAGES.length), STAGES.length - 1);
  const activeStage = STAGES[stageIndex];
  const iteration = Math.min(Math.floor(progress * 4) + 1, 4);

  // Simulated live KPIs based on progress
  const kpis = useMemo(() => {
    const p = Math.min(progress, 1);
    const far = (0.048 - p * 0.038).toFixed(4); // Decreases from 0.048 down to 0.010
    const recall = (0.932 + p * 0.052).toFixed(4); // Increases from 0.932 to 0.984
    return { far, recall };
  }, [progress]);

  // Evidence toast trigger during Act 4 (progress 0.65 - 0.78)
  const showToast = progress >= 0.62 && progress <= 0.78;
  const isFailedToast = progress >= 0.62 && progress <= 0.70;

  return (
    <aside
      className={`fixed top-16 left-6 z-30 w-72 pointer-events-auto transition-opacity duration-300 ${
        isDimmed ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
      {/* State Radar Card */}
      <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-4 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-xs font-semibold text-slate-200">
              deft_state.json
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Lock className="w-3 h-3 text-[#76b900]" />
            <span>flock: LOCKED</span>
          </div>
        </div>

        {/* Circular / Linear Stage Ring */}
        <div className="py-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Cycle Stage</span>
            <span className="font-mono text-slate-200">
              Iteration {iteration}/4
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1 mb-2">
            {STAGES.map((s, idx) => {
              const isPast = idx < stageIndex;
              const isCurrent = idx === stageIndex;

              return (
                <div key={s.key} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-xs transition-colors duration-200 ${
                      isCurrent
                        ? 'bg-[#76b900] shadow-[0_0_8px_#76b900]'
                        : isPast
                        ? 'bg-[#10b981]'
                        : 'bg-slate-800'
                    }`}
                  />
                  <span
                    className={`text-[9px] font-mono leading-none ${
                      isCurrent
                        ? 'text-[#76b900] font-bold'
                        : isPast
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {s.label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 p-2 bg-slate-900/80 rounded border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Phase:</span>
              <span className="font-mono font-medium text-[#76b900]">
                {activeStage.label.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              {activeStage.desc}
            </p>
          </div>
        </div>

        {/* Live Metric KPIs */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
          <div className="p-2 bg-slate-950/60 rounded border border-slate-850">
            <span className="text-[10px] text-slate-500 block">FAR (Target &le; 0.010)</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                parseFloat(kpis.far) <= 0.010 ? 'text-[#10b981]' : 'text-amber-400'
              }`}
            >
              {kpis.far}
            </span>
          </div>

          <div className="p-2 bg-slate-950/60 rounded border border-slate-850">
            <span className="text-[10px] text-slate-500 block">Recall (Target &ge; 0.980)</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                parseFloat(kpis.recall) >= 0.980 ? 'text-[#10b981]' : 'text-slate-300'
              }`}
            >
              {kpis.recall}
            </span>
          </div>
        </div>
      </div>

      {/* Slide-in Evidence Validation Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`mt-2 p-3 rounded-lg border shadow-2xl backdrop-blur-md ${
              isFailedToast
                ? 'bg-red-950/90 border-red-800/80 text-red-200'
                : 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isFailedToast ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold block">
                  {isFailedToast ? 'EVIDENCE CHECK FAILED' : 'COMMIT VERIFIED & LOCKED'}
                </span>
                <span className="text-[11px] opacity-90 block">
                  {isFailedToast
                    ? 'commit_stage.py: Hallucinated recall rejected (no eval.csv).'
                    : 'commit_stage.py: Real CSV parsed. Checkpoint sealed.'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
