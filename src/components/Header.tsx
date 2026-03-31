'use client';

import { ThemeToggle } from './ThemeToggle';
import { TrashIcon } from './icons';

export function Header() {
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

  return (
    <header className="app-header" role="banner">
      <div className="container mx-auto px-3 flex items-center justify-between h-full gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="logo-icon flex-shrink-0" aria-hidden="true">
            <span>≋</span>
          </div>
          <div className="min-w-0">
            <h1 className="app-title truncate">SettleIt</h1>
            <p className="app-subtitle truncate hidden sm:block">Split bills, not friendships.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={clearStorage} className="icon-btn text-[var(--muted)] hover:text-[var(--danger)]" aria-label="Clear all data">
            <TrashIcon className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
