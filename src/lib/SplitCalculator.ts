import type { SplitStrategy, SplitDetail } from './types';
import { EqualSplitStrategy } from './strategies/EqualSplitStrategy';
import { ManualSplitStrategy } from './strategies/ManualSplitStrategy';

export class SplitCalculator {
  private strategies: Map<string, SplitStrategy>;

  constructor() {
    const equal = new EqualSplitStrategy();
    const manual = new ManualSplitStrategy();
    this.strategies = new Map<string, SplitStrategy>([
      [equal.type, equal],
      [manual.type, manual],
    ]);
  }

  registerStrategy(strategy: SplitStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  calculate(
    totalAmount: number,
    participantIds: string[],
    strategyType: string,
    manualAmounts?: Record<string, number>
  ): SplitDetail[] {
    const strategy = this.strategies.get(strategyType);
    if (!strategy) throw new Error(`Unknown split strategy: ${strategyType}`);
    return strategy.calculate(totalAmount, participantIds, manualAmounts);
  }
}
