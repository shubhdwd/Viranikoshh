import { request } from './client';
import type { AuthCredentials, CulturalUser, RegistrationDetails } from '../types/user';

export const authApi = {
  login(credentials: AuthCredentials): Promise<{user: CulturalUser; token: string;}> {
    return request({ url: '/auth/login', method: 'POST', data: credentials });
  },

  register(details: RegistrationDetails): Promise<{user: CulturalUser; token: string;}> {
    return request({ url: '/auth/register', method: 'POST', data: details });
  },

  logout(): Promise<void> {
    return request({ url: '/auth/logout', method: 'POST' });
  },

  getMe(): Promise<CulturalUser> {
    return request({ url: '/auth/me', method: 'GET' });
  }
};
