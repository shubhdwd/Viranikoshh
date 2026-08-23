import * as React from 'react';
import { cn } from '../utils/cn';
interface InterviewQuestionCardProps {
  index: number;
  total: number;
  question: string;
  answered?: boolean;
  children?: React.ReactNode;
  className?: string;
}
export function InterviewQuestionCard({
  index,
  total,
  question,
  answered,
  children,
  className
}: InterviewQuestionCardProps) {
  return <section aria-label={`Question ${index + 1} of ${total}`} className={cn('rounded-card border border-sand-light bg-paper p-5 sm:p-8', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal-soft">
          Question {index + 1} of {total} suggested
        </p>
        {answered && <span className="shrink-0 text-[11px] font-medium text-verified">Answer recorded</span>}
      </div>

      <h2 className="mt-3 font-display text-[20px] font-semibold leading-[1.35] text-charcoal sm:mt-4 sm:text-[26px]">
        {question}
      </h2>

      {children && <div className="mt-5 border-t border-sand-lighter pt-5 sm:mt-6 sm:pt-6">{children}</div>}
    </section>;
}
