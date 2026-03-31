'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { SplitType } from '@/lib/types';

export function ExpenseForm() {
  const { participants, addExpense } = useApp();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!description.trim()) { setError('Please enter a description.'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    if (!paidBy) { setError('Please select who paid.'); return; }
    const ids = selectedParticipants.length > 0 ? selectedParticipants : participants.map(p => p.id);
    if (ids.length === 0) { setError('Add participants first.'); return; }

    const manualMap = splitType === 'manual'
      ? Object.fromEntries(Object.entries(manualAmounts).map(([k, v]) => [k, parseFloat(v) || 0]))
      : undefined;

    if (splitType === 'manual' && manualMap) {
      const total = Object.values(manualMap).reduce((a, b) => a + b, 0);
      if (Math.abs(total - amt) > 0.01) {
        setError(`Manual amounts total ${total.toFixed(2)} but expense is ${amt.toFixed(2)}. They must match.`);
        return;
      }
    }

    addExpense({ description, amount: amt, paidBy, splitType, manualAmounts: manualMap, participantIds: ids });
    setDescription(''); setAmount(''); setPaidBy(''); setSplitType('equal');
    setManualAmounts({}); setSelectedParticipants([]);
  };

  if (participants.length === 0) {
    return (
      <section aria-labelledby="expense-heading" className="card">
        <h2 id="expense-heading" className="section-title">Add Expense</h2>
        <p className="empty-state">Add at least one participant before adding expenses.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="expense-heading" className="card">
      <h2 id="expense-heading" className="section-title">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p role="alert" className="error-msg">{error}</p>}
        <div className="form-group">
          <label htmlFor="description" className="label">Description</label>
          <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Dinner at Mario's" className="input" required maxLength={100} />
        </div>
        <div className="form-group">
          <label htmlFor="amount" className="label">Total Amount</label>
          <div className="relative">
            <span className="amount-prefix">$</span>
            <input id="amount" type="number" min="0.01" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="input pl-8 font-mono" required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="paid-by" className="label">Paid By</label>
          <select id="paid-by" value={paidBy} onChange={e => setPaidBy(e.target.value)} className="input" required>
            <option value="">Select who paid</option>
            {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <span className="label">Split Type</span>
          <div className="split-type-toggle">
            {(['equal', 'manual'] as SplitType[]).map(t => (
              <button key={t} type="button" onClick={() => setSplitType(t)}
                className={`split-type-btn ${splitType === t ? 'active' : ''}`}
                aria-pressed={splitType === t}>
                {t === 'equal' ? 'Equal Split' : 'Manual Split'}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <span className="label">Split Among</span>
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <button key={p.id} type="button"
                onClick={() => toggleParticipant(p.id)}
                className={`participant-toggle ${selectedParticipants.length === 0 || selectedParticipants.includes(p.id) ? 'active' : ''}`}
                aria-pressed={selectedParticipants.length === 0 || selectedParticipants.includes(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">Leave all selected for equal split among everyone.</p>
        </div>
        {splitType === 'manual' && (
          <div className="form-group">
            <span className="label">Manual Amounts</span>
            <div className="space-y-2">
              {(selectedParticipants.length > 0 ? participants.filter(p => selectedParticipants.includes(p.id)) : participants).map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="w-24 text-sm truncate">{p.name}</span>
                  <div className="relative flex-1">
                    <span className="amount-prefix">$</span>
                    <input type="number" min="0" step="0.01"
                      value={manualAmounts[p.id] ?? ''}
                      onChange={e => setManualAmounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="0.00" className="input pl-8 font-mono" aria-label={`Amount for ${p.name}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button type="submit" className="btn btn-primary w-full">Add Expense</button>
      </form>
    </section>
  );
}
