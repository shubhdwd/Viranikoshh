import { useEffect, useState } from 'react';
import type { CulturalCategory } from '../../types/culture';
import { fallbackImage } from '../../utils/media';

interface CulturalImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  /** Keeps the substituted image stable for a given record. */
  seed?: string;
  category?: CulturalCategory | undefined;
  'aria-hidden'?: boolean | 'true' | 'false';
  loading?: 'eager' | 'lazy';
}

/**
 * An <img> that always paints something. Records can reference media that was
 * never uploaded, was stored outside this environment, or points at an audio or
 * video file, so a missing or broken source falls back to local cultural
 * artwork instead of the browser's broken-image glyph.
 */
export function CulturalImage({
  src,
  alt,
  className,
  seed,
  category,
  loading = 'lazy',
  ...rest
}: CulturalImageProps) {
  const fallback = fallbackImage(seed ?? alt ?? 'vk', category);
  const [current, setCurrent] = useState(src || fallback);

  useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);

  return (
    <img
      src={current}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
      {...rest} />);

}
