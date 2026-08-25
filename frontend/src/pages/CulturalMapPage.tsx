import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import { postsApi } from '../api/postsApi';
import { useAsync } from '../hooks/useAsync';
import { CulturalMap, CATEGORY_COLOR } from '../components/CulturalMap';
import { VerificationBadge } from '../components/VerificationBadge';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { CulturalImage } from '../components/ui/CulturalImage';
import { CATEGORY_LABELS, type CulturalCategory, type CulturalRecord } from '../types/culture';

const MAP_CATEGORIES: CulturalCategory[] = [
'folk-song',
'folk-story',
'oral-tradition',
'artwork',
'craft',
'festival',
'traditional-practice',
'local-history'];


function Preview({
  record,
  onClose,
  layout = 'panel'




}: {record: CulturalRecord;onClose: () => void;layout?: 'panel' | 'strip';}) {
  return (
    <div className="overflow-hidden rounded-card border border-sand-light bg-paper">
      <div className={layout === 'strip' ? 'flex gap-3 p-3' : ''}>
        {layout === 'strip' ?
        <CulturalImage src={record.source.media.posterUrl} alt="" aria-hidden="true" seed={record.id} category={record.category} className="h-20 w-20 shrink-0 rounded-md object-cover" /> :

        <div className="relative">
            <CulturalImage src={record.source.media.posterUrl} alt="" aria-hidden="true" seed={record.id} category={record.category} className="h-40 w-full object-cover" />
            <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/70 text-cream backdrop-blur-sm">
            
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        }

        <div className={layout === 'strip' ? 'min-w-0 flex-1' : 'p-4'}>
          <div className="flex items-start gap-2">
            <p className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-charcoal-soft">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CATEGORY_COLOR[record.category] }}
                aria-hidden="true" />
              
              <span className="truncate">{CATEGORY_LABELS[record.category]}</span>
            </p>
            {layout === 'strip' &&
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="ml-auto shrink-0 text-charcoal-soft transition-colors duration-150 ease-firm hover:text-charcoal">
              
                <XIcon className="h-4 w-4" />
              </button>
            }
          </div>

          <h3 className="mt-1.5 font-display text-[16px] font-semibold leading-snug text-charcoal sm:text-[17px]">
            {record.title}
          </h3>
          <p className="mt-1 truncate text-[12px] text-charcoal-soft">
            {record.region} · {record.source.language}
          </p>

          {layout === 'panel' &&
          <p className="mt-2 text-[13px] leading-relaxed text-charcoal-muted line-clamp-3">{record.description}</p>
          }

          <div className="mt-2.5">
            <VerificationBadge status={record.community.status} count={record.community.verifiedBy} />
          </div>

          <Link
            to={`/post/${record.id}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-terracotta transition-colors duration-150 ease-firm hover:text-terracotta-600">
            
            Open full record
            <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>);

}

export function CulturalMapPage() {
  const { data, loading } = useAsync(() => postsApi.getCulturalMap(), []);
  const [active, setActive] = useState<CulturalCategory[]>([]);
  const [selected, setSelected] = useState<CulturalRecord | null>(null);

  const visible = useMemo(() => {
    const all = data ?? [];
    return active.length === 0 ? all : all.filter((r) => active.includes(r.category));
  }, [data, active]);

  const toggle = (category: CulturalCategory) =>
  setActive((prev) => prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <SectionHeading
        level={1}
        title="Cultural map of India"
        description="Every record is anchored to the place it comes from." />
      

      <div className="vk-scroll-x mt-5 flex gap-1.5 overflow-x-auto pb-1">
        <Chip label="All categories" selected={active.length === 0} onClick={() => setActive([])} />
        {MAP_CATEGORIES.map((c) =>
        <Chip key={c} label={CATEGORY_LABELS[c]} selected={active.includes(c)} onClick={() => toggle(c)} />
        )}
      </div>

      {/* On phones and small tablets the selection sits above the map, in flow */}
      {selected &&
      <div className="mt-4 lg:hidden">
          <Preview record={selected} onClose={() => setSelected(null)} layout="strip" />
        </div>
      }

      <div className="mt-4 grid gap-5 lg:mt-5 lg:grid-cols-[1fr_320px]">
        {loading ?
        <Skeleton className="h-[360px] w-full rounded-card sm:h-[460px] lg:h-[620px]" /> :

        <CulturalMap
          records={visible}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          className="h-[360px] sm:h-[460px] lg:h-[620px]" />

        }

        <div className="hidden lg:block">
          {selected ?
          <div className="sticky top-6">
              <Preview record={selected} onClose={() => setSelected(null)} />
            </div> :

          <div className="sticky top-6 rounded-card border border-dashed border-sand-light bg-paper p-6">
              <h2 className="font-display text-[15px] font-semibold text-charcoal">
                {visible.length} records on the map
              </h2>
              <p className="mt-1.5 text-[13px] text-charcoal-muted">Select a marker to preview it.</p>
              <ul className="mt-4 space-y-2">
                {MAP_CATEGORIES.map((c) =>
              <li key={c} className="flex items-center gap-2 text-[12px] text-charcoal-muted">
                    <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: CATEGORY_COLOR[c] }}
                  aria-hidden="true" />
                
                    {CATEGORY_LABELS[c]}
                  </li>
              )}
              </ul>
              <p className="mt-4 border-t border-sand-lighter pt-3 text-[12px] text-charcoal-soft">
                Shaded regions carry more recorded culture.
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}