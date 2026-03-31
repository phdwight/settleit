import type { Expense, Debt, User } from './types';

export class DebtSimplifier {
  simplify(expenses: Expense[], participants: User[]): Debt[] {
    // Compute net balance for each user (positive = owed money, negative = owes money)
    const balance: Record<string, number> = {};
    participants.forEach(p => { balance[p.id] = 0; });

    expenses.forEach(expense => {
      // The payer is owed back their share from others
      balance[expense.paidBy] = (balance[expense.paidBy] ?? 0) + expense.amount;
      expense.splits.forEach(split => {
        balance[split.userId] = (balance[split.userId] ?? 0) - split.amount;
      });
    });

    // Convert to arrays of creditors and debtors
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    Object.entries(balance).forEach(([id, amt]) => {
      const rounded = Math.round(amt * 100) / 100;
      if (rounded > 0.005) creditors.push({ id, amount: rounded });
      else if (rounded < -0.005) debtors.push({ id, amount: -rounded });
    });

    const debts: Debt[] = [];

    // Greedy settlement
    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const credit = creditors[ci];
      const debt = debtors[di];
      const settled = Math.min(credit.amount, debt.amount);
      const roundedSettled = Math.round(settled * 100) / 100;

      if (roundedSettled > 0.005) {
        debts.push({ from: debt.id, to: credit.id, amount: roundedSettled });
      }

      credit.amount = Math.round((credit.amount - settled) * 100) / 100;
      debt.amount = Math.round((debt.amount - settled) * 100) / 100;

      if (credit.amount < 0.005) ci++;
      if (debt.amount < 0.005) di++;
    }

    return debts;
  }
}
