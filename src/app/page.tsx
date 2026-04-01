'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { EventManager } from '@/components/EventManager';
import { ParticipantManager } from '@/components/ParticipantManager';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { DebtSummary } from '@/components/DebtSummary';

type PanelKey = 'participants' | 'expense' | 'summary' | 'expenses';
type PanelState = Record<PanelKey, boolean>;

const DEFAULT_PANELS: PanelState = { participants: true, expense: false, summary: false, expenses: false };
const STORAGE_KEY = 'settleit-panels';

function loadPanels(eventId: string): PanelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[eventId]) return { ...DEFAULT_PANELS, ...parsed[eventId] };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PANELS };
}

function savePanels(eventId: string, panels: PanelState) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[eventId] = panels;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export default function Home() {
  const { activeEvent, goBack } = useApp();
  const [panels, setPanels] = useState<PanelState>(DEFAULT_PANELS);

  useEffect(() => {
    if (activeEvent) {
      setPanels(loadPanels(activeEvent.id));
    }
  }, [activeEvent?.id]);

  const toggle = useCallback((key: PanelKey) => (open: boolean) => {
    setPanels(prev => {
      const next = { ...prev, [key]: open };
      if (activeEvent) savePanels(activeEvent.id, next);
      return next;
    });
  }, [activeEvent?.id]);

  if (!activeEvent) {
    return <EventManager />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={goBack} className="btn btn-ghost btn-sm">← Events</button>
        <h2 className="text-lg font-semibold truncate">{activeEvent.name}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="accordion-group">
          <ParticipantManager open={panels.participants} onToggle={toggle('participants')} />
          <ExpenseForm open={panels.expense} onToggle={toggle('expense')} />
        </div>
        {/* Right column */}
        <div className="accordion-group">
          <DebtSummary open={panels.summary} onToggle={toggle('summary')} />
          <ExpenseList open={panels.expenses} onToggle={toggle('expenses')} />
        </div>
      </div>
    </div>
  );
}
