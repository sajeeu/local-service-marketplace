import { cn } from '@/lib/utils';

interface PageBackgroundProps {
  className?: string;
  withGrid?: boolean;
}

export function PageBackground({ className, withGrid = false }: PageBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(199_89%_90%)_0%,_transparent_55%),linear-gradient(180deg,_hsl(40_33%_98%)_0%,_hsl(200_20%_96%)_100%)]" />
      {withGrid ? (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(200_16%_88%/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(200_16%_88%/0.35)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
      ) : null}
    </div>
  );
}
