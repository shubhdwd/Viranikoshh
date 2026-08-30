import { useState } from 'react';
import { BookmarkIcon, CheckIcon, HeartIcon, LinkIcon, MessageCircleIcon, Share2Icon, Trash2Icon } from 'lucide-react';
import { useInteractions } from '../contexts/InteractionsContext';
import { useAuth } from '../contexts/AuthContext';
import { postsApi } from '../api/postsApi';
import { Popover } from './ui/Popover';
import { compactCount } from '../utils/format';
import { cn } from '../utils/cn';

interface PostActionsProps {
  recordId: string;
  creatorId?: string;
  likes: number;
  comments: number;
  saves: number;
  commentsOpen?: boolean;
  onToggleComments?: () => void;
  onDelete?: () => void;
  className?: string;
}

const ITEM = 'inline-flex items-center gap-1.5 text-[13px] transition-colors duration-150 ease-firm';

function recordUrl(recordId: string): string {
  return `${window.location.origin}/post/${recordId}`;
}

export function PostActions({
  recordId,
  creatorId,
  likes,
  comments,
  saves,
  commentsOpen,
  onToggleComments,
  onDelete,
  className
}: PostActionsProps) {
  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractions();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.id && creatorId && user.id === creatorId;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await postsApi.deletePost(recordId);
      onDelete?.();
    } catch {
      setDeleting(false);
    }
  };

  const liked = isLiked(recordId);
  const saved = isSaved(recordId);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(recordUrl(recordId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ url: recordUrl(recordId), title: 'Viranikosh cultural record' });
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      setShared(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-3 sm:gap-5 min-w-0', className)}>
      <button
        type="button"
        onClick={() => toggleLike(recordId)}
        aria-pressed={liked}
        aria-label={liked ? 'Remove like' : 'Like this record'}
        className={cn(ITEM, 'shrink-0', liked ? 'text-terracotta' : 'text-charcoal-muted hover:text-charcoal')}>
        
        <HeartIcon className={cn('h-[18px] w-[18px]', liked && 'fill-terracotta')} aria-hidden="true" />
        {compactCount(likes + (liked ? 1 : 0))}
      </button>

      <button
        type="button"
        onClick={onToggleComments}
        aria-expanded={commentsOpen}
        aria-label={commentsOpen ? 'Hide comments' : 'Show comments'}
        className={cn(ITEM, 'shrink-0', commentsOpen ? 'text-terracotta' : 'text-charcoal-muted hover:text-charcoal')}>
        
        <MessageCircleIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        {compactCount(comments)}
      </button>

      <button
        type="button"
        onClick={() => toggleSave(recordId)}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved' : 'Save this record'}
        className={cn(ITEM, 'shrink-0', saved ? 'text-terracotta' : 'text-charcoal-muted hover:text-charcoal')}>
        
        <BookmarkIcon className={cn('h-[18px] w-[18px]', saved && 'fill-terracotta')} aria-hidden="true" />
        {compactCount(saves + (saved ? 1 : 0))}
      </button>

      {isOwner && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete this record"
          className={cn(ITEM, 'shrink-0', 'text-charcoal-muted hover:text-flagged')}>
          <Trash2Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          <span className="hidden sm:inline">{deleting ? 'Deleting...' : 'Delete'}</span>
        </button>
      )}

      <div className="ml-auto shrink-0">
        {canNativeShare ?
        <button
          type="button"
          onClick={nativeShare}
          className={cn(ITEM, 'shrink-0', shared ? 'text-verified' : 'text-charcoal-muted hover:text-charcoal')}>
          
            {shared ? <CheckIcon className="h-[18px] w-[18px]" aria-hidden="true" /> : <Share2Icon className="h-[18px] w-[18px]" aria-hidden="true" />}
            <span className="hidden sm:inline">{shared ? 'Shared' : 'Share'}</span>
          </button> :

        <Popover
          label="Share this record"
          panelClassName="w-64 p-3"
          trigger={() =>
          <span className={cn(ITEM, 'text-charcoal-muted hover:text-charcoal')}>
                <Share2Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                <span className="hidden sm:inline">Share</span>
              </span>
          }>
          
            {() =>
          <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">Share this record</p>
                <p className="mt-2 truncate rounded-md border border-sand-light bg-cream px-2.5 py-2 font-mono text-[11px] text-charcoal-muted">
                  {recordUrl(recordId)}
                </p>
                <button
              type="button"
              onClick={copyLink}
              className={cn(
                'mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 ease-firm',
                copied ? 'bg-verified-soft text-verified' : 'bg-terracotta text-paper hover:bg-terracotta-600'
              )}>
              
                  {copied ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : <LinkIcon className="h-4 w-4" aria-hidden="true" />}
                  {copied ? 'Link copied' : 'Copy link'}
                </button>
              </div>
          }
          </Popover>
        }
      </div>
    </div>);

}