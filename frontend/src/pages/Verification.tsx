import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheckIcon, ShieldCheckIcon } from 'lucide-react';
import { verificationApi } from '../api/verificationApi';
import { useAsync } from '../hooks/useAsync';
import { VerificationPanel } from '../components/VerificationPanel';
import { VerificationBadge } from '../components/VerificationBadge';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CATEGORY_LABELS } from '../types/culture';
import { VERIFICATION_LABELS, type VerificationStatus } from '../types/verification';
const FILTERS: VerificationStatus[] = ['pending', 'correction-suggested', 'flagged'];
export function Verification() {
  const {
    data,
    loading
  } = useAsync(() => verificationApi.queue(), []);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const items = useMemo(() => {
    const all = data ?? [];
    return status ? all.filter((r) => r.community.status === status) : all;
  }, [data, status]);
  return <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <SectionHeading level={1} title="Community verification" description="Records waiting on someone who knows the tradition." />

      <p className="mt-4 flex items-start gap-2 rounded-card border border-verified/20 bg-verified-soft px-4 py-3 text-[13px] leading-relaxed text-charcoal-muted">
        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-verified" aria-hidden="true" />
        AI transcribes, translates and tags. It never marks a record as authentic. Verification, correction, context and
        flags come only from people.
      </p>

      <div className="vk-scroll-x mt-5 flex gap-1.5 overflow-x-auto pb-1">
        <Chip label="All open records" selected={status === null} onClick={() => setStatus(null)} />
        {FILTERS.map((s) => <Chip key={s} label={VERIFICATION_LABELS[s]} selected={status === s} onClick={() => setStatus(s)} />)}
      </div>

      <div className="mt-6 space-y-6">
        {loading && Array.from({
        length: 2
      }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-card" />)}

        {!loading && items.length === 0 && <EmptyState icon={BadgeCheckIcon} title="The queue is clear" description="Every open record in this view has been reviewed by the community." actionLabel="Back to the feed" actionTo="/home" />}

        {items.map((record) => <article key={record.id} className="overflow-hidden rounded-card border border-sand-light bg-paper">
            <div className="grid sm:grid-cols-[170px_1fr] lg:grid-cols-[200px_1fr]">
              <Link to={`/post/${record.id}`} className="block">
                <img src={record.source.media.posterUrl} alt={record.source.media.altText} className="h-full min-h-[140px] w-full object-cover" />
              </Link>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-sand-lighter px-2 py-1 text-[11px] uppercase tracking-wider text-charcoal-muted">
                    {CATEGORY_LABELS[record.category]}
                  </span>
                  <VerificationBadge status={record.community.status} count={record.community.verifiedBy} />
                </div>
                <Link to={`/post/${record.id}`}>
                  <h2 className="mt-2.5 font-display text-lg font-semibold leading-snug text-charcoal hover:text-terracotta">
                    {record.title}
                  </h2>
                </Link>
                <p className="mt-1 text-[12px] text-charcoal-soft">
                  {record.region} · {record.source.language} · {record.tradition}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-charcoal-muted line-clamp-2">{record.description}</p>
                <p className="mt-3 rounded-lg border border-sand-light border-l-[3px] border-l-charcoal bg-cream p-3 font-deva text-[15px] leading-[1.8] text-charcoal line-clamp-2">
                  {record.source.transcript}
                </p>
              </div>
            </div>
            <VerificationPanel record={record} className="rounded-none border-x-0 border-b-0" />
          </article>)}
      </div>
    </div>;
}