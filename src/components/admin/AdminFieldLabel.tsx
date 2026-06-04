import type { ReactNode } from 'react';

interface AdminFieldLabelProps {
  children: ReactNode;
  hint?: string;
}

export default function AdminFieldLabel({ children, hint }: AdminFieldLabelProps) {
  return (
    <span className="block space-y-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">{children}</span>
      {hint ? <span className="block text-[10px] font-normal normal-case tracking-normal text-muted/80">{hint}</span> : null}
    </span>
  );
}
