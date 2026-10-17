'use client';

import React, { useState } from 'react';
import { X, Copy, Check, FileCode, ShieldCheck } from 'lucide-react';
import { DIRECTOR_RECEIPTS } from '@/lib/deftData';

interface DirectorCommentaryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DirectorCommentary({
  isOpen,
  onClose,
}: DirectorCommentaryProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentReceipt = DIRECTOR_RECEIPTS[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentReceipt.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#76b900]" />
            <h2 className="text-sm font-semibold text-slate-100">
              NVIDIA DEFT Architectural Receipts
            </h2>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Production Execution Proof
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Script Selection Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto">
          {DIRECTOR_RECEIPTS.map((r, idx) => (
            <button
              key={r.title}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-t-md transition-colors whitespace-nowrap border-b-2 ${
                activeTab === idx
                  ? 'border-[#76b900] text-slate-100 bg-[#0b0f19]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-[#76b900]" />
              <span>{r.title.split('—')[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Code Content Viewport */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-sans text-xs">
              {currentReceipt.title}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#10b981]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-lg bg-[#07090e] border border-slate-850 p-4 overflow-x-auto text-slate-300">
            <pre className="leading-relaxed">
              <code>{currentReceipt.code}</code>
            </pre>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 font-sans text-xs text-slate-300 leading-normal">
            <span className="font-semibold text-[#10b981] block mb-1">
              Architectural Takeaway:
            </span>
            Deterministic Python wrapper scripts hold OS file locks (`flock`) on the state file.
            The LLM is prompted only to formulate stage parameters; it cannot execute commands directly or fabricate metrics.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-500">
          <span>tao-run-deft-aoi / commit_stage.py runtime</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
