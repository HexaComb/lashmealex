'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const CONSENT_KEY = 'lashmealex_cookie_consent';
const ANALYTICS_CONSENT_KEY = 'lashmealex_analytics_consent';

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
    const saved = localStorage.getItem(CONSENT_KEY);
    const storedStatus = saved === 'accepted' || saved === 'declined' ? saved : null;
    if (!storedStatus) return;

    const timer = window.setTimeout(() => {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, storedStatus === 'accepted' ? 'granted' : 'denied');
      setStatus(storedStatus);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
    setStatus('accepted');
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'denied');
    setStatus('declined');
  }, []);

  return <ConsentContext.Provider value={{ status, accept, decline }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
