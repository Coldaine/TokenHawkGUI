export type ToolCategory = 'all' | 'chat' | 'coding' | 'media' | 'api';

export interface AISubscription {
  id: string;
  name: string;
  provider: string;
  category: 'chat' | 'coding' | 'media' | 'api';
  plan: string;
  cost: string;
  totalAllowance: number;
  remaining: number;
  unit: string;
  resetType: 'rolling' | 'daily' | 'monthly';
  resetCountdown: string;
  burnRate: string;
  color: string;
  accentHex: number;
  officialUrl?: string;
}

export interface UsageEvent {
  id: string;
  subscriptionId: string;
  amount: number;
  timestamp: string;
  note: string;
}
