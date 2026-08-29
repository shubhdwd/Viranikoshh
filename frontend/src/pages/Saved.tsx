import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkIcon, LayoutGridIcon, ListIcon } from 'lucide-react';
import { postsApi } from '../api/postsApi';
import { useAsync } from '../hooks/useAsync';
import { useInteractions } from '../contexts/InteractionsContext';
import { CulturalPostCard } from '../components/CulturalPostCard';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Chip } from '../components/ui/Chip';
import { GridSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CulturalImage } from '../components/ui/CulturalImage';
import { VerificationBadge } from '../components/VerificationBadge';
import { CATEGORY_LABELS, type CulturalCategory } from '../types/culture';
import { cn } from '../utils/cn';
export function Saved() {
  const {
    saved
  } = useInteractions();
  const {
    data,
    loading
  } = useAsync(() => {
    if (saved.length === 0) return Promise.resolve([]);
    return Promise.all(saved.map((id) => postsApi.getById(id).catch(() => null)))
      .then((results) => results.filter(Boolean) as NonNullable<typeof results[number]>[]);
  }, [saved.join(',')]);
  const [category, setCategory] = useState<CulturalCategory | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const items = useMemo(() => {
    const all = data ?? [];
    return category ? all.filter((r) => r.category === category) : all;
  }, [data, category]);
  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((r) => r.category));
    return Array.from(set);
  }, [data]);
  return <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionHeading level={1} title="Saved" description="Private to you." action={<div className="flex rounded-lg border border-sand-light bg-paper p-0.5">
            {(['grid', 'list'] as const).map((mode) => <button key={mode} type="button" onClick={() => setView(mode)} aria-label={`${mode} view`} aria-pressed={view === mode} className={cn('flex h-8 w-9 items-center justify-center rounded-md transition-colors duration-150 ease-firm', view === mode ? 'bg-sand-lighter text-charcoal' : 'text-charcoal-soft hover:text-charcoal')}>
                {mode === 'grid' ? <LayoutGridIcon className="h-4 w-4" /> : <ListIcon className="h-4 w-4" />}
              </button>)}
          </div>} />

      {categories.length > 0 && <div className="vk-scroll-x mt-5 flex gap-1.5 overflow-x-auto pb-1">
          <Chip label="All" selected={category === null} onClick={() => setCategory(null)} />
          {categories.map((c) => <Chip key={c} label={CATEGORY_LABELS[c]} selected={category === c} onClick={() => setCategory(c)} />)}
        </div>}

      <div className="mt-6">
        {loading ? <GridSkeleton count={4} /> : items.length === 0 ? <EmptyState icon={BookmarkIcon} title="Nothing saved yet" description="Bookmark a record to keep it here." actionLabel="Find something to save" actionTo="/explore" /> : view === 'grid' ? <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((record) => <CulturalPostCard key={record.id} record={record} variant="grid" />)}
          </div> : <ul className="divide-y divide-sand-lighter rounded-card border border-sand-light bg-paper">
            {items.map((record) => <li key={record.id}>
                <Link to={`/post/${record.id}`} className="flex items-center gap-4 p-4 transition-colors duration-150 ease-firm hover:bg-cream">
                  <CulturalImage src={record.source.media.posterUrl} alt="" aria-hidden="true" seed={record.id} category={record.category} className="h-14 w-14 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-semibold text-charcoal">{record.title}</p>
                    <p className="mt-0.5 truncate text-[12px] text-charcoal-soft">
                      {CATEGORY_LABELS[record.category]} · {record.region} · {record.source.language}
                    </p>
                  </div>
                  <VerificationBadge status={record.community.status} />
                </Link>
              </li>)}
          </ul>}
      </div>
    </div>;
}