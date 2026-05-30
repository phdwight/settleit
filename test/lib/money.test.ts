import { roundCents, isMonetaryZero, MONEY_EPSILON } from '@/lib/money';

describe('money', () => {
  describe('roundCents', () => {
    it('rounds to 2 decimal places', () => {
      // Note: 1.005 lands on 1.00 due to IEEE-754 (1.005 * 100 ≈ 100.4999…).
      // The helper preserves the existing app-wide rounding behavior.
      expect(roundCents(1.004)).toBe(1.0);
      expect(roundCents(1.236)).toBe(1.24);
      expect(roundCents(1.234)).toBe(1.23);
      expect(roundCents(2.005)).toBe(2.01);
    });

    it('passes through whole numbers', () => {
      expect(roundCents(10)).toBe(10);
      expect(roundCents(0)).toBe(0);
    });

    it('handles negatives', () => {
      expect(roundCents(-1.236)).toBeCloseTo(-1.24, 2);
    });
  });

  describe('isMonetaryZero', () => {
    it('treats values below epsilon as zero', () => {
      expect(isMonetaryZero(0)).toBe(true);
      expect(isMonetaryZero(MONEY_EPSILON / 2)).toBe(true);
      expect(isMonetaryZero(-MONEY_EPSILON / 2)).toBe(true);
    });

    it('treats values at or above epsilon as non-zero', () => {
      expect(isMonetaryZero(MONEY_EPSILON)).toBe(false);
      expect(isMonetaryZero(0.01)).toBe(false);
      expect(isMonetaryZero(-0.01)).toBe(false);
    });
  });

  describe('MONEY_EPSILON', () => {
    it('is half a cent', () => {
      expect(MONEY_EPSILON).toBe(0.005);
    });
  });
});
