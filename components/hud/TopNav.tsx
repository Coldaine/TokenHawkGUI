'use client';

import React from 'react';
import { LayoutDashboard, BarChart2, Box, Plus, Terminal } from 'lucide-react';

export type AppViewMode = 'corner-widget' | 'full-rack' | 'architecture';

interface TopNavProps {
  currentView: AppViewMode;
  onSetView: (view: AppViewMode) => void;
  onOpenReceipts: () => void;
  onOpenAddModal: () => void;
}

export default function TopNav({
  currentView,
  onSetView,
  onOpenReceipts,
  onOpenAddModal,
}: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-2.5 border-b border-slate-800/80 bg-[#07090e]/90 backdrop-blur-md">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="w-2.5 h-2.5 rounded-sm bg-[#76b900] shadow-[0_0_8px_#76b900]" />
        <span className="text-sm font-semibold tracking-wider text-slate-100 whitespace-nowrap">
          AI QUOTA VAULT
        </span>
      </div>

      {/* Zone 2: Primary View Switcher Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
        <button
          onClick={() => onSetView('corner-widget')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            currentView === 'corner-widget'
              ? 'bg-[#76b900] text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Corner Widget</span>
        </button>

        <button
          onClick={() => onSetView('full-rack')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            currentView === 'full-rack'
              ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Full Rack</span>
        </button>

        <button
          onClick={() => onSetView('architecture')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            currentView === 'architecture'
              ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Architecture</span>
        </button>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-[#76b900] hover:bg-[#68a400] rounded-md transition-colors whitespace-nowrap font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Tool</span>
        </button>

        {currentView === 'architecture' && (
          <button
            onClick={onOpenReceipts}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            <Terminal className="w-3.5 h-3.5 text-[#76b900]" />
            <span>Receipts</span>
          </button>
        )}
      </div>
    </header>
  );
}
