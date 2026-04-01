'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { TrashIcon } from '@/components/icons';
import { Accordion } from '@/components/Accordion';

interface ExpenseListProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export function ExpenseList({ open, onToggle }: ExpenseListProps) {
  const { expenses, participants, removeExpense } = useApp();
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const getName = (id: string) => participants.find(p => p.id === id)?.name ?? 'Unknown';

  const getPaidByLabel = (paidBy: unknown) => {
    if (Array.isArray(paidBy)) {
      return paidBy.map(p => `${getName(p.userId)}: ${p.amount.toFixed(2)}`).join(' · ');
    }
    return getName(paidBy as string);
  };

  if (expenses.length === 0) {
    return (
      <Accordion title="Expenses" headingId="expenses-heading" open={open} onToggle={onToggle}>
        <p className="empty-state">No expenses yet.</p>
      </Accordion>
    );
  }

  return (
    <Accordion title="Expenses" headingId="expenses-heading" open={open} onToggle={onToggle} badge={<span className="badge ml-2">{expenses.length}</span>}>
      <ul className="space-y-3" role="list">
        {[...expenses].reverse().map(expense => (
          <li key={expense.id} className="expense-item">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{expense.description}</p>
                <p className="text-xs text-[var(--muted)]">
                  Paid by <strong>{getPaidByLabel(expense.paidBy)}</strong> · {expense.splitType === 'equal' ? 'Equal' : 'Manual'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="amount-display">{expense.amount.toFixed(2)}</span>
                <button onClick={() => removeExpense(expense.id)} className="icon-btn text-red-500 hover:text-red-700"
                  aria-label={`Remove expense: ${expense.description}`}>
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {expense.splits.map(split => (
                <span key={split.userId} className="split-chip">
                  {getName(split.userId)}: <span className="font-mono">{split.amount.toFixed(2)}</span>
                </span>
              ))}
            </div>
            {expense.receiptImage && (
              <button type="button" className="mt-2 receipt-thumb" onClick={() => setViewingReceipt(expense.receiptImage!)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={expense.receiptImage} alt="Receipt" className="receipt-thumb-img" />
                <span className="text-xs text-[var(--muted)]">View receipt</span>
              </button>
            )}
          </li>
        ))}
      </ul>
      {viewingReceipt && (
        <div className="receipt-overlay" onClick={() => setViewingReceipt(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewingReceipt} alt="Receipt full view" className="receipt-overlay-img" />
        </div>
      )}
    </Accordion>
  );
}
