import { request } from './client';

interface TaxonomyCategory {
  id: string;
  name: string;
}

/** Format a raw category name for display (e.g. "folk-song" → "Folk Song") */
function formatCategoryName(name: string): string {
  // If it's already a human-readable name (contains spaces or uppercase), use as-is
  if (/\s/.test(name) || /[A-Z]/.test(name)) return name;
  // Otherwise it's a slug — convert "folk-song" → "Folk Song"
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const taxonomyApi = {
  getCategories(): Promise<TaxonomyCategory[]> {
    return request({ url: '/taxonomy', method: 'GET' }).then(
      (data) => data.categories
    );
  },

  /**
   * Returns unique categories formatted for display.
   * Deduplicates by slug (e.g. "craft" and "Craft" both become one entry).
   */
  getInterestCategories(): Promise<Array<{ slug: string; label: string }>> {
    return taxonomyApi.getCategories().then((cats) => {
      const seen = new Map<string, { slug: string; label: string }>();
      for (const cat of cats) {
        const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
        if (!seen.has(slug)) {
          seen.set(slug, { slug: cat.name, label: formatCategoryName(cat.name) });
        }
      }
      return Array.from(seen.values());
    });
  },
};
