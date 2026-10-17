import {
  AiUsageAdapterResult,
  AiUsageAdapterWarning,
  AiUsageHealthTargetRow,
  AiUsageQuotaObservationRow,
  AiUsageServicePayloadBundle,
  AiUsageSubscriptionRow,
  CapacityState,
  MeasurementMode,
  ObservationStatus,
  QuotaInstrumentItem,
  QuotaWindowReading,
} from '@/types/tokenhawk';

function slugifyIdentity(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isShortWindowName(windowName?: string, windowRole?: 'primary' | 'short'): boolean {
  if (windowRole === 'short') return true;
  if (windowRole === 'primary') return false;
  if (!windowName) return false;
  const lower = windowName.toLowerCase();
  return (
    lower.includes('5h') ||
    lower.includes('3h') ||
    lower.includes('1h') ||
    lower.includes('hour') ||
    lower.includes('session') ||
    lower.includes('rolling')
  );
}

function computePercentRemaining(
  remaining: number | null,
  limit: number | null,
  unit: string
): number | null {
  if (remaining === null || typeof remaining !== 'number' || Number.isNaN(remaining)) {
    return null;
  }
  const normalizedUnit = (unit || '').toLowerCase();
  if (normalizedUnit === '%' || normalizedUnit === 'percent') {
    return Math.max(0, Math.min(100, remaining));
  }
  if (limit !== null && typeof limit === 'number' && limit > 0) {
    return Math.max(0, Math.min(100, (remaining / limit) * 100));
  }
  // Never invent a percentage when the denominator is unknown or null
  return null;
}

function deriveCapacityState(
  remaining: number | null,
  limit: number | null,
  percentRemaining: number | null,
  measurementMode: MeasurementMode
): CapacityState {
  if (measurementMode === 'prepaid_no_max' || measurementMode === 'metered_uncapped') {
    if (remaining !== null && remaining <= 0) {
      return 'exhausted';
    }
    return 'unbounded';
  }

  if (remaining === null && percentRemaining === null) {
    return 'unknown';
  }

  if ((remaining !== null && remaining <= 0) || (percentRemaining !== null && percentRemaining <= 0)) {
    return 'exhausted';
  }

  if (percentRemaining !== null && percentRemaining <= 25) {
    return 'warning';
  }

  return 'nominal';
}

function deriveObservationStatus(
  healthRow: AiUsageHealthTargetRow | undefined,
  rowError?: string | null
): ObservationStatus {
  const combinedError = `${healthRow?.lastError || ''} ${rowError || ''}`.toLowerCase();
  if (
    healthRow?.authRequired ||
    combinedError.includes('401') ||
    combinedError.includes('403') ||
    combinedError.includes('auth') ||
    combinedError.includes('expired') ||
    combinedError.includes('login')
  ) {
    return 'auth_required';
  }

  if (!healthRow) {
    return rowError ? 'failing' : 'working';
  }

  if (healthRow.status === 'stale') return 'stale';
  if (healthRow.status === 'failing') return 'failing';
  return 'working';
}

function toWindowReading(
  row: AiUsageQuotaObservationRow,
  healthStatus: ObservationStatus,
  labelOverride?: string
): QuotaWindowReading {
  const rawUnit = (row.unit || '').toLowerCase();
  const normalizedUnit =
    rawUnit === '%' || rawUnit === 'percent'
      ? 'percent'
      : rawUnit === '$' || rawUnit === 'usd' || rawUnit === 'dollars'
      ? 'usd'
      : rawUnit || 'units';

  const pct = computePercentRemaining(row.remaining, row.limit, normalizedUnit);
  const isExhausted =
    (row.remaining !== null && row.remaining <= 0 && (row.limit === null || row.limit > 0)) ||
    (pct !== null && pct <= 0);

  const windowStatus =
    healthStatus === 'failing' || healthStatus === 'auth_required' || row.remaining === null
      ? row.remaining === null
        ? 'unavailable'
        : 'stale'
      : healthStatus === 'stale'
      ? 'stale'
      : 'working';

  return {
    windowId: (row.window || 'primary').toLowerCase(),
    label: (labelOverride || row.window || 'ALLOWANCE').toUpperCase(),
    remaining: row.remaining,
    limit: row.limit,
    unit: normalizedUnit,
    percentRemaining: pct,
    resetsAt: row.resetsAt ?? null,
    resetLabel: row.resetText ?? null,
    isExhausted,
    windowStatus,
  };
}

/**
 * Pure adapter translating `services/ai-usage` responses (`/api/quota`, `/api/quota/health`,
 * `/api/subscriptions`) into typed `QuotaInstrumentItem[]`.
 *
 * Strict guarantees:
 * 1. Never silently falls back to demo/example data on service error or empty payload.
 * 2. Preserves distinct accounts even when they share a provider name.
 * 3. Separates `capacityState` from `observationStatus` so `0%` + `stale` coexist cleanly.
 * 4. Does not infer `enforced_cap` vs `personal_budget` or shared credit pools from
 *    provider names or dollar units; uses explicit metadata when present and logs an
 *    adapter note when falling back conservatively.
 */
export function adaptAiUsageServiceToInstruments(
  bundle: AiUsageServicePayloadBundle
): AiUsageAdapterResult {
  const mappedAt = new Date().toISOString();

  if (bundle.serviceError || bundle.quotaRows === null) {
    return {
      status: 'service_error',
      instruments: [],
      warnings: [],
      errorMessage:
        bundle.serviceError ||
        'Unable to read /api/quota from services/ai-usage. Connected view refuses to fall back to example balances.',
      mappedAt,
    };
  }

  if (bundle.quotaRows.length === 0) {
    return {
      status: 'empty',
      instruments: [],
      warnings: [],
      errorMessage: null,
      mappedAt,
    };
  }

  const warnings: AiUsageAdapterWarning[] = [];
  const healthList = bundle.healthRows || [];
  const subList = bundle.subscriptionRows || [];

  // Group quota rows by explicit creditPoolId (if present) or deterministic (account + entitlement)
  // Never merge rows merely because they have the same provider name!
  const grouped = new Map<
    string,
    {
      instrumentId: string;
      account: string;
      entitlement: string;
      provider: string;
      primaryRow?: AiUsageQuotaObservationRow;
      shortRow?: AiUsageQuotaObservationRow;
      subMeta?: AiUsageSubscriptionRow;
    }
  >();

  for (const row of bundle.quotaRows) {
    const subMeta = subList.find((s) => s.account === row.account);
    const poolIdentity =
      row.creditPoolId ||
      subMeta?.creditPoolId ||
      `${row.account}::${row.entitlement}`;

    const instrumentId = slugifyIdentity(poolIdentity);
    const existing = grouped.get(instrumentId) || {
      instrumentId,
      account: row.account,
      entitlement: row.entitlement,
      provider: row.provider || subMeta?.provider || row.account.split(' ')[0],
      subMeta,
    };

    if (isShortWindowName(row.window, row.windowRole)) {
      existing.shortRow = row;
    } else if (!existing.primaryRow) {
      existing.primaryRow = row;
    } else {
      // If a second long row arrives without short role, keep first as primary and log warning
      warnings.push({
        instrumentId,
        field: 'window',
        note: `Multiple primary windows observed for (${row.account} / ${row.entitlement}); keeping first primary window (${existing.primaryRow.window}).`,
      });
    }

    grouped.set(instrumentId, existing);
  }

  const instruments: QuotaInstrumentItem[] = [];

  for (const group of grouped.values()) {
    const primarySource = group.primaryRow || group.shortRow!;
    const healthRow =
      healthList.find(
        (h) => h.account === group.account && h.entitlement === group.entitlement
      ) || healthList.find((h) => h.account === group.account);

    const observationStatus = deriveObservationStatus(healthRow, primarySource.error);

    // Determine measurementMode without guessing cap enforcement from provider name
    const rawUnit = (primarySource.unit || '').toLowerCase();
    const isDollar = rawUnit === 'usd' || rawUnit === '$' || rawUnit === 'dollars';
    const explicitLimitKind = primarySource.limitKind || group.subMeta?.limitKind;

    let measurementMode: MeasurementMode = 'percentage';
    let primaryLabelOverride: string | undefined;

    if (explicitLimitKind) {
      measurementMode = explicitLimitKind;
      primaryLabelOverride =
        explicitLimitKind === 'enforced_cap'
          ? 'CAP'
          : explicitLimitKind === 'personal_budget'
          ? 'BUDGET'
          : explicitLimitKind === 'metered_uncapped'
          ? 'METERED'
          : 'INCLUDED';
    } else if (isDollar) {
      if (primarySource.limit === null && primarySource.remaining !== null) {
        measurementMode = 'prepaid_no_max';
        primaryLabelOverride = 'PREPAID';
      } else if (primarySource.limit === null && primarySource.remaining === null) {
        measurementMode = 'metered_uncapped';
        primaryLabelOverride = 'METERED';
      } else {
        // Conservative default when limit is a dollar number but API does not state CAP vs BUDGET vs INCLUDED
        measurementMode = 'included_credit';
        primaryLabelOverride = 'LIMIT';
        warnings.push({
          instrumentId: group.instrumentId,
          field: 'limitKind',
          note: `Row "${group.account} / ${group.entitlement}" reports a $${primarySource.limit} limit without explicit limitKind ('included_credit' | 'enforced_cap' | 'personal_budget'). Mapped conservatively as 'included_credit' labeled 'LIMIT' rather than guessing provider cap enforcement.`,
        });
      }
    } else if (rawUnit === '%' || rawUnit === 'percent') {
      measurementMode = 'percentage';
    } else {
      measurementMode = 'unit_allowance';
    }

    const primaryWindow = toWindowReading(
      primarySource,
      observationStatus,
      primaryLabelOverride
    );

    const companionWindow =
      group.primaryRow && group.shortRow
        ? toWindowReading(group.shortRow, observationStatus)
        : null;

    // Capacity state reflects the most constrained active window if companion window is exhausted
    const baseCapacity = deriveCapacityState(
      primaryWindow.remaining,
      primaryWindow.limit,
      primaryWindow.percentRemaining,
      measurementMode
    );

    const capacityState: CapacityState =
      companionWindow?.isExhausted && baseCapacity === 'nominal'
        ? 'warning'
        : baseCapacity;

    instruments.push({
      instrumentId: group.instrumentId,
      accountLabel: group.account,
      entitlementLabel: group.entitlement,
      providerId: group.provider.toLowerCase(),
      providerName: group.provider,
      sharedKeyCount: primarySource.sharedKeyCount || group.subMeta?.sharedKeyCount,
      measurementMode,
      primaryWindow,
      companionWindow,
      capacityState,
      observationStatus,
      observedAt: primarySource.observedAt || healthRow?.lastSuccessAt || null,
      errorDetail: primarySource.error || healthRow?.lastError || null,
    });
  }

  return {
    status: 'ready',
    instruments,
    warnings,
    errorMessage: null,
    mappedAt,
  };
}

/**
 * Documented schema verification matrix comparing current `services/ai-usage`
 * API fields against the presentation layer's inputs.
 */
export const AI_USAGE_SCHEMA_VERIFICATION_MATRIX = [
  {
    presentationField: 'accountLabel & entitlementLabel',
    sourceEndpoint: 'GET /api/quota',
    status: 'Available Today',
    mappingRule: 'Mapped directly from quota observation `account` and `entitlement` strings.',
  },
  {
    presentationField: 'instrumentId (Stable Slot Key)',
    sourceEndpoint: 'Derived in Adapter',
    status: 'Derived Safely',
    mappingRule:
      'Deterministic slug of `(account, entitlement)` or optional `creditPoolId`. Never merges distinct accounts merely because they share a provider name.',
  },
  {
    presentationField: 'primaryWindow & companionWindow',
    sourceEndpoint: 'GET /api/quota',
    status: 'Available Today',
    mappingRule:
      'Pairs long-period (`weekly`, `monthly`) and short-period (`5h`, `3h`) rows sharing `(account, entitlement)`. Missing short windows stay `null` (never coerced to 0%).',
  },
  {
    presentationField: 'observationStatus (working | stale | failing | auth_required)',
    sourceEndpoint: 'GET /api/quota/health',
    status: 'Available Today',
    mappingRule:
      'Mapped from `/api/quota/health` target status (`working`, `stale`, `failing`) and error message inspection. Kept independent from `capacityState`.',
  },
  {
    presentationField: 'measurementMode (enforced_cap vs personal_budget)',
    sourceEndpoint: 'GET /api/subscriptions (Optional Extension)',
    status: 'Requires Explicit Metadata',
    mappingRule:
      'Base API exposes `remaining`, `limit`, and `unit: "usd"`, which cannot distinguish an enforced provider cap from a personal budget. Adapter requires explicit `limitKind` metadata and refuses to guess from provider name.',
  },
  {
    presentationField: 'sharedKeyCount / creditPoolId',
    sourceEndpoint: 'GET /api/subscriptions (Optional Extension)',
    status: 'Requires Explicit Metadata',
    mappingRule:
      'Base API does not group multiple API keys into a shared pool automatically. Adapter honours `creditPoolId` and `sharedKeyCount` when present without guessing.',
  },
] as const;
