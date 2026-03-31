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
      <div className="container mx-auto px-4 flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <div className="logo-icon" aria-hidden="true">
            <span>≋</span>
          </div>
          <div>
            <h1 className="app-title">SettleIt</h1>
            <p className="app-subtitle">Split bills, not friendships.</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearStorage} className="icon-btn text-[var(--muted)] hover:text-[var(--danger)]" aria-label="Clear all data">
            <TrashIcon className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
