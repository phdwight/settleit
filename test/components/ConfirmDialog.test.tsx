import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const baseProps = {
    title: 'Delete thing?',
    message: 'This cannot be undone.',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmDialog open={false} {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title and message when open', () => {
    render(<ConfirmDialog open {...baseProps} />);
    expect(screen.getByText('Delete thing?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('uses default Delete / Cancel labels', () => {
    render(<ConfirmDialog open {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('uses custom labels when provided', () => {
    render(
      <ConfirmDialog
        open
        {...baseProps}
        confirmLabel="Remove"
        cancelLabel="Keep"
      />
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog open {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmDialog open {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when overlay is clicked', () => {
    render(<ConfirmDialog open {...baseProps} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when clicking inside the dialog body', () => {
    render(<ConfirmDialog open {...baseProps} />);
    fireEvent.click(screen.getByText('This cannot be undone.'));
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Escape is pressed', () => {
    render(<ConfirmDialog open {...baseProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('autofocuses the confirm button when opened', () => {
    render(<ConfirmDialog open {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
  });

  it('exposes dialog role and aria-modal', () => {
    render(<ConfirmDialog open {...baseProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
  });
});
