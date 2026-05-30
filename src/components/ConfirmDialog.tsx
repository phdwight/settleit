'use client';

import { useEffect, useRef } from 'react';
import { messages } from '@/lib/messages';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = messages.confirmDialog.defaultConfirm,
  cancelLabel = messages.confirmDialog.defaultCancel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirm-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">{title}</h2>
        <div className="confirm-dialog-message">{message}</div>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className="btn btn-danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
