'use client';

import { ThemeToggle } from './ThemeToggle';

export function Header() {
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
