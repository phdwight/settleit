export interface User {
  id: string;
  name: string;
}

export interface SplitDetail {
  userId: string;
  amount: number;
}

export type SplitType = 'equal' | 'manual';

export interface PayerDetail {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: PayerDetail[]; // one or more payers
  splitType: SplitType;
  splits: SplitDetail[]; // computed splits
  receiptImage?: string; // base64 data URL (downscaled)
  createdAt: number;
}

export interface Debt {
  from: string; // userId
  to: string;   // userId
  amount: number;
}

export interface Event {
  id: string;
  name: string;
  createdAt: number;
  participants: User[];
  expenses: Expense[];
}

export interface AppState {
  events: Event[];
  activeEventId: string | null;
}

/** Convenience projection of the active event's data */
export interface EventData {
  participants: User[];
  expenses: Expense[];
}

// Dependency Inversion: SplitStrategy interface
export interface SplitStrategy {
  readonly type: SplitType;
  calculate(totalAmount: number, participantIds: string[], manualAmounts?: Record<string, number>): SplitDetail[];
}
