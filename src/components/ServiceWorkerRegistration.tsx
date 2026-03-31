'use client';

import { useEffect } from 'react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {
        // SW registration failed - app still works, just no offline support
      });
    }
  }, []);
  return null;
}
