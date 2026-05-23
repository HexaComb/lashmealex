'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, Heart, User, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

import { motionEaseOut } from '@/lib/motion';

interface HeaderProps {
  cartItemCount?: number;
  wishlistItemCount?: number;
  onSearchToggle?: () => void;
  onCartToggle?: () => void;
  isSearchOpen?: boolean;
  isCartOpen?: boolean;
}

const navigationItems = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
];



export default function Header({
  cartItemCount = 0,
  wishlistItemCount = 0,
  onSearchToggle,
  onCartToggle,
  isSearchOpen = false,
  isCartOpen = false,
}: HeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActiveRoute = (href: string) => {
    const [basePath] = href.split('#');

    if (!basePath || basePath === '/') {
      return pathname === '/';
    }

    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 z-sticky transition-all duration-300',
          isScrolled ? 'border-b border-foreground bg-background' : 'bg-background/80 backdrop-blur-sm'
        )}
      >
        <div className="relative mx-auto flex h-16 w-full items-center justify-between px-6 sm:px-12 lg:h-24 lg:px-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="focus-ring p-2 text-foreground transition-colors hover:text-pink-dark lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link href="/" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center bg-foreground text-xs font-bold uppercase tracking-[0.2em] text-white">
                LM
              </div>
              <div className="hidden sm:block">
                <p className="font-display text-3xl leading-none text-foreground tracking-tighter">lashmealex</p>
              </div>
              {/* Blinking eyelash */}
              <div className="flex items-center" aria-hidden="true">
                <svg width="28" height="18" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="eyelash-blink">
                  {/* Lid */}
                  <path d="M2 10 Q14 2 26 10" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  {/* Lashes */}
                  <line x1="5"  y1="8.2"  x2="3.5"  y2="3"   stroke="#121212" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="9"  y1="5.8"  x2="8.5"  y2="0.5" stroke="#121212" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="14" y1="4.5"  x2="14"   y2="0"   stroke="#121212" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="19" y1="5.8"  x2="19.5" y2="0.5" stroke="#121212" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="23" y1="8.2"  x2="24.5" y2="3"   stroke="#121212" strokeWidth="1.2" strokeLinecap="round"/>
                  {/* Lower lid */}
                  <path d="M2 10 Q14 17 26 10" stroke="#121212" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3"/>
                </svg>
              </div>
            </Link>
          </div>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-10 lg:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  'relative text-sm font-bold uppercase tracking-[0.25em] transition-colors hover:text-pink-dark',
                  isActiveRoute(item.href) ? 'text-pink-dark' : 'text-foreground'
                )}
              >
                {item.label}
                {isActiveRoute(item.href) && (
                  <span className="absolute -bottom-2 left-0 h-px w-full bg-pink-dark" aria-hidden="true" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onSearchToggle}
              className={clsx(
                'focus-ring p-2 text-foreground transition-colors hover:text-pink-dark',
                isSearchOpen && 'text-pink-dark'
              )}
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            <button className="relative p-2 text-foreground transition-colors hover:text-pink-dark focus-ring">
              <Heart size={19} />
              {wishlistItemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-foreground text-[9px] font-bold text-white">
                  {wishlistItemCount}
                </span>
              )}
            </button>

            <button
              onClick={onCartToggle}
              className={clsx(
                'relative p-2 text-foreground transition-colors hover:text-pink-dark focus-ring',
                isCartOpen && 'text-pink-dark'
              )}
              aria-label="Shopping cart"
            >
              <ShoppingBag size={19} />
              {cartItemCount > 0 && (
                <motion.span
                  className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-foreground text-[9px] font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={motionEaseOut}
                >
                  {cartItemCount}
                </motion.span>
              )}
            </button>

            <button className="hidden p-2 text-foreground transition-colors hover:text-pink-dark focus-ring sm:flex">
              <User size={19} />
            </button>

            <a
              href="https://lashmealex.glossgenius.com/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 border border-foreground bg-transparent px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-background sm:inline-flex"
            >
              <Calendar size={13} />
              Book
            </a>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="border-t border-foreground bg-background lg:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-6 px-5 py-8 sm:px-7">
                {navigationItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={clsx(
                      'block border px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] transition-colors hover:text-pink-dark',
                      isActiveRoute(item.href)
                        ? 'border-foreground bg-surface-hover text-pink-dark'
                        : 'border-line text-foreground hover:border-foreground'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-line pt-6">
                  <Link href="/shop" className="btn-primary w-full" onClick={() => setIsMenuOpen(false)}>
                    Shop products
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
