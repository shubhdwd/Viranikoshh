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
        interests: (u.interests ?? []).map((i: any) => (typeof i === 'string' ? i : i.name)),
        followers: u._count?.followers ?? u.counts?.followers ?? 0,
        following: u._count?.following ?? u.counts?.following ?? 0,
        contributions: u._count?.posts ?? u.counts?.posts ?? 0,
        isKnowledgeHolder: false,
        role: u.role,
      };
    });
  },

  suggested(excludeIds: string[]): Promise<CulturalUser[]> {
    return request<{ id: string; name: string; avatarUrl: string | null; bio: string | null; postCount: number }[]>({
      url: '/users/suggested',
      method: 'GET',
      params: { excludeIds: excludeIds.join(',') },
    }).then((users) =>
      users.map((u) => ({
        id: u.id,
        name: u.name,
        handle: u.name.toLowerCase().replace(/\s+/g, ''),
        avatarUrl: u.avatarUrl ?? '',
        bio: u.bio ?? '',
        region: '',
        state: '',
        languages: [],
        interests: [],
        followers: 0,
        following: 0,
        contributions: u.postCount,
        isKnowledgeHolder: false,
      }))
    );
  },

  updateProfile(_id: string, patch: Partial<CulturalUser>): Promise<CulturalUser> {
    return request<any>({ url: '/users/me', method: 'PATCH', data: patch }).then((data) => ({
      id: data.id,
      name: data.name ?? '',
      handle: data.email?.split('@')[0] ?? data.name?.toLowerCase().replace(/\s+/g, '') ?? '',
      avatarUrl: data.profile?.avatar ?? '',
      bio: data.profile?.bio ?? '',
      region: data.profile?.location ?? '',
      state: data.profile?.location ?? '',
      languages: data.profile?.languages ?? [],
      interests: [],
      followers: 0,
      following: 0,
      contributions: 0,
      isKnowledgeHolder: false,
      role: data.role,
    }));
  }
};
