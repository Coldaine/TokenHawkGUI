import React from 'react';
import { AISubscription } from '@/types/subscriptions';
import { DEFAULT_SUBSCRIPTIONS } from '@/lib/initialSubscriptions';

const STORAGE_KEY = 'ai_subscriptions_vault';

let cachedSubscriptions: AISubscription[] = DEFAULT_SUBSCRIPTIONS;
let isInitialized = false;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function initFromStorage() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedSubscriptions = parsed;
      }
    }
  } catch {}
}

export const subscriptionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    // Initialize lazily on first subscription in the browser
    if (!isInitialized) {
      initFromStorage();
      emitChange();
    }
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): AISubscription[] {
    return cachedSubscriptions;
  },

  getServerSnapshot(): AISubscription[] {
    return DEFAULT_SUBSCRIPTIONS;
  },

  save(newSubs: AISubscription[]) {
    cachedSubscriptions = newSubs;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSubs));
    } catch {}
    emitChange();
  },

  updateRemaining(id: string, newRemaining: number) {
    const updated = cachedSubscriptions.map((s) =>
      s.id === id ? { ...s, remaining: newRemaining } : s
    );
    this.save(updated);
  },

  reset(id: string) {
    const updated = cachedSubscriptions.map((s) =>
      s.id === id ? { ...s, remaining: s.totalAllowance } : s
    );
    this.save(updated);
  },

  resetAll() {
    const updated = cachedSubscriptions.map((s) => ({
      ...s,
      remaining: s.totalAllowance,
    }));
    this.save(updated);
  },

  upsert(sub: AISubscription) {
    const exists = cachedSubscriptions.some((s) => s.id === sub.id);
    let updated: AISubscription[];
    if (exists) {
      updated = cachedSubscriptions.map((s) => (s.id === sub.id ? sub : s));
    } else {
      updated = [sub, ...cachedSubscriptions];
    }
    this.save(updated);
  },

  delete(id: string) {
    const updated = cachedSubscriptions.filter((s) => s.id !== id);
    this.save(updated);
  },

  restoreDefaults() {
    this.save(DEFAULT_SUBSCRIPTIONS);
  },
};

export function useSubscriptions(): [
  AISubscription[],
  typeof subscriptionStore
] {
  const subscriptions = React.useSyncExternalStore(
    subscriptionStore.subscribe,
    subscriptionStore.getSnapshot,
    subscriptionStore.getServerSnapshot
  );

  return [subscriptions, subscriptionStore];
}
