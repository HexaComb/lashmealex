'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { analytics } from '@/lib/analytics';
import { formatPhoneNumber } from '@/lib/cart-constants';

export default function CartStartModal() {
  const { isModalOpen, closeStartModal, startCart, resolveConflict, conflict, cartError, clearError } = useCart();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      clearError();
    }
  }, [isModalOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await startCart({ email, phone, name });
    if ('ok' in result && result.ok) {
      analytics.cartIdentitySubmitted(name, email, phone);
    }
    setSubmitting(false);
  };

  const handleResolve = async (intent: 'resume' | 'replace') => {
    setSubmitting(true);
    await resolveConflict(intent);
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center bg-foreground/50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeStartModal}
        >
          <motion.div
            className="w-full max-w-md border border-foreground bg-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-foreground px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark">
                  {conflict ? 'Welcome Back' : 'Start Your Cart'}
                </p>
                <h2 className="mt-1 font-display text-2xl tracking-tighter text-foreground">
                  {conflict ? 'Cart Found' : 'Your Details'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeStartModal}
                className="focus-ring p-2 text-muted transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {conflict ? (
              <div className="space-y-5 p-6">
                <p className="text-sm leading-relaxed text-foreground">
                  Welcome back, <span className="font-semibold">{conflict.name}</span>! You already
                  have a cart with{' '}
                  <span className="font-semibold">{conflict.itemCount}</span>{' '}
                  item{conflict.itemCount === 1 ? '' : 's'}.
                </p>
                <p className="text-xs text-muted">
                  What would you like to do?
                </p>

                {cartError && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{cartError}</div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResolve('resume')}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    Resume Previous Cart
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResolve('replace')}
                    className="w-full border border-foreground px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-white disabled:opacity-50"
                  >
                    Start Over
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed text-muted">
                  <span className="font-semibold">Resume</span> adds anything you just picked to your old cart.{' '}
                  <span className="font-semibold">Start Over</span> clears your old cart and uses only what you just picked.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <p className="text-xs leading-relaxed text-muted">
                  Enter your details to start your cart. We&apos;ll remember you so you can come back and pick up where you left off.
                </p>

                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Name *</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Email *</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Phone *</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    required
                    placeholder="(555) 555-5555"
                    className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/40 focus:border-pink-dark"
                  />
                </label>

                {cartError && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{cartError}</div>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                  {submitting ? 'Starting…' : 'Start Cart'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
