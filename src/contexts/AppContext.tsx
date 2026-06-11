'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { AppState, Event, User, Expense, SplitType, PayerDetail } from '@/lib/types';
import { StorageService } from '@/lib/StorageService';
import { SplitCalculator } from '@/lib/SplitCalculator';
import { DebtSimplifier } from '@/lib/DebtSimplifier';
import { EventExportService } from '@/lib/EventExportService';
import { generateId } from '@/lib/generateId';
import { hasPaidAnyExpense } from '@/lib/participantGuards';

interface AppContextValue {
  // Event management
  events: Event[];
  activeEventId: string | null;
  activeEvent: Event | null;
  createEvent: (name: string) => void;
  selectEvent: (id: string) => void;
  deleteEvent: (id: string) => void;
  goBack: () => void;
  exportEvent: () => void;
  importEvent: (file: File) => Promise<void>;
  // Active-event scoped
  participants: User[];
  expenses: Expense[];
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  addExpense: (params: {
    description: string;
    amount: number;
    paidBy: PayerDetail[];
    splitType: SplitType;
    manualAmounts?: Record<string, number>;
    participantIds: string[];
    receiptImage?: string;
  }) => void;
  updateExpense: (id: string, params: {
    description: string;
    amount: number;
    paidBy: PayerDetail[];
    splitType: SplitType;
    manualAmounts?: Record<string, number>;
    participantIds: string[];
    receiptImage?: string;
  }) => void;
  removeExpense: (id: string) => void;
  debts: ReturnType<DebtSimplifier['simplify']>;
  reset: () => void;
}

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'CREATE_EVENT'; payload: Event }
  | { type: 'SELECT_EVENT'; payload: string }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'GO_BACK' }
  | { type: 'ADD_PARTICIPANT'; payload: User }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: { id: string; changes: Partial<Expense> } }
  | { type: 'REMOVE_EXPENSE'; payload: string }
  | { type: 'RESET' };

export type { Action as AppAction };

const initialState: AppState = { events: [], activeEventId: null };

function updateActiveEvent(state: AppState, updater: (event: Event) => Event): AppState {
  if (!state.activeEventId) return state;
  return {
    ...state,
    events: state.events.map(e => e.id === state.activeEventId ? updater(e) : e),
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE': return action.payload;
    case 'CREATE_EVENT': return { ...state, events: [...state.events, action.payload], activeEventId: action.payload.id };
    case 'SELECT_EVENT': return { ...state, activeEventId: action.payload };
    case 'DELETE_EVENT': {
      const events = state.events.filter(e => e.id !== action.payload);
      return { ...state, events, activeEventId: state.activeEventId === action.payload ? null : state.activeEventId };
    }
    case 'GO_BACK': return { ...state, activeEventId: null };
    case 'ADD_PARTICIPANT': return updateActiveEvent(state, e => ({
      ...e, participants: [...e.participants, action.payload],
    }));
    case 'REMOVE_PARTICIPANT': return updateActiveEvent(state, e => {
      // Guard: do not remove a participant who has paid for any expense.
      // Recomputing payer totals across expenses would be lossy and surprising.
      if (hasPaidAnyExpense(action.payload, e.expenses)) return e;
      return {
        ...e,
        participants: e.participants.filter(p => p.id !== action.payload),
        expenses: e.expenses.map(ex => {
          const remainingSplitIds = ex.splits
            .filter(s => s.userId !== action.payload)
            .map(s => s.userId);
          // Equal splits: recompute so the surviving participants' shares add
          // up to the expense total. Manual splits keep the user-entered
          // amounts (the removed person's share is simply dropped).
          const splits = ex.splitType === 'equal' && remainingSplitIds.length > 0
            ? calculator.calculate(ex.amount, remainingSplitIds, 'equal')
            : ex.splits.filter(s => s.userId !== action.payload);
          return { ...ex, splits };
        }),
      };
    });
    case 'ADD_EXPENSE': return updateActiveEvent(state, e => ({
      ...e, expenses: [...e.expenses, action.payload],
    }));
    case 'UPDATE_EXPENSE': return updateActiveEvent(state, e => ({
      ...e, expenses: e.expenses.map(ex => ex.id === action.payload.id ? { ...ex, ...action.payload.changes } : ex),
    }));
    case 'REMOVE_EXPENSE': return updateActiveEvent(state, e => ({
      ...e, expenses: e.expenses.filter(ex => ex.id !== action.payload),
    }));
    case 'RESET': return updateActiveEvent(state, e => ({
      ...e, participants: [], expenses: [],
    }));
    default: return state;
  }
}

const AppContext = createContext<AppContextValue | null>(null);
const storage = new StorageService();
const calculator = new SplitCalculator();
const simplifier = new DebtSimplifier();
const exportService = new EventExportService();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    const saved = storage.load();
    if (saved) dispatch({ type: 'SET_STATE', payload: saved });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) storage.save(state);
  }, [state, initialized]);

  const activeEvent = useMemo(() => state.events.find(e => e.id === state.activeEventId) ?? null, [state]);

  const createEvent = useCallback((name: string) => {
    const event: Event = {
      id: generateId(),
      name: name.trim(),
      createdAt: Date.now(),
      participants: [],
      expenses: [],
    };
    dispatch({ type: 'CREATE_EVENT', payload: event });
  }, []);

  const selectEvent = useCallback((id: string) => {
    dispatch({ type: 'SELECT_EVENT', payload: id });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const addParticipant = useCallback((name: string) => {
    const user: User = { id: generateId(), name: name.trim() };
    dispatch({ type: 'ADD_PARTICIPANT', payload: user });
  }, []);

  const removeParticipant = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', payload: id });
  }, []);

  const addExpense = useCallback((params: {
    description: string;
    amount: number;
    paidBy: PayerDetail[];
    splitType: SplitType;
    manualAmounts?: Record<string, number>;
    participantIds: string[];
    receiptImage?: string;
  }) => {
    const splits = calculator.calculate(
      params.amount,
      params.participantIds,
      params.splitType,
      params.manualAmounts
    );
    const expense: Expense = {
      id: generateId(),
      description: params.description,
      amount: params.amount,
      paidBy: params.paidBy,
      splitType: params.splitType,
      splits,
      receiptImage: params.receiptImage,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: expense });
  }, []);

  const updateExpense = useCallback((id: string, params: {
    description: string;
    amount: number;
    paidBy: PayerDetail[];
    splitType: SplitType;
    manualAmounts?: Record<string, number>;
    participantIds: string[];
    receiptImage?: string;
  }) => {
    const splits = calculator.calculate(
      params.amount,
      params.participantIds,
      params.splitType,
      params.manualAmounts
    );
    dispatch({
      type: 'UPDATE_EXPENSE',
      payload: {
        id,
        changes: {
          description: params.description,
          amount: params.amount,
          paidBy: params.paidBy,
          splitType: params.splitType,
          splits,
          receiptImage: params.receiptImage,
        },
      },
    });
  }, []);

  const removeExpense = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_EXPENSE', payload: id });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const exportEvent = useCallback(() => {
    const event = state.events.find(e => e.id === state.activeEventId);
    if (!event) return;
    exportService.export(event);
  }, [state.events, state.activeEventId]);

  const importEvent = useCallback(async (file: File) => {
    const imported = await exportService.import(file);
    dispatch({ type: 'CREATE_EVENT', payload: imported });
  }, []);

  const participants = activeEvent?.participants ?? [];
  const expenses = activeEvent?.expenses ?? [];
  const debts = simplifier.simplify(expenses, participants);

  return (
    <AppContext.Provider value={{
      events: state.events,
      activeEventId: state.activeEventId,
      activeEvent,
      createEvent,
      selectEvent,
      deleteEvent,
      goBack,
      exportEvent,
      importEvent,
      participants,
      expenses,
      addParticipant,
      removeParticipant,
      addExpense,
      updateExpense,
      removeExpense,
      debts,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
