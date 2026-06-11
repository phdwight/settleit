'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';

interface NewEventFormProps {
  onSubmitted?: () => void;
}

export function NewEventForm({ onSubmitted }: NewEventFormProps) {
  const { createEvent } = useApp();
  const [name, setName] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createEvent(trimmed);
    setName('');
    onSubmitted?.();
  };

  return (
    <div className="space-y-4">
      <div className="form-group">
        <label htmlFor="new-event-name" className="label">Event name</label>
        <input
          id="new-event-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Summer Holiday"
          className="input"
          maxLength={80}
          autoFocus
        />
      </div>
      <button type="button" onClick={handleCreate} className="btn btn-primary w-full">Create event</button>
    </div>
  );
}
