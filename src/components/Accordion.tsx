'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/icons';

interface AccordionProps {
  title: string;
  headingId: string;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  badge?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function Accordion({ title, headingId, defaultOpen = false, open: controlledOpen, onToggle, badge, headerRight, children }: AccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const toggle = () => {
    const next = !open;
    if (isControlled) {
      onToggle?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  return (
    <section aria-labelledby={headingId} className="accordion-section">
      <button
        type="button"
        className="accordion-trigger"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`${headingId}-panel`}
      >
        <h2 id={headingId} className="section-title" style={{ marginBottom: 0 }}>
          {title}
          {badge}
        </h2>
        <div className="flex items-center gap-2">
          {headerRight}
          <ChevronDownIcon className={`accordion-chevron ${open ? 'open' : ''}`} />
        </div>
      </button>
      <div
        id={`${headingId}-panel`}
        role="region"
        aria-labelledby={headingId}
        className={`accordion-panel ${open ? 'open' : ''}`}
      >
        <div className="accordion-content">
          {children}
        </div>
      </div>
    </section>
  );
}
