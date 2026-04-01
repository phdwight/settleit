'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { AppState, Event, User, Expense, SplitType, PayerDetail } from '@/lib/types';
import { StorageService } from '@/lib/StorageService';
import { SplitCalculator } from '@/lib/SplitCalculator';
import { DebtSimplifier } from '@/lib/DebtSimplifier';
import { EventExportService } from '@/lib/EventExportService';
import { generateId } from '@/lib/generateId';

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
  | { type: 'REMOVE_EXPENSE'; payload: string }
  | { type: 'RESET' };

const initialState: AppState = { events: [], activeEventId: null };

function updateActiveEvent(state: AppState, updater: (event: Event) => Event): AppState {
  if (!state.activeEventId) return state;
  return {
    ...state,
    events: state.events.map(e => e.id === state.activeEventId ? updater(e) : e),
  };
}

function reducer(state: AppState, action: Action): AppState {
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
    case 'REMOVE_PARTICIPANT': return updateActiveEvent(state, e => ({
      ...e,
      participants: e.participants.filter(p => p.id !== action.payload),
      expenses: e.expenses.filter(ex => {
        if (Array.isArray(ex.paidBy)) {
          return ex.paidBy.some(py => py.userId !== action.payload);
        }
        return ex.paidBy !== action.payload;
      }).map(ex => ({
        ...ex,
        paidBy: Array.isArray(ex.paidBy) ? ex.paidBy.filter(py => py.userId !== action.payload) : ex.paidBy,
        splits: ex.splits.filter(s => s.userId !== action.payload),
      })),
    }));
    case 'ADD_EXPENSE': return updateActiveEvent(state, e => ({
      ...e, expenses: [...e.expenses, action.payload],
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
