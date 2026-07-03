'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { EventManager } from '@/components/EventManager';
import { ParticipantManager } from '@/components/ParticipantManager';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { DebtSummary } from '@/components/DebtSummary';
import { MoreMenu } from '@/components/MoreMenu';
import { NewEventForm } from '@/components/NewEventForm';
import { BottomNav, type NavTab } from '@/components/BottomNav';
import { Sheet } from '@/components/Sheet';
import type { Expense } from '@/lib/types';

export default function Home() {
  const { activeEvent } = useApp();
  const [tab, setTab] = useState<NavTab>('summary');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // No active event: show the events list. The FAB creates a new event.
  if (!activeEvent) {
    return (
      <>
        <EventManager />
        <BottomNav
          active="summary"
          onSelect={() => {}}
          onAdd={() => setSheetOpen(true)}
          addLabel="New event"
        />
        <Sheet open={sheetOpen} title="New event" onClose={() => setSheetOpen(false)}>
          <NewEventForm onSubmitted={() => { setSheetOpen(false); setTab('people'); }} />
        </Sheet>
      </>
    );
  }

  const openAdd = () => {
    setEditingExpense(null);
    setSheetOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingExpense(null);
  };

  // After a successful add/edit, show the expenses list so the entry is
  // visible even if the form was opened from another tab.
  const handleExpenseSubmitted = () => {
    closeSheet();
    setTab('expenses');
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-2xl page">
        <div className="page-heading">
          <h1 className="page-title">{activeEvent.name}</h1>
        </div>

        {tab === 'summary' && <DebtSummary />}
        {tab === 'expenses' && <ExpenseList onEdit={openEdit} />}
        {tab === 'people' && <ParticipantManager />}
        {tab === 'more' && <MoreMenu onEventCreated={() => setTab('people')} />}
      </div>

      <BottomNav
        active={tab}
        onSelect={setTab}
        onAdd={openAdd}
        addLabel="Add expense"
      />

      <Sheet
        open={sheetOpen}
        title={editingExpense ? 'Edit expense' : 'Add expense'}
        onClose={closeSheet}
      >
        <ExpenseForm key={editingExpense?.id ?? 'new'} expense={editingExpense ?? undefined} onSubmitted={handleExpenseSubmitted} />
      </Sheet>
    </>
  );
}
