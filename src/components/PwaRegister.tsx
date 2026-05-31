'use client';

import { useEffect } from 'react';

// Enregistre le service worker pour rendre la PWA installable.
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
