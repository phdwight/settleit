import { ManualSplitStrategy } from '@/lib/strategies/ManualSplitStrategy';

describe('ManualSplitStrategy', () => {
  const strategy = new ManualSplitStrategy();

  it('has type "manual"', () => {
    expect(strategy.type).toBe('manual');
  });

  it('uses manual amounts for each participant', () => {
    const result = strategy.calculate(100, ['a', 'b'], { a: 60, b: 40 });
    expect(result).toEqual([
      { userId: 'a', amount: 60 },
      { userId: 'b', amount: 40 },
    ]);
  });

  it('defaults to 0 for participants not in manualAmounts', () => {
    const result = strategy.calculate(100, ['a', 'b'], { a: 100 });
    expect(result).toEqual([
      { userId: 'a', amount: 100 },
      { userId: 'b', amount: 0 },
    ]);
  });

  it('returns empty array when manualAmounts is undefined', () => {
    expect(strategy.calculate(100, ['a', 'b'])).toEqual([]);
  });

  it('rounds amounts to 2 decimal places', () => {
    const result = strategy.calculate(100, ['a'], { a: 33.3333 });
    expect(result).toEqual([{ userId: 'a', amount: 33.33 }]);
  });
});
