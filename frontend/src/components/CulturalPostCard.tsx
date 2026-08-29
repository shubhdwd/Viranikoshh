import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FileTextIcon, MapPinIcon, PlayIcon, Volume2Icon } from 'lucide-react';
import type { CulturalRecord, MediaType } from '../types/culture';
import { CATEGORY_LABELS } from '../types/culture';
import { usePhoneViewport } from '../hooks/useMediaQuery';
import { Avatar } from './ui/Avatar';
import { CulturalImage } from './ui/CulturalImage';
import { Modal } from './ui/Modal';
import { VerificationBadge } from './VerificationBadge';
import { CulturalMediaViewer } from './CulturalMediaViewer';
import { CulturalTags } from './CulturalTags';
import { PostActions } from './PostActions';
import { CommentSection } from './CommentSection';
import { AIProcessingStatus } from './AIProcessingStatus';
import { formatDuration, timeAgo } from '../utils/format';
import { isTimeBased } from '../utils/media';
import { cn } from '../utils/cn';

interface CulturalPostCardProps {
  record: CulturalRecord;
  variant?: 'feed' | 'grid';
  className?: string;
}

function MediaIcon({ type }: {type: MediaType;}) {
  if (type === 'audio') return <Volume2Icon className="h-3 w-3" aria-hidden="true" />;
  if (type === 'video') return <PlayIcon className="h-3 w-3" aria-hidden="true" />;
  return <FileTextIcon className="h-3 w-3" aria-hidden="true" />;
}

/**
 * Time-based records show their length once it is known; everything else names
 * its kind. A duration is never shown for media that has no timeline.
 */
function mediaBadgeLabel(media: CulturalRecord['source']['media']): string {
  if (isTimeBased(media.type)) {
    if (media.durationSec && media.durationSec > 0) return formatDuration(media.durationSec);
    return media.type === 'audio' ? 'Audio' : 'Video';
  }
  return 'Text';
}

export function CulturalPostCard({ record, variant = 'feed', className }: CulturalPostCardProps) {
  const creator = record.user ?? { id: record.creatorId, name: '', avatarUrl: '' };
  const isPhone = usePhoneViewport();
  const [commentsOpen, setCommentsOpen] = useState(false);

  if (variant === 'grid') {
    return (
      <article
        className={cn(
          'group overflow-hidden rounded-card border border-sand-light bg-paper transition-[border-color] duration-150 ease-firm hover:border-charcoal-soft',
          className
        )}>
        
        <Link to={`/post/${record.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
            <CulturalImage
              src={record.source.media.posterUrl}
              alt={record.source.media.altText}
              seed={record.id}
              category={record.category}
              className={cn(
                'h-full w-full object-cover transition-transform duration-200 ease-firm group-hover:scale-[1.02]',
                record.source.media.type === 'audio' && 'opacity-50'
              )} />

            {/* Audio overlay — mini waveform */}
            {record.source.media.type === 'audio' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/90 shadow">
                  <Volume2Icon className="h-4 w-4 text-charcoal" aria-hidden="true" />
                </span>
                <div className="flex h-5 items-end gap-[2px]">
                  {Array.from({ length: 18 }, (_, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-cream/60"
                      style={{ height: `${20 + Math.sin(i * 0.9) * 50 + Math.cos(i * 0.4) * 30}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <span className="absolute left-2.5 top-2.5 rounded-md bg-charcoal/75 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-cream backdrop-blur-sm">
              {CATEGORY_LABELS[record.category]}
            </span>
            {record.source.media.type !== 'image' &&
            <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-charcoal/75 px-2 py-1 text-[10px] font-medium text-cream backdrop-blur-sm">
                <MediaIcon type={record.source.media.type} />
                {mediaBadgeLabel(record.source.media)}
              </span>
            }
          </div>
          <div className="p-3 sm:p-3.5">
            <h3 className="font-display text-[14px] font-semibold leading-snug text-charcoal line-clamp-2 sm:text-[15px]">
              {record.title}
            </h3>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-charcoal-soft sm:text-[12px]">
              <MapPinIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {record.region} · {record.source.language}
              </span>
            </p>
            <div className="mt-2.5">
              <VerificationBadge status={record.community.status} />
            </div>
          </div>
        </Link>
      </article>);

  }

  return (
    <article className={cn('overflow-hidden rounded-card border border-sand-light bg-paper', className)}>
      <header className="flex items-center gap-3 p-3.5 sm:p-4">
        <Link to={`/profile/${creator.id}`} className="shrink-0">
          <Avatar src={creator.avatarUrl} name={creator.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${creator.id}`}
            className="block truncate text-sm font-medium text-charcoal transition-colors duration-150 ease-firm hover:text-terracotta">
            
            {creator.name}
          </Link>
          <p className="truncate text-[11px] text-charcoal-soft sm:text-[12px]">
            {CATEGORY_LABELS[record.category]} · {record.region} · {timeAgo(record.createdAt)}
          </p>
        </div>
        <VerificationBadge status={record.community.status} count={record.community.verifiedBy} />
      </header>

      {record.source.media.type === 'image' || record.source.media.type === 'text' ?
      <Link to={`/post/${record.id}`} className="block">
          <CulturalMediaViewer media={record.source.media} seed={record.id} excerpt={record.source.transcript} />
        </Link> :
      /* Audio / video — player is interactive, wrap just the title link below */
      <CulturalMediaViewer media={record.source.media} seed={record.id} excerpt={record.source.transcript} />
      }

      <div className="space-y-3 p-3.5 sm:p-4">
        <div>
          <Link to={`/post/${record.id}`}>
            <h2 className="font-display text-[17px] font-semibold leading-snug text-charcoal transition-colors duration-150 ease-firm hover:text-terracotta sm:text-lg">
              {record.title}
            </h2>
          </Link>
          <p className="mt-1.5 text-[13px] leading-relaxed text-charcoal-muted line-clamp-2 sm:text-sm">
            {record.description}
          </p>
        </div>

        <CulturalTags tags={record.tags} aiTags={record.ai.tags} limit={5} />

        {record.ai.status === 'FAILED' &&
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-flagged/20 bg-flagged-soft px-3 py-2 text-[12px] text-charcoal-muted">
            <AIProcessingStatus stage="FAILED" compact />
            The original recording is preserved and playable above.
          </div>
        }

        <PostActions
          recordId={record.id}
          likes={record.likes}
          comments={record.comments}
          saves={record.saves}
          commentsOpen={commentsOpen}
          onToggleComments={() => setCommentsOpen((open) => !open)}
          className="border-t border-sand-lighter pt-3" />
        

        {/* Comments open in place on tablet and desktop */}
        {!isPhone &&
        <AnimatePresence initial={false}>
            {commentsOpen &&
          <motion.div
            key="comments"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden">
            
                <div className="border-t border-sand-lighter pt-4">
                  <CommentSection recordId={record.id} compact />
                </div>
              </motion.div>
          }
          </AnimatePresence>
        }
      </div>

      {/* Comments open as a bottom sheet on phones so the feed position is kept */}
      {isPhone &&
      <Modal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        title="Discussion"
        description={record.title}>
        
          <CommentSection recordId={record.id} compact />
        </Modal>
      }
    </article>);

}