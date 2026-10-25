import { describe, expect, test } from 'bun:test';
import {
  INVALID_BACKUP_KEY,
  STORAGE_KEY,
  createSubscriptionStore,
  parseStoredSubscriptions,
} from '@/lib/subscriptionStore';
import { DEFAULT_SUBSCRIPTIONS } from '@/lib/initialSubscriptions';
import type { AISubscription } from '@/types/subscriptions';

class FakeStorage implements Storage {
  [name: string]: unknown;
  data = new Map<string, string>();
  failGet = false;
  failSet = false;
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  getItem(key: string) {
    if (this.failGet) throw new Error('denied');
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failSet) throw new Error('quota');
    this.data.set(key, value);
  }
}

class FakeWindow extends EventTarget {
  localStorage = new FakeStorage();
  sessionStorage = new FakeStorage();
  listenerCount = 0;
  addEventListener(...args: Parameters<EventTarget['addEventListener']>) {
    this.listenerCount++;
    super.addEventListener(...args);
  }
  removeEventListener(...args: Parameters<EventTarget['removeEventListener']>) {
    this.listenerCount--;
    super.removeEventListener(...args);
  }
  /** Dispatch a storage event as another tab would cause it. */
  storage(init: { key: string | null; newValue?: string | null; area?: unknown }) {
    const event = new Event('storage');
    Object.defineProperties(event, {
      key: { value: init.key },
      newValue: { value: init.newValue ?? null },
      storageArea: { value: 'area' in init ? init.area : this.localStorage },
    });
    this.dispatchEvent(event);
  }
}

const sub = (over: Partial<AISubscription> = {}): AISubscription => ({
  id: 'x',
  name: 'X',
  provider: 'P',
  category: 'chat',
  plan: 'Pro',
  cost: '$1',
  totalAllowance: 100,
  remaining: 40.5,
  unit: 'u',
  resetType: 'monthly',
  resetCountdown: '30 days',
  burnRate: 'Normal',
  color: '#10b981',
  accentHex: 0x10b981,
  ...over,
});

function setup(stored?: string) {
  const win = new FakeWindow();
  if (stored !== undefined) win.localStorage.data.set(STORAGE_KEY, stored);
  const store = createSubscriptionStore({ getWindow: () => win });
  return { win, store };
}

describe('parseStoredSubscriptions', () => {
  test('round-trips the shipped defaults and a modal-shaped record', () => {
    expect(parseStoredSubscriptions(JSON.stringify(DEFAULT_SUBSCRIPTIONS))).toEqual(
      DEFAULT_SUBSCRIPTIONS
    );
    expect(parseStoredSubscriptions(JSON.stringify([sub()]))).toEqual([sub()]);
  });

  test('accepts a valid empty list and tolerates unknown extra keys', () => {
    expect(parseStoredSubscriptions('[]')).toEqual([]);
    expect(parseStoredSubscriptions(JSON.stringify([{ ...sub(), extra: 1 }]))).toHaveLength(1);
  });

  const bad: Array<[string, unknown]> = [
    ['non-array', { id: 'x' }],
    ['null entry', [null]],
    ['empty object', [{}]],
    ['missing string field', [{ ...sub(), name: undefined }]],
    ['empty id', [sub({ id: '' })]],
    ['bad category', [sub({ category: 'video' as never })]],
    ['bad resetType', [sub({ resetType: 'weekly' as never })]],
    ['zero allowance', [sub({ totalAllowance: 0 })]],
    ['string allowance', [sub({ totalAllowance: '100' as never })]],
    ['negative remaining', [sub({ remaining: -1 })]],
    ['remaining over allowance', [sub({ remaining: 101 })]],
    ['null remaining (NaN/Infinity serialize to null)', [{ ...sub(), remaining: null }]],
    ['fractional accentHex', [sub({ accentHex: 1.5 })]],
    ['out-of-range accentHex', [sub({ accentHex: 0x1000000 })]],
    ['non-string officialUrl', [sub({ officialUrl: 5 as never })]],
    ['duplicate ids', [sub(), sub()]],
  ];
  test.each(bad)('rejects %s', (_name, value) => {
    expect(parseStoredSubscriptions(JSON.stringify(value))).toBeNull();
  });

  test('rejects malformed JSON', () => {
    expect(parseStoredSubscriptions('{nope')).toBeNull();
    expect(parseStoredSubscriptions('')).toBeNull();
  });

  test('one bad record rejects the whole payload (no partial salvage)', () => {
    expect(parseStoredSubscriptions(JSON.stringify([sub(), sub({ id: 'y', remaining: -3 })]))).toBeNull();
  });
});

describe('loading', () => {
  test('missing key shows defaults and writes nothing', () => {
    const { win, store } = setup();
    const unsub = store.subscribe(() => {});
    expect(store.getSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
    expect(win.localStorage.data.size).toBe(0);
    unsub();
  });

  test('restores a valid list', () => {
    const saved = [sub({ id: 'a' }), sub({ id: 'b', remaining: 0 })];
    const { store } = setup(JSON.stringify(saved));
    let notified = 0;
    store.subscribe(() => notified++);
    expect(store.getSnapshot()).toEqual(saved);
    expect(notified).toBe(1);
  });

  test('empty list survives a reload instead of resurrecting defaults', () => {
    const first = setup();
    first.store.subscribe(() => {});
    for (const s of [...first.store.getSnapshot()]) first.store.delete(s.id);
    expect(first.store.getSnapshot()).toEqual([]);
    expect(first.win.localStorage.data.get(STORAGE_KEY)).toBe('[]');

    // "Reload": fresh store module state over the same storage.
    const second = createSubscriptionStore({ getWindow: () => first.win });
    second.subscribe(() => {});
    expect(second.getSnapshot()).toEqual([]);
  });

  test('persisted edits restore after reload', () => {
    const first = setup();
    first.store.subscribe(() => {});
    first.store.upsert(sub({ id: 'new' }));
    first.store.updateRemaining('claude-pro', 3);
    const second = createSubscriptionStore({ getWindow: () => first.win });
    second.subscribe(() => {});
    expect(second.getSnapshot()).toEqual(first.store.getSnapshot());
    expect(second.getSnapshot()[0].id).toBe('new');
  });

  for (const [name, raw] of [
    ['malformed JSON', '{oops'],
    ['non-array JSON', '{"a":1}'],
    ['invalid record', JSON.stringify([sub({ remaining: 500 })])],
  ] as const) {
    test(`${name}: defaults in memory, stored value untouched, raw preserved in backup`, () => {
      const { win, store } = setup(raw);
      store.subscribe(() => {});
      expect(store.getSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
      expect(win.localStorage.data.get(STORAGE_KEY)).toBe(raw);
      expect(win.localStorage.data.get(INVALID_BACKUP_KEY)).toBe(raw);
    });
  }

  test('an existing backup is never overwritten', () => {
    const { win, store } = setup('{oops');
    win.localStorage.data.set(INVALID_BACKUP_KEY, 'older');
    store.subscribe(() => {});
    expect(win.localStorage.data.get(INVALID_BACKUP_KEY)).toBe('older');
  });

  test('first explicit edit after an invalid load overwrites the main key', () => {
    const { win, store } = setup('{oops');
    store.subscribe(() => {});
    store.updateRemaining('claude-pro', 1);
    expect(parseStoredSubscriptions(win.localStorage.data.get(STORAGE_KEY)!)).not.toBeNull();
    expect(win.localStorage.data.get(INVALID_BACKUP_KEY)).toBe('{oops');
  });
});

describe('storage failures', () => {
  test('getItem denied: defaults, editing still works in memory', () => {
    const { win, store } = setup(JSON.stringify([sub()]));
    win.localStorage.failGet = true;
    store.subscribe(() => {});
    expect(store.getSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
    store.updateRemaining('claude-pro', 2);
    expect(store.getSnapshot().find((s) => s.id === 'claude-pro')?.remaining).toBe(2);
  });

  test('setItem failure keeps the in-memory edit and notifies', () => {
    const { win, store } = setup();
    let notified = 0;
    store.subscribe(() => notified++);
    win.localStorage.failSet = true;
    store.delete('claude-pro');
    expect(notified).toBe(1);
    expect(store.getSnapshot().some((s) => s.id === 'claude-pro')).toBe(false);
    expect(win.localStorage.data.has(STORAGE_KEY)).toBe(false);
  });

  test('unsaved edits are not clobbered when subscribers re-attach', () => {
    const { win, store } = setup();
    const unsub = store.subscribe(() => {});
    win.localStorage.failSet = true;
    store.delete('claude-pro');
    unsub();
    store.subscribe(() => {});
    expect(store.getSnapshot().some((s) => s.id === 'claude-pro')).toBe(false);
  });

  test('accessing window.localStorage throwing is tolerated', () => {
    const win = new FakeWindow();
    Object.defineProperty(win, 'localStorage', {
      get() {
        throw new Error('SecurityError');
      },
    });
    const store = createSubscriptionStore({ getWindow: () => win });
    store.subscribe(() => {});
    store.delete('claude-pro');
    win.storage({ key: STORAGE_KEY, newValue: '[]', area: {} });
    expect(store.getSnapshot().some((s) => s.id === 'claude-pro')).toBe(false);
  });
});

describe('cross-tab events', () => {
  test('valid edit from another tab updates consumers', () => {
    const { win, store } = setup();
    let notified = 0;
    store.subscribe(() => notified++);
    const next = [sub({ id: 'other' })];
    win.storage({ key: STORAGE_KEY, newValue: JSON.stringify(next) });
    expect(store.getSnapshot()).toEqual(next);
    expect(notified).toBe(1);
  });

  test('an empty list from another tab is honoured', () => {
    const { win, store } = setup();
    store.subscribe(() => {});
    win.storage({ key: STORAGE_KEY, newValue: '[]' });
    expect(store.getSnapshot()).toEqual([]);
  });

  test('removal and clear() revert to defaults', () => {
    const { win, store } = setup(JSON.stringify([sub()]));
    store.subscribe(() => {});
    win.storage({ key: STORAGE_KEY, newValue: null });
    expect(store.getSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
    win.storage({ key: STORAGE_KEY, newValue: '[]' });
    win.storage({ key: null });
    expect(store.getSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
  });

  test('ignores unrelated keys, other storage areas, and invalid payloads', () => {
    const saved = [sub()];
    const { win, store } = setup(JSON.stringify(saved));
    let notified = 0;
    store.subscribe(() => notified++);
    notified = 0;
    const before = store.getSnapshot();
    win.storage({ key: 'something_else', newValue: '[]' });
    win.storage({ key: STORAGE_KEY, newValue: '[]', area: win.sessionStorage });
    win.storage({ key: STORAGE_KEY, newValue: '{bad' });
    win.storage({ key: STORAGE_KEY, newValue: JSON.stringify([sub({ remaining: -1 })]) });
    expect(store.getSnapshot()).toBe(before);
    expect(notified).toBe(0);
    // An invalid cross-tab payload must not be written back or backed up here.
    expect(win.localStorage.data.get(STORAGE_KEY)).toBe(JSON.stringify(saved));
    expect(win.localStorage.data.has(INVALID_BACKUP_KEY)).toBe(false);
  });

  test('an unchanged payload keeps the same snapshot reference and does not notify', () => {
    const raw = JSON.stringify([sub()]);
    const { win, store } = setup(raw);
    let notified = 0;
    store.subscribe(() => notified++);
    notified = 0;
    const before = store.getSnapshot();
    win.storage({ key: STORAGE_KEY, newValue: raw });
    expect(store.getSnapshot()).toBe(before);
    expect(notified).toBe(0);
  });

  test('does not write back to storage when handling an event', () => {
    const { win, store } = setup();
    store.subscribe(() => {});
    let writes = 0;
    const set = win.localStorage.setItem.bind(win.localStorage);
    win.localStorage.setItem = (k, v) => {
      writes++;
      set(k, v);
    };
    win.storage({ key: STORAGE_KEY, newValue: JSON.stringify([sub()]) });
    expect(writes).toBe(0);
  });
});

describe('subscribe / unsubscribe', () => {
  test('one window listener for many subscribers; removed after the last leaves', () => {
    const { win, store } = setup();
    const u1 = store.subscribe(() => {});
    const u2 = store.subscribe(() => {});
    expect(win.listenerCount).toBe(1);
    u1();
    expect(win.listenerCount).toBe(1);
    u2();
    expect(win.listenerCount).toBe(0);
    u2(); // double unsubscribe is harmless
    expect(win.listenerCount).toBe(0);
  });

  test('re-subscribing re-attaches and picks up changes missed while detached', () => {
    const { win, store } = setup();
    store.subscribe(() => {})();
    win.localStorage.data.set(STORAGE_KEY, '[]');
    let notified = 0;
    store.subscribe(() => notified++);
    expect(win.listenerCount).toBe(1);
    expect(store.getSnapshot()).toEqual([]);
    expect(notified).toBe(1);
  });

  test('StrictMode-style subscribe/unsubscribe/subscribe keeps one stable snapshot', () => {
    const { win, store } = setup(JSON.stringify([sub()]));
    store.subscribe(() => {})();
    const snap = store.getSnapshot();
    let notified = 0;
    store.subscribe(() => notified++);
    expect(store.getSnapshot()).toBe(snap);
    expect(notified).toBe(0);
    expect(win.listenerCount).toBe(1);
  });

  test('stopped listeners are not notified; store methods work unbound', () => {
    const { store } = setup();
    let notified = 0;
    const unsub = store.subscribe(() => notified++);
    unsub();
    const { getSnapshot, save } = store;
    save([]);
    expect(getSnapshot()).toEqual([]);
    expect(notified).toBe(0);
  });
});

describe('SSR', () => {
  test('without a window: no throw, defaults, stable server snapshot', () => {
    const store = createSubscriptionStore({ getWindow: () => undefined });
    const unsub = store.subscribe(() => {});
    expect(store.getSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
    expect(store.getServerSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
    unsub();
  });

  test('server snapshot stays the defaults even after client state changes', () => {
    const { store } = setup();
    store.subscribe(() => {});
    store.save([]);
    expect(store.getServerSnapshot()).toBe(DEFAULT_SUBSCRIPTIONS);
  });
});
