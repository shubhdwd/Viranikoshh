import { request } from './client';
import type { CulturalUser } from '../types/user';

export const usersApi = {
  getById(id: string): Promise<CulturalUser> {
    return request({ url: `/users/${id}`, method: 'GET' }).then((data) => {
      const u = data.user;
      return {
        id: u.id,
        name: u.name,
        handle: u.email?.split('@')[0] ?? u.name?.toLowerCase().replace(/\s+/g, ''),
        avatarUrl: u.profile?.avatar ?? '',
        bio: u.profile?.bio ?? '',
        region: u.profile?.location ?? '',
        state: u.profile?.location ?? '',
        languages: [],
        interests: (u.interests ?? []).map((i: any) => i.name),
        followers: u.counts?.followers ?? 0,
        following: u.counts?.following ?? 0,
        contributions: u.counts?.posts ?? 0,
        isKnowledgeHolder: false,
        role: u.role,
      };
    });
  },

  suggested(excludeIds: string[]): Promise<CulturalUser[]> {
    return request({ url: '/users/suggested', method: 'GET', params: { excludeIds: excludeIds.join(',') } });
  },

  updateProfile(id: string, patch: Partial<CulturalUser>): Promise<CulturalUser> {
    return request({ url: `/users/${id}`, method: 'PATCH', data: patch });
  }
};
