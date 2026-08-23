import { useEffect } from 'react';
import { AlertTriangleIcon, CircleIcon, MicIcon, RotateCcwIcon, SquareIcon } from 'lucide-react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { AudioPlayer } from './AudioPlayer';
import { Button } from './ui/Button';
import { formatDuration } from '../utils/format';
import { cn } from '../utils/cn';
interface VoiceRecorderProps {
  onChange: (result: {
    audioUrl: string | null;
    durationSec: number;
  }) => void;
  hint?: string;
  className?: string;
}
export function VoiceRecorder({
  onChange,
  hint,
  className
}: VoiceRecorderProps) {
  const {
    state,
    elapsed,
    audioUrl,
    levels,
    error,
    start,
    stop,
    reset
  } = useMediaRecorder();
  useEffect(() => {
    if (state === 'stopped') onChange({
      audioUrl,
      durationSec: elapsed
    });
    if (state === 'idle') onChange({
      audioUrl: null,
      durationSec: 0
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, audioUrl]);
  const recording = state === 'recording';
  const blocked = state === 'denied' || state === 'unsupported';
  return <div className={cn('rounded-card border border-sand-light bg-paper p-5 sm:p-6', className)}>
      {blocked ? <div className="flex items-start gap-3 rounded-lg border border-flagged/20 bg-flagged-soft p-4">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-flagged" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-charcoal">
              {state === 'denied' ? 'Microphone blocked' : 'Recording not supported here'}
            </p>
            <p className="mt-1 text-[13px] text-charcoal-muted">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={reset}>
              <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        </div> : state === 'stopped' && audioUrl ? <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
            Your recording · preserved as the source
          </p>
          <AudioPlayer src={audioUrl} durationSec={elapsed} seed="live" className="mt-3 border-0 p-0" />
          <Button variant="secondary" size="sm" className="mt-4" onClick={reset}>
            <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
            Record again
          </Button>
        </div> : <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-full items-end justify-center gap-[3px]" aria-hidden="true">
            {levels.map((level, i) => <span key={i} style={{
          height: `${Math.round(level * 100)}%`
        }} className={cn('w-[3px] rounded-full transition-[height] duration-100 ease-linear', recording ? 'bg-terracotta' : 'bg-sand-light')} />)}
          </div>

          <p className="mt-4 font-mono text-2xl text-charcoal">{formatDuration(elapsed)}</p>
          <p className="mt-1 text-[13px] text-charcoal-muted">
            {recording ? 'Recording — speak in your own language, at your own pace.' : hint ?? 'Ready when you are.'}
          </p>

          <div className="mt-5">
            {recording ? <button type="button" onClick={stop} className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal text-cream transition-transform duration-150 ease-firm active:scale-95" aria-label="Stop recording">
                <SquareIcon className="h-6 w-6 fill-cream" />
              </button> : <button type="button" onClick={start} disabled={state === 'requesting'} className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta text-paper transition-transform duration-150 ease-firm active:scale-95 disabled:opacity-60" aria-label="Start recording">
                {state === 'requesting' ? <CircleIcon className="h-6 w-6 animate-pulse" /> : <MicIcon className="h-7 w-7" />}
              </button>}
          </div>

          <p className="mt-4 text-[12px] text-charcoal-soft">
            Nothing is uploaded until you submit. The original audio is never replaced by AI output.
          </p>
        </div>}
    </div>;
}