'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';

import { motionEaseOut } from '@/lib/motion';

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden border border-line bg-white">
      <div className="aspect-square bg-gradient-to-br from-rose-gold-light to-background skeleton" />
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          <div className="h-3 w-1/3 rounded-full skeleton" />
          <div className="h-5 w-3/4 rounded skeleton" />
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-2/3 rounded skeleton" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-line">
          <div className="h-5 w-16 rounded skeleton" />
          <div className="h-8 w-24 rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}

// Page Loading Skeleton
export function PageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-sticky h-16 border-b border-line bg-white/70 skeleton" />
      
      {/* Hero Section Skeleton */}
      <div className="p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-3 w-1/4 rounded-full skeleton" />
              <div className="h-12 w-3/4 rounded skeleton lg:h-20" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded skeleton" />
                <div className="h-4 w-5/6 rounded skeleton" />
                <div className="h-4 w-4/6 rounded skeleton" />
              </div>
              <div className="flex gap-4">
                <div className="h-12 w-32 rounded-full skeleton" />
                <div className="h-12 w-32 rounded-full skeleton" />
              </div>
            </div>
            <div className="h-96 border border-line bg-white p-8 skeleton" />
          </div>
        </div>
      </div>
      
      {/* Product Grid Skeleton */}
      <div className="p-6 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="h-3 w-1/5 rounded-full skeleton" />
            <div className="h-8 w-1/2 rounded skeleton lg:h-12" />
            <div className="h-4 w-3/4 rounded skeleton" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Button Loading State
interface LoadingButtonProps {
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function LoadingButton({ 
  isLoading = false, 
  children, 
  className,
  disabled = false,
  onClick
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// Toast Notification
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible?: boolean;
  onClose?: () => void;
}

export function Toast({ message, type = 'success', isVisible = false, onClose }: ToastProps) {
  const typeStyles = {
    success: 'border border-foreground bg-foreground text-background',
    error: 'border border-pink-dark bg-pink-dark text-white',
    info: 'border border-line bg-surface text-foreground',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={clsx(
            'fixed bottom-4 right-4 z-toast border px-6 py-3 shadow-soft',
            'flex items-center gap-3 max-w-sm',
            typeStyles[type]
          )}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={motionEaseOut}
        >
          <span className="flex-1 text-sm">{message}</span>
          <button
            onClick={onClose}
            className="focus-ring p-1 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Close notification"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 0.25, className }: AnimatedCounterProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...motionEaseOut, duration }}
    >
      {value}
    </motion.span>
  );
}

// Hover Card with Micro-interactions
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
}

export function HoverCard({ children, className, hoverScale = 1.02 }: HoverCardProps) {
  return (
    <motion.div
      className={clsx('transition-all duration-300', className)}
      whileHover={{ 
        scale: hoverScale,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// Fade In Animation Component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  direction = 'up',
  className 
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 20 };
      case 'down': return { y: -20 };
      case 'left': return { x: 20 };
      case 'right': return { x: -20 };
      default: return { y: 20 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration, 
        delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}
