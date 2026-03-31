'use client';

import { ThemeToggle } from './ThemeToggle';
import { TrashIcon } from './icons';

export function Header() {
  const clearStorage = () => {
    if (window.confirm('Clear all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <header className="app-header" role="banner">
      <div className="container mx-auto px-4 flex items-center justify-between h-full gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="logo-icon flex-shrink-0" aria-hidden="true">
            <span>≋</span>
          </div>
          <div className="min-w-0">
            <h1 className="app-title truncate">SettleIt</h1>
            <p className="app-subtitle truncate">Split bills, not friendships.</p>
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
