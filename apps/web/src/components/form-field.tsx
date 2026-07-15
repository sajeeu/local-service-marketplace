import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  description?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

export function FormField({
  id,
  label,
  children,
  description,
  error,
  className,
  required,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={id}
        className={required ? 'after:ml-0.5 after:text-destructive after:content-["*"]' : undefined}
      >
        {label}
      </Label>
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Aria props to spread onto the control inside FormField. */
export function getFormFieldAria(id: string, error?: string, description?: string) {
  const ids = [description ? `${id}-description` : null, error ? `${id}-error` : null].filter(
    Boolean,
  );

  return {
    id,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': ids.length > 0 ? ids.join(' ') : undefined,
  } as const;
}
