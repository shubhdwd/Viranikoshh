import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react';
import { Popover } from './ui/Popover';
import { formatDuration } from '../utils/format';
import { cn } from '../utils/cn';

interface AudioPlayerProps {
  /** Real source when available (recordings the user just captured). */
  src?: string | undefined;
  durationSec: number;
  seed?: string;
  label?: string;
  className?: string;
  tone?: 'light' | 'dark';
}

const BARS = 32;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function waveform(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 100003;
  return Array.from({ length: BARS }, (_, i) => {
    h = (h * 1103515245 + 12345) % 2147483648;
    const base = h / 2147483648 * 0.75 + 0.18;
    const envelope = 0.55 + 0.45 * Math.sin(i / BARS * Math.PI);
    return Math.min(1, base * envelope + 0.12);
  });
}

export function AudioPlayer({ src, durationSec, seed = 'vk', label, className, tone = 'light' }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [rate, setRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bars = useMemo(() => waveform(seed), [seed]);
  const total = durationSec || 1;
  const dark = tone === 'dark';

  useEffect(() => {
    if (src || !playing) return;
    const id = window.setInterval(() => {
      setPosition((p) => {
        const next = p + 0.25 * rate;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, src, total, rate]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  const toggle = () => {
    if (src && audioRef.current) {
      if (playing) audioRef.current.pause();else
      void audioRef.current.play();
      setPlaying(!playing);
      return;
    }
    if (position >= total) setPosition(0);
    setPlaying((p) => !p);
  };

  const restart = () => {
    setPosition(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const seek = (ratio: number) => {
    const next = Math.max(0, Math.min(1, ratio)) * total;
    setPosition(next);
    if (audioRef.current) audioRef.current.currentTime = next;
  };

  const progress = Math.min(1, position / total);

  const iconButton = cn(
    'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-firm',
    dark ? 'text-cream/70 hover:bg-cream/10 hover:text-cream' : 'text-charcoal-muted hover:bg-sand-lighter hover:text-charcoal'
  );

  return (
    <div
      className={cn(
        'rounded-card border p-2.5 sm:px-3 sm:py-2.5 min-w-0 overflow-hidden',
        dark ? 'border-charcoal bg-charcoal/85 text-cream' : 'border-sand-light bg-paper',
        className
      )}>
      
      {src &&
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
        className="hidden" />

      }

      {label &&
      <p
        className={cn(
          'mb-1.5 sm:mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] truncate',
          dark ? 'text-cream/60' : 'text-charcoal-soft'
        )}>
        
          {label}
        </p>
      }

      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause recording' : 'Play recording'}
          className={cn(
            'flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-150 ease-firm active:scale-95',
            dark ? 'bg-cream text-charcoal' : 'bg-terracotta text-paper'
          )}>
          
          {playing ? <PauseIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <PlayIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 translate-x-[1px]" />}
        </button>

        <button
          type="button"
          aria-label="Seek within recording"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
          className="flex h-7 sm:h-8 min-w-0 flex-1 items-end gap-[1px] sm:gap-[2px] overflow-hidden">
          
          {bars.map((height, i) => {
            const active = i / BARS <= progress;
            return (
              <span
                key={i}
                style={{ height: `${Math.round(height * 100)}%` }}
                className={cn(
                  'flex-1 min-w-[2px] rounded-full transition-colors duration-150 ease-firm',
                  active ? dark ? 'bg-clay' : 'bg-terracotta' : dark ? 'bg-cream/25' : 'bg-sand-light'
                )} />);


          })}
        </button>

        <span
          className={cn(
            'shrink-0 whitespace-nowrap font-mono text-[10px] sm:text-[11px] tabular-nums',
            dark ? 'text-cream/70' : 'text-charcoal-muted'
          )}>
          
          {formatDuration(position)}
          <span className={dark ? 'text-cream/40' : 'text-charcoal-soft'}> / {formatDuration(total)}</span>
        </span>

        <button type="button" onClick={restart} aria-label="Restart recording" className={iconButton}>
          <RotateCcwIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </button>

        <Popover
          label="Playback speed"
          trigger={(open) =>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 sm:px-2 sm:py-1 font-mono text-[10px] sm:text-[11px] tabular-nums transition-colors duration-150 ease-firm shrink-0',
              dark ?
              'border-cream/25 text-cream/80 hover:border-cream/50' :
              'border-sand-light text-charcoal-muted hover:border-charcoal-soft hover:text-charcoal',
              open && (dark ? 'border-cream/60 text-cream' : 'border-charcoal-soft text-charcoal')
            )}>
            
              {rate}×
              <ChevronDownIcon
              className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-150 ease-firm', open && 'rotate-180')}
              aria-hidden="true" />
            
            </span>
          }>
          
          {(close) =>
          <ul>
              {SPEEDS.map((speed) =>
            <li key={speed}>
                  <button
                type="button"
                role="menuitemradio"
                aria-checked={rate === speed}
                onClick={() => {
                  setRate(speed);
                  close();
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors duration-150 ease-firm',
                  rate === speed ? 'bg-sand-lighter text-charcoal' : 'text-charcoal-muted hover:bg-sand-lighter hover:text-charcoal'
                )}>
                
                    <span className="font-mono tabular-nums">{speed}×</span>
                    {rate === speed && <CheckIcon className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />}
                  </button>
                </li>
            )}
            </ul>
          }
        </Popover>
      </div>
    </div>);

}