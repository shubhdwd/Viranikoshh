import { request } from './client';

export const interactionsApi = {
  like(recordId: string, liked: boolean): Promise<{recordId: string; liked: boolean;}> {
    return request({ url: `/posts/${recordId}/like`, method: liked ? 'POST' : 'DELETE' });
  },

  save(recordId: string, saved: boolean): Promise<{recordId: string; saved: boolean;}> {
    return request({ url: `/posts/${recordId}/save`, method: saved ? 'POST' : 'DELETE' });
  },

  followUser(userId: string, following: boolean): Promise<{userId: string; following: boolean;}> {
    return request({ url: `/users/${userId}/follow`, method: following ? 'POST' : 'DELETE' });
  },

  followInterest(categoryId: string, following: boolean): Promise<{categoryId: string; following: boolean;}> {
    return request({ url: `/interests/${categoryId}/follow`, method: following ? 'POST' : 'DELETE' });
  },

  getFollowedInterests(): Promise<Array<{ id: string; name: string }>> {
    return request({ url: '/users/me/interests', method: 'GET' }).then((data) => data.interests);
  }
};
