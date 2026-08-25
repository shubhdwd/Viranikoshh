import { useCallback, useEffect, useRef, useState } from 'react';

export interface PageResult<T> {
  records: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface PaginatedState<T> {
  items: T[];
  total: number;
  /** True only during the initial (page 1) load or a reset. */
  loading: boolean;
  /** True while a "load more" (page 2+) request is in flight. */
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

/**
 * Accumulating paginated loader. Loads page 1 whenever `deps` change (replacing
 * the list), and appends further pages via `loadMore`. The `loader` may be a
 * fresh closure each render — it's read through a ref so `loadMore` stays stable.
 */
export function usePaginatedList<T>(
  loader: (page: number) => Promise<PageResult<T>>,
  deps: unknown[] = []
): PaginatedState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 0, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;
  const busyRef = useRef(false);

  // Initial load + reset whenever deps change.
  useEffect(() => {
    let cancelled = false;
    busyRef.current = true;
    setLoading(true);
    setError(null);
    loaderRef.current(1).
    then((res) => {
      if (cancelled) return;
      setItems(res.records);
      setPagination(res.pagination);
    }).
    catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Something went wrong');
    }).
    finally(() => {
      busyRef.current = false;
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const loadMore = useCallback(() => {
    const { page, totalPages } = paginationRef.current;
    if (busyRef.current || page >= totalPages) return;
    busyRef.current = true;
    setLoadingMore(true);
    loaderRef.current(page + 1).
    then((res) => {
      setItems((prev) => [...prev, ...res.records]);
      setPagination(res.pagination);
    }).
    catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }).
    finally(() => {
      busyRef.current = false;
      setLoadingMore(false);
    });
  }, []);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    items,
    total: pagination.total,
    loading,
    loadingMore,
    error,
    hasMore: pagination.page < pagination.totalPages,
    loadMore,
    reload
  };
}
