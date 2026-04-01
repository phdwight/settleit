import { EqualSplitStrategy } from '@/lib/strategies/EqualSplitStrategy';

describe('EqualSplitStrategy', () => {
  const strategy = new EqualSplitStrategy();

  it('has type "equal"', () => {
    expect(strategy.type).toBe('equal');
  });

  it('splits evenly among participants', () => {
    const result = strategy.calculate(100, ['a', 'b']);
    expect(result).toEqual([
      { userId: 'a', amount: 50 },
      { userId: 'b', amount: 50 },
    ]);
  });

  it('handles three-way split with rounding', () => {
    const result = strategy.calculate(100, ['a', 'b', 'c']);
    const total = result.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBeCloseTo(100, 2);
    // First participant gets the remainder
    expect(result[0].amount).toBeCloseTo(33.34, 2);
    expect(result[1].amount).toBeCloseTo(33.33, 2);
    expect(result[2].amount).toBeCloseTo(33.33, 2);
  });

  it('returns empty array for no participants', () => {
    expect(strategy.calculate(100, [])).toEqual([]);
  });

  it('assigns full amount to single participant', () => {
    const result = strategy.calculate(50, ['a']);
    expect(result).toEqual([{ userId: 'a', amount: 50 }]);
  });

  it('handles zero amount', () => {
    const result = strategy.calculate(0, ['a', 'b']);
    expect(result).toEqual([
      { userId: 'a', amount: 0 },
      { userId: 'b', amount: 0 },
    ]);
  });
});
