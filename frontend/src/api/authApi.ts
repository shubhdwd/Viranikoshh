import { request } from './client';
import type { AuthCredentials, CulturalUser, RegistrationDetails } from '../types/user';

function toCulturalUser(raw: any): CulturalUser {
  return {
    id: raw.id,
    name: raw.name ?? '',
    handle: raw.email?.split('@')[0] ?? raw.name?.toLowerCase().replace(/\s+/g, '') ?? '',
    avatarUrl: raw.profile?.avatar ?? '',
    bio: raw.profile?.bio ?? '',
    region: raw.profile?.location ?? raw.profile?.region ?? '',
    state: raw.profile?.location ?? '',
    languages: raw.profile?.languages ?? [],
    interests: raw.interests?.map((i: any) => i.name) ?? [],
    followers: raw._count?.followers ?? 0,
    following: raw._count?.following ?? 0,
    contributions: raw._count?.posts ?? 0,
    isKnowledgeHolder: false,
    role: raw.role,
  };
}

export const authApi = {
  login(credentials: AuthCredentials): Promise<{user: CulturalUser; token: string;}> {
    return request<{ user: any; token: string }>({ url: '/auth/login', method: 'POST', data: credentials })
      .then((data) => ({ user: toCulturalUser(data.user), token: data.token }));
  },

  register(details: RegistrationDetails): Promise<{user: CulturalUser; token: string;}> {
    return request<{ user: any; token: string }>({ url: '/auth/register', method: 'POST', data: details })
      .then((data) => ({ user: toCulturalUser(data.user), token: data.token }));
  },

  logout(): Promise<void> {
    return request({ url: '/auth/logout', method: 'POST' });
  },

  getMe(): Promise<CulturalUser> {
    return request<{ user: any }>({ url: '/auth/me', method: 'GET' })
      .then((data) => toCulturalUser(data));
  }
};
