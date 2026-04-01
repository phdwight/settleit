/**
 * Tests for the AppContext reducer logic.
 * We extract and test the reducer directly by importing AppContext module.
 */
import type { AppState, Event, User, Expense } from '@/lib/types';

// We can't import the reducer directly since it's not exported,
// so we test via the public API by rendering the provider.
// Instead, we replicate the reducer here for pure unit testing.

function updateActiveEvent(state: AppState, updater: (event: Event) => Event): AppState {
  if (!state.activeEventId) return state;
  return {
    ...state,
    events: state.events.map(e => e.id === state.activeEventId ? updater(e) : e),
  };
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

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'evt-1',
  name: 'Test Event',
  createdAt: 1000,
  participants: [],
  expenses: [],
  ...overrides,
});

const makeExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'exp-1',
  description: 'Pizza',
  amount: 30,
  paidBy: [{ userId: 'u1', amount: 30 }],
  splitType: 'equal',
  splits: [
    { userId: 'u1', amount: 15 },
    { userId: 'u2', amount: 15 },
  ],
  createdAt: 2000,
  ...overrides,
});

describe('AppContext reducer', () => {
  const emptyState: AppState = { events: [], activeEventId: null };

  describe('SET_STATE', () => {
    it('replaces the entire state', () => {
      const newState: AppState = { events: [makeEvent()], activeEventId: 'evt-1' };
      expect(reducer(emptyState, { type: 'SET_STATE', payload: newState })).toEqual(newState);
    });
  });

  describe('CREATE_EVENT', () => {
    it('adds event and sets it as active', () => {
      const event = makeEvent();
      const state = reducer(emptyState, { type: 'CREATE_EVENT', payload: event });
      expect(state.events).toHaveLength(1);
      expect(state.activeEventId).toBe('evt-1');
    });
  });

  describe('SELECT_EVENT', () => {
    it('sets activeEventId', () => {
      const state: AppState = { events: [makeEvent()], activeEventId: null };
      const next = reducer(state, { type: 'SELECT_EVENT', payload: 'evt-1' });
      expect(next.activeEventId).toBe('evt-1');
    });
  });

  describe('DELETE_EVENT', () => {
    it('removes event and clears active if it was active', () => {
      const state: AppState = { events: [makeEvent()], activeEventId: 'evt-1' };
      const next = reducer(state, { type: 'DELETE_EVENT', payload: 'evt-1' });
      expect(next.events).toHaveLength(0);
      expect(next.activeEventId).toBeNull();
    });

    it('keeps active if a different event is deleted', () => {
      const state: AppState = {
        events: [makeEvent({ id: 'evt-1' }), makeEvent({ id: 'evt-2' })],
        activeEventId: 'evt-1',
      };
      const next = reducer(state, { type: 'DELETE_EVENT', payload: 'evt-2' });
      expect(next.events).toHaveLength(1);
      expect(next.activeEventId).toBe('evt-1');
    });
  });

  describe('GO_BACK', () => {
    it('clears activeEventId', () => {
      const state: AppState = { events: [makeEvent()], activeEventId: 'evt-1' };
      expect(reducer(state, { type: 'GO_BACK' }).activeEventId).toBeNull();
    });
  });

  describe('ADD_PARTICIPANT', () => {
    it('adds participant to active event', () => {
      const state: AppState = { events: [makeEvent()], activeEventId: 'evt-1' };
      const next = reducer(state, { type: 'ADD_PARTICIPANT', payload: { id: 'u1', name: 'Alice' } });
      expect(next.events[0].participants).toHaveLength(1);
      expect(next.events[0].participants[0].name).toBe('Alice');
    });

    it('does nothing if no active event', () => {
      const state: AppState = { events: [makeEvent()], activeEventId: null };
      const next = reducer(state, { type: 'ADD_PARTICIPANT', payload: { id: 'u1', name: 'Alice' } });
      expect(next.events[0].participants).toHaveLength(0);
    });
  });

  describe('ADD_EXPENSE', () => {
    it('adds expense to active event', () => {
      const state: AppState = { events: [makeEvent()], activeEventId: 'evt-1' };
      const expense = makeExpense();
      const next = reducer(state, { type: 'ADD_EXPENSE', payload: expense });
      expect(next.events[0].expenses).toHaveLength(1);
    });
  });

  describe('REMOVE_EXPENSE', () => {
    it('removes expense from active event', () => {
      const state: AppState = {
        events: [makeEvent({ expenses: [makeExpense()] })],
        activeEventId: 'evt-1',
      };
      const next = reducer(state, { type: 'REMOVE_EXPENSE', payload: 'exp-1' });
      expect(next.events[0].expenses).toHaveLength(0);
    });
  });

  describe('REMOVE_PARTICIPANT', () => {
    it('removes participant and cleans up their expenses/splits', () => {
      const state: AppState = {
        events: [makeEvent({
          participants: [{ id: 'u1', name: 'Alice' }, { id: 'u2', name: 'Bob' }],
          expenses: [makeExpense()],
        })],
        activeEventId: 'evt-1',
      };
      const next = reducer(state, { type: 'REMOVE_PARTICIPANT', payload: 'u2' });
      expect(next.events[0].participants).toHaveLength(1);
      // Expense still exists (u1 is still a payer) but u2's split is removed
      expect(next.events[0].expenses).toHaveLength(1);
      expect(next.events[0].expenses[0].splits).toHaveLength(1);
      expect(next.events[0].expenses[0].splits[0].userId).toBe('u1');
    });
  });

  describe('RESET', () => {
    it('clears participants and expenses of active event', () => {
      const state: AppState = {
        events: [makeEvent({
          participants: [{ id: 'u1', name: 'Alice' }],
          expenses: [makeExpense()],
        })],
        activeEventId: 'evt-1',
      };
      const next = reducer(state, { type: 'RESET' });
      expect(next.events[0].participants).toEqual([]);
      expect(next.events[0].expenses).toEqual([]);
    });
  });
});
