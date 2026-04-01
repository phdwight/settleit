'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/icons';

interface AccordionProps {
  title: string;
  headingId: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function Accordion({ title, headingId, defaultOpen = true, badge, headerRight, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section aria-labelledby={headingId} className="card">
      <button
        type="button"
        className="accordion-trigger"
        onClick={() => setOpen(o => !o)}
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
