import * as React from 'react';
import { cn } from '../../utils/cn';

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  level?: 1 | 2 | 3;
  /** Adds one thin hairline beneath the heading block where separation helps. */
  divider?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  action,
  level = 2,
  divider,
  className
}: SectionHeadingProps) {
  const Tag = `h${level}` as unknown as keyof JSX.IntrinsicElements;
  return (
    <div className={cn(divider && 'border-b border-sand-lighter pb-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <Tag
            className={cn(
              'font-display text-charcoal',
              level === 1 ? 'text-xl font-semibold sm:text-2xl lg:text-[28px]' : 'text-base font-semibold sm:text-lg'
            )}>
            
            {title}
          </Tag>
          {description && <p className="mt-1.5 max-w-prose text-[13px] text-charcoal-muted sm:text-sm">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>);

}
