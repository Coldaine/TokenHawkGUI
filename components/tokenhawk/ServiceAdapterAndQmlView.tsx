'use client';

import React, { useState, useMemo } from 'react';
import {
  AI_USAGE_SCHEMA_VERIFICATION_MATRIX,
  adaptAiUsageServiceToInstruments,
} from '@/lib/tokenhawk/serviceAdapter';
import { AI_USAGE_SERVICE_FIXTURES } from '@/lib/tokenhawk/fixtures';
import { DEFAULT_TOKENHAWK_PREFERENCES } from '@/lib/tokenhawk/designTokens';
import CompactRotatingWidget from '@/components/tokenhawk/CompactRotatingWidget';
import PreviewBackdropStage from '@/components/tokenhawk/PreviewBackdropStage';
import { PreviewBackdropMode, TokenHawkDisplayPreferences } from '@/types/tokenhawk';
import {
  Database,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ServerCrash,
  Inbox,
  Terminal,
} from 'lucide-react';

type ScenarioKey =
  | 'nominal_mixed'
  | 'exhausted_and_stale'
  | 'unconfigured_empty'
  | 'collector_offline';

const QML_FILES_PREVIEW: Record<
  string,
  { path: string; summary: string; snippet: string }
> = {
  'shell.qml': {
    path: 'quickshell/shell.qml',
    summary:
      'Wayland LayerShell PanelWindow entry point (WlrLayer.Top, WlrKeyboardFocus.None, intentional input Region mask, JSON FileView loader).',
    snippet: `ShellRoot {
    id: root
    property var loadedInstruments: []

    FileView {
        id: fixtureFile
        path: Qt.resolvedUrl("./fixtures/sample_instruments.json")
        watchChanges: true
        onLoaded: root.loadedInstruments = JSON.parse(fixtureFile.text()).instruments
    }

    Variants {
        model: Quickshell.screens
        PanelWindow {
            required property var modelData
            screen: modelData
            anchors { top: true; right: true }
            margins { top: 16; right: 16 }
            color: "transparent"

            WlrLayershell.namespace: "tokenhawk-quota-overlay"
            WlrLayershell.layer: WlrLayer.Top
            WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
            exclusionMode: ExclusionMode.Ignore
            mask: Region { item: overlayWidget }

            TokenHawkOverlay {
                id: overlayWidget
                instruments: root.loadedInstruments
            }
        }
    }
}`,
  },
  'TokenHawkOverlay.qml': {
    path: 'quickshell/TokenHawkOverlay.qml',
    summary:
      '3-position rotating container with Group/Relay/Favorite Timer, HoverHandler auto-pause, partial-group slot placeholder, and expanded grid.',
    snippet: `Rectangle {
    id: overlayRoot
    property var instruments: []
    property string rotationMode: "group"
    readonly property bool isRotationPaused: hoverHandler.hovered || isManuallyPaused || isExpanded || instruments.length <= 3
    readonly property int totalGroupPages: Math.max(1, Math.ceil(instruments.length / 3))

    HoverHandler { id: hoverHandler }

    Timer {
        interval: overlayRoot.rotationMode === "relay" ? 3000 : 8000
        repeat: true
        running: !overlayRoot.isRotationPaused
        onTriggered: overlayRoot.stepForward()
    }
    // Renders 3 QuotaSlotItem positions or full GridLayout when expanded
}`,
  },
  'MeterHousing.qml': {
    path: 'quickshell/MeterHousing.qml',
    summary:
      'Vertical instrument housing implementing Long-period, Stacked (33% upper + 4px collar + 62% lower), Overlaid Companion, Prepaid Alt A/B, CAP/BUDGET, and METERED.',
    snippet: `Rectangle {
    id: root
    property string measurementMode: "percentage"
    property string windowMode: "long"
    property string prepaidTreatment: "digital_readout"
    width: 26; height: 92; radius: 6; color: "#05070b"

    // Supports digitalReadoutComp, splitCounterComp, metered PAYG,
    // stacked dual compartments with 4px collar, and 5px right-edge companion track.
}`,
  },
  'ThemeTokens.qml': {
    path: 'quickshell/ThemeTokens.qml',
    summary:
      'Pragma Singleton centralizing colors, slot geometry (68px slot, 26x92px housing), font families, and rotation intervals matching lib/tokenhawk/designTokens.ts.',
    snippet: `pragma Singleton
import QtQuick

QtObject {
    readonly property color canvasObsidian: "#07090e"
    readonly property color surfaceHousing: "#0b0f19"
    readonly property color nominalPrimary: "#76b900"
    readonly property color warningAmber: "#f59e0b"
    readonly property color criticalRed: "#ef4444"
    readonly property int compactSlotWidth: 68
    readonly property int compactMeterHeight: 92
    readonly property int compactMeterWidth: 26
}`,
  },
};

export default function ServiceAdapterAndQmlView() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('nominal_mixed');
  const [backdrop, setBackdrop] = useState<PreviewBackdropMode>('dark');
  const [selectedQmlFile, setSelectedQmlFile] = useState<string>('shell.qml');
  const [preferences, setPreferences] = useState<TokenHawkDisplayPreferences>({
    ...DEFAULT_TOKENHAWK_PREFERENCES,
    windowMode: 'stacked', // Show paired weekly + 5h windows in the adapter test
  });

  const activeScenario = AI_USAGE_SERVICE_FIXTURES[selectedScenario];
  const adapterResult = useMemo(
    () => adaptAiUsageServiceToInstruments(activeScenario.bundle),
    [activeScenario]
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0b0f19]/90 border border-slate-800 rounded-xl px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#76b900] font-bold">
              Architecture · Service Adapter &amp; Concrete Quickshell QML
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-400">
              MooseGooseWebsiteServices (services/ai-usage) + coldaine-configurations
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
            Verified API Adapter Harness, Schema Contract &amp; Isolated Qt Quick / QML Deliverable
          </h1>
        </div>

        {/* 4-Tier Verification Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-700/70 text-emerald-300 font-semibold">
            1. Source Implemented
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-700/70 text-emerald-300 font-semibold">
            2. Browser Verified
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-700/70 text-cyan-300 font-semibold">
            3. QML Checked in Isolation
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700/70 text-amber-300 font-semibold">
            4. Live Desktop Not Modified
          </span>
        </div>
      </div>

      {/* Top Row: Left = Service Adapter Live Harness; Right = Connected Output Preview (Zero Silent Fallback) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 6 COLS: Payload Selector & Adapter Diagnostics */}
        <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#76b900]" />
                <span className="text-xs font-bold text-slate-100">
                  `services/ai-usage` Adapter Harness
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                /api/quota + /api/quota/health
              </span>
            </div>

            {/* Scenario Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px] mb-3">
              {(
                [
                  { id: 'nominal_mixed', label: '1. Actual Multi-Provider API' },
                  { id: 'exhausted_and_stale', label: '2. 0% Exhausted + Stale Overlap' },
                  { id: 'unconfigured_empty', label: '3. Empty Payload (No Fallback)' },
                  { id: 'collector_offline', label: '4. HTTP 503 Offline (No Fallback)' },
                ] as const
              ).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setSelectedScenario(sc.id)}
                  className={`text-left px-2.5 py-1.5 rounded-lg border transition-all truncate ${
                    selectedScenario === sc.id
                      ? 'bg-slate-800 border-[#76b900] text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
              {activeScenario.description}
            </p>
          </div>

          {/* Raw Input JSON vs Adapter Warnings */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-2.5 font-mono text-[10px] max-h-[150px] overflow-y-auto">
            <div className="text-slate-400 font-bold mb-1">
              Input Payload (`{selectedScenario}`):
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap break-words text-[9.5px]">
              {JSON.stringify(activeScenario.bundle, null, 2)}
            </pre>
          </div>

          {/* Adapter Verification Warnings (e.g. conservative limitKind mapping) */}
          {adapterResult.warnings.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-[10px] font-mono text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Adapter Honesty Note (No Unfounded Inference):</span>
              </div>
              {adapterResult.warnings.map((w, idx) => (
                <p key={idx} className="text-[9.5px] text-amber-200/90 leading-relaxed">
                  • [{w.instrumentId}] {w.note}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT 6 COLS: Connected Presentation Output (Demonstrating Zero Silent Fallback) */}
        <PreviewBackdropStage
          backdrop={backdrop}
          onChangeBackdrop={setBackdrop}
          title="Connected Presentation Output"
          subtitle="Never silently falls back to example balances"
          className="lg:col-span-6"
        >
          {adapterResult.status === 'ready' && (
            <CompactRotatingWidget
              instruments={adapterResult.instruments}
              preferences={preferences}
              onUpdatePreferences={(partial) =>
                setPreferences((prev) => ({ ...prev, ...partial }))
              }
              showDemoQuickActions={false}
            />
          )}

          {adapterResult.status === 'empty' && (
            <div className="w-72 rounded-2xl bg-[#0b0f19]/95 border border-slate-700 p-5 text-center shadow-2xl backdrop-blur-xl font-mono">
              <Inbox className="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-100 mb-1">
                NO QUOTA OBSERVATIONS
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                `GET /api/quota` returned `[]`. Connected TokenHawk display refuses to
                fall back to demo fixtures. Configure a provider in `services/ai-usage`.
              </p>
            </div>
          )}

          {adapterResult.status === 'service_error' && (
            <div className="w-80 rounded-2xl bg-[#0b0f19]/95 border border-red-800/80 p-5 text-center shadow-2xl backdrop-blur-xl font-mono">
              <ServerCrash className="w-7 h-7 text-red-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-red-300 mb-1">
                COLLECTOR SERVICE UNREACHABLE
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed mb-2">
                {adapterResult.errorMessage}
              </p>
              <span className="inline-block px-2 py-0.5 rounded bg-red-950 border border-red-800 text-[9px] text-red-300">
                Zero Silent Demo Fallback Enforced
              </span>
            </div>
          )}
        </PreviewBackdropStage>
      </div>

      {/* Bottom Row: Schema Verification Matrix & Concrete Quickshell QML Source Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Schema Verification Matrix */}
        <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#76b900]" />
              <span className="text-xs font-bold text-slate-100">
                `services/ai-usage` Field Mapping &amp; Upstream Gap Matrix
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Verified Contract
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
            {AI_USAGE_SCHEMA_VERIFICATION_MATRIX.map((row) => (
              <div
                key={row.presentationField}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1 font-mono">
                  <span className="font-bold text-slate-200 text-[11px]">
                    {row.presentationField}
                  </span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded border ${
                      row.status === 'Available Today'
                        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                        : row.status === 'Derived Safely'
                        ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                        : 'bg-amber-950/80 border-amber-800 text-amber-300'
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  {row.mappingRule}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Concrete Quickshell QML Source & Integration Inspector */}
        <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-100">
                Concrete Quickshell / Qt Quick (QML) Implementation (`quickshell/`)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              See `INTEGRATION.md`
            </span>
          </div>

          {/* File Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 mb-2 font-mono text-[10px]">
            {Object.keys(QML_FILES_PREVIEW).map((fileKey) => (
              <button
                key={fileKey}
                type="button"
                onClick={() => setSelectedQmlFile(fileKey)}
                className={`px-2 py-1 rounded border transition-colors ${
                  selectedQmlFile === fileKey
                    ? 'bg-slate-800 border-cyan-400 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {fileKey}
              </button>
            ))}
          </div>

          <p className="text-[10.5px] text-slate-400 mb-2 font-mono">
            {QML_FILES_PREVIEW[selectedQmlFile]?.summary}
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] overflow-x-auto max-h-[160px] overflow-y-auto">
            <pre className="text-cyan-200/90 leading-relaxed">
              {QML_FILES_PREVIEW[selectedQmlFile]?.snippet}
            </pre>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#76b900]" />
              <span>Isolated Test: `quickshell -p ./quickshell/shell.qml`</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Live Desktop Untouched</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
