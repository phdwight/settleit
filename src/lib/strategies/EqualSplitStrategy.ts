import type { SplitDetail, SplitStrategy } from '../types';

export class EqualSplitStrategy implements SplitStrategy {
  readonly type = 'equal' as const;

  calculate(totalAmount: number, participantIds: string[]): SplitDetail[] {
    if (participantIds.length === 0) return [];
    const perPerson = Math.round((totalAmount / participantIds.length) * 100) / 100;
    const splits = participantIds.map((id) => ({
      userId: id,
      amount: perPerson,
    }));
    // Handle rounding: assign remainder to first participant (deterministic, stable ordering)
    const sum = splits.reduce((acc, s) => acc + s.amount, 0);
    const diff = Math.round((totalAmount - sum) * 100) / 100;
    if (diff !== 0) splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;
    return splits;
  }
}
