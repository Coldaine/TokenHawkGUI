'use client';

import React, { useState, useCallback } from 'react';
import FocusedBarsStage from '@/components/subscriptions/FocusedBarsStage';
import LiquidEqualizerWidget from '@/components/subscriptions/widgets/LiquidEqualizerWidget';
import SegmentedLEDWidget from '@/components/subscriptions/widgets/SegmentedLEDWidget';
import MicroNeedleWidget from '@/components/subscriptions/widgets/MicroNeedleWidget';
import GlassCapsuleWidget from '@/components/subscriptions/widgets/GlassCapsuleWidget';
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal';
import GlobalConsumptionOverlay from '@/components/subscriptions/GlobalConsumptionOverlay';
import { DEFAULT_SUBSCRIPTIONS } from '@/lib/initialSubscriptions';
import { AISubscription } from '@/types/subscriptions';
import { Plus, RotateCcw, Activity, Layers } from 'lucide-react';

export default function Page() {
  // Subscriptions State with LocalStorage persistence via lazy initializer
  const [subscriptions, setSubscriptions] = useState<AISubscription[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ai_subscriptions_vault');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_SUBSCRIPTIONS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [showCornerStack, setShowCornerStack] = useState(false);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<AISubscription | null>(null);

  // Save subscriptions to localStorage
  const saveSubscriptions = useCallback((newSubs: AISubscription[]) => {
    setSubscriptions(newSubs);
    try {
      localStorage.setItem('ai_subscriptions_vault', JSON.stringify(newSubs));
    } catch {}
  }, []);

  const handleUpdateRemaining = useCallback((id: string, newRemaining: number) => {
    setSubscriptions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, remaining: newRemaining } : s));
      try {
        localStorage.setItem('ai_subscriptions_vault', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleResetSubscription = useCallback((id: string) => {
    setSubscriptions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, remaining: s.totalAllowance } : s));
      try {
        localStorage.setItem('ai_subscriptions_vault', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleResetAll = useCallback(() => {
    setSubscriptions((prev) => {
      const updated = prev.map((s) => ({ ...s, remaining: s.totalAllowance }));
      try {
        localStorage.setItem('ai_subscriptions_vault', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleSaveSubscription = useCallback(
    (sub: AISubscription) => {
      const exists = subscriptions.some((s) => s.id === sub.id);
      let updated: AISubscription[];
      if (exists) {
        updated = subscriptions.map((s) => (s.id === sub.id ? sub : s));
      } else {
        updated = [sub, ...subscriptions];
      }
      saveSubscriptions(updated);
    },
    [subscriptions, saveSubscriptions]
  );

  const handleDeleteSubscription = useCallback(
    (id: string) => {
      const updated = subscriptions.filter((s) => s.id !== id);
      saveSubscriptions(updated);
    },
    [subscriptions, saveSubscriptions]
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07090e] text-slate-100 font-sans select-none flex flex-col justify-between p-6 sm:p-8">
      {/* Subtle minimalist ambient grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(118,185,0,0.07),rgba(255,255,255,0))] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#76b900] shadow-[0_0_8px_#76b900]" />
          <span className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
            AI Quota Runway
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            · Focused Vertical Equalizer
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Corner Stack Comparison */}
          <button
            onClick={() => setShowCornerStack(!showCornerStack)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-mono transition-colors ${
              showCornerStack
                ? 'bg-slate-800 border-[#76b900] text-[#76b900]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showCornerStack ? 'Hide Corner Stack' : 'Show Corner Stack (4 Styles)'}
            </span>
          </button>

          {/* Matrix Trigger */}
          <button
            onClick={() => setIsMatrixOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs rounded-lg transition-colors font-mono"
          >
            <Activity className="w-3.5 h-3.5 text-[#76b900]" />
            <span className="hidden sm:inline">Radial Matrix</span>
          </button>

          {/* Add Subscription Button */}
          <button
            onClick={() => {
              setSelectedSubForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#76b900] hover:bg-[#68a400] text-slate-950 font-bold text-xs rounded-lg transition-colors font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tool</span>
          </button>

          <button
            onClick={() => setSubscriptions(DEFAULT_SUBSCRIPTIONS)}
            title="Reset default subscriptions"
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* THE PRIMARY FOCUSED BIG VERTICAL BARS STAGE */}
      <div className="relative z-20 w-full flex items-center justify-center my-auto">
        <FocusedBarsStage
          subscriptions={subscriptions}
          onUpdateRemaining={handleUpdateRemaining}
          onResetSubscription={handleResetSubscription}
          onOpenEdit={(sub) => {
            setSelectedSubForEdit(sub);
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Bottom Footer */}
      <footer className="relative z-10 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span>AI Quota Equalizer · Real-time synchronized across all views</span>
        <span className="hidden sm:inline">Hover any bar for mouseover disclosure &amp; action buttons</span>
      </footer>

      {/* OPTIONAL CORNER STACK (When toggled) */}
      {showCornerStack && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200">
          <LiquidEqualizerWidget
            subscriptions={subscriptions}
            onUpdateRemaining={handleUpdateRemaining}
            onResetSubscription={handleResetSubscription}
          />
          <SegmentedLEDWidget
            subscriptions={subscriptions}
            onUpdateRemaining={handleUpdateRemaining}
            onResetSubscription={handleResetSubscription}
          />
          <MicroNeedleWidget
            subscriptions={subscriptions}
            onUpdateRemaining={handleUpdateRemaining}
            onResetSubscription={handleResetSubscription}
          />
          <GlassCapsuleWidget
            subscriptions={subscriptions}
            onUpdateRemaining={handleUpdateRemaining}
            onResetSubscription={handleResetSubscription}
          />
        </div>
      )}

      {/* Recharts Matrix Modal */}
      <GlobalConsumptionOverlay
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        subscriptions={subscriptions}
        onUpdateRemaining={handleUpdateRemaining}
        onResetAll={handleResetAll}
      />

      {/* Edit / Add Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        subscriptionToEdit={selectedSubForEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubscription}
        onDelete={handleDeleteSubscription}
      />
    </main>
  );
}
