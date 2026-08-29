import { request } from './client';
import { transformPost, type PaginatedRecords } from './postsApi';
import type { CulturalCategory, CulturalRecord, MediaType } from '../types/culture';
import type { VerificationStatus } from '../types/verification';

export interface SearchFilterState {
  query: string;
  regions: string[];
  languages: string[];
  categories: CulturalCategory[];
  traditions: string[];
  artForms: string[];
  festivals: string[];
  tags: string[];
  mediaTypes: MediaType[];
  verification: VerificationStatus[];
}

export const emptyFilters: SearchFilterState = {
  query: '',
  regions: [],
  languages: [],
  categories: [],
  traditions: [],
  artForms: [],
  festivals: [],
  tags: [],
  mediaTypes: [],
  verification: []
};

export const searchApi = {
  search(filters: SearchFilterState): Promise<CulturalRecord[]> {
    return request({ url: '/search', method: 'GET', params: filters }).then((data) => data.posts.map(transformPost));
  },

  // Paginated search — returns records plus the server's pagination metadata.
  searchPage(filters: SearchFilterState, page = 1): Promise<PaginatedRecords> {
    return request({ url: '/search', method: 'GET', params: { ...filters, page } }).then((data) => ({
      records: data.posts.map(transformPost),
      pagination: data.pagination
    }));
  },

  suggestions(query: string): Promise<string[]> {
    return request({ url: '/search/suggestions', method: 'GET', params: { q: query } });
  }
};
