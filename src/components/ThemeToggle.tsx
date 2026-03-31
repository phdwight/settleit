'use client';

import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon, EyeIcon } from '@/components/icons';

const themes: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'high-contrast', label: 'High Contrast', Icon: EyeIcon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-[var(--surface)] rounded-full p-1" role="group" aria-label="Select theme">
      {themes.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          title={label}
          className={`theme-btn ${theme === value ? 'active' : ''}`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
