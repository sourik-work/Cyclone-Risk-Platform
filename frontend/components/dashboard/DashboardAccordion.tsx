'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DashboardAccordionContextValue {
  openPanelIds: Set<string>;
  togglePanel: (id: string) => void;
}

const DashboardAccordionContext = createContext<DashboardAccordionContextValue | null>(null);

export const DashboardAccordionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openPanelIds, setOpenPanelIds] = useState(() =>
    new Set(['storm-telemetry', 'downstream-impact-preview'])
  );

  const togglePanel = (id: string) => {
    setOpenPanelIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <DashboardAccordionContext.Provider value={{ openPanelIds, togglePanel }}>
      {children}
    </DashboardAccordionContext.Provider>
  );
};

interface AccordionPanelProps {
  id: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  summary?: ReactNode;
}

export const AccordionPanel: React.FC<AccordionPanelProps> = ({ id, title, children, action, summary }) => {
  const context = useContext(DashboardAccordionContext);
  if (!context) {
    throw new Error('AccordionPanel must be rendered inside DashboardAccordionProvider');
  }

  const isOpen = context.openPanelIds.has(id);
  const [hasBeenOpened, setHasBeenOpened] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setHasBeenOpened(true);
  }, [isOpen]);

  const triggerId = `${id}-accordion-trigger`;
  const contentId = `${id}-accordion-content`;

  return (
    <section className="space-y-2">
      <div className="flex min-h-10 items-center gap-2 rounded-md border border-slate-700/70 bg-slate-900/70 px-3">
        <button
          id={triggerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => context.togglePanel(id)}
          className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-3 text-left text-xs font-semibold text-slate-200 transition-colors hover:text-white"
        >
          <span className="min-w-0 truncate">{title}</span>
          {!isOpen && summary && (
            <span className="max-w-[52%] truncate rounded bg-slate-800/70 px-2 py-1 text-[10px] font-normal text-slate-400">
              {summary}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
        {action}
      </div>
      {(isOpen || hasBeenOpened) && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          hidden={!isOpen}
          className="space-y-2 dashboard-accordion-enter"
        >
          {children}
        </div>
      )}
    </section>
  );
};