import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const toneClasses: Record<Tone, string> = {
  neutral: 'border-line bg-background text-muted',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-600',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  accent: 'border-pink-200 bg-pink-50 text-pink-dark',
};

const buttonToneClasses: Record<ButtonTone, string> = {
  primary: 'admin-btn admin-btn--primary',
  secondary: 'admin-btn admin-btn--secondary',
  ghost: 'admin-btn admin-btn--ghost',
  danger: 'admin-btn admin-btn--danger',
  warning: 'admin-btn admin-btn--warning',
};

export function AdminPageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl space-y-10 px-6 py-8 sm:px-12 lg:px-20">{children}</div>;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-foreground pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-pink-dark">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function AdminSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('border border-foreground bg-white', className)}>
      <div className="flex flex-col gap-3 border-b border-foreground px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-pink-dark">{eyebrow}</p> : null}
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Groups one admin workflow into a native, keyboard-accessible disclosure.
 * This keeps the Operations page scannable without hiding related controls on separate routes.
 *
 * @param id - Stable fragment target used by admin navigation links.
 * @param title - Visible operation name shown in the disclosure summary.
 * @param description - Short explanation of the workflow contained in the group.
 * @param summary - Optional compact status or count displayed beside the disclosure icon.
 * @param defaultOpen - Whether the group is expanded on initial render.
 * @param children - Existing admin sections and controls owned by this workflow.
 * @return A semantic details/summary disclosure containing the supplied workflow UI.
 * @throws This component does not throw intentionally.
 */
export function AdminOperationGroup({
  id,
  title,
  description,
  summary,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  description: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} open={defaultOpen} className="group scroll-mt-24 border border-foreground bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 transition-colors hover:bg-surface-hover focus-ring [&::-webkit-details-marker]:hidden sm:px-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {summary ? <span className="hidden text-xs text-muted sm:inline">{summary}</span> : null}
          <ChevronDown
            aria-hidden="true"
            className="h-5 w-5 text-muted transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
          />
        </div>
      </summary>
      <div className="space-y-6 border-t border-foreground bg-background p-4 sm:p-6">{children}</div>
    </details>
  );
}

export function AdminStat({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {detail ? <p className="mt-1 text-[11px] leading-relaxed text-muted">{detail}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block border border-foreground bg-white p-5 transition-colors hover:bg-surface-hover">
        {content}
      </Link>
    );
  }

  return <div className="border border-foreground bg-white p-5">{content}</div>;
}

export function AdminActionLink({
  href,
  children,
  tone = 'secondary',
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: ButtonTone;
  className?: string;
}) {
  return (
    <Link href={href} className={cx(buttonToneClasses[tone], 'focus-ring', className)}>
      {children}
    </Link>
  );
}

export function AdminButton({
  children,
  tone = 'secondary',
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { tone?: ButtonTone }) {
  return (
    <button
      className={cx(
        buttonToneClasses[tone],
        'focus-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminStatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cx('inline-flex border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]', toneClasses[tone])}>
      {children}
    </span>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-foreground bg-white px-8 py-14 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function AdminTableWrap({ children, minWidth }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto border border-foreground bg-white">
      <div className={cx('w-full', minWidth)}>{children}</div>
    </div>
  );
}

export function adminInputClass(extra?: string) {
  return cx(
    'w-full border border-foreground bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/45 focus:border-pink-dark focus-ring',
    extra,
  );
}

export function adminSmallInputClass(extra?: string) {
  return cx(
    'w-full min-w-0 border border-foreground bg-white px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-pink-dark focus-ring',
    extra,
  );
}

export function adminFileInputClass(extra?: string) {
  return cx(
    'w-full cursor-pointer border border-foreground bg-white px-3 py-2 text-xs text-muted outline-none file:mr-3 file:cursor-pointer file:border file:border-foreground file:bg-foreground file:px-3 file:py-1.5 file:text-[9px] file:font-bold file:uppercase file:tracking-[0.12em] file:text-[#faf9f6] hover:file:bg-pink-dark focus:border-pink-dark focus-ring',
    extra,
  );
}
