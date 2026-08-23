
import { AlertTriangleIcon, CheckIcon, Loader2Icon, RotateCcwIcon, ShieldCheckIcon } from 'lucide-react';
import { AI_PIPELINE, AI_STAGE_COPY, type AIStage } from '../types/ai';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';
interface AIProcessingStatusProps {
  stage: AIStage;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}
export function AIProcessingStatus({
  stage,
  onRetry,
  compact,
  className
}: AIProcessingStatusProps) {
  const failed = stage === 'FAILED';
  const activeIndex = failed ? -1 : AI_PIPELINE.indexOf(stage as Exclude<AIStage, 'FAILED'>);
  if (compact) {
    return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium', failed ? 'bg-flagged-soft text-flagged border-flagged/25' : stage === 'COMPLETED' ? 'bg-ai-soft text-ai border-ai-border' : 'bg-ai-soft text-ai border-ai-border', className)}>
        {failed ? <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" /> : stage === 'COMPLETED' ? <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        AI · {AI_STAGE_COPY[stage].label}
      </span>;
  }
  return <section aria-live="polite" className={cn('rounded-card border border-ai-border bg-ai-soft/60 p-5', className)}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ai">AI enrichment</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-charcoal">
            {failed ? 'Enrichment did not finish' : AI_STAGE_COPY[stage].label}
          </h3>
          <p className="mt-1 text-sm text-charcoal-muted">{AI_STAGE_COPY[stage].detail}</p>
        </div>
        {failed && onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>
            <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
            Retry processing
          </Button>}
      </header>

      <ol className="mt-5 space-y-2.5">
        {AI_PIPELINE.filter((s) => s !== 'COMPLETED').map((s, index) => {
        const done = !failed && activeIndex > index;
        const current = !failed && activeIndex === index;
        const stalled = failed && index >= AI_PIPELINE.length - 2;
        return <li key={s} className="flex items-center gap-3">
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold', done && 'bg-ai text-paper border-ai', current && 'border-ai text-ai bg-paper', !done && !current && 'border-sand-light text-charcoal-soft bg-paper')}>
                {done ? <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" /> : current ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn('text-sm', done && 'text-charcoal', current && 'text-charcoal font-medium', !done && !current && 'text-charcoal-soft', stalled && 'text-charcoal-soft line-through')}>
                {AI_STAGE_COPY[s].label}
              </span>
            </li>;
      })}
      </ol>

      <p className="mt-5 flex items-center gap-2 border-t border-ai-border pt-4 text-[13px] text-charcoal-muted">
        <ShieldCheckIcon className="h-4 w-4 text-verified shrink-0" aria-hidden="true" />
        Your original recording is saved and safe. AI never overwrites the source.
      </p>
    </section>;
}
