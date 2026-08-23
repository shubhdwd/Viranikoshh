import * as React from 'react';
import { cn } from '../../utils/cn';
const CONTROL = 'w-full rounded-lg border border-sand-light bg-paper px-3.5 py-2.5 text-[16px] sm:text-sm text-charcoal placeholder:text-charcoal-soft transition-colors duration-150 ease-firm focus:border-terracotta focus:outline-none';
interface FieldProps {
  label: string;
  hint?: string;
  error?: string | undefined;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className
}: FieldProps) {
  return <label className={cn('block', className)}>
      <span className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-charcoal">
          {label}
          {required && <span className="text-terracotta"> *</span>}
        </span>
        {hint && <span className="text-[11px] text-charcoal-soft">{hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1.5 block text-[12px] text-flagged">{error}</span>}
    </label>;
}
export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function TextInput({
  className,
  type = 'text',
  ...rest
}, ref) {
  return <input ref={ref} type={type} className={cn(CONTROL, className)} {...rest} />;
});
export function TextArea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'resize-y min-h-[96px]', className)} {...rest} />;
}
export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, 'appearance-none pr-9 bg-paper', className)} {...rest}>
      {children}
    </select>;
}
