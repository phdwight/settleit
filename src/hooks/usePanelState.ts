'use client';

import { useState, useEffect, useCallback } from 'react';

export type PanelKey = 'participants' | 'expense' | 'summary' | 'expenses';
type PanelState = Record<PanelKey, boolean>;

const DEFAULT_PANELS: PanelState = { participants: true, expense: false, summary: false, expenses: false };
const STORAGE_KEY = 'settleit-panels';

function loadPanels(eventId: string): PanelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[eventId]) return { ...DEFAULT_PANELS, ...parsed[eventId] };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PANELS };
}

function savePanels(eventId: string, panels: PanelState) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[eventId] = panels;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function usePanelState(eventId: string | null) {
  const [panels, setPanels] = useState<PanelState>(DEFAULT_PANELS);

  useEffect(() => {
    if (eventId) {
      setPanels(loadPanels(eventId));
    }
  }, [eventId]);

  const toggle = useCallback((key: PanelKey) => (open: boolean) => {
    setPanels(prev => {
      const next = { ...prev, [key]: open };
      if (eventId) savePanels(eventId, next);
      return next;
    });
  }, [eventId]);

  return { panels, toggle };
}
