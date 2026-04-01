'use client';

import { useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { TrashIcon, DownloadIcon, UploadIcon } from './icons';

export function Header() {
  const { activeEvent, exportEvent, importEvent } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearStorage = async () => {
    if (window.confirm('Clear all data? This cannot be undone.')) {
      localStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      const regs = await navigator.serviceWorker?.getRegistrations();
      if (regs) await Promise.all(regs.map(r => r.unregister()));
      window.location.reload();
    }
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
    <header className="app-header" role="banner">
      <div className="container mx-auto px-3 flex items-center justify-between h-full gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="logo-icon flex-shrink-0" aria-hidden="true">
            <span>≋</span>
          </div>
          <div className="min-w-0">
            <h1 className="app-title truncate">Settle<span className="text-[var(--accent)]">.</span>It</h1>
            <p className="app-subtitle truncate hidden sm:block">Split bills, not friendships.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {activeEvent && (
            <button onClick={exportEvent} className="icon-btn text-[var(--muted)] hover:text-[var(--accent)]" aria-label="Export event" title="Export event">
              <DownloadIcon className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="icon-btn text-[var(--muted)] hover:text-[var(--accent)]" aria-label="Import event" title="Import event">
            <UploadIcon className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={clearStorage} className="icon-btn text-[var(--muted)] hover:text-[var(--danger)]" aria-label="Clear all data">
            <TrashIcon className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
