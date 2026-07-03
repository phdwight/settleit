'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ArrowRightIcon, CheckCircleIcon, TrashIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Sheet } from '@/components/Sheet';
import { messages } from '@/lib/messages';

export function DebtSummary() {
  const { debts, participants, expenses, payments, reset, addPayment, removePayment } = useApp();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [settling, setSettling] = useState<{ from: string; to: string; amount: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

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

  const openSettle = (from: string, to: string, amount: number) => {
    setSettling({ from, to, amount });
    setPayAmount(amount.toFixed(2));
    setPayNote('');
  };

  const closeSettle = () => {
    setSettling(null);
    setPayAmount('');
    setPayNote('');
  };

  const handleRecordPayment = () => {
    if (!settling) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    addPayment(settling.from, settling.to, amount, payNote.trim() || undefined);
    closeSettle();
  };

  const deletingPayment = payments.find(p => p.id === deletingPaymentId) ?? null;

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
              <div className="debt-parties">
                <span className="debt-name from">{getName(debt.from)}</span>
                <div className="flex items-center gap-1 text-[var(--muted)]">
                  <span className="text-xs">owes</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
                <span className="debt-name to">{getName(debt.to)}</span>
                <span className="debt-amount font-mono">{debt.amount.toFixed(2)}</span>
              </div>
              <div className="debt-actions">
                <button
                  type="button"
                  onClick={() => openSettle(debt.from, debt.to, debt.amount)}
                  className="btn btn-sm btn-ghost"
                  aria-label={`${messages.settlements.settleUp}: ${getName(debt.from)} to ${getName(debt.to)}`}
                  title={messages.settlements.settleUp}
                >
                  {messages.settlements.settleUp}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {payments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2 text-[var(--muted)]">{messages.settlements.heading}</h3>
          <ul className="space-y-2" role="list">
            {payments.map(p => (
              <li key={p.id} className="debt-item">
                <div className="debt-parties">
                  <span className="debt-name from">{getName(p.from)}</span>
                  <ArrowRightIcon className="w-4 h-4 text-[var(--muted)]" />
                  <span className="debt-name to">{getName(p.to)}</span>
                  <span className="debt-amount font-mono">{p.amount.toFixed(2)}</span>
                </div>
                <div className="debt-actions">
                  <button
                    type="button"
                    onClick={() => setDeletingPaymentId(p.id)}
                    className="icon-btn"
                    aria-label={`${messages.settlements.deleteConfirm}: ${getName(p.from)} to ${getName(p.to)}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmingReset}
        title={messages.summary.resetTitle}
        confirmLabel={messages.summary.resetConfirm}
        message={messages.summary.resetBody(participants.length, expenses.length)}
        onConfirm={handleReset}
        onCancel={() => setConfirmingReset(false)}
      />

      <ConfirmDialog
        open={deletingPayment !== null}
        title={messages.settlements.deleteTitle}
        confirmLabel={messages.settlements.deleteConfirm}
        message={deletingPayment
          ? messages.settlements.deleteBody(getName(deletingPayment.from), getName(deletingPayment.to), deletingPayment.amount.toFixed(2))
          : null}
        onConfirm={() => {
          if (deletingPaymentId) removePayment(deletingPaymentId);
          setDeletingPaymentId(null);
        }}
        onCancel={() => setDeletingPaymentId(null)}
      />

      <Sheet open={settling !== null} title={messages.settlements.recordTitle} onClose={closeSettle}>
        {settling && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="debt-name from">{getName(settling.from)}</span>
              <ArrowRightIcon className="w-4 h-4 text-[var(--muted)]" />
              <span className="debt-name to">{getName(settling.to)}</span>
            </div>
            <div className="form-group">
              <label htmlFor="settle-amount" className="label">{messages.settlements.amountLabel}</label>
              <input
                id="settle-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="input"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="settle-note" className="label">{messages.settlements.noteLabel}</label>
              <input
                id="settle-note"
                type="text"
                value={payNote}
                onChange={e => setPayNote(e.target.value)}
                placeholder={messages.settlements.notePlaceholder}
                className="input"
                maxLength={80}
              />
            </div>
            <button type="button" onClick={handleRecordPayment} className="btn btn-primary w-full">
              {messages.settlements.save}
            </button>
          </div>
        )}
      </Sheet>
    </section>
  );
}
