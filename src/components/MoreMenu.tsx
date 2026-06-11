'use client';

import { useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useState } from 'react';
import { DownloadIcon, UploadIcon, TrashIcon, ArrowLeftIcon } from '@/components/icons';

export function MoreMenu() {
  const { exportEvent, importEvent, goBack } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const clearStorage = async () => {
    localStorage.clear();
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    const regs = await navigator.serviceWorker?.getRegistrations();
    if (regs) await Promise.all(regs.map(r => r.unregister()));
    window.location.reload();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importEvent(file);
    } catch {
      alert('Failed to import: invalid file format.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section className="card" aria-labelledby="more-heading">
      <h2 id="more-heading" className="section-title">More</h2>
      <div className="space-y-2">
        <button onClick={goBack} className="more-row">
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Switch event</span>
        </button>
        <button onClick={exportEvent} className="more-row">
          <DownloadIcon className="w-5 h-5" />
          <span>Export this event</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="more-row">
          <UploadIcon className="w-5 h-5" />
          <span>Import event</span>
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <button onClick={() => setConfirmingClear(true)} className="more-row more-row-danger">
          <TrashIcon className="w-5 h-5" />
          <span>Clear all data</span>
        </button>
      </div>

      <p className="text-center text-[10px] text-[var(--muted)] mt-6">
        v{process.env.NEXT_PUBLIC_BUILD_VERSION}
      </p>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear all data?"
        confirmLabel="Clear everything"
        message={<p>This permanently deletes all events, participants, and expenses on this device. This cannot be undone.</p>}
        onConfirm={clearStorage}
        onCancel={() => setConfirmingClear(false)}
      />
    </section>
  );
}
