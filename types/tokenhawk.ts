export type WindowMode = 'long' | 'stacked' | 'companion' | 'short';

export type PrepaidTreatment = 'digital_readout' | 'split_counter';

export type MeterStyle = 'liquid' | 'segmented' | 'needle' | 'capsule' | 'dotmatrix';

export type RotationMode = 'group' | 'relay' | 'favorite';

export type MotionTreatment = 'carousel_glide' | 'instrument_reel' | 'depth_shuffle';

export type IdleEffectLevel = 'off' | 'subtle' | 'playful';

export type PreviewBackdropMode = 'dark' | 'light' | 'busy';

/**
 * Decoupled Capacity State:
 * Represents remaining allowance health only. Can coexist with any ObservationStatus
 * (e.g. an account can be both 'exhausted' (0%) and 'stale' simultaneously).
 */
export type CapacityState =
  | 'nominal'
  | 'warning'
  | 'exhausted'
  | 'unbounded'
  | 'unknown';

/**
 * Decoupled Observation / Collector Status:
 * Mirrors services/ai-usage /api/quota/health ('working' | 'stale' | 'failing')
 * plus explicit authentication-required and unknown states.
 */
export type ObservationStatus =
  | 'working'
  | 'stale'
  | 'failing'
  | 'auth_required'
  | 'unknown';

export type MeasurementMode =
  | 'percentage'
  | 'unit_allowance'
  | 'included_credit'
  | 'prepaid_no_max'
  | 'enforced_cap'
  | 'personal_budget'
  | 'metered_uncapped';

export type WindowObservationStatus = 'working' | 'stale' | 'unavailable';

/**
 * Nullable-safe reading for a single quota window (long period or short companion).
 * Unavailable or non-applicable values use `null` rather than coercing to `0`.
 */
export interface QuotaWindowReading {
  windowId: string;
  label: string; // e.g., 'WEEKLY', 'MONTHLY', '5H', '3H', 'CREDIT', 'CAP', 'BUDGET', 'METERED'
  remaining: number | null;
  limit: number | null;
  unit: 'percent' | 'usd' | 'requests' | 'tokens' | 'hours' | 'chars' | 'searches' | string;
  percentRemaining: number | null; // Populated ONLY when `limit` is a meaningful positive denominator
  resetsAt: string | null; // ISO timestamp or null when no reset applies (e.g., prepaid balance)
  resetLabel: string | null; // e.g., 'resets 3d', 'avail 22m', or null when no reset exists
  isExhausted: boolean; // True ONLY when a known allowance is genuinely 0
  windowStatus: WindowObservationStatus;
}

/**
 * Normalized presentation model for a single TokenHawk instrument slot.
 * `instrumentId` is a stable identity representing one account/entitlement or
 * one shared credit pool (multiple API keys sharing a pool do not create duplicate instruments).
 */
export interface QuotaInstrumentItem {
  instrumentId: string;
  accountLabel: string;
  entitlementLabel: string;
  providerId: string;
  providerName: string;
  sharedKeyCount?: number; // If multiple API keys share this credit pool
  measurementMode: MeasurementMode;
  primaryWindow: QuotaWindowReading;
  companionWindow: QuotaWindowReading | null;
  capacityState: CapacityState;
  observationStatus: ObservationStatus;
  observedAt: string | null;
  errorDetail?: string | null;
  accentColor?: string;
}

/**
 * Complete user display preferences kept strictly separate from observed quota data.
 */
export interface TokenHawkDisplayPreferences {
  windowMode: WindowMode; // Default: 'long'
  prepaidTreatment: PrepaidTreatment; // Proposed default: 'digital_readout'
  meterStyle: MeterStyle; // Default: 'liquid' (includes 'dotmatrix' / Matrix)
  rotationMode: RotationMode; // Default: 'group'
  rotationIntervalSec: number; // Default: 8 for group/favorite, 3 for relay
  pinnedInstrumentId: string | null; // Stable instrumentId pinned in Slot 1 during 'favorite' mode
  motionTreatment: MotionTreatment; // Default: 'carousel_glide'
  idleEffect: IdleEffectLevel; // Default: 'subtle'
  glassOpacity: number; // Default: 0.85
}

/**
 * Actual-shaped interfaces for MooseGooseWebsiteServices (services/ai-usage)
 * /api/quota, /api/quota/health, and /api/subscriptions.
 */
export interface AiUsageQuotaObservationRow {
  account: string;
  provider?: string;
  entitlement: string;
  window?: string; // e.g., 'weekly', 'monthly', '5h', '3h', 'billing_period'
  windowRole?: 'primary' | 'short';
  remaining: number | null;
  limit: number | null;
  unit: string; // e.g., '%', 'usd', 'requests', 'tokens', 'messages'
  resetsAt: string | null;
  resetText?: string | null;
  observedAt: string | null;
  error?: string | null;
  /**
   * Optional upstream extension fields (not assumed to exist in base API;
   * used only when explicitly supplied, never guessed from provider name or unit).
   */
  creditPoolId?: string;
  limitKind?: 'included_credit' | 'enforced_cap' | 'personal_budget' | 'metered_uncapped';
  sharedKeyCount?: number;
}

export interface AiUsageHealthTargetRow {
  account: string;
  entitlement?: string;
  status: 'working' | 'stale' | 'failing';
  lastSuccessAt: string | null;
  lastError?: string | null;
  authRequired?: boolean;
}

export interface AiUsageSubscriptionRow {
  account: string;
  provider: string;
  planName: string;
  enabled: boolean;
  /**
   * Optional explicit user-configured budget/cap classification if supplied by subscriptions endpoint
   */
  limitKind?: 'included_credit' | 'enforced_cap' | 'personal_budget' | 'metered_uncapped';
  creditPoolId?: string;
  sharedKeyCount?: number;
}

export interface AiUsageServicePayloadBundle {
  quotaRows: AiUsageQuotaObservationRow[] | null;
  healthRows: AiUsageHealthTargetRow[] | null;
  subscriptionRows?: AiUsageSubscriptionRow[] | null;
  serviceError?: string | null;
}

export interface AiUsageAdapterWarning {
  instrumentId: string;
  field: string;
  note: string;
}

export interface AiUsageAdapterResult {
  status: 'ready' | 'empty' | 'service_error';
  instruments: QuotaInstrumentItem[];
  warnings: AiUsageAdapterWarning[];
  errorMessage: string | null;
  mappedAt: string;
}
