
import { CheckIcon } from 'lucide-react';
import { cn } from '../utils/cn';
interface StepIndicatorProps {
  steps: string[];
  current: number;
  className?: string;
}
export function StepIndicator({
  steps,
  current,
  className
}: StepIndicatorProps) {
  return <ol className={cn('vk-scroll-x flex items-center gap-2 overflow-x-auto', className)} aria-label="Progress">
      {steps.map((step, index) => {
      const done = index < current;
      const active = index === current;
      return <li key={step} className="flex shrink-0 items-center gap-2">
            <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold', done && 'border-terracotta bg-terracotta text-paper', active && 'border-terracotta bg-paper text-terracotta', !done && !active && 'border-sand-light bg-paper text-charcoal-soft')}>
              {done ? <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn('text-[12px] whitespace-nowrap', active ? 'font-medium text-charcoal' : 'text-charcoal-soft')}>
              {step}
            </span>
            {index < steps.length - 1 && <span className="h-px w-6 bg-sand-light" aria-hidden="true" />}
          </li>;
    })}
    </ol>;
}
