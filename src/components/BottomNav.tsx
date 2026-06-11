'use client';

import { WalletIcon, ReceiptIcon, UsersIcon, MenuIcon, PlusIcon } from '@/components/icons';

export type NavTab = 'summary' | 'expenses' | 'people' | 'more';

const LEFT_ITEMS: { tab: NavTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { tab: 'summary', label: 'Summary', Icon: WalletIcon },
  { tab: 'expenses', label: 'Expenses', Icon: ReceiptIcon },
];

const RIGHT_ITEMS: { tab: NavTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { tab: 'people', label: 'People', Icon: UsersIcon },
  { tab: 'more', label: 'More', Icon: MenuIcon },
];

interface BottomNavProps {
  active: NavTab;
  onSelect: (tab: NavTab) => void;
  onAdd: () => void;
  addLabel: string;
}

export function BottomNav({ active, onSelect, onAdd, addLabel }: BottomNavProps) {
  const renderItem = ({ tab, label, Icon }: { tab: NavTab; label: string; Icon: React.ComponentType<{ className?: string }> }) => (
    <button
      key={tab}
      type="button"
      className={`nav-item ${active === tab ? 'active' : ''}`}
      onClick={() => onSelect(tab)}
      aria-current={active === tab ? 'page' : undefined}
    >
      <Icon />
      <span>{label}</span>
    </button>
  );

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-inner">
        {LEFT_ITEMS.map(renderItem)}
        <div className="nav-spacer" aria-hidden="true" />
        {RIGHT_ITEMS.map(renderItem)}
        <button type="button" className="fab" onClick={onAdd} aria-label={addLabel} title={addLabel}>
          <PlusIcon />
        </button>
      </div>
    </nav>
  );
}
