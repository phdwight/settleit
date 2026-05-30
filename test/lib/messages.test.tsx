import { messages } from '@/lib/messages';

describe('messages', () => {
  describe('confirmDialog', () => {
    it('exposes default labels', () => {
      expect(messages.confirmDialog.defaultConfirm).toBe('Delete');
      expect(messages.confirmDialog.defaultCancel).toBe('Cancel');
    });
  });

  describe('events', () => {
    it('formats the delete title with the event name', () => {
      expect(messages.events.deleteTitle('Trip')).toBe('Delete "Trip"?');
    });

    it('uses singular for one participant', () => {
      expect(messages.events.deleteParticipantsItem(1)).toBe('1 participant');
    });

    it('uses plural for more than one participant', () => {
      expect(messages.events.deleteParticipantsItem(3)).toBe('3 participants');
    });

    it('uses singular for one expense', () => {
      expect(messages.events.deleteExpensesItem(1)).toBe(
        '1 expense and any attached receipts'
      );
    });

    it('uses plural for more than one expense', () => {
      expect(messages.events.deleteExpensesItem(5)).toBe(
        '5 expenses and any attached receipts'
      );
    });

    it('uses plural for zero', () => {
      expect(messages.events.deleteParticipantsItem(0)).toBe('0 participants');
    });
  });

  describe('participants', () => {
    it('formats the remove title with the participant name', () => {
      expect(messages.participants.removeTitle('Alice')).toBe('Remove Alice?');
    });

    it('pluralizes deleted expenses correctly', () => {
      expect(messages.participants.removeDeletedExpenses(1)).toBe(
        '1 expense paid solely by them will be deleted.'
      );
      expect(messages.participants.removeDeletedExpenses(4)).toBe(
        '4 expenses paid solely by them will be deleted.'
      );
    });

    it('pluralizes modified expenses correctly', () => {
      expect(messages.participants.removeModifiedExpenses(1)).toBe(
        '1 other expense will be updated to drop their share.'
      );
      expect(messages.participants.removeModifiedExpenses(2)).toBe(
        '2 other expenses will be updated to drop their share.'
      );
    });
  });

  describe('expenses', () => {
    it('formats the remove title with the description', () => {
      expect(messages.expenses.removeTitle('Pizza')).toBe('Delete "Pizza"?');
    });

    it('exposes a confirm label', () => {
      expect(messages.expenses.removeConfirm).toBe('Delete expense');
    });
  });

  describe('summary', () => {
    it('exposes labels for reset', () => {
      expect(messages.summary.resetButton).toBe('Reset');
      expect(messages.summary.resetTitle).toBe('Reset this event?');
      expect(messages.summary.resetConfirm).toBe('Reset event');
    });
  });
});
