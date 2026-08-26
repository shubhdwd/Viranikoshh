import { request } from './client';
import type { CulturalCategory, MediaType } from '../types/culture';

export interface TaxonomyItem {
  id: string;
  name: string;
}

export interface ContributionDraft {
  mediaType: MediaType;
  fileName?: string;
  previewUrl?: string;
  durationSec?: number;
  title: string;
  description: string;
  region: string;
  regionId: string;
  language: string;
  category: CulturalCategory | '';
  categoryId: string;
  tradition: string;
  tags: string[];
  originalTranscript: string;
  contributorNote: string;
}

export const emptyDraft: ContributionDraft = {
  mediaType: 'audio',
  title: '',
  description: '',
  region: '',
  regionId: '',
  language: '',
  category: '',
  categoryId: '',
  tradition: '',
  tags: [],
  originalTranscript: '',
  contributorNote: ''
};

export const uploadApi = {
  getTaxonomy(): Promise<{ regions: TaxonomyItem[]; categories: TaxonomyItem[] }> {
    return request({ url: '/taxonomy', method: 'GET' });
  },

  submit(draft: ContributionDraft): Promise<{id: string}> {
    return request({ url: '/posts', method: 'POST', data: {
      title: draft.title,
      description: draft.description || undefined,
      content: draft.originalTranscript || undefined,
      published: true,
      regionId: draft.regionId || undefined,
      categoryId: draft.categoryId || undefined,
      tags: draft.tags.length > 0 ? draft.tags : undefined,
    } });
  },

  uploadMedia(postId: string, file: Blob, fileName: string): Promise<{mediaUrl: string; postId: string;}> {
    const form = new FormData();
    form.append('file', file, fileName);
    // Do NOT manually set Content-Type — axios auto-detects FormData and
    // sets the correct header including the multipart boundary string.
    return request({
      url: '/uploads',
      method: 'POST',
      params: { postId },
      data: form,
    });
  },

  getStatus(recordId: string): Promise<{status: string;}> {
    return request({ url: `/uploads/${recordId}/status`, method: 'GET' });
  }
};
