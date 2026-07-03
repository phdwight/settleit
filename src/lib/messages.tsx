/**
 * Centralized user-facing strings.
 *
 * Structured to be ready for future i18n: keys are stable, values are either
 * plain strings or functions that accept parameters. Swap this module for a
 * locale-aware loader (e.g. `formatjs`, `i18next`) without touching call sites.
 */

const plural = (count: number, singular: string, pluralForm?: string) =>
  count === 1 ? singular : pluralForm ?? `${singular}s`;

export const messages = {
  confirmDialog: {
    defaultConfirm: 'Delete',
    defaultCancel: 'Cancel',
  },

  events: {
    deleteTitle: (eventName: string) => `Delete "${eventName}"?`,
    deleteConfirm: 'Delete event',
    deleteIntro: 'This action cannot be undone. Deleting this event will permanently remove:',
    deleteParticipantsItem: (count: number) =>
      `${count} ${plural(count, 'participant')}`,
    deleteExpensesItem: (count: number) =>
      `${count} ${plural(count, 'expense')} and any attached receipts`,
    deleteHistoryItem: 'All calculated balances and settlement history for this event',
  },

  participants: {
    removeTitle: (name: string) => `Remove ${name}?`,
    removeConfirm: 'Remove',
    removeIntro: (name: string) => (
      <>
        This will remove <strong>{name}</strong> from this event.
      </>
    ),
    removeDeletedExpenses: (count: number) =>
      `${count} ${plural(count, 'expense')} paid solely by them will be deleted.`,
    removeModifiedExpenses: (count: number) =>
      `${count} other ${plural(count, 'expense')} will be updated to drop their share.`,
    removeDebtsNote: 'Any debts involving this participant will be recalculated.',
    removeNoImpact: 'They have no expenses recorded, so no other data will be affected.',
    removeBlockedTooltip:
      'This participant has paid for one or more expenses. Delete or reassign those expenses first.',
    removeBlockedHint:
      'Remove disabled: this participant has paid for one or more expenses. Delete or reassign those expenses first.',
  },

  expenses: {
    removeTitle: (description: string) => `Delete "${description}"?`,
    removeConfirm: 'Delete expense',
    removeBody: (description: string, amount: string) => (
      <>
        This permanently removes <strong>{description}</strong>{' '}
        (<span style={{ fontFamily: 'monospace' }}>{amount}</span>) and updates the
        settlement summary. This action cannot be undone.
      </>
    ),
  },

  summary: {
    resetButton: 'Reset',
    resetTitle: 'Reset this event?',
    resetConfirm: 'Reset event',
    resetBody: (participantCount: number, expenseCount: number) => (
      <>
        <p>This clears all data for the current event:</p>
        <ul>
          <li>
            {participantCount} {plural(participantCount, 'participant')} will be removed.
          </li>
          <li>
            {expenseCount} {plural(expenseCount, 'expense')} and any attached receipts
            will be deleted.
          </li>
          <li>All calculated balances will be cleared.</li>
        </ul>
        <p>The event itself will remain. This action cannot be undone.</p>
      </>
    ),
  },

  settlements: {
    heading: 'Payments',
    empty: 'No payments recorded yet.',
    settleUp: 'Settle up',
    recordTitle: 'Record a payment',
    amountLabel: 'Amount',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'e.g. cash, GCash',
    save: 'Record payment',
    deleteTitle: 'Delete this payment?',
    deleteConfirm: 'Delete payment',
    deleteBody: (from: string, to: string, amount: string) => (
      <>
        This removes the recorded payment of <strong>{amount}</strong> from{' '}
        {from} to {to}. Remaining balances will be recalculated.
      </>
    ),
  },
} as const;
