import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon, SearchXIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { searchApi, emptyFilters, type SearchFilterState } from '../api/searchApi';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { CulturalPostCard } from '../components/CulturalPostCard';
import { SearchFilters } from '../components/SearchFilters';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { GridSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CATEGORY_LABELS, type CulturalCategory } from '../types/culture';
import { VERIFICATION_LABELS } from '../types/verification';
import { ART_FORMS, FESTIVALS, LANGUAGES, REGIONS } from '../data/taxonomy';

type Facet = 'category' | 'artForm' | 'festival' | 'region' | 'language';

const FACETS: {id: Facet;label: string;key: keyof SearchFilterState;}[] = [
{ id: 'category', label: 'Category', key: 'categories' },
{ id: 'artForm', label: 'Art form', key: 'artForms' },
{ id: 'festival', label: 'Festival', key: 'festivals' },
{ id: 'region', label: 'Region', key: 'regions' },
{ id: 'language', label: 'Language', key: 'languages' }];


const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as CulturalCategory[];

function activeChips(filters: SearchFilterState): {key: keyof SearchFilterState;value: string;label: string;}[] {
  const chips: {key: keyof SearchFilterState;value: string;label: string;}[] = [];
  filters.categories.forEach((v) => chips.push({ key: 'categories', value: v, label: CATEGORY_LABELS[v] }));
  filters.regions.forEach((v) => chips.push({ key: 'regions', value: v, label: v }));
  filters.languages.forEach((v) => chips.push({ key: 'languages', value: v, label: v }));
  filters.traditions.forEach((v) => chips.push({ key: 'traditions', value: v, label: v }));
  filters.artForms.forEach((v) => chips.push({ key: 'artForms', value: v, label: v }));
  filters.festivals.forEach((v) => chips.push({ key: 'festivals', value: v, label: v }));
  filters.mediaTypes.forEach((v) => chips.push({ key: 'mediaTypes', value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
  filters.verification.forEach((v) => chips.push({ key: 'verification', value: v, label: VERIFICATION_LABELS[v] }));
  return chips;
}

export function Explore() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') ?? '';

  const [filters, setFilters] = useState<SearchFilterState>({ ...emptyFilters, query: initialQuery });
  const [input, setInput] = useState(initialQuery);
  const [facet, setFacet] = useState<Facet>('category');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const q = params.get('q') ?? '';
    setInput(q);
    setFilters((f) => f.query === q ? f : { ...f, query: q });
  }, [params]);

  const { items, total, loading, loadingMore, hasMore, loadMore } = usePaginatedList(
    (page) => searchApi.searchPage(filters, page),
    [JSON.stringify(filters)]
  );

  const active = FACETS.find((f) => f.id === facet)!;
  const options = useMemo<{value: string;label: string;}[]>(() => {
    switch (facet) {
      case 'category':
        return CATEGORY_VALUES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));
      case 'artForm':
        return ART_FORMS.map((a) => ({ value: a, label: a }));
      case 'festival':
        return FESTIVALS.map((f) => ({ value: f, label: f }));
      case 'region':
        return REGIONS.map((r) => ({ value: r, label: r }));
      default:
        return LANGUAGES.map((l) => ({ value: l, label: l }));
    }
  }, [facet]);

  const selectedForFacet = filters[active.key] as string[];
  const chips = activeChips(filters);

  const toggleFacetValue = (value: string) => {
    setFilters((f) => {
      const current = f[active.key] as string[];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...f, [active.key]: next } as SearchFilterState;
    });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(input ? { q: input } : {});
    setFilters((f) => ({ ...f, query: input }));
  };

  const removeChip = (key: keyof SearchFilterState, value: string) => {
    setFilters((f) => ({ ...f, [key]: (f[key] as string[]).filter((v) => v !== value) }) as SearchFilterState);
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <SectionHeading
        level={1}
        title="Explore"
        description="Search the treasury, or browse by tradition, region and language." />
      

      <form onSubmit={submitSearch} className="mt-5 flex items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-charcoal-soft"
            aria-hidden="true" />
          
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search traditions, songs, regions…"
            aria-label="Search cultural records"
            className="h-11 w-full rounded-lg border border-sand-light bg-paper pl-10 pr-9 text-[15px] sm:text-sm text-charcoal placeholder:text-charcoal-soft transition-colors duration-150 ease-firm focus:border-terracotta focus:outline-none sm:h-12 sm:pl-11 sm:pr-4" />
          
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                setParams({});
                setFilters((f) => ({ ...f, query: '' }));
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-soft hover:text-charcoal sm:hidden"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search button on tablet/desktop */}
        <Button type="submit" size="lg" className="hidden sm:inline-flex shrink-0">
          Search
        </Button>

        {/* Mobile filter button with active count badge */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Open filters"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-sand-light bg-paper text-charcoal-muted transition-colors duration-150 ease-firm hover:border-charcoal-soft hover:text-charcoal lg:hidden active:bg-sand-lighter"
        >
          <SlidersHorizontalIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          {chips.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-bold text-paper shadow-sm">
              {chips.length}
            </span>
          )}
        </button>
      </form>

      {/* Quick-browse facets */}
      <div className="mt-5 flex flex-wrap gap-1.5 border-b border-sand-lighter pb-4">
        {FACETS.map((f) =>
        <button
          key={f.id}
          type="button"
          onClick={() => setFacet(f.id)}
          className={
          facet === f.id ?
          'rounded-full bg-charcoal px-3.5 py-1.5 text-[13px] font-medium text-cream' :
          'rounded-full px-3.5 py-1.5 text-[13px] text-charcoal-muted transition-colors duration-150 ease-firm hover:text-charcoal'
          }>
          
            {f.label}
          </button>
        )}
      </div>

      <div className="vk-scroll-x mt-4 flex gap-1.5 overflow-x-auto pb-1">
        <Chip
          label={`All ${active.label.toLowerCase()}s`}
          selected={selectedForFacet.length === 0}
          onClick={() => setFilters((f) => ({ ...f, [active.key]: [] }) as SearchFilterState)} />
        
        {options.map((option) =>
        <Chip
          key={option.value}
          label={option.label}
          selected={selectedForFacet.includes(option.value)}
          onClick={() => toggleFacetValue(option.value)} />

        )}
      </div>

      {chips.length > 0 &&
      <ul className="mt-4 flex flex-wrap gap-1.5">
          {chips.map((chip) =>
        <li key={`${chip.key}-${chip.value}`}>
              <button
            type="button"
            onClick={() => removeChip(chip.key, chip.value)}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-3 py-1.5 text-[12px] text-cream transition-colors duration-150 ease-firm hover:bg-terracotta">
            
                {chip.label}
                <XIcon className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
        )}
        </ul>
      }

      <div className="mt-6 flex gap-8">
        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <SearchFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-[13px] text-charcoal-soft">
            {loading ?
            'Searching…' :
            `${total} cultural ${total === 1 ? 'record' : 'records'}`}
            {filters.query && !loading && <span> for “{filters.query}”</span>}
          </p>

          {loading ?
          <GridSkeleton /> :
          items.length > 0 ?
          <>
              <div className="columns-1 gap-3 min-[420px]:columns-2 sm:gap-4 md:columns-3 xl:columns-4 [&>*]:mb-3 sm:[&>*]:mb-4">
                {items.map((record) =>
              <div key={record.id} className="break-inside-avoid">
                    <CulturalPostCard record={record} variant="grid" />
                  </div>
              )}
              </div>
              {hasMore &&
            <div className="mt-6 flex justify-center">
                  <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                    Load more
                  </Button>
                </div>
            }
            </> :

          <EmptyState
            icon={SearchXIcon}
            title="No records matched"
            description="Try fewer filters or a broader keyword."
            actionLabel="Contribute a record"
            actionTo="/create" />

          }
        </div>
      </div>

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Refine results">
        <SearchFilters filters={filters} onChange={setFilters} className="border-0 p-0" />
        <Button className="mt-4 w-full" onClick={() => setSheetOpen(false)}>
          Show {total} results
        </Button>
      </Modal>
    </div>);

}