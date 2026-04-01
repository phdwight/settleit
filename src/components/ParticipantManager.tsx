'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { UserPlusIcon, XMarkIcon } from '@/components/icons';
import { Accordion } from '@/components/Accordion';

export function ParticipantManager() {
  const { participants, addParticipant, removeParticipant } = useApp();
  const [name, setName] = useState('');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addParticipant(trimmed);
    setName('');
  };

  return (
    <Accordion title="Participants" headingId="participants-heading" badge={participants.length > 0 ? <span className="badge ml-2">{participants.length}</span> : undefined}>
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
                onClick={() => removeParticipant(p.id)}
                className="icon-btn text-red-500 hover:text-red-700"
                aria-label={`Remove ${p.name}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Accordion>
  );
}
