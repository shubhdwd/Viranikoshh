import { request } from './client';
import type { CulturalComment, CulturalRecord } from '../types/culture';
import { resolveMedia } from '../utils/media';

export interface FeedParams {
  followedCreators?: string[];
  followedInterests?: string[];
  savedIds?: string[];
  likedIds?: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedRecords {
  records: CulturalRecord[];
  pagination: Pagination;
}

function transformPost(post: any): CulturalRecord {
  const apiUser = post.user;
  const category = (post.category?.name as CulturalRecord['category']) || 'folk-song';
  const transcript = post.source?.transcript || post.content || '';
  return {
    id: post.id,
    title: post.title,
    description: post.description || '',
    category,
    region: post.region?.name || '',
    state: post.region?.state || '',
    coordinates: [post.latitude ?? 0, post.longitude ?? 0] as [number, number],
    tradition: post.tradition ?? '',
    artForm: post.artForm,
    festival: post.festival,
    creatorId: post.userId ?? post.creatorId ?? '',
    createdAt: post.createdAt ?? '',
    tags: post.tags?.map((t: any) => (typeof t === 'string' ? t : (t.name ?? t.tag?.name ?? ''))).filter(Boolean) || [],
    likes: post._count?.likes ?? post.likes ?? 0,
    comments: post._count?.comments ?? post.comments ?? 0,
    saves: post._count?.saves ?? post.saves ?? 0,
    source: {
      media: resolveMedia({
        media: post.media,
        title: post.title,
        transcript,
        category,
        seed: post.id ?? '',
        durationSec: post.source?.media?.durationSec
      }),
      language: post.source?.language || '',
      transcript,
      recordedAt: post.source?.recordedAt || post.createdAt || '',
      recordedBy: post.source?.recordedBy || apiUser?.name || ''
    },
    ai: post.ai ?? { status: 'QUEUED', tags: [] },
    community: post.community ?? { status: 'pending', verifiedBy: 0, notes: [], corrections: [], history: [] },
    relationships: post.relationships ?? [],
    user: apiUser ? {
      id: apiUser.id,
      name: apiUser.name,
      avatarUrl: apiUser.profile?.avatar || '',
      region: apiUser.profile?.location || '',
    } : undefined,
  };
}

export { transformPost };

export const postsApi = {
  getFeed(params?: FeedParams): Promise<CulturalRecord[]> {
    return request({ url: '/posts/feed', method: 'GET', params }).then((data) => data.posts.map(transformPost));
  },

  // Paginated feed — returns records plus the server's pagination metadata so
  // the caller can append further pages.
  getFeedPage(params?: FeedParams, page = 1): Promise<PaginatedRecords> {
    // Join arrays into comma-separated strings for backend query parsing
    const queryParams: Record<string, string> = { page: String(page) };
    if (params?.followedInterests && params.followedInterests.length > 0) {
      queryParams['followedInterests'] = params.followedInterests.join(',');
    }
    if (params?.followedCreators && params.followedCreators.length > 0) {
      queryParams['followedCreators'] = params.followedCreators.join(',');
    }
    return request({ url: '/posts/feed', method: 'GET', params: queryParams }).then((data) => ({
      records: data.posts.map(transformPost),
      pagination: data.pagination as Pagination
    }));
  },

  getFeatured(): Promise<CulturalRecord[]> {
    return request({ url: '/posts/feed', method: 'GET', params: { featured: true } }).then((data) => data.posts.map(transformPost));
  },

  getAll(): Promise<CulturalRecord[]> {
    return request({ url: '/posts/feed', method: 'GET', params: { limit: 100 } }).then((data) => data.posts.map(transformPost));
  },

  getById(id: string): Promise<CulturalRecord> {
    return request({ url: `/posts/${id}`, method: 'GET' }).then(transformPost);
  },

  getRelated(id: string): Promise<CulturalRecord[]> {
    return request<{ related: Array<{ relationType: string; post: any }> }>({ url: `/posts/${id}/related`, method: 'GET' }).then((data) => data.related.map((item) => transformPost(item.post)));
  },

  getComments(id: string): Promise<CulturalComment[]> {
    return request({ url: `/posts/${id}/comments`, method: 'GET' }).then((data) =>
      data.comments.map((c: any) => ({
        id: c.id,
        recordId: id,
        userId: c.user?.id ?? '',
        body: c.content,
        createdAt: c.createdAt,
        likes: c._count?.replies ?? 0,
        user: c.user ? {
          id: c.user.id,
          name: c.user.name,
          avatarUrl: c.user.profile?.avatar || '',
        } : undefined,
      }))
    );
  },

  addComment(id: string, body: string, _userId: string): Promise<CulturalComment> {
    return request({ url: `/posts/${id}/comments`, method: 'POST', data: { content: body } }).then((res: any) => {
      // sendSuccess wraps in { success, message, data }; unwrap if needed
      const c = res?.id ? res : (res?.data ?? res);
      return {
        id: c.id,
        recordId: id,
        userId: c.user?.id ?? c.userId ?? '',
        body: c.content ?? body,
        createdAt: c.createdAt ?? new Date().toISOString(),
        likes: 0,
        user: c.user ? {
          id: c.user.id,
          name: c.user.name,
          avatarUrl: c.user.profile?.avatar || '',
        } : undefined,
      } as CulturalComment;
    });
  },

  getDrafts(): Promise<CulturalRecord[]> {
    return request({ url: '/posts/my/drafts', method: 'GET' }).then((data) => data.posts.map(transformPost));
  },

  deletePost(id: string): Promise<void> {
    return request({ url: `/posts/${id}`, method: 'DELETE' });
  },

  getByCreator(userId: string): Promise<CulturalRecord[]> {
    return request({ url: '/posts/feed', method: 'GET', params: { followedCreators: userId, limit: 50 } }).then((data) => data.posts.map(transformPost));
  },

  createRelation(postId: string, targetPostId: string, relationType: string): Promise<void> {
    return request({ url: `/posts/${postId}/relations`, method: 'POST', data: { targetPostId, relationType } });
  },

  getCulturalMap(): Promise<CulturalRecord[]> {
    return request<Array<{ postId: string; title: string; latitude: number; longitude: number; region: { id: string; name: string; state: string; country: string }; category: { id: string; name: string }; thumbnail: string }>>({ url: '/cultural-map', method: 'GET' }).then((items) =>
      items.map((item) => transformPost({
        id: item.postId,
        title: item.title,
        region: item.region,
        category: item.category,
        latitude: item.latitude,
        longitude: item.longitude,
        media: [{ url: item.thumbnail, type: 'image', filename: '' }]
      }))
    );
  }
};
