'use client';

import React, { useState, useCallback } from 'react';
import FocusedBarsStage from '@/components/subscriptions/FocusedBarsStage';
import LiquidEqualizerWidget from '@/components/subscriptions/widgets/LiquidEqualizerWidget';
import SegmentedLEDWidget from '@/components/subscriptions/widgets/SegmentedLEDWidget';
import MicroNeedleWidget from '@/components/subscriptions/widgets/MicroNeedleWidget';
import GlassCapsuleWidget from '@/components/subscriptions/widgets/GlassCapsuleWidget';
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal';
import GlobalConsumptionOverlay from '@/components/subscriptions/GlobalConsumptionOverlay';
import QuotaWindowsStudy from '@/components/tokenhawk/QuotaWindowsStudy';
import DollarBalancesStudy from '@/components/tokenhawk/DollarBalancesStudy';
import RotationMotionStudy from '@/components/tokenhawk/RotationMotionStudy';
import ServiceAdapterAndQmlView from '@/components/tokenhawk/ServiceAdapterAndQmlView';
import { useSubscriptions } from '@/lib/subscriptionStore';
import { AISubscription } from '@/types/subscriptions';
import { PrepaidTreatment } from '@/types/tokenhawk';
import {
  Plus,
  RotateCcw,
  Activity,
  Layers,
  Sliders,
  DollarSign,
  RotateCw,
  FileCode2,
  Orbit,
} from 'lucide-react';

type WorkbenchTab =
  | 'equalizer'
  | 'study_windows'
  | 'study_dollars'
  | 'study_rotation'
  | 'adapter_qml'
  | 'swarm_lab';

export default function Page() {
  // SSR-Safe Subscription Store powered by useSyncExternalStore
  const [subscriptions, store] = useSubscriptions();

  // Default to the preserved Focused Vertical Equalizer view, with top workbench tabs
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('equalizer');
  const [preferredPrepaid, setPreferredPrepaid] =
    useState<PrepaidTreatment>('digital_readout');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [showCornerStack, setShowCornerStack] = useState(false);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<AISubscription | null>(
    null
  );

  const handleUpdateRemaining = useCallback(
    (id: string, newRemaining: number) => {
      store.updateRemaining(id, newRemaining);
    },
    [store]
  );

  const handleResetSubscription = useCallback(
    (id: string) => {
      store.reset(id);
    },
    [store]
  );

  const handleResetAll = useCallback(() => {
    store.resetAll();
  }, [store]);

  const handleSaveSubscription = useCallback(
    (sub: AISubscription) => {
      store.upsert(sub);
    },
    [store]
  );

  const handleDeleteSubscription = useCallback(
    (id: string) => {
      store.delete(id);
    },
    [store]
  );

  const workbenchTabs: Array<{
    id: WorkbenchTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'equalizer',
      label: 'Focused Equalizer (Default)',
      shortLabel: 'Equalizer',
      icon: Sliders,
    },
    {
      id: 'study_windows',
      label: '1. Quota Windows',
      shortLabel: '1. Windows',
      icon: Layers,
    },
    {
      id: 'study_dollars',
      label: '2. Dollar Balances',
      shortLabel: '2. Dollars',
      icon: DollarSign,
    },
    {
      id: 'study_rotation',
      label: '3. Rotation & Motion',
      shortLabel: '3. Rotation',
      icon: RotateCw,
    },
    {
      id: 'adapter_qml',
      label: 'Adapter & Quickshell QML',
      shortLabel: 'QML & API',
      icon: FileCode2,
    },
    {
      id: 'swarm_lab',
      label: 'Swarm Lab',
      shortLabel: 'Swarm Lab',
      icon: Orbit,
    },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#07090e] text-slate-100 font-sans select-none flex flex-col justify-between p-4 sm:p-6">
      {/* Subtle minimalist ambient grid background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(118,185,0,0.06),rgba(255,255,255,0))] pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Workbench Header (3-Zone Contract: Brand Wordmark | Workbench Tabs | Context Action) */}
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => setActiveTab('equalizer')}
          className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono whitespace-nowrap shrink-0 hover:text-[#76b900] transition-colors"
        >
          TokenHawk Workbench
        </button>

        {/* Zone 2: Workbench Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#0b0f19] border border-slate-800 rounded-xl p-1 overflow-x-auto max-w-full">
          {workbenchTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#76b900] text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Context Controls for Default Equalizer View */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'equalizer' ? (
            <>
              <button
                type="button"
                onClick={() => setShowCornerStack(!showCornerStack)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                  showCornerStack
                    ? 'bg-slate-800 border-[#76b900] text-[#76b900]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">
                  {showCornerStack ? 'Hide Corner Stack' : 'Corner Stack (4)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsMatrixOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs rounded-lg transition-colors font-mono whitespace-nowrap shrink-0"
              >
                <Activity className="w-3.5 h-3.5 text-[#76b900]" />
                <span className="hidden xl:inline">Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSubForEdit(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#76b900] hover:bg-[#68a400] text-slate-950 font-bold text-xs rounded-lg transition-colors font-mono whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tool</span>
              </button>

              <button
                type="button"
                onClick={() => store.restoreDefaults()}
                title="Reset default subscriptions"
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('study_rotation')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Compact Rotating Widget
            </button>
          )}
        </div>
      </header>

      {/* ACTIVE WORKBENCH STAGE */}
      <div className="relative z-20 w-full flex-1 flex items-center justify-center py-4 my-auto">
        {activeTab === 'equalizer' && (
          <FocusedBarsStage
            subscriptions={subscriptions}
            onUpdateRemaining={handleUpdateRemaining}
            onResetSubscription={handleResetSubscription}
            onOpenEdit={(sub) => {
              setSelectedSubForEdit(sub);
              setIsModalOpen(true);
            }}
          />
        )}

        {activeTab === 'study_windows' && <QuotaWindowsStudy />}

        {activeTab === 'study_dollars' && (
          <DollarBalancesStudy
            preferredPrepaid={preferredPrepaid}
            onChangePreferredPrepaid={setPreferredPrepaid}
          />
        )}

        {activeTab === 'study_rotation' && <RotationMotionStudy />}

        {activeTab === 'adapter_qml' && <ServiceAdapterAndQmlView />}

        {activeTab === 'swarm_lab' && (
          <section className="w-full max-w-7xl overflow-hidden rounded-xl border border-slate-800 bg-[#050506]">
            <iframe
              title="TokenHawk Swarm Lab particle studies"
              src="/sidecars/swarm-lab/index.html"
              className="block h-[min(78vh,900px)] min-h-[560px] w-full"
              /* Opaque origin: the gallery cannot read this page or its storage.
                 Fullscreen is deliberately not granted: it cannot be verified under
                 this sandbox here, so the frame keeps only scripts and downloads. */
              sandbox="allow-scripts allow-downloads"
            />
          </section>
        )}
      </div>

      {/* Bottom Footer */}
      <footer className="relative z-10 pt-2 border-t border-slate-900/80 text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>
          TokenHawkGUI · Reusable Quota Instrument Family &amp; Quickshell Handoff
        </span>
        <span className="hidden sm:inline">
          Preserved Equalizer Default · 3 Visual Studies · Verified `services/ai-usage` Adapter · Isolated QML
        </span>
      </footer>

      {/* OPTIONAL CORNER STACK (When toggled on Equalizer tab) */}
      {activeTab === 'equalizer' && showCornerStack && (
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
