'use client';

import React, { useState } from 'react';
import { AISubscription } from '@/types/subscriptions';
import { X, Check, Trash2 } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  subscriptionToEdit: AISubscription | null;
  onClose: () => void;
  onSave: (sub: AISubscription) => void;
  onDelete?: (id: string) => void;
}

function SubscriptionForm({
  initialData,
  onClose,
  onSave,
  onDelete,
  isEdit,
}: {
  initialData: Partial<AISubscription>;
  onClose: () => void;
  onSave: (sub: AISubscription) => void;
  onDelete?: (id: string) => void;
  isEdit: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AISubscription>>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const subToSave: AISubscription = {
      id: formData.id || `sub-${Date.now()}`,
      name: formData.name || 'New AI Tool',
      provider: formData.provider || 'AI Provider',
      category: formData.category || 'chat',
      plan: formData.plan || 'Pro',
      cost: formData.cost || '$20/mo',
      totalAllowance: Number(formData.totalAllowance) || 100,
      remaining: Math.min(Number(formData.remaining) || 0, Number(formData.totalAllowance) || 100),
      unit: formData.unit || 'units',
      resetType: formData.resetType || 'monthly',
      resetCountdown: formData.resetCountdown || '30 days',
      burnRate: formData.burnRate || 'Normal',
      color: formData.color || '#10b981',
      accentHex: 0x10b981,
    };

    onSave(subToSave);
    onClose();
  };

  const percent = Math.round(
    ((formData.remaining || 0) / (formData.totalAllowance || 1)) * 100
  );

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
      {/* Live Preview Bar */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-slate-400 block">
            Calculated Remaining Capacity
          </span>
          <span className="text-xl font-bold font-mono text-[#76b900]">
            {isNaN(percent) ? 0 : percent}%
          </span>
          <span className="text-slate-400 text-[11px] ml-2">
            ({formData.remaining} / {formData.totalAllowance} {formData.unit})
          </span>
        </div>

        <div className="h-10 w-4 bg-slate-900 rounded border border-slate-800 p-0.5 flex flex-col justify-end">
          <div
            className="w-full bg-[#76b900] rounded-xs"
            style={{ height: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 mb-1 font-mono">Tool Name</label>
          <input
            type="text"
            required
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Claude Pro, Cursor, ChatGPT"
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-[#76b900]"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-mono">Provider</label>
          <input
            type="text"
            value={formData.provider || ''}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder="e.g. Anthropic, OpenAI, Anysphere"
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-[#76b900]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-slate-400 mb-1 font-mono">Total Allowance</label>
          <input
            type="number"
            min="1"
            required
            value={formData.totalAllowance ?? 100}
            onChange={(e) =>
              setFormData({ ...formData, totalAllowance: parseFloat(e.target.value) })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-[#76b900]"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-mono">Currently Remaining</label>
          <input
            type="number"
            min="0"
            step="any"
            required
            value={formData.remaining ?? 80}
            onChange={(e) =>
              setFormData({ ...formData, remaining: parseFloat(e.target.value) })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-[#76b900]"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-mono">Unit Label</label>
          <input
            type="text"
            value={formData.unit || ''}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="e.g. messages, requests"
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-[#76b900]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 mb-1 font-mono">Category</label>
          <select
            value={formData.category || 'chat'}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-[#76b900]"
          >
            <option value="chat">Chat & Reasoning</option>
            <option value="coding">Code & Dev</option>
            <option value="media">Media & Voice</option>
            <option value="api">APIs & Credits</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-mono">Reset Cycle / Countdown</label>
          <input
            type="text"
            value={formData.resetCountdown || ''}
            onChange={(e) => setFormData({ ...formData, resetCountdown: e.target.value })}
            placeholder="e.g. 1h 45m, 12 days"
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-[#76b900]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-850">
        {isEdit && onDelete && initialData.id ? (
          <button
            type="button"
            onClick={() => {
              onDelete(initialData.id!);
              onClose();
            }}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Tool</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#76b900] hover:bg-[#68a400] text-slate-950 font-bold rounded-md transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Quota</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default function SubscriptionModal({
  isOpen,
  subscriptionToEdit,
  onClose,
  onSave,
  onDelete,
}: SubscriptionModalProps) {
  if (!isOpen) return null;

  const defaultNew: Partial<AISubscription> = {
    id: 'sub-new',
    name: '',
    provider: '',
    category: 'chat',
    plan: 'Pro Plan',
    cost: '$20/mo',
    totalAllowance: 100,
    remaining: 80,
    unit: 'requests',
    resetType: 'monthly',
    resetCountdown: '30 days',
    burnRate: 'Normal',
    color: '#10b981',
  };

  const initialData = subscriptionToEdit || defaultNew;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100">
            {subscriptionToEdit ? 'Configure Subscription Quota' : 'Add New AI Subscription'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form component keyed by subscription ID */}
        <SubscriptionForm
          key={subscriptionToEdit?.id ?? 'new'}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          isEdit={!!subscriptionToEdit}
        />
      </div>
    </div>
  );
}
