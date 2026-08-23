import * as React from 'react';
import { cn } from '../../utils/cn';
interface CardProps {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'article' | 'section' | 'li';
}
export function Card({
  className,
  children,
  as: Tag = 'div'
}: CardProps) {
  return <Tag className={cn('bg-paper border border-sand-light rounded-card', className)}>{children}</Tag>;
}
