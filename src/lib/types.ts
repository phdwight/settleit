export interface User {
  id: string;
  name: string;
}

export interface SplitDetail {
  userId: string;
  amount: number;
}

export type SplitType = 'equal' | 'manual';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // userId
  splitType: SplitType;
  splits: SplitDetail[]; // computed splits
  createdAt: number;
}

export interface Debt {
  from: string; // userId
  to: string;   // userId
  amount: number;
}

export interface AppState {
  participants: User[];
  expenses: Expense[];
}

// Dependency Inversion: SplitStrategy interface
export interface SplitStrategy {
  readonly type: SplitType;
  calculate(totalAmount: number, participantIds: string[], manualAmounts?: Record<string, number>): SplitDetail[];
}
