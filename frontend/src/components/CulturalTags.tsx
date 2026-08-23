
import { Link } from 'react-router-dom';
import { SparklesIcon } from 'lucide-react';
import { cn } from '../utils/cn';
interface CulturalTagsProps {
  tags: string[];
  aiTags?: string[];
  limit?: number;
  linked?: boolean;
  className?: string;
}
function tagHref(tag: string): string {
  return `/explore?q=${encodeURIComponent(tag)}`;
}
export function CulturalTags({
  tags,
  aiTags = [],
  limit,
  linked = true,
  className
}: CulturalTagsProps) {
  const contributor = limit ? tags.slice(0, limit) : tags;
  const machine = limit ? aiTags.slice(0, Math.max(0, limit - contributor.length + 1)) : aiTags;
  const base = 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors duration-150 ease-firm';
  return <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {contributor.map((tag) => <li key={`c-${tag}`}>
          {linked ? <Link to={tagHref(tag)} className={cn(base, 'bg-sand-lighter text-charcoal-muted hover:text-charcoal')}>
              #{tag}
            </Link> : <span className={cn(base, 'bg-sand-lighter text-charcoal-muted')}>#{tag}</span>}
        </li>)}
      {machine.map((tag) => <li key={`a-${tag}`}>
          {linked ? <Link to={tagHref(tag)} title="Suggested by AI" className={cn(base, 'bg-ai-soft text-ai border border-ai-border hover:bg-[#ece7f5]')}>
              <SparklesIcon className="h-3 w-3" aria-hidden="true" />
              {tag}
            </Link> : <span title="Suggested by AI" className={cn(base, 'bg-ai-soft text-ai border border-ai-border')}>
              <SparklesIcon className="h-3 w-3" aria-hidden="true" />
              {tag}
            </span>}
        </li>)}
    </ul>;
}
