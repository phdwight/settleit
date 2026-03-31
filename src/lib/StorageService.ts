import type { AppState } from './types';
import { generateId } from './generateId';

const STORAGE_KEY = 'settleit_state';

export class StorageService {
  load(): AppState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Migrate legacy data (pre-events format)
      if (parsed && Array.isArray(parsed.participants) && !parsed.events) {
        const event = {
          id: generateId(),
          name: 'My Event',
          createdAt: Date.now(),
          participants: parsed.participants,
          expenses: parsed.expenses ?? [],
        };
        return { events: [event], activeEventId: event.id };
      }
      return parsed as AppState;
    } catch {
      return null;
    }
  }

  save(state: AppState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable - silently fail
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}
