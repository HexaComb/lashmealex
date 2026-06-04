'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useConsent } from '@/context/ConsentContext';

export default function CookieBanner() {
  const { status, accept, decline } = useConsent();

  return (
    <AnimatePresence>
      {status === 'pending' && (
        <motion.div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-modal border-t border-foreground bg-white px-6 py-5 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm sm:border"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark mb-2">
            Privacy Notice
          </p>
          <p className="text-xs leading-relaxed text-muted mb-5">
            We use privacy-conscious analytics to understand how visitors use our site.
            No cross-site tracking or advertising cookies are used.
          </p>
          <div className="flex gap-3">
            <button
              onClick={accept}
              className="flex-1 border border-foreground bg-foreground px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-pink-dark hover:border-pink-dark"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="flex-1 border border-foreground px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground transition-colors hover:bg-foreground hover:text-white"
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
