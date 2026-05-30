/**
 * Tests for the AppContext reducer logic.
 * Imports the real reducer (single source of truth — handoff.md DRY rule).
 */
import type { AppState, Event, Expense } from '@/lib/types';
import { reducer } from '@/contexts/AppContext';

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

    it('recomputes equal splits so remaining shares add up to the total', () => {
      // Three-way equal split of $30 → $10 each.
      const expense: Expense = {
        id: 'exp-1',
        description: 'Pizza',
        amount: 30,
        paidBy: [{ userId: 'u1', amount: 30 }],
        splitType: 'equal',
        splits: [
          { userId: 'u1', amount: 10 },
          { userId: 'u2', amount: 10 },
          { userId: 'u3', amount: 10 },
        ],
        createdAt: 2000,
      };
      const state: AppState = {
        events: [makeEvent({
          participants: [
            { id: 'u1', name: 'Alice' },
            { id: 'u2', name: 'Bob' },
            { id: 'u3', name: 'Carol' },
          ],
          expenses: [expense],
        })],
        activeEventId: 'evt-1',
      };
      const next = reducer(state, { type: 'REMOVE_PARTICIPANT', payload: 'u3' });
      const updated = next.events[0].expenses[0];
      expect(updated.splits).toHaveLength(2);
      const total = updated.splits.reduce((s, x) => s + x.amount, 0);
      expect(Math.abs(total - updated.amount)).toBeLessThan(0.01);
    });

    it('leaves manual split amounts untouched for surviving participants', () => {
      const expense: Expense = {
        id: 'exp-1',
        description: 'Dinner',
        amount: 50,
        paidBy: [{ userId: 'u1', amount: 50 }],
        splitType: 'manual',
        splits: [
          { userId: 'u1', amount: 20 },
          { userId: 'u2', amount: 30 },
        ],
        createdAt: 2000,
      };
      const state: AppState = {
        events: [makeEvent({
          participants: [
            { id: 'u1', name: 'Alice' },
            { id: 'u2', name: 'Bob' },
          ],
          expenses: [expense],
        })],
        activeEventId: 'evt-1',
      };
      const next = reducer(state, { type: 'REMOVE_PARTICIPANT', payload: 'u2' });
      const updated = next.events[0].expenses[0];
      expect(updated.splits).toEqual([{ userId: 'u1', amount: 20 }]);
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
