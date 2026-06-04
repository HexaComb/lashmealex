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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'accepted') setStatus('accepted');
    else if (saved === 'declined') setStatus('declined');
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setStatus('accepted');
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setStatus('declined');
  }, []);

  return <ConsentContext.Provider value={{ status, accept, decline }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
