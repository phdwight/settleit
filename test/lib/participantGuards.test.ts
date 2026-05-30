import { hasPaidAnyExpense } from '@/lib/participantGuards';
import type { Expense } from '@/lib/types';

const make = (paidBy: Expense['paidBy']): Expense => ({
  id: 'exp-1',
  description: 'x',
  amount: 10,
  paidBy,
  splitType: 'equal',
  splits: [],
  createdAt: 1,
});

describe('hasPaidAnyExpense', () => {
  it('returns false when there are no expenses', () => {
    expect(hasPaidAnyExpense('u1', [])).toBe(false);
  });

  it('returns true when the user is listed as a payer in any expense', () => {
    const expenses = [make([{ userId: 'u2', amount: 10 }]), make([{ userId: 'u1', amount: 10 }])];
    expect(hasPaidAnyExpense('u1', expenses)).toBe(true);
  });

  it('returns false when the user is not a payer on any expense', () => {
    const expenses = [make([{ userId: 'u2', amount: 10 }])];
    expect(hasPaidAnyExpense('u1', expenses)).toBe(false);
  });

  it('supports legacy single-payer string form', () => {
    const legacy = { ...make([]), paidBy: 'u1' as unknown as Expense['paidBy'] };
    expect(hasPaidAnyExpense('u1', [legacy])).toBe(true);
    expect(hasPaidAnyExpense('u2', [legacy])).toBe(false);
  });
});
