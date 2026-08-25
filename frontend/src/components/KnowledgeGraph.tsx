
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import type { CulturalRecord, RelationshipType } from '../types/culture';
import { RELATIONSHIP_LABELS } from '../types/culture';
import { SectionHeading } from './ui/SectionHeading';
import { CulturalImage } from './ui/CulturalImage';
const ORDER: RelationshipType[] = ['REGIONAL_VARIANT', 'RELATED_SONG', 'SAME_FESTIVAL', 'SAME_ART_FORM', 'RELATED_TRADITION'];
export function KnowledgeGraph({
  record,
  relatedRecords = []
}: {record: CulturalRecord; relatedRecords?: CulturalRecord[];}) {
  const relatedById = new Map(relatedRecords.map((r) => [r.id, r]));
  const groups = ORDER.map((type) => ({
    type,
    items: record.relationships.filter((rel) => rel.type === type).map((rel) => relatedById.get(rel.recordId)).filter((r): r is CulturalRecord => Boolean(r))
  })).filter((group) => group.items.length > 0);
  if (groups.length === 0) return null;
  return <section aria-labelledby="graph-heading" className="rounded-card border border-sand-light bg-paper p-3.5 sm:p-5 min-w-0 overflow-hidden">
      <SectionHeading title="Cultural knowledge graph" description="Where this record sits in the wider tradition." />

      {/* Hub and spoke */}
      <div className="mt-5 rounded-lg border border-sand-light bg-cream p-3 sm:p-4 min-w-0 overflow-hidden">
        <div className="flex flex-col items-stretch gap-3 min-w-0">
          <div className="w-full rounded-lg border border-charcoal bg-paper p-3 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-charcoal-soft">This record</p>
            <p className="mt-1 font-display text-[14px] font-semibold leading-snug text-charcoal line-clamp-2 break-words">
              {record.title}
            </p>
          </div>
          <ul className="grid min-w-0 w-full gap-2 grid-cols-1 sm:grid-cols-2">
            {groups.map((group) => <li key={group.type} className="rounded-lg border border-dashed border-sand bg-paper p-2.5 sm:px-3 sm:py-2 min-w-0 overflow-hidden">
                <p className="text-[11px] font-medium text-clay truncate">{RELATIONSHIP_LABELS[group.type]}</p>
                <p className="mt-0.5 text-[12px] text-charcoal-muted truncate">
                  {group.items.length} connected {group.items.length === 1 ? 'record' : 'records'}
                </p>
              </li>)}
          </ul>
        </div>
      </div>

      {/* Readable relationship groups */}
      <div className="mt-5 space-y-5 min-w-0">
        {groups.map((group) => <div key={group.type} className="min-w-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
              {RELATIONSHIP_LABELS[group.type]}
            </h3>
            <ul className="mt-2 space-y-2 min-w-0">
              {group.items.map((item) => <li key={item.id} className="min-w-0">
                  <Link to={`/post/${item.id}`} className="group flex items-center gap-2.5 sm:gap-3 rounded-lg border border-sand-light p-2 sm:p-2.5 transition-colors duration-150 ease-firm hover:border-charcoal-soft overflow-hidden min-w-0">
                    <CulturalImage src={item.source.media.posterUrl} alt="" aria-hidden="true" seed={item.id} category={item.category} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="block truncate text-[13px] sm:text-[14px] font-medium text-charcoal">{item.title}</span>
                      <span className="block truncate text-[11px] sm:text-[12px] text-charcoal-soft">
                        {item.region} · {item.source.language}
                      </span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-charcoal-soft transition-transform duration-150 ease-firm group-hover:translate-x-0.5 group-hover:text-terracotta" aria-hidden="true" />
                  </Link>
                </li>)}
            </ul>
          </div>)}
      </div>
    </section>;
}
