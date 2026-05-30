import type { Expense, Debt, User } from './types';
import { roundCents, MONEY_EPSILON } from './money';

export class DebtSimplifier {
  simplify(expenses: Expense[], participants: User[]): Debt[] {
    if (!participants?.length || !expenses?.length) return [];
    // Compute net balance for each user (positive = owed money, negative = owes money)
    const balance: Record<string, number> = {};
    participants.forEach(p => { balance[p.id] = 0; });

    expenses.forEach(expense => {
      // Each payer is owed back their contribution
      if (Array.isArray(expense.paidBy)) {
        expense.paidBy.forEach(payer => {
          balance[payer.userId] = (balance[payer.userId] ?? 0) + payer.amount;
        });
      } else {
        // Legacy single-payer format
        balance[expense.paidBy as string] = (balance[expense.paidBy as string] ?? 0) + expense.amount;
      }
      expense.splits.forEach(split => {
        balance[split.userId] = (balance[split.userId] ?? 0) - split.amount;
      });
    });

    // Convert to arrays of creditors and debtors
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    Object.entries(balance).forEach(([id, amt]) => {
      const rounded = roundCents(amt);
      if (rounded > MONEY_EPSILON) creditors.push({ id, amount: rounded });
      else if (rounded < -MONEY_EPSILON) debtors.push({ id, amount: -rounded });
    });

    const debts: Debt[] = [];

    // Greedy settlement
    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const credit = creditors[ci];
      const debt = debtors[di];
      const settled = Math.min(credit.amount, debt.amount);
      const roundedSettled = roundCents(settled);

      if (roundedSettled > MONEY_EPSILON) {
        debts.push({ from: debt.id, to: credit.id, amount: roundedSettled });
      }

      credit.amount = roundCents(credit.amount - settled);
      debt.amount = roundCents(debt.amount - settled);

      if (credit.amount < MONEY_EPSILON) ci++;
      if (debt.amount < MONEY_EPSILON) di++;
    }

    return debts;
  }
}
