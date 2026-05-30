import type { Expense } from './types';

/**
 * True when the given participant appears as a payer on any expense.
 * Removing such a participant would invalidate the expense's `paidBy` total,
 * so the UI and reducer both block it.
 */
export function hasPaidAnyExpense(participantId: string, expenses: Expense[]): boolean {
  return expenses.some(ex => {
    if (Array.isArray(ex.paidBy)) {
      return ex.paidBy.some(py => py.userId === participantId);
    }
    return ex.paidBy === participantId;
  });
}
