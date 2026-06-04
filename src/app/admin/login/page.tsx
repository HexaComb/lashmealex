import Link from 'next/link';
import { redirect } from 'next/navigation';

import { loginAction } from '../auth-actions';
import { isAdminAuthenticated } from '@/lib/admin-auth';

interface AdminLoginPageProps {
  searchParams?: Promise<{
    error?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const authenticated = await isAdminAuthenticated();

  if (authenticated) {
    redirect('/admin');
  }

  const resolvedSearchParams = await searchParams;
  const authConfigured = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);

  return (
    <div className="min-h-screen bg-background px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-xl border border-foreground bg-white p-10 sm:p-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Owner Access</p>
        <h1 className="mt-6 font-display text-5xl tracking-tighter text-foreground">Admin Login</h1>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Use the owner password to manage variant inventory, feature flags, and order status from
          this Vercel-hosted admin route.
        </p>

        {!authConfigured && (
          <div className="mt-8 border border-foreground bg-[#faf2ee] p-5 text-sm text-foreground">
            Set <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> before using the
            admin dashboard.
          </div>
        )}

        {resolvedSearchParams?.error === 'invalid' && (
          <div className="mt-8 border border-foreground bg-[#faf2ee] p-5 text-sm text-foreground">
            The supplied password did not match the configured admin credentials.
          </div>
        )}

        <form action={loginAction} className="mt-10 space-y-6">
          <label className="block space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">
              Password
            </span>
            <input
              type="password"
              name="password"
              required
              suppressHydrationWarning
              className="w-full border border-foreground bg-transparent px-4 py-4 text-sm text-foreground outline-none"
            />
          </label>

          <button type="submit" disabled={!authConfigured} className="btn-primary w-full disabled:opacity-40">
            Sign In
          </button>
        </form>

        <div className="mt-10 border-t border-line pt-6">
          <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
            Return to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
