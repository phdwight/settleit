'use client';

import { useApp } from '@/contexts/AppContext';
import { TrashIcon } from '@/components/icons';

export function ExpenseList() {
  const { expenses, participants, removeExpense } = useApp();

  const getName = (id: string) => participants.find(p => p.id === id)?.name ?? 'Unknown';

  if (expenses.length === 0) {
    return (
      <section aria-labelledby="expenses-heading" className="card">
        <h2 id="expenses-heading" className="section-title">Expenses</h2>
        <p className="empty-state">No expenses yet.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="expenses-heading" className="card">
      <h2 id="expenses-heading" className="section-title">
        Expenses
        <span className="badge ml-2">{expenses.length}</span>
      </h2>
      <ul className="space-y-3" role="list">
        {[...expenses].reverse().map(expense => (
          <li key={expense.id} className="expense-item">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{expense.description}</p>
                <p className="text-sm text-[var(--muted)]">
                  Paid by <strong>{getName(expense.paidBy)}</strong> · {expense.splitType === 'equal' ? 'Equal split' : 'Manual split'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="amount-display">${expense.amount.toFixed(2)}</span>
                <button onClick={() => removeExpense(expense.id)} className="icon-btn text-red-500 hover:text-red-700"
                  aria-label={`Remove expense: ${expense.description}`}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {expense.splits.map(split => (
                <span key={split.userId} className="split-chip">
                  {getName(split.userId)}: <span className="font-mono">${split.amount.toFixed(2)}</span>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
