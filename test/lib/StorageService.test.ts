import { StorageService } from '@/lib/StorageService';
import type { AppState } from '@/lib/types';

describe('StorageService', () => {
  const service = new StorageService();

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(service.load()).toBeNull();
  });

  it('saves and loads state', () => {
    const state: AppState = {
      events: [{
        id: '1',
        name: 'Test',
        createdAt: 1000,
        participants: [{ id: 'a', name: 'Alice' }],
        expenses: [],
      }],
      activeEventId: '1',
    };
    service.save(state);
    expect(service.load()).toEqual(state);
  });

  it('clears stored data', () => {
    const state: AppState = { events: [], activeEventId: null };
    service.save(state);
    service.clear();
    expect(service.load()).toBeNull();
  });

  it('migrates legacy pre-events format', () => {
    localStorage.setItem('settleit_state', JSON.stringify({
      participants: [{ id: 'a', name: 'Alice' }],
      expenses: [{ id: 'e1', description: 'Test', amount: 10, paidBy: [{ userId: 'a', amount: 10 }], splitType: 'equal', splits: [{ userId: 'a', amount: 10 }], createdAt: 1 }],
    }));
    const loaded = service.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.events).toHaveLength(1);
    expect(loaded!.events[0].name).toBe('My Event');
    expect(loaded!.events[0].participants).toHaveLength(1);
    expect(loaded!.events[0].expenses).toHaveLength(1);
    expect(loaded!.activeEventId).toBe(loaded!.events[0].id);
  });

  it('handles corrupt JSON gracefully', () => {
    localStorage.setItem('settleit_state', 'not json');
    expect(service.load()).toBeNull();
  });
});
