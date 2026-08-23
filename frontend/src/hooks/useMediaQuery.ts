import { useEffect, useState } from 'react';

/**
 * Reactive viewport query so components can pick the right presentation
 * (inline panel vs bottom sheet) at real device widths.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ?
  window.matchMedia(query).matches :
  false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const usePhoneViewport = () => useMediaQuery('(max-width: 639px)');
export const useDesktopViewport = () => useMediaQuery('(min-width: 1024px)');