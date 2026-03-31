'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    else setDismissed(true);
  };

  return (
    <div className="install-banner" role="banner" aria-label="Install app banner">
      <p className="text-sm font-medium">Install SettleIt for offline use!</p>
      <div className="flex gap-2">
        <button onClick={handleInstall} className="btn btn-sm btn-primary">Install</button>
        <button onClick={() => setDismissed(true)} className="btn btn-sm btn-ghost" aria-label="Dismiss install prompt">✕</button>
      </div>
    </div>
  );
}
