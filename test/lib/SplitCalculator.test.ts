import { SplitCalculator } from '@/lib/SplitCalculator';

describe('SplitCalculator', () => {
  const calc = new SplitCalculator();

  it('calculates equal split', () => {
    const result = calc.calculate(100, ['a', 'b'], 'equal');
    expect(result).toEqual([
      { userId: 'a', amount: 50 },
      { userId: 'b', amount: 50 },
    ]);
  });

  it('calculates manual split', () => {
    const result = calc.calculate(100, ['a', 'b'], 'manual', { a: 70, b: 30 });
    expect(result).toEqual([
      { userId: 'a', amount: 70 },
      { userId: 'b', amount: 30 },
    ]);
  });

  it('throws for unknown strategy', () => {
    expect(() => calc.calculate(100, ['a'], 'unknown')).toThrow('Unknown split strategy: unknown');
  });

  it('supports registering a custom strategy', () => {
    const custom = {
      type: 'custom' as const,
      calculate: (_total: number, ids: string[]) =>
        ids.map(id => ({ userId: id, amount: 0 })),
    };
    calc.registerStrategy(custom);
    const result = calc.calculate(100, ['a', 'b'], 'custom');
    expect(result).toEqual([
      { userId: 'a', amount: 0 },
      { userId: 'b', amount: 0 },
    ]);
  });
});
