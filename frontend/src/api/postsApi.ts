import { request } from './client';
import type { CulturalComment, CulturalRecord } from '../types/culture';
import { CATEGORY_NAME_TO_ID } from '../types/culture';

export interface FeedParams {
  followedCreators: string[];
  followedInterests: string[];
  savedIds?: string[];
  likedIds?: string[];
}

function transformPost(post: any): CulturalRecord {
  const apiUser = post.user;
  return {
    id: post.id,
    title: post.title,
    description: post.description ?? '',
    category: CATEGORY_NAME_TO_ID[post.category?.name] || 'folk-song',
    region: post.region?.name || '',
    state: post.region?.state || post.region?.name || '',
    coordinates: [post.latitude ?? 0, post.longitude ?? 0] as [number, number],
    tradition: post.tradition ?? '',
    artForm: post.artForm,
    festival: post.festival,
    creatorId: post.userId ?? post.creatorId ?? '',
    createdAt: post.createdAt ?? '',
    tags: post.tags?.map((t: any) => t.name || t) ?? [],
    likes: post._count?.likes ?? post.likes ?? 0,
    comments: post._count?.comments ?? post.comments ?? 0,
    saves: post._count?.saves ?? post.saves ?? 0,
    source: {
      media: {
        type: (post.media?.[0]?.type as any) || 'image',
        posterUrl: post.media?.[0]?.url || post.source?.media?.posterUrl || '',
        altText: post.media?.[0]?.filename || ''
      },
      language: post.source?.language || '',
      transcript: post.source?.transcript || '',
      recordedAt: post.source?.recordedAt || '',
      recordedBy: post.source?.recordedBy || ''
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
  getFeed(params: FeedParams): Promise<CulturalRecord[]> {
    return request({ url: '/posts/feed', method: 'GET', params }).then((data) => data.posts.map(transformPost));
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
    return request({ url: `/posts/${id}/comments`, method: 'POST', data: { body } });
  },

  getByCreator(userId: string): Promise<CulturalRecord[]> {
    return request({ url: '/posts/feed', method: 'GET', params: { limit: 100 } }).then((data) => data.posts.filter((p: any) => p.userId === userId).map(transformPost));
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
