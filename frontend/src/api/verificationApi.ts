import { request } from './client';
import { transformPost } from './postsApi';
import type { CulturalRecord } from '../types/culture';
import type { VerificationAction, VerificationEvent } from '../types/verification';

export const verificationApi = {
  queue(): Promise<CulturalRecord[]> {
    return request({ url: '/verification/queue', method: 'GET' }).then((data) => data.posts.map(transformPost));
  },

  submit(recordId: string, action: VerificationAction, note: string, userId: string): Promise<VerificationEvent> {
    const localEvent: VerificationEvent = {
      id: `local-${Date.now()}`,
      action,
      userId,
      note,
      createdAt: new Date().toISOString(),
    };

    if (action === 'verify') {
      return request({ url: `/posts/${recordId}/verify`, method: 'POST', data: { status: 'VERIFIED', comment: note } })
        .then((data: any) => ({
          ...localEvent,
          id: data?.id ?? localEvent.id,
          ...(data?.user ? { user: { id: data.user.id, name: data.user.name } } : {}),
        }));
    }

    if (action === 'correct') {
      return request({ url: `/posts/${recordId}/corrections`, method: 'POST', data: { field: 'general', suggestion: note } })
        .then((data: any) => ({
          ...localEvent,
          id: data?.id ?? localEvent.id,
          ...(data?.user ? { user: { id: data.user.id, name: data.user.name } } : {}),
        }));
    }

    // 'context' and 'flag' have no dedicated backend endpoint yet — keep as a
    // local optimistic event so the UI still reflects the user's action.
    return Promise.resolve(localEvent);
  },

  listVerifications(recordId: string): Promise<VerificationEvent[]> {
    return request({ url: `/posts/${recordId}/verifications`, method: 'GET' }).then((data) => data.verifications);
  },

  flagged(): Promise<CulturalRecord[]> {
    return request({ url: '/verification/flagged', method: 'GET' }).then((data) => data.posts.map(transformPost));
  }
};
