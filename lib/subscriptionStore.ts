import React from 'react';
import { AISubscription } from '@/types/subscriptions';
import { DEFAULT_SUBSCRIPTIONS } from '@/lib/initialSubscriptions';

export const STORAGE_KEY = 'ai_subscriptions_vault';
export const INVALID_BACKUP_KEY = 'ai_subscriptions_vault_invalid';

const CATEGORIES = ['chat', 'coding', 'media', 'api'];
const RESET_TYPES = ['rolling', 'daily', 'monthly'];
const STRING_FIELDS = [
  'name',
  'provider',
  'plan',
  'cost',
  'unit',
  'resetCountdown',
  'burnRate',
  'color',
] as const;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isAISubscription(value: unknown): value is AISubscription {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const r = value as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id === '') return false;
  if (!STRING_FIELDS.every((field) => typeof r[field] === 'string')) return false;
  if (typeof r.category !== 'string' || !CATEGORIES.includes(r.category)) return false;
  if (typeof r.resetType !== 'string' || !RESET_TYPES.includes(r.resetType)) return false;
  if (!isFiniteNumber(r.totalAllowance) || r.totalAllowance <= 0) return false;
  // remaining may exceed totalAllowance: the edit modal allows it (min=0, no max).
  if (!isFiniteNumber(r.remaining) || r.remaining < 0) return false;
  if (!isFiniteNumber(r.accentHex) || !Number.isInteger(r.accentHex)) return false;
  if (r.accentHex < 0 || r.accentHex > 0xffffff) return false;
  if (r.officialUrl !== undefined && typeof r.officialUrl !== 'string') return false;
  return true;
}

/**
 * Parses a persisted payload. Returns null unless the whole payload is a JSON
 * array of valid, uniquely-identified subscriptions. A valid empty array is a
 * legitimate result (the user deleted everything).
 */
export function parseStoredSubscriptions(raw: string): AISubscription[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || !parsed.every(isAISubscription)) return null;
  const ids = new Set(parsed.map((s) => s.id));
  return ids.size === parsed.length ? parsed : null;
}

type StoreWindow = EventTarget & { localStorage?: Storage };

export interface SubscriptionStoreEnv {
  /** Returns the browser window, or undefined during SSR. */
  getWindow(): StoreWindow | undefined;
}

/** Reads `window.localStorage`; the property access itself can throw (sandboxed iframes, blocked cookies). */
function getStorage(win: StoreWindow | undefined): Storage | null {
  try {
    return win?.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Persistence policy:
 * - Missing key: defaults, in memory only (the main key is not written on load).
 * - Valid payload, including `[]`: restored as-is. A record is valid when its
 *   fields have the right types/enums, `totalAllowance` is finite and > 0, and
 *   `remaining` is finite and >= 0. `remaining` may exceed `totalAllowance`
 *   because the edit modal permits that; negative/non-finite values are rejected.
 * - Invalid payload (bad JSON, any invalid record, duplicate ids): rejected as a
 *   whole and defaults are shown in memory only. The main key is left unchanged;
 *   the raw payload is copied once to INVALID_BACKUP_KEY (the only write made on
 *   load, skipped if a backup exists). The user's next explicit edit overwrites
 *   the main key; the backup survives.
 * - Storage unavailable or write failure: edits continue in memory, and a later
 *   re-attach will not replace those unsaved edits with a stale read.
 * - Other tabs: `storage` events for STORAGE_KEY (or clear()) with a valid
 *   payload update the snapshot; a removal reverts to defaults; invalid payloads
 *   and unrelated keys/areas are ignored. One window listener exists while
 *   there is at least one subscriber.
 */
export function createSubscriptionStore(env: SubscriptionStoreEnv) {
  let cachedSubscriptions: AISubscription[] = DEFAULT_SUBSCRIPTIONS;
  let lastRaw: string | null = null;
  let persistFailed = false;
  let attachedWindow: StoreWindow | undefined;
  const listeners = new Set<() => void>();

  function emitChange() {
    listeners.forEach((listener) => listener());
  }

  /** Applies a persisted raw value (null = key absent). Returns whether the snapshot changed. */
  function applyRaw(raw: string | null, storage: Storage): boolean {
    if (raw === lastRaw) return false;
    let next = DEFAULT_SUBSCRIPTIONS;
    if (raw !== null) {
      const valid = parseStoredSubscriptions(raw);
      if (valid) {
        next = valid;
      } else {
        // Keep the unreadable payload recoverable; never touch the main key.
        try {
          if (storage.getItem(INVALID_BACKUP_KEY) === null) {
            storage.setItem(INVALID_BACKUP_KEY, raw);
          }
        } catch {}
      }
    }
    lastRaw = raw;
    persistFailed = false;
    const changed = next !== cachedSubscriptions;
    cachedSubscriptions = next;
    return changed;
  }

  function syncFromStorage(): boolean {
    const storage = getStorage(env.getWindow());
    if (!storage) return false;
    try {
      return applyRaw(storage.getItem(STORAGE_KEY), storage);
    } catch {
      return false;
    }
  }

  function handleStorageEvent(event: Event) {
    const e = event as Event & {
      key?: string | null;
      newValue?: string | null;
      storageArea?: Storage | null;
    };
    const storage = getStorage(attachedWindow);
    if (!storage || e.storageArea !== storage) return;
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    // key === null means another tab called localStorage.clear().
    const raw = e.key === null ? null : (e.newValue ?? null);
    if (raw !== null && parseStoredSubscriptions(raw) === null) return;
    if (applyRaw(raw, storage)) emitChange();
  }

  function save(newSubs: AISubscription[]) {
    cachedSubscriptions = newSubs;
    try {
      const storage = getStorage(env.getWindow());
      if (!storage) throw new Error('storage unavailable');
      const raw = JSON.stringify(newSubs);
      storage.setItem(STORAGE_KEY, raw);
      lastRaw = raw;
      persistFailed = false;
    } catch {
      persistFailed = true;
    }
    emitChange();
  }

  // Methods avoid `this` so they stay safe when passed around unbound.
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      const win = env.getWindow();
      if (win && !attachedWindow) {
        attachedWindow = win;
        win.addEventListener('storage', handleStorageEvent);
        // First subscriber (or first after none): load, or re-sync events missed
        // meanwhile, unless unsaved in-memory edits would be lost.
        if (!persistFailed && syncFromStorage()) emitChange();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && attachedWindow) {
          attachedWindow.removeEventListener('storage', handleStorageEvent);
          attachedWindow = undefined;
        }
      };
    },

    getSnapshot(): AISubscription[] {
      return cachedSubscriptions;
    },

    getServerSnapshot(): AISubscription[] {
      return DEFAULT_SUBSCRIPTIONS;
    },

    save,

    updateRemaining(id: string, newRemaining: number) {
      save(
        cachedSubscriptions.map((s) =>
          s.id === id ? { ...s, remaining: newRemaining } : s
        )
      );
    },

    reset(id: string) {
      save(
        cachedSubscriptions.map((s) =>
          s.id === id ? { ...s, remaining: s.totalAllowance } : s
        )
      );
    },

    resetAll() {
      save(cachedSubscriptions.map((s) => ({ ...s, remaining: s.totalAllowance })));
    },

    upsert(sub: AISubscription) {
      const exists = cachedSubscriptions.some((s) => s.id === sub.id);
      save(
        exists
          ? cachedSubscriptions.map((s) => (s.id === sub.id ? sub : s))
          : [sub, ...cachedSubscriptions]
      );
    },

    delete(id: string) {
      save(cachedSubscriptions.filter((s) => s.id !== id));
    },

    restoreDefaults() {
      save(DEFAULT_SUBSCRIPTIONS);
    },
  };
}

export const subscriptionStore = createSubscriptionStore({
  getWindow: () => (typeof window === 'undefined' ? undefined : window),
});

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
