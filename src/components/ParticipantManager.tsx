'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { UserPlusIcon, XMarkIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { messages } from '@/lib/messages';
import { hasPaidAnyExpense } from '@/lib/participantGuards';

export function ParticipantManager() {
  const { participants, expenses, addParticipant, removeParticipant } = useApp();
  const [name, setName] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addParticipant(trimmed);
    setName('');
  };

  const pendingParticipant = participants.find(p => p.id === pendingRemoval) ?? null;

  // Since payers can't be removed, "impact" reduces to: how many expenses
  // include them in the split? Equal-split expenses will have remaining
  // shares recomputed; manual splits will simply drop their entry.
  const affectedExpenses = pendingParticipant
    ? expenses.filter(ex => ex.splits.some(s => s.userId === pendingParticipant.id)).length
    : 0;

  const confirmRemove = () => {
    if (pendingRemoval) removeParticipant(pendingRemoval);
    setPendingRemoval(null);
  };

  return (
    <section className="card" aria-labelledby="participants-heading">
      <h2 id="participants-heading" className="section-title">
        Participants
        {participants.length > 0 && <span className="badge ml-2">{participants.length}</span>}
      </h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add participant name"
          className="input flex-1"
          aria-label="Participant name"
          maxLength={50}
        />
        <button onClick={handleAdd} className="btn btn-primary" aria-label="Add participant">
          <UserPlusIcon className="w-5 h-5" />
          <span className="ml-1 hidden sm:inline">Add</span>
        </button>
      </div>
      {participants.length === 0 ? (
        <p className="empty-state">No participants yet. Add someone to get started!</p>
      ) : (
        <ul className="space-y-2" role="list">
          {participants.map(p => {
            const blocked = hasPaidAnyExpense(p.id, expenses);
            return (
              <li key={p.id} className="participant-chip">
                <span className="participant-avatar">{p.name.charAt(0).toUpperCase()}</span>
                <span className="flex-1 font-medium">{p.name}</span>
                <button
                  onClick={() => setPendingRemoval(p.id)}
                  className="icon-btn text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-red-500"
                  aria-label={
                    blocked
                      ? messages.participants.removeBlockedHint
                      : `Remove ${p.name}`
                  }
                  title={blocked ? messages.participants.removeBlockedTooltip : undefined}
                  disabled={blocked}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={pendingParticipant !== null}
        title={pendingParticipant ? messages.participants.removeTitle(pendingParticipant.name) : ''}
        confirmLabel={messages.participants.removeConfirm}
        message={
          <>
            <p>{pendingParticipant && messages.participants.removeIntro(pendingParticipant.name)}</p>
            {affectedExpenses > 0 ? (
              <ul>
                <li>{messages.participants.removeModifiedExpenses(affectedExpenses)}</li>
                <li>{messages.participants.removeDebtsNote}</li>
              </ul>
            ) : (
              <p>{messages.participants.removeNoImpact}</p>
            )}
          </>
        }
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </section>
  );
}
