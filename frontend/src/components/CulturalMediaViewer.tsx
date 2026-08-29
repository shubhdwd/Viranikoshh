
import { MicOffIcon, QuoteIcon } from 'lucide-react';
import type { MediaAsset } from '../types/culture';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import { CulturalImage } from './ui/CulturalImage';
import { cn } from '../utils/cn';
interface CulturalMediaViewerProps {
  media: MediaAsset;
  seed: string;
  /** Text records show their opening lines in the original script. */
  excerpt?: string;
  aspect?: 'feed' | 'detail';
  className?: string;
}
export function CulturalMediaViewer({
  media,
  seed,
  excerpt,
  aspect = 'feed',
  className
}: CulturalMediaViewerProps) {
  const frame = aspect === 'feed' ? 'aspect-[4/3]' : 'aspect-[16/10]';
  if (media.type === 'video') {
    return <VideoPlayer posterUrl={media.posterUrl} src={media.sourceUrl} durationSec={media.durationSec} altText={media.altText} className={cn(frame, className)} />;
  }
  if (media.type === 'audio') {
    const hasAudio = Boolean(media.sourceUrl);
    return <div className={cn('relative overflow-hidden bg-charcoal', frame, className)}>
        <CulturalImage src={media.posterUrl} alt={media.altText} seed={seed} className="h-full w-full object-cover opacity-55" />
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <AudioPlayer src={media.sourceUrl} durationSec={media.durationSec} seed={seed} tone="dark" label="Original recording" className="backdrop-blur-sm" />
          {!hasAudio && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-cream/60">
              <MicOffIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              No audio file uploaded yet — contributor can add a recording.
            </p>
          )}
        </div>
      </div>;
  }
  if (media.type === 'text') {
    return <div className={cn('relative overflow-hidden vk-texture bg-cream', frame, className)}>
        <CulturalImage src={media.posterUrl} alt="" aria-hidden="true" seed={seed} className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10">
          <QuoteIcon className="h-6 w-6 text-terracotta" aria-hidden="true" />
          <p className="mt-3 font-deva text-lg leading-relaxed text-charcoal line-clamp-5">{excerpt}</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
            Written record · original script
          </p>
        </div>
      </div>;
  }
  return <div className={cn('overflow-hidden bg-sand-lighter', frame, className)}>
      <CulturalImage src={media.posterUrl} alt={media.altText} seed={seed} className="h-full w-full object-cover" />
    </div>;
}
