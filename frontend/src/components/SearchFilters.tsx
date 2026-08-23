import * as React from 'react';
import { XIcon } from 'lucide-react';
import type { SearchFilterState } from '../api/searchApi';
import { emptyFilters } from '../api/searchApi';
import { ART_FORMS, FESTIVALS, LANGUAGES, REGIONS, TRADITIONS } from '../data/taxonomy';
import { CATEGORY_LABELS, type CulturalCategory, type MediaType } from '../types/culture';
import { VERIFICATION_LABELS, type VerificationStatus } from '../types/verification';
import { Chip } from './ui/Chip';
import { cn } from '../utils/cn';
type ListKey = 'regions' | 'languages' | 'categories' | 'traditions' | 'artForms' | 'festivals' | 'mediaTypes' | 'verification';
interface SearchFiltersProps {
  filters: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
  className?: string;
}
const MEDIA_TYPES: MediaType[] = ['image', 'video', 'audio', 'text'];
const STATUSES: VerificationStatus[] = ['verified', 'pending', 'correction-suggested', 'flagged'];
function Group({
  title,
  children



}: {title: string;children: React.ReactNode;}) {
  return <section className="border-b border-sand-lighter py-4 first:pt-0 last:border-b-0">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>;
}
export function SearchFilters({
  filters,
  onChange,
  className
}: SearchFiltersProps) {
  function toggleValue<T extends string>(key: ListKey, value: T) {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({
      ...filters,
      [key]: next
    } as SearchFilterState);
  }
  const activeCount = (Object.keys(emptyFilters) as (keyof SearchFilterState)[]).reduce((total, key) => {
    const value = filters[key];
    return total + (Array.isArray(value) ? value.length : 0);
  }, 0);
  return <div className={cn('rounded-card border border-sand-light bg-paper p-4', className)}>
      <header className="flex items-center justify-between pb-3">
        <h2 className="font-display text-[15px] font-semibold text-charcoal">Refine</h2>
        {activeCount > 0 && <button type="button" onClick={() => onChange({
        ...emptyFilters,
        query: filters.query
      })} className="inline-flex items-center gap-1 text-[12px] font-medium text-terracotta transition-colors duration-150 ease-firm hover:text-terracotta-600">
            <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Clear {activeCount}
          </button>}
      </header>

      <Group title="Cultural category">
        {(Object.keys(CATEGORY_LABELS) as CulturalCategory[]).map((c) => <Chip key={c} label={CATEGORY_LABELS[c]} selected={filters.categories.includes(c)} onClick={() => toggleValue('categories', c)} />)}
      </Group>

      <Group title="Region">
        {REGIONS.map((r) => <Chip key={r} label={r} selected={filters.regions.includes(r)} onClick={() => toggleValue('regions', r)} />)}
      </Group>

      <Group title="Language">
        {LANGUAGES.map((l) => <Chip key={l} label={l} selected={filters.languages.includes(l)} onClick={() => toggleValue('languages', l)} />)}
      </Group>

      <Group title="Tradition">
        {TRADITIONS.map((t) => <Chip key={t} label={t} selected={filters.traditions.includes(t)} onClick={() => toggleValue('traditions', t)} />)}
      </Group>

      <Group title="Art form">
        {ART_FORMS.map((a) => <Chip key={a} label={a} selected={filters.artForms.includes(a)} onClick={() => toggleValue('artForms', a)} />)}
      </Group>

      <Group title="Festival">
        {FESTIVALS.map((f) => <Chip key={f} label={f} selected={filters.festivals.includes(f)} onClick={() => toggleValue('festivals', f)} />)}
      </Group>

      <Group title="Media">
        {MEDIA_TYPES.map((m) => <Chip key={m} label={m.charAt(0).toUpperCase() + m.slice(1)} selected={filters.mediaTypes.includes(m)} onClick={() => toggleValue('mediaTypes', m)} />)}
      </Group>

      <Group title="Verification">
        {STATUSES.map((s) => <Chip key={s} label={VERIFICATION_LABELS[s]} selected={filters.verification.includes(s)} onClick={() => toggleValue('verification', s)} />)}
      </Group>
    </div>;
}
