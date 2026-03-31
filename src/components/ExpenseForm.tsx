'use client';

import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { SplitType } from '@/lib/types';

function downscaleImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

export function ExpenseForm() {
  const { participants, addExpense } = useApp();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payers, setPayers] = useState<Record<string, string>>({}); // userId -> amount string
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [manualError, setManualError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const payerCount = Object.keys(payers).length;

  const togglePayer = (id: string) => {
    setPayers(prev => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
        // If only one payer remains, auto-assign full amount
        const remaining = Object.keys(next);
        if (remaining.length === 1) {
          next[remaining[0]] = amount;
        }
      } else {
        if (Object.keys(next).length === 0) {
          // First payer: auto-assign full amount
          next[id] = amount;
        } else {
          // Multiple payers: new ones start at empty, reset existing to empty too
          next[id] = '';
          for (const key of Object.keys(next)) {
            next[key] = '';
          }
        }
      }
      return next;
    });
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await downscaleImage(file, 800, 0.6);
      setReceiptImage(dataUrl);
    } catch {
      setError('Failed to process receipt image.');
    }
  };

  // Manual split: compute remaining amount
  const splitParticipants = useMemo(() =>
    selectedParticipants.length > 0
      ? participants.filter(p => selectedParticipants.includes(p.id))
      : participants,
    [selectedParticipants, participants]
  );

  const manualTotal = useMemo(() => {
    return splitParticipants.reduce((sum, p) => sum + (parseFloat(manualAmounts[p.id] ?? '') || 0), 0);
  }, [manualAmounts, splitParticipants]);

  const totalAmount = parseFloat(amount) || 0;
  const remaining = Math.round((totalAmount - manualTotal) * 100) / 100;

  // Check if we can offer auto-distribute: remaining > 0 and at least one person has no value
  const canAutoDistribute = useMemo(() => {
    if (remaining <= 0 || totalAmount <= 0) return false;
    const filledCount = splitParticipants.filter(p => (parseFloat(manualAmounts[p.id] ?? '') || 0) > 0).length;
    const emptyCount = splitParticipants.length - filledCount;
    return filledCount >= 1 && emptyCount >= 1;
  }, [remaining, totalAmount, splitParticipants, manualAmounts]);

  const handleAutoDistribute = () => {
    const emptyIds = splitParticipants
      .filter(p => !(parseFloat(manualAmounts[p.id] ?? '') > 0))
      .map(p => p.id);
    if (emptyIds.length === 0) return;
    const each = Math.round((remaining / emptyIds.length) * 100) / 100;
    // Adjust last one for rounding
    const updates: Record<string, string> = {};
    emptyIds.forEach((id, i) => {
      if (i === emptyIds.length - 1) {
        const allocated = each * (emptyIds.length - 1);
        updates[id] = (Math.round((remaining - allocated) * 100) / 100).toFixed(2);
      } else {
        updates[id] = each.toFixed(2);
      }
    });
    setManualAmounts(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!description.trim()) { setError('Please enter a description.'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }

    // Validate payers
    const payerIds = Object.keys(payers);
    if (payerIds.length === 0) { setError('Please select at least one payer.'); return; }

    let payerDetails;
    if (payerIds.length === 1) {
      // Single payer: auto-assign full amount
      payerDetails = [{ userId: payerIds[0], amount: amt }];
    } else {
      payerDetails = payerIds.map(id => ({
        userId: id,
        amount: parseFloat(payers[id]) || 0,
      }));
      const payerTotal = payerDetails.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(payerTotal - amt) > 0.01) {
        setError(`Payer amounts total ${payerTotal.toFixed(2)} but expense is ${amt.toFixed(2)}. They must match.`);
        return;
      }
    }

    const ids = selectedParticipants.length > 0 ? selectedParticipants : participants.map(p => p.id);
    if (ids.length === 0) { setError('Add participants first.'); return; }

    const manualMap = splitType === 'manual'
      ? Object.fromEntries(Object.entries(manualAmounts).map(([k, v]) => [k, parseFloat(v) || 0]))
      : undefined;

    if (splitType === 'manual' && manualMap) {
      const total = Object.values(manualMap).reduce((a, b) => a + b, 0);
      if (Math.abs(total - amt) > 0.01) {
        setManualError(`Manual amounts total ${total.toFixed(2)} but expense is ${amt.toFixed(2)}. They must match.`);
        return;
      }
    }
    setManualError('');

    addExpense({ description, amount: amt, paidBy: payerDetails, splitType, manualAmounts: manualMap, participantIds: ids, receiptImage });
    setDescription(''); setAmount(''); setPayers({}); setSplitType('equal');
    setManualAmounts({}); setSelectedParticipants([]); setReceiptImage(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            <input id="amount" type="number" min="0.01" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="input font-mono" required />
          </div>
        </div>
        <div className="form-group">
          <span className="label">Paid By</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {participants.map(p => (
              <button key={p.id} type="button"
                onClick={() => togglePayer(p.id)}
                className={`participant-toggle ${p.id in payers ? 'active' : ''}`}
                aria-pressed={p.id in payers}>
                {p.name}
              </button>
            ))}
          </div>
          {payerCount > 1 && (
            <div className="space-y-2">
              <div className="auto-distribute-bar">
                <span className="text-xs text-[var(--text-secondary)]">
                  Split <strong className="font-mono">{totalAmount.toFixed(2)}</strong> equally among {payerCount}?
                </span>
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const ids = Object.keys(payers);
                    const each = Math.round((totalAmount / ids.length) * 100) / 100;
                    const updated: Record<string, string> = {};
                    ids.forEach((id, i) => {
                      if (i === ids.length - 1) {
                        updated[id] = (Math.round((totalAmount - each * (ids.length - 1)) * 100) / 100).toFixed(2);
                      } else {
                        updated[id] = each.toFixed(2);
                      }
                    });
                    setPayers(updated);
                  }}
                  disabled={totalAmount <= 0}>
                  Apply
                </button>
              </div>
              {Object.keys(payers).map(id => {
                const p = participants.find(pp => pp.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="w-24 text-sm truncate">{p.name}</span>
                    <input type="number" min="0" step="0.01"
                      value={payers[id] ?? ''}
                      onChange={e => setPayers(prev => ({ ...prev, [id]: e.target.value }))}
                      placeholder="0.00" className="input flex-1 font-mono" aria-label={`Amount paid by ${p.name}`} />
                  </div>
                );
              })}
              {(() => {
                const payerTotal = Object.values(payers).reduce((s, v) => s + (parseFloat(v) || 0), 0);
                const lacking = Math.round((totalAmount - payerTotal) * 100) / 100;
                return (
                  <p className="text-xs text-[var(--muted)]">
                    Payer total: <span className="font-mono">{payerTotal.toFixed(2)}</span> / <span className="font-mono">{totalAmount.toFixed(2)}</span>
                    {lacking !== 0 && (
                      <span className={`ml-2 font-mono ${lacking > 0 ? 'text-[var(--danger)]' : 'text-[var(--danger)]'}`}>
                        (lacking: {lacking.toFixed(2)})
                      </span>
                    )}
                    {lacking === 0 && (
                      <span className="ml-2 text-[var(--success)]">✓</span>
                    )}
                  </p>
                );
              })()}
            </div>
          )}
        </div>
        <div className="form-group">
          <span className="label">Split Type</span>
          <div className="split-type-toggle">
            {(['equal', 'manual'] as SplitType[]).map(t => (
              <button key={t} type="button" onClick={() => { setSplitType(t); setManualError(''); }}
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
            <div className="flex items-center justify-between">
              <span className="label">Manual Amounts</span>
              <span className={`text-xs font-mono ${remaining === 0 ? 'text-[var(--success)]' : remaining < 0 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}>
                Remaining: {remaining.toFixed(2)}
              </span>
            </div>
            <div className="space-y-2">
              {splitParticipants.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="w-24 text-sm truncate">{p.name}</span>
                  <div className="relative flex-1">
                    <input type="number" min="0" step="0.01"
                      value={manualAmounts[p.id] ?? ''}
                      onChange={e => { setManualAmounts(prev => ({ ...prev, [p.id]: e.target.value })); setManualError(''); }}
                      placeholder="0.00" className="input font-mono" aria-label={`Amount for ${p.name}`} />
                  </div>
                </div>
              ))}
            </div>
            {canAutoDistribute && (
              <div className="auto-distribute-bar">
                <span className="text-xs text-[var(--text-secondary)]">
                  Split remaining <strong className="font-mono">{remaining.toFixed(2)}</strong> equally among {splitParticipants.filter(p => !(parseFloat(manualAmounts[p.id] ?? '') > 0)).length} others?
                </span>
                <button type="button" onClick={handleAutoDistribute} className="btn btn-ghost btn-sm">
                  Apply
                </button>
              </div>
            )}
            {manualError && <p role="alert" className="text-xs text-[var(--danger)] mt-1">{manualError}</p>}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="receipt" className="label">Receipt (optional)</label>
          <input id="receipt" ref={fileInputRef} type="file" accept="image/*" capture="environment"
            onChange={handleReceiptChange} className="input text-sm" />
          {receiptImage && (
            <div className="mt-2 relative inline-block">
              <img src={receiptImage} alt="Receipt preview" className="receipt-preview" />
              <button type="button" onClick={() => { setReceiptImage(undefined); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="icon-btn receipt-remove" aria-label="Remove receipt">✕</button>
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary w-full">Add Expense</button>
      </form>
    </section>
  );
}
