'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface AdminHeaderProps {
  logoutAction: (formData: FormData) => void;
  productName?: string;
}

export default function AdminHeader({ logoutAction, productName }: AdminHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/admin', active: pathname === '/admin' },
    { label: 'Products', href: '/admin#products', active: pathname.startsWith('/admin/products') },
    { label: 'Orders', href: '/admin#orders', active: false },
    { label: 'Carts', href: '/admin/carts', active: pathname.startsWith('/admin/carts') },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-foreground bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 sm:px-12 lg:px-20">
        <div className="flex items-center gap-3 sm:gap-8">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-muted transition-colors hover:text-foreground sm:hidden"
            aria-label={isMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/admin" className="flex flex-col">
            <p className="text-sm font-semibold leading-none tracking-tight text-foreground">Lashmealex</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.28em] text-pink-dark">Admin</p>
          </Link>

          <div className="hidden items-center gap-7 sm:flex">
            {navItems.map((item) => {
              const isActive = item.active;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-foreground ${
                    isActive ? 'text-foreground underline underline-offset-4' : 'text-muted'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {productName ? (
              <>
                <span className="text-muted">/</span>
                <span className="max-w-[220px] truncate text-[10px] font-bold uppercase tracking-[0.16em] text-foreground">
                  {productName}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-foreground lg:block"
          >
            Storefront
          </Link>
          <form action={logoutAction}>
            <button 
              type="submit" 
              className="border border-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground hover:text-[#faf9f6]"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-white sm:hidden"
          >
            <div className="flex flex-col divide-y divide-line">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-6 py-4 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    item.active ? 'bg-background text-foreground' : 'text-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
              >
                Storefront
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
