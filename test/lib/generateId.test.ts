import { generateId } from '@/lib/generateId';

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns UUID format (8-4-4-4-12)', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  describe('fallback when crypto.randomUUID is unavailable', () => {
    let originalRandomUUID: typeof crypto.randomUUID;

    beforeEach(() => {
      originalRandomUUID = crypto.randomUUID;
      // Simulate a non-secure context (e.g. http://localhost in some browsers)
      // where randomUUID throws, forcing the getRandomValues fallback.
      crypto.randomUUID = () => {
        throw new Error('not available');
      };
    });

    afterEach(() => {
      crypto.randomUUID = originalRandomUUID;
    });

    it('produces a valid RFC 4122 v4 UUID via getRandomValues', () => {
      const id = generateId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('still generates unique IDs on the fallback path', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });
});
