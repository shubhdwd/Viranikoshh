import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { formatDuration } from '../utils/format';
import { CulturalImage } from './ui/CulturalImage';
import { cn } from '../utils/cn';
interface VideoPlayerProps {
  posterUrl: string;
  src?: string | undefined;
  /**
   * Only set when the length is genuinely known (demo fixtures). For real
   * uploads it stays undefined until the element reports its own duration —
   * a timeline is never shown for a length nobody measured.
   */
  durationSec?: number | undefined;
  altText: string;
  className?: string;
}
export function VideoPlayer({
  posterUrl,
  src,
  durationSec,
  altText,
  className
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [position, setPosition] = useState(0);
  const [loadedDuration, setLoadedDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Real metadata wins; a supplied duration is only a fixture stand-in.
  const total = loadedDuration ?? (durationSec && durationSec > 0 ? durationSec : null);
  const scrubbable = total !== null;

  useEffect(() => {
    // Without a real source there is nothing to play — only fixtures with a
    // declared duration animate, and only while "playing".
    if (src || !playing || total === null) return;
    const id = window.setInterval(() => {
      setPosition((p) => {
        if (p + 0.25 >= total) {
          setPlaying(false);
          return total;
        }
        return p + 0.25;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, src, total]);

  const toggle = () => {
    if (src && videoRef.current) {
      if (playing) videoRef.current.pause();else void videoRef.current.play();
    }
    if (total !== null && position >= total) setPosition(0);
    setPlaying((p) => !p);
  };
  const progress = total === null ? 0 : Math.min(100, position / total * 100);
  return <div className={cn('relative overflow-hidden bg-charcoal group', className)}>
      {src ? <video ref={videoRef} src={src} poster={posterUrl} muted={muted} playsInline onLoadedMetadata={(e) => {
      const value = e.currentTarget.duration;
      if (Number.isFinite(value) && value > 0) setLoadedDuration(value);
    }} onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)} onEnded={() => setPlaying(false)} className="h-full w-full object-cover" /> : <CulturalImage src={posterUrl} alt={altText} className="h-full w-full object-cover" />}

      {/* Nothing to play without a source or a declared length. */}
      {(src || scrubbable) && <button type="button" onClick={toggle} aria-label={playing ? 'Pause video' : 'Play video'} className="absolute inset-0 flex items-center justify-center">
          <span className={cn('flex h-14 w-14 items-center justify-center rounded-full bg-charcoal/70 text-cream backdrop-blur-sm transition-[opacity,transform] duration-150 ease-firm', playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100')}>
            {playing ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6 translate-x-[2px]" />}
          </span>
        </button>}

      {scrubbable && <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-charcoal/70 px-3 py-2 backdrop-blur-sm">
          <span className="font-mono text-[11px] text-cream/80">{formatDuration(position)}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-cream/25">
            <div className="h-full bg-clay transition-[width] duration-200 ease-linear" style={{
          width: `${progress}%`
        }} />
          </div>
          <span className="font-mono text-[11px] text-cream/60">{formatDuration(total)}</span>
          <button type="button" onClick={() => {
        setMuted((m) => !m);
        if (videoRef.current) videoRef.current.muted = !muted;
      }} aria-label={muted ? 'Unmute' : 'Mute'} className="text-cream/80 transition-colors duration-150 ease-firm hover:text-cream">
            {muted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
          </button>
        </div>}
    </div>;
}
