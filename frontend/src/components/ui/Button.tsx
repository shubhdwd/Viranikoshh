import * as React from 'react';
import { Link } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { cn } from '../../utils/cn';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-terracotta text-paper hover:bg-terracotta-600 active:scale-[0.98]',
  secondary: 'bg-paper text-charcoal border border-sand-light hover:border-charcoal-soft active:scale-[0.98]',
  ghost: 'text-charcoal-muted hover:text-charcoal hover:bg-sand-lighter',
  danger: 'bg-flagged text-paper hover:bg-[#8d2222] active:scale-[0.98]'
};
const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-lg'
};
const BASE = 'inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,transform] duration-150 ease-firm disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}
type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  ...rest
}: ButtonProps) {
  return <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>;
}
type LinkButtonProps = CommonProps & {
  to: string;
};
export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  to
}: LinkButtonProps) {
  return <Link to={to} className={cn(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>;
}
