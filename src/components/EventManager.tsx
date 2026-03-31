'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { TrashIcon } from '@/components/icons';

export function EventManager() {
  const { events, createEvent, selectEvent, deleteEvent } = useApp();
  const [name, setName] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createEvent(trimmed);
    setName('');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <div className="card">
        <h2 className="section-title">Create a New Event</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Summer Holiday"
            className="input flex-1"
            aria-label="Event name"
            maxLength={80}
          />
          <button type="button" onClick={handleCreate} className="btn btn-primary">Create</button>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-6">
          <h2 className="section-title px-1">Your Events</h2>
          <ul className="space-y-3" role="list">
            {[...events].sort((a, b) => b.createdAt - a.createdAt).map(event => (
              <li key={event.id} className="event-card">
                <button
                  className="event-card-body"
                  onClick={() => selectEvent(event.id)}
                >
                  <span className="event-name">{event.name}</span>
                  <span className="event-meta">
                    {event.participants.length} people · {event.expenses.length} expenses
                  </span>
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="icon-btn text-red-500 hover:text-red-700 flex-shrink-0"
                  aria-label={`Delete event: ${event.name}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
