'use client';

import type { ReactNode } from 'react';

interface ConfirmSubmitButtonProps {
  message: string;
  children: ReactNode;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}

/**
 * Submit button that asks for confirmation before posting a destructive server action.
 */
export default function ConfirmSubmitButton({
  message,
  children,
  className,
  formAction,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      formAction={formAction}
      className={[className, 'focus-ring'].filter(Boolean).join(' ')}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
