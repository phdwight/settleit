'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ArrowRightIcon, CheckCircleIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { messages } from '@/lib/messages';

export function DebtSummary() {
  const { debts, participants, expenses, reset } = useApp();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const getName = (id: string) => participants.find(p => p.id === id)?.name ?? 'Unknown';

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const resetButton = (participants.length > 0 || expenses.length > 0) ? (
    <button
      onClick={() => setConfirmingReset(true)}
      className="btn btn-sm btn-ghost"
      aria-label="Reset all data"
    >
      {messages.summary.resetButton}
    </button>
  ) : undefined;

  const handleReset = () => {
    reset();
    setConfirmingReset(false);
  };

  return (
    <section className="card" aria-labelledby="summary-heading">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 id="summary-heading" className="section-title" style={{ marginBottom: 0 }}>Settlement Summary</h2>
        {resetButton}
      </div>
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
      <ConfirmDialog
        open={confirmingReset}
        title={messages.summary.resetTitle}
        confirmLabel={messages.summary.resetConfirm}
        message={messages.summary.resetBody(participants.length, expenses.length)}
        onConfirm={handleReset}
        onCancel={() => setConfirmingReset(false)}
      />
    </section>
  );
}
