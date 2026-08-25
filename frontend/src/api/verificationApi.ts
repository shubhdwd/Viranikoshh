import { request } from './client';
import { transformPost } from './postsApi';
import type { CulturalRecord } from '../types/culture';
import type { VerificationAction, VerificationEvent } from '../types/verification';

// Community actions are stored as verification rows keyed by status. A single
// `/verify` endpoint backs verify / flag / add-context; corrections have their
// own endpoint.
const ACTION_TO_STATUS: Record<Exclude<VerificationAction, 'correct'>, string> = {
  verify: 'VERIFIED',
  flag: 'FLAGGED',
  context: 'CONTEXT',
};

const STATUS_TO_ACTION: Record<string, VerificationAction> = {
  VERIFIED: 'verify',
  FLAGGED: 'flag',
  CONTEXT: 'context',
};

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

    // Merge whatever the server returns (real id, timestamp, user) onto the
    // optimistic event so the UI shows the persisted record.
    const withServer = (data: any): VerificationEvent => ({
      ...localEvent,
      id: data?.id ?? localEvent.id,
      createdAt: data?.createdAt ?? localEvent.createdAt,
      ...(data?.user ? { user: { id: data.user.id, name: data.user.name } } : {}),
    });

    if (action === 'correct') {
      return request({ url: `/posts/${recordId}/corrections`, method: 'POST', data: { field: 'general', suggestion: note } })
        .then(withServer);
    }

    // verify / flag / context all persist as a verification row.
    return request({
      url: `/posts/${recordId}/verify`,
      method: 'POST',
      data: { status: ACTION_TO_STATUS[action], comment: note },
    }).then(withServer);
  },

  listVerifications(recordId: string): Promise<VerificationEvent[]> {
    return request({ url: `/posts/${recordId}/verifications`, method: 'GET' }).then((data: any) => {
      const fromVerifications: VerificationEvent[] = (data?.verifications ?? []).map((v: any) => ({
        id: v.id,
        action: STATUS_TO_ACTION[v.status] ?? 'verify',
        userId: v.userId,
        note: v.comment ?? undefined,
        createdAt: v.createdAt,
        ...(v.user ? { user: { id: v.user.id, name: v.user.name } } : {}),
      }));
      const fromCorrections: VerificationEvent[] = (data?.corrections ?? []).map((c: any) => ({
        id: c.id,
        action: 'correct' as const,
        userId: c.userId,
        note: c.suggestion ?? undefined,
        createdAt: c.createdAt,
        ...(c.user ? { user: { id: c.user.id, name: c.user.name } } : {}),
      }));
      return [...fromVerifications, ...fromCorrections].sort(
        (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
      );
    });
  },

  flagged(): Promise<CulturalRecord[]> {
    return request({ url: '/verification/flagged', method: 'GET' }).then((data) => data.posts.map(transformPost));
  }
};
