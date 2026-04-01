'use client';

import { useApp } from '@/contexts/AppContext';
import { ArrowRightIcon, CheckCircleIcon } from '@/components/icons';
import { Accordion } from '@/components/Accordion';

export function DebtSummary() {
  const { debts, participants, expenses, reset } = useApp();

  const getName = (id: string) => participants.find(p => p.id === id)?.name ?? 'Unknown';

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const resetButton = (participants.length > 0 || expenses.length > 0) ? (
    <button
      onClick={(e) => { e.stopPropagation(); if (confirm('Reset all data? This cannot be undone.')) reset(); }}
      className="btn btn-sm btn-ghost"
      aria-label="Reset all data"
    >
      Reset
    </button>
  ) : undefined;

  return (
    <Accordion title="Settlement Summary" headingId="summary-heading" headerRight={resetButton}>
      {expenses.length > 0 && (
        <div className="totals-bar mb-4">
          <div className="total-item">
            <span className="total-label">Total Spent</span>
            <span className="total-value font-mono">{total.toFixed(2)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Expenses</span>
            <span className="total-value">{expenses.length}</span>
          </div>
          <div className="total-item">
            <span className="total-label">People</span>
            <span className="total-value">{participants.length}</span>
          </div>
        </div>
      )}
      {debts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-[var(--muted)]">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
          <p className="font-medium">{expenses.length === 0 ? 'No expenses to settle.' : 'All settled up! 🎉'}</p>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {debts.map((debt, i) => (
            <li key={i} className="debt-item">
              <span className="debt-name from">{getName(debt.from)}</span>
              <div className="flex items-center gap-1 text-[var(--muted)]">
                <span className="text-xs">owes</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
              <span className="debt-name to">{getName(debt.to)}</span>
              <span className="debt-amount font-mono ml-auto">{debt.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </Accordion>
  );
}
