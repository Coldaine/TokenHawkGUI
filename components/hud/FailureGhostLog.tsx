'use client';

import React, { useState } from 'react';
import { Terminal, ShieldX, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { INITIAL_GHOST_LOGS } from '@/lib/deftData';
import { GhostLogEntry } from '@/types/presentation';

interface FailureGhostLogProps {
  progress: number;
  isDimmed: boolean;
}

export default function FailureGhostLog({
  progress,
  isDimmed,
}: FailureGhostLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<GhostLogEntry | null>(null);

  // Progressive log feed
  const visibleLogCount = Math.min(
    Math.floor(progress * (INITIAL_GHOST_LOGS.length + 1)) + 1,
    INITIAL_GHOST_LOGS.length
  );
  const logs = INITIAL_GHOST_LOGS.slice(0, visibleLogCount);

  return (
    <aside
      className={`fixed bottom-24 left-6 z-30 w-84 pointer-events-auto transition-opacity duration-300 ${
        isDimmed ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-md">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200">
              Failure Ghost Log
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono"
          >
            <span>{isExpanded ? 'Collapse' : 'Inspect'}</span>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Scrolling Log Feed */}
        <div
          className={`space-y-1.5 pt-2 transition-all duration-200 overflow-y-auto font-mono text-[11px] ${
            isExpanded ? 'max-h-60' : 'max-h-32'
          }`}
        >
          {logs.map((log) => {
            const isRejected = log.verdict === 'REJECTED';
            const isSelected = selectedLog?.id === log.id;

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(isSelected ? null : log)}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  isRejected
                    ? 'bg-red-950/30 border-red-900/60 hover:bg-red-950/50'
                    : 'bg-emerald-950/30 border-emerald-900/60 hover:bg-emerald-950/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {isRejected ? (
                      <ShieldX className="w-3 h-3 text-red-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 text-[#10b981] shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-bold ${
                        isRejected ? 'text-red-400' : 'text-[#10b981]'
                      }`}
                    >
                      {log.verdict}
                    </span>
                    <span className="text-[10px] text-slate-500">[{log.stage}]</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>

                <div
                  className={`text-[11px] ${
                    isRejected
                      ? 'text-red-300 line-through opacity-80'
                      : 'text-emerald-300'
                  }`}
                >
                  {log.pattern}
                </div>

                {/* Expanded stack trace / line receipt */}
                {(isSelected || isExpanded) && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                    <div className="text-slate-300 mb-0.5">
                      {log.sourceFile}:{log.receiptLine}
                    </div>
                    <div className="text-slate-400 leading-normal">
                      {log.reason}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
