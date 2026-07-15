import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-md border px-4 py-3 text-sm [&_svg]:absolute [&_svg]:left-4 [&_svg]:top-3.5 [&_svg]:size-4 [&_svg+div]:translate-y-[-1px] [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-foreground',
        destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
        success: 'border-accent/30 bg-accent/5 text-accent',
        warning: 'border-warning/30 bg-warning/10 text-foreground',
        info: 'border-primary/30 bg-primary/5 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const icons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  hideIcon?: boolean;
}

export function Alert({
  className,
  variant = 'default',
  hideIcon,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[variant ?? 'default'];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {!hideIcon ? <Icon aria-hidden /> : null}
      <div>{children}</div>
    </div>
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}
