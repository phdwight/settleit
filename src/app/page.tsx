'use client';

import { useApp } from '@/contexts/AppContext';
import { usePanelState } from '@/hooks/usePanelState';
import { EventManager } from '@/components/EventManager';
import { ParticipantManager } from '@/components/ParticipantManager';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { DebtSummary } from '@/components/DebtSummary';

export default function Home() {
  const { activeEvent, goBack } = useApp();
  const { panels, toggle } = usePanelState(activeEvent?.id ?? null);

  if (!activeEvent) {
    return <EventManager />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={goBack} className="btn btn-ghost btn-sm">← Events</button>
        <h2 className="text-lg font-semibold truncate">{activeEvent.name}</h2>
      </div>
      <div className="accordion-group">
        <ParticipantManager open={panels.participants} onToggle={toggle('participants')} />
        <ExpenseForm open={panels.expense} onToggle={toggle('expense')} />
        <DebtSummary open={panels.summary} onToggle={toggle('summary')} />
        <ExpenseList open={panels.expenses} onToggle={toggle('expenses')} />
      </div>
    </div>
  );
}
