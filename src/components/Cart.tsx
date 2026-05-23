'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, LogOut, AlertCircle } from 'lucide-react';
import { LoadingButton } from './LoadingStates';
import { useCart } from '@/context/CartContext';
import { createCheckoutSessionAction } from '@/app/cart/actions';
import { analytics } from '@/lib/analytics';
import { motionPanel } from '@/lib/motion';

export default function Cart() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    identity,
    signOutCart,
    cartError,
    subtotal,
    clearError,
    cartId,
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!cartId) {
      setCheckoutError("Please add items to your bag before checking out.");
      return;
    }
    setCheckoutError(null);
    setIsCheckingOut(true);
    try {
      analytics.checkoutInitiated(subtotal, items.length);
      const result = await createCheckoutSessionAction(cartId);
      if (result.ok) {
        window.location.href = result.url;
      } else {
        setCheckoutError(result.error);
        setIsCheckingOut(false);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setCheckoutError("Something went wrong. Please try again.");
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-modal-backdrop bg-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />

          {/* Cart Sidebar */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md z-modal bg-white border-l border-foreground"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={motionPanel}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-8 border-b border-foreground">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-foreground">
                    Your Bag ({items.length})
                  </h2>
                </div>
                <button
                  onClick={closeCart}
                  className="focus-ring p-2 text-foreground transition-colors hover:text-pink-dark"
                  aria-label="Close cart"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Identity Block */}
              {identity && (
                <div className="bg-[#faf9f7] border-b border-line px-8 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Shopping as</p>
                    <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{identity.name}</p>
                  </div>
                  <button
                    onClick={signOutCart}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-pink-dark transition-colors"
                  >
                    Not you? <LogOut size={12} />
                  </button>
                </div>
              )}

              {/* Error Display */}
              <AnimatePresence>
                {(cartError || checkoutError) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-50 border-b border-red-200 px-8 py-3 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2 text-red-700">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <p className="text-xs leading-relaxed">{cartError ?? checkoutError}</p>
                      </div>
                      <button
                        onClick={() => { clearError(); setCheckoutError(null); }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-8">
                {items.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag size={48} className="mx-auto mb-6 text-muted/30" />
                    <h3 className="mb-4 font-display text-3xl font-medium text-foreground">Your bag is empty</h3>
                    <p className="text-muted mb-10 text-sm">Discover our collection and start your beauty journey.</p>
                    <button
                      onClick={closeCart}
                      className="btn-primary w-full"
                    >
                      Browse the Shop
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        className="space-y-4 border-b border-line pb-8 last:border-0"
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center bg-[#f4f4f4]">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-center text-[10px] font-bold uppercase tracking-widest text-muted px-2">
                                {item.name.slice(0, 12)}
                              </span>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h4 className="font-display text-lg font-medium leading-tight text-foreground">
                                {item.name}
                              </h4>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{item.category}</p>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <span className="text-sm font-bold text-foreground">
                                ${(item.price / 100).toFixed(2)}
                              </span>

                              {/* Quantity Controls */}
                              <div className="flex items-center border border-foreground">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="focus-ring flex h-8 w-8 items-center justify-center bg-white text-foreground transition-colors hover:bg-foreground hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-foreground">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="focus-ring flex h-8 w-8 items-center justify-center bg-white text-foreground transition-colors hover:bg-foreground hover:text-white"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="focus-ring p-1 text-muted transition-colors hover:text-foreground self-start"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-foreground p-8 space-y-8 bg-background">
                  {/* Order Summary */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted">Subtotal</span>
                      <span className="text-foreground">${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted">Pickup</span>
                      <span className="text-foreground">Free</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-4 border-t border-line">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">${(subtotal / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <div className="space-y-4">
                    <LoadingButton
                      isLoading={isCheckingOut}
                      className="w-full btn-primary py-5"
                      onClick={handleCheckout}
                    >
                      Checkout Now
                    </LoadingButton>

                    <button
                      onClick={closeCart}
                      className="w-full btn-secondary py-5"
                    >
                      Continue Shopping
                    </button>
                  </div>

                  {/* Pickup Info */}
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Fresno Salon Pickup</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted/60">Ready in 2-4 Hours</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

