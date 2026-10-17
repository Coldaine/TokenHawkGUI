'use client';

import React from 'react';
import { PreviewBackdropMode } from '@/types/tokenhawk';
import { Monitor, Moon, Sun, Terminal } from 'lucide-react';

interface PreviewBackdropStageProps {
  backdrop: PreviewBackdropMode;
  onChangeBackdrop?: (mode: PreviewBackdropMode) => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  compactHeader?: boolean;
}

/**
 * External Workbench Preview Backdrop Stage:
 * Renders selectable Dark, Light, and Busy Desktop backgrounds OUTSIDE the widget
 * so the widget's own transparent surface (`glassOpacity`) can be evaluated honestly
 * without baking any preview background into the exported component.
 */
export default function PreviewBackdropStage({
  backdrop,
  onChangeBackdrop,
  title,
  subtitle,
  children,
  className = '',
  compactHeader = false,
}: PreviewBackdropStageProps) {
  return (
    <div className={`flex flex-col rounded-2xl border border-slate-800/90 overflow-hidden bg-[#080b12] ${className}`}>
      {/* External Preview Stage Header (Outside the Widget) */}
      {(title || onChangeBackdrop) && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0b0f19] ${
            compactHeader ? 'px-3.5 py-2' : 'px-4 py-2.5'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {title && (
              <span className="text-xs font-semibold text-slate-200 truncate">
                {title}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline truncate">
                · {subtitle}
              </span>
            )}
          </div>

          {onChangeBackdrop && (
            <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono shrink-0">
              <span className="text-slate-500 px-1.5 hidden md:inline">Backdrop:</span>
              {(
                [
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'busy', label: 'Busy Desktop', icon: Terminal },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = backdrop === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeBackdrop(item.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800 text-[#76b900] font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Isolated Backdrop Surface */}
      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-8 overflow-hidden min-h-[260px]">
        {/* DARK WORKSPACE BACKDROP */}
        {backdrop === 'dark' && (
          <div className="absolute inset-0 bg-[#060911] pointer-events-none">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.06),transparent_70%)]" />
          </div>
        )}

        {/* LIGHT PAPER / DOCUMENTATION BACKDROP */}
        {backdrop === 'light' && (
          <div className="absolute inset-0 bg-[#f1f5f9] pointer-events-none">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute top-4 left-5 right-5 flex items-center justify-between text-[10px] font-mono text-slate-400 select-none">
              <span>LIGHT WORKSPACE SURFACE · CONTRAST CHECK</span>
              <span>#F1F5F9</span>
            </div>
          </div>
        )}

        {/* BUSY CODE / TERMINAL WINDOW BACKDROP */}
        {backdrop === 'busy' && (
          <div className="absolute inset-0 bg-[#0d1117] pointer-events-none select-none overflow-hidden font-mono text-[10px] leading-relaxed p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-65">
              <div className="rounded-lg border border-slate-700/70 bg-[#161b22]/90 p-3 text-slate-300 shadow-lg">
                <div className="text-emerald-400 font-bold mb-1">
                  $ cargo test --workspace --all-targets
                </div>
                <div className="text-sky-300">
                  Compiling tokenhawk-collector v0.4.2 (/srv/ai-usage)
                </div>
                <div className="text-amber-300">
                  WARN quota_window::anthropic: 5h rolling window at 28% (resets 1h40m)
                </div>
                <div className="text-slate-400">
                  INFO quota_pool::openrouter: shared balance $24.80 USD across 4 keys
                </div>
                <div className="text-rose-400">
                  ERROR collector::mistral_eu: HTTP 401 session token expired
                </div>
                <div className="text-emerald-300">
                  test result: ok. 42 passed; 0 failed; finished in 1.18s
                </div>
              </div>
              <div className="rounded-lg border border-indigo-500/40 bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-emerald-950/70 p-3 text-slate-200 shadow-lg">
                <div className="text-indigo-300 font-bold mb-1">
                  services/ai-usage/src/routes/quota.ts
                </div>
                <div className="text-slate-300">
                  export async function getQuotaObservations(): Promise&lt;Row[]&gt; &#123;
                </div>
                <div className="text-amber-200 pl-3">
                  const rows = await db.select().from(quotaObservations);
                </div>
                <div className="text-cyan-300 pl-3">
                  return rows.map(normalizeEntitlementWindow);
                </div>
                <div className="text-slate-300">&#125;</div>
                <div className="mt-2 h-2 w-full rounded bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 opacity-60" />
              </div>
            </div>
          </div>
        )}

        {/* Actual Exportable Component Slot */}
        <div className="relative z-10 flex items-center justify-center w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
