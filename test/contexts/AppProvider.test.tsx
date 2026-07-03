/**
 * Tests for the AppProvider callbacks (the hooks exposed via useApp).
 * The reducer itself is unit-tested in AppContext.test.ts; this file exercises
 * the provider wiring (createEvent, addExpense, importEvent, exportEvent, ...).
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import type { Event } from '@/lib/types';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AppProvider, null, children);

function makeFile(content: string): File {
  const file = new Blob([content]) as File;
  if (!file.text) {
    (file as { text: () => Promise<string> }).text = () => Promise.resolve(content);
  }
  return file;
}

const sampleEvent: Event = {
  id: 'evt-import',
  name: 'Imported Trip',
  createdAt: 1000,
  participants: [{ id: 'u1', name: 'Alice' }],
  expenses: [],
};

describe('AppProvider (useApp)', () => {
  beforeEach(() => {
    localStorage.clear();
    if (!URL.createObjectURL) URL.createObjectURL = jest.fn(() => 'blob:test');
    if (!URL.revokeObjectURL) URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with no events and no active event', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.events).toHaveLength(0);
    expect(result.current.activeEvent).toBeNull();
    expect(result.current.activeEventId).toBeNull();
    expect(result.current.participants).toEqual([]);
    expect(result.current.expenses).toEqual([]);
    expect(result.current.debts).toEqual([]);
  });

  it('createEvent adds and activates an event', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Summer Holiday'));
    expect(result.current.events).toHaveLength(1);
    expect(result.current.activeEvent?.name).toBe('Summer Holiday');
    expect(result.current.activeEventId).toBe(result.current.events[0].id);
  });

  it('addParticipant appends a participant to the active event', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));
    act(() => result.current.addParticipant('Alice'));
    act(() => result.current.addParticipant('Bob'));
    expect(result.current.participants.map(p => p.name)).toEqual(['Alice', 'Bob']);
  });

  it('addExpense computes splits and drives debts', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));
    act(() => result.current.addParticipant('Alice'));
    act(() => result.current.addParticipant('Bob'));
    const [alice, bob] = result.current.participants;

    act(() =>
      result.current.addExpense({
        description: 'Pizza',
        amount: 30,
        paidBy: [{ userId: alice.id, amount: 30 }],
        splitType: 'equal',
        participantIds: [alice.id, bob.id],
      })
    );

    expect(result.current.expenses).toHaveLength(1);
    const expense = result.current.expenses[0];
    expect(expense.splits).toHaveLength(2);
    // Bob owes Alice his 15 share.
    expect(result.current.debts).toEqual([
      { from: bob.id, to: alice.id, amount: 15 },
    ]);
  });

  it('updateExpense recomputes the stored expense', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));
    act(() => result.current.addParticipant('Alice'));
    act(() => result.current.addParticipant('Bob'));
    const [alice, bob] = result.current.participants;
    act(() =>
      result.current.addExpense({
        description: 'Pizza',
        amount: 30,
        paidBy: [{ userId: alice.id, amount: 30 }],
        splitType: 'equal',
        participantIds: [alice.id, bob.id],
      })
    );
    const id = result.current.expenses[0].id;

    act(() =>
      result.current.updateExpense(id, {
        description: 'Pizza (large)',
        amount: 40,
        paidBy: [{ userId: alice.id, amount: 40 }],
        splitType: 'equal',
        participantIds: [alice.id, bob.id],
      })
    );

    const updated = result.current.expenses[0];
    expect(updated.description).toBe('Pizza (large)');
    expect(updated.amount).toBe(40);
    expect(result.current.debts).toEqual([
      { from: bob.id, to: alice.id, amount: 20 },
    ]);
  });

  it('removeExpense deletes the expense', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));
    act(() => result.current.addParticipant('Alice'));
    const alice = result.current.participants[0];
    act(() =>
      result.current.addExpense({
        description: 'Coffee',
        amount: 10,
        paidBy: [{ userId: alice.id, amount: 10 }],
        splitType: 'equal',
        participantIds: [alice.id],
      })
    );
    const id = result.current.expenses[0].id;
    act(() => result.current.removeExpense(id));
    expect(result.current.expenses).toHaveLength(0);
  });

  it('removeParticipant removes a participant with no expenses', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));
    act(() => result.current.addParticipant('Alice'));
    const alice = result.current.participants[0];
    act(() => result.current.removeParticipant(alice.id));
    expect(result.current.participants).toHaveLength(0);
  });

  it('reset clears participants and expenses but keeps the event', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));
    act(() => result.current.addParticipant('Alice'));
    act(() => result.current.reset());
    expect(result.current.events).toHaveLength(1);
    expect(result.current.participants).toHaveLength(0);
  });

  it('selectEvent and goBack switch the active event', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('First'));
    const firstId = result.current.activeEventId!;
    act(() => result.current.createEvent('Second'));
    expect(result.current.activeEvent?.name).toBe('Second');

    act(() => result.current.selectEvent(firstId));
    expect(result.current.activeEvent?.name).toBe('First');

    act(() => result.current.goBack());
    expect(result.current.activeEvent).toBeNull();
  });

  it('deleteEvent removes the event and clears the active id', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));
    const id = result.current.activeEventId!;
    act(() => result.current.deleteEvent(id));
    expect(result.current.events).toHaveLength(0);
    expect(result.current.activeEventId).toBeNull();
  });

  it('exportEvent runs for the active event without throwing', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.createEvent('Trip'));

    // Mock createElement only after the hook is rendered, so React's own
    // container creation is untouched.
    const clickSpy = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({
      set href(_: string) {},
      set download(_: string) {},
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    act(() => result.current.exportEvent());

    expect(clickSpy).toHaveBeenCalled();
  });

  it('exportEvent is a no-op when there is no active event', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(() => act(() => result.current.exportEvent())).not.toThrow();
  });

  it('importEvent adds the imported event and activates it', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const file = makeFile(JSON.stringify({ version: 1, event: sampleEvent }));

    await act(async () => {
      await result.current.importEvent(file);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.activeEvent?.name).toBe('Imported Trip');
    expect(result.current.activeEvent?.id).not.toBe('evt-import');
  });

  it('importEvent rejects an invalid file', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const file = makeFile(JSON.stringify({ nope: true }));

    await expect(
      act(async () => {
        await result.current.importEvent(file);
      })
    ).rejects.toThrow();
    expect(result.current.events).toHaveLength(0);
  });
});

describe('useApp outside a provider', () => {
  it('throws a helpful error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useApp())).toThrow(
      'useApp must be used within AppProvider'
    );
    spy.mockRestore();
  });
});
