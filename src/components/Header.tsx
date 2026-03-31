import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="app-header" role="banner">
      <div className="container mx-auto px-4 flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <div className="logo-icon" aria-hidden="true">
            <span>$</span>
          </div>
          <div>
            <h1 className="app-title">SettleIt</h1>
            <p className="app-subtitle">Split bills, not friendships.</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
