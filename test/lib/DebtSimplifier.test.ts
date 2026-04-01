import { DebtSimplifier } from '@/lib/DebtSimplifier';
import type { Expense, User } from '@/lib/types';

describe('DebtSimplifier', () => {
  const simplifier = new DebtSimplifier();

  const users: User[] = [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'charlie', name: 'Charlie' },
  ];

  it('returns empty array with no expenses', () => {
    expect(simplifier.simplify([], users)).toEqual([]);
  });

  it('returns empty array with no participants', () => {
    expect(simplifier.simplify([], [])).toEqual([]);
  });

  it('computes simple two-person debt', () => {
    const expenses: Expense[] = [{
      id: '1',
      description: 'Dinner',
      amount: 100,
      paidBy: [{ userId: 'alice', amount: 100 }],
      splitType: 'equal',
      splits: [
        { userId: 'alice', amount: 50 },
        { userId: 'bob', amount: 50 },
      ],
      createdAt: 1,
    }];

    const debts = simplifier.simplify(expenses, users.slice(0, 2));
    expect(debts).toEqual([
      { from: 'bob', to: 'alice', amount: 50 },
    ]);
  });

  it('simplifies three-person debts', () => {
    const expenses: Expense[] = [{
      id: '1',
      description: 'Dinner',
      amount: 90,
      paidBy: [{ userId: 'alice', amount: 90 }],
      splitType: 'equal',
      splits: [
        { userId: 'alice', amount: 30 },
        { userId: 'bob', amount: 30 },
        { userId: 'charlie', amount: 30 },
      ],
      createdAt: 1,
    }];

    const debts = simplifier.simplify(expenses, users);
    const totalOwed = debts.reduce((sum, d) => sum + d.amount, 0);
    expect(totalOwed).toBe(60); // bob(30) + charlie(30) owe alice
    expect(debts).toHaveLength(2);
    debts.forEach(d => expect(d.to).toBe('alice'));
  });

  it('nets out opposing debts', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        description: 'Dinner',
        amount: 100,
        paidBy: [{ userId: 'alice', amount: 100 }],
        splitType: 'equal',
        splits: [
          { userId: 'alice', amount: 50 },
          { userId: 'bob', amount: 50 },
        ],
        createdAt: 1,
      },
      {
        id: '2',
        description: 'Taxi',
        amount: 100,
        paidBy: [{ userId: 'bob', amount: 100 }],
        splitType: 'equal',
        splits: [
          { userId: 'alice', amount: 50 },
          { userId: 'bob', amount: 50 },
        ],
        createdAt: 2,
      },
    ];

    const debts = simplifier.simplify(expenses, users.slice(0, 2));
    // They cancel out — no debts
    expect(debts).toEqual([]);
  });

  it('handles multi-payer expenses', () => {
    const expenses: Expense[] = [{
      id: '1',
      description: 'Dinner',
      amount: 90,
      paidBy: [
        { userId: 'alice', amount: 60 },
        { userId: 'bob', amount: 30 },
      ],
      splitType: 'equal',
      splits: [
        { userId: 'alice', amount: 30 },
        { userId: 'bob', amount: 30 },
        { userId: 'charlie', amount: 30 },
      ],
      createdAt: 1,
    }];

    const debts = simplifier.simplify(expenses, users);
    // alice net: +60-30=+30, bob net: +30-30=0, charlie net: -30
    expect(debts).toEqual([
      { from: 'charlie', to: 'alice', amount: 30 },
    ]);
  });
});
