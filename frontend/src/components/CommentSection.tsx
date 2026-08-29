import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, MessageCircleIcon } from 'lucide-react';
import { postsApi } from '../api/postsApi';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../contexts/AuthContext';
import type { CulturalComment } from '../types/culture';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface CommentSectionProps {
  recordId: string;
  /** Compact mode is used inline in the feed and inside the mobile sheet. */
  compact?: boolean;
  className?: string;
}

export function CommentSection({ recordId, compact, className }: CommentSectionProps) {
  const { user } = useAuth();
  const { data, loading } = useAsync(() => postsApi.getComments(recordId), [recordId]);
  const [added, setAdded] = useState<CulturalComment[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const serverIds = new Set((data ?? []).map((c) => c.id));
  const all = [...(data ?? []), ...added.filter((c) => !serverIds.has(c.id))];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setSending(true);
    try {
      const comment = await postsApi.addComment(recordId, body.trim(), user.id);
      setAdded((prev) => [...prev, comment]);
      setBody('');
    } finally {
      setSending(false);
    }
  };

  const Wrapper = compact ? 'div' : 'section';

  return (
    <Wrapper
      id={compact ? undefined : 'comments'}
      aria-labelledby={compact ? undefined : 'comments-heading'}
      className={cn(compact ? '' : 'rounded-card border border-sand-light bg-paper p-5', className)}>
      
      {!compact &&
      <h2 id="comments-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-charcoal">
          <MessageCircleIcon className="h-[18px] w-[18px] text-charcoal-muted" aria-hidden="true" />
          Discussion
          <span className="text-sm font-normal text-charcoal-soft">{all.length}</span>
        </h2>
      }

      {user &&
      <form onSubmit={submit} className={cn('flex gap-3', compact ? '' : 'mt-4')}>
          <Avatar src={user.avatarUrl} name={user.name} size="sm" className="hidden sm:block" />
          <div className="min-w-0 flex-1">
            <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={compact ? 2 : 2}
            placeholder="Add what you know about this tradition…"
            aria-label="Write a comment"
            className="w-full resize-y rounded-lg border border-sand-light bg-cream px-3.5 py-2.5 text-[16px] sm:text-sm text-charcoal placeholder:text-charcoal-soft transition-colors duration-150 ease-firm focus:border-terracotta focus:outline-none" />
          
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-charcoal-soft">Discussion, not verification.</p>
              <Button type="submit" size="sm" loading={sending} disabled={!body.trim()}>
                Post
              </Button>
            </div>
          </div>
        </form>
      }

      <ul
        className={cn(
          'space-y-5',
          compact ? 'mt-4 max-h-72 overflow-y-auto pr-1' : 'mt-6'
        )}>
        
        {loading &&
        Array.from({ length: 2 }).map((_, i) =>
        <li key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </li>
        )}

        {!loading && all.length === 0 &&
        <li className="py-3 text-[13px] text-charcoal-soft">
            No comments yet. If you recognise this tradition, your knowledge is welcome here.
          </li>
        }

        {all.map((comment) => {
          const author = comment.user ?? { id: comment.userId, name: '', avatarUrl: '' };
          return (
            <li key={comment.id} className="flex gap-3">
              <Link to={`/profile/${author.id}`} className="shrink-0">
                <Avatar src={author.avatarUrl} name={author.name} size="sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <Link to={`/profile/${author.id}`} className="text-sm font-medium text-charcoal hover:text-terracotta">
                    {author.name}
                  </Link>
                  <span className="text-[11px] text-charcoal-soft">
                    {timeAgo(comment.createdAt)}
                  </span>
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-charcoal-muted sm:text-sm">{comment.body}</p>
                <button
                  type="button"
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-charcoal-soft transition-colors duration-150 ease-firm hover:text-terracotta">
                  
                  <HeartIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {comment.likes}
                </button>
              </div>
            </li>);

        })}
      </ul>

      {compact &&
      <Link
        to={`/post/${recordId}#comments`}
        className="mt-4 inline-block text-[13px] font-medium text-terracotta transition-colors duration-150 ease-firm hover:text-terracotta-600">
        
          View all in the full record →
        </Link>
      }
    </Wrapper>);

}