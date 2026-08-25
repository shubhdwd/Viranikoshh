
import { Link } from 'react-router-dom';
import type { CulturalRecord } from '../types/culture';
import { CATEGORY_LABELS } from '../types/culture';
import { VerificationBadge } from './VerificationBadge';
import { SectionHeading } from './ui/SectionHeading';
import { CulturalImage } from './ui/CulturalImage';
interface RelatedCultureProps {
  records: CulturalRecord[];
  loading?: boolean;
}
export function RelatedCulture({
  records,
  loading
}: RelatedCultureProps) {
  return <section aria-labelledby="related-heading" className="rounded-card border border-sand-light bg-paper p-3.5 sm:p-5 min-w-0 overflow-hidden">
      <SectionHeading title="Related culture" description="Connected by region, tradition, art form or festival." />

      {loading ? <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {Array.from({
        length: 4
      }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-sand-lighter" />)}
        </div> : records.length === 0 ? <p className="mt-5 text-sm text-charcoal-soft">No connected records yet.</p> : <ul className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {records.map((record) => <li key={record.id} className="min-w-0">
              <Link to={`/post/${record.id}`} className="flex gap-3 rounded-lg border border-sand-light p-2.5 sm:p-3 transition-colors duration-150 ease-firm hover:border-charcoal-soft overflow-hidden min-w-0">
                <CulturalImage src={record.source.media.posterUrl} alt="" aria-hidden="true" seed={record.id} category={record.category} className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-md object-cover" />
                <span className="min-w-0 flex-1 overflow-hidden">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-charcoal-soft truncate">
                    {CATEGORY_LABELS[record.category]}
                  </span>
                  <span className="mt-0.5 block font-display text-[13px] sm:text-[14px] font-semibold leading-snug text-charcoal line-clamp-2 break-words">
                    {record.title}
                  </span>
                  <span className="mt-1.5 block">
                    <VerificationBadge status={record.community.status} />
                  </span>
                </span>
              </Link>
            </li>)}
        </ul>}
    </section>;
}
