'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
  CONSENT_STORAGE_KEY,
  CONSENT_STORAGE_KEY_LEGACY,
} from '@/lib/brand-keys';
import { readAndMigrateStorage, writeStorageAndClearLegacy } from '@/lib/migrate-local-storage';

type ConsentStatus = 'pending' | 'accepted' | 'declined';

interface ConsentContextValue {
  status: ConsentStatus;
  accept: () => void;
  decline: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>('pending');

  useEffect(() => {
    const saved = readAndMigrateStorage(localStorage, CONSENT_STORAGE_KEY, CONSENT_STORAGE_KEY_LEGACY);
    const storedStatus = saved === 'accepted' || saved === 'declined' ? saved : null;
    if (!storedStatus) return;

    const timer = window.setTimeout(() => {
      writeStorageAndClearLegacy(
        localStorage,
        ANALYTICS_CONSENT_STORAGE_KEY,
        ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
        storedStatus === 'accepted' ? 'granted' : 'denied',
      );
      setStatus(storedStatus);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const accept = useCallback(() => {
    writeStorageAndClearLegacy(localStorage, CONSENT_STORAGE_KEY, CONSENT_STORAGE_KEY_LEGACY, 'accepted');
    writeStorageAndClearLegacy(
      localStorage,
      ANALYTICS_CONSENT_STORAGE_KEY,
      ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
      'granted',
    );
    setStatus('accepted');
  }, []);

  const decline = useCallback(() => {
    writeStorageAndClearLegacy(localStorage, CONSENT_STORAGE_KEY, CONSENT_STORAGE_KEY_LEGACY, 'declined');
    writeStorageAndClearLegacy(
      localStorage,
      ANALYTICS_CONSENT_STORAGE_KEY,
      ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
      'denied',
    );
    setStatus('declined');
  }, []);

  return <ConsentContext.Provider value={{ status, accept, decline }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
