'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { UserPlusIcon, XMarkIcon } from '@/components/icons';
import { Accordion } from '@/components/Accordion';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { messages } from '@/lib/messages';

interface ParticipantManagerProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export function ParticipantManager({ open, onToggle }: ParticipantManagerProps) {
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

  const impact = pendingParticipant
    ? expenses.reduce(
        (acc, ex) => {
          const paidByThem = Array.isArray(ex.paidBy)
            ? ex.paidBy.some(py => py.userId === pendingParticipant.id)
            : ex.paidBy === pendingParticipant.id;
          const owedByThem = ex.splits.some(s => s.userId === pendingParticipant.id);
          const onlyPayer =
            Array.isArray(ex.paidBy) &&
            ex.paidBy.length === 1 &&
            ex.paidBy[0].userId === pendingParticipant.id;
          const nonPayer = !Array.isArray(ex.paidBy) && ex.paidBy === pendingParticipant.id;
          if (onlyPayer || nonPayer) acc.deletedExpenses += 1;
          else if (paidByThem || owedByThem) acc.modifiedExpenses += 1;
          return acc;
        },
        { deletedExpenses: 0, modifiedExpenses: 0 }
      )
    : { deletedExpenses: 0, modifiedExpenses: 0 };

  const confirmRemove = () => {
    if (pendingRemoval) removeParticipant(pendingRemoval);
    setPendingRemoval(null);
  };

  return (
    <Accordion title="Participants" headingId="participants-heading" open={open} onToggle={onToggle} badge={participants.length > 0 ? <span className="badge ml-2">{participants.length}</span> : undefined}>
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
          {participants.map(p => (
            <li key={p.id} className="participant-chip">
              <span className="participant-avatar">{p.name.charAt(0).toUpperCase()}</span>
              <span className="flex-1 font-medium">{p.name}</span>
              <button
                onClick={() => setPendingRemoval(p.id)}
                className="icon-btn text-red-500 hover:text-red-700"
                aria-label={`Remove ${p.name}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={pendingParticipant !== null}
        title={pendingParticipant ? messages.participants.removeTitle(pendingParticipant.name) : ''}
        confirmLabel={messages.participants.removeConfirm}
        message={
          <>
            <p>{pendingParticipant && messages.participants.removeIntro(pendingParticipant.name)}</p>
            {impact.deletedExpenses + impact.modifiedExpenses > 0 ? (
              <ul>
                {impact.deletedExpenses > 0 && (
                  <li>{messages.participants.removeDeletedExpenses(impact.deletedExpenses)}</li>
                )}
                {impact.modifiedExpenses > 0 && (
                  <li>{messages.participants.removeModifiedExpenses(impact.modifiedExpenses)}</li>
                )}
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
    </Accordion>
  );
}
