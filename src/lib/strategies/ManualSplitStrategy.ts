import type { SplitDetail, SplitStrategy } from '../types';

export class ManualSplitStrategy implements SplitStrategy {
  readonly type = 'manual' as const;

  calculate(totalAmount: number, participantIds: string[], manualAmounts?: Record<string, number>): SplitDetail[] {
    if (!manualAmounts) return [];
    return participantIds.map(id => ({
      userId: id,
      amount: Math.round((manualAmounts[id] ?? 0) * 100) / 100,
    }));
  }
}
