'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AppState, User, Expense, SplitType } from '@/lib/types';
import { StorageService } from '@/lib/StorageService';
import { SplitCalculator } from '@/lib/SplitCalculator';
import { DebtSimplifier } from '@/lib/DebtSimplifier';

interface AppContextValue extends AppState {
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  addExpense: (params: {
    description: string;
    amount: number;
    paidBy: string;
    splitType: SplitType;
    manualAmounts?: Record<string, number>;
    participantIds: string[];
  }) => void;
  removeExpense: (id: string) => void;
  debts: ReturnType<DebtSimplifier['simplify']>;
  reset: () => void;
}

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'ADD_PARTICIPANT'; payload: User }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'REMOVE_EXPENSE'; payload: string }
  | { type: 'RESET' };

const initialState: AppState = { participants: [], expenses: [] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE': return action.payload;
    case 'ADD_PARTICIPANT': return { ...state, participants: [...state.participants, action.payload] };
    case 'REMOVE_PARTICIPANT': return {
      ...state,
      participants: state.participants.filter(p => p.id !== action.payload),
      expenses: state.expenses.filter(e => e.paidBy !== action.payload).map(e => ({
        ...e,
        splits: e.splits.filter(s => s.userId !== action.payload),
      })),
    };
    case 'ADD_EXPENSE': return { ...state, expenses: [...state.expenses, action.payload] };
    case 'REMOVE_EXPENSE': return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
    case 'RESET': return initialState;
    default: return state;
  }
}

const AppContext = createContext<AppContextValue | null>(null);
const storage = new StorageService();
const calculator = new SplitCalculator();
const simplifier = new DebtSimplifier();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = storage.load();
    if (saved) dispatch({ type: 'SET_STATE', payload: saved });
  }, []);

  useEffect(() => {
    storage.save(state);
  }, [state]);

  const addParticipant = useCallback((name: string) => {
    const user: User = { id: crypto.randomUUID(), name: name.trim() };
    dispatch({ type: 'ADD_PARTICIPANT', payload: user });
  }, []);

  const removeParticipant = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', payload: id });
  }, []);

  const addExpense = useCallback((params: {
    description: string;
    amount: number;
    paidBy: string;
    splitType: SplitType;
    manualAmounts?: Record<string, number>;
    participantIds: string[];
  }) => {
    const splits = calculator.calculate(
      params.amount,
      params.participantIds,
      params.splitType,
      params.manualAmounts
    );
    const expense: Expense = {
      id: crypto.randomUUID(),
      description: params.description,
      amount: params.amount,
      paidBy: params.paidBy,
      splitType: params.splitType,
      splits,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: expense });
  }, []);

  const removeExpense = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_EXPENSE', payload: id });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    storage.clear();
  }, []);

  const debts = simplifier.simplify(state.expenses, state.participants);

  return (
    <AppContext.Provider value={{ ...state, addParticipant, removeParticipant, addExpense, removeExpense, debts, reset }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
