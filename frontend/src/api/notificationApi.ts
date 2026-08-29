import { request } from './client';
import type { CulturalNotification, NotificationKind } from '../types/notification';

const KIND_MAP: Record<string, NotificationKind> = {
  LIKE: 'like',
  like: 'like',
  COMMENT: 'comment',
  comment: 'comment',
  FOLLOW: 'follow',
  follow: 'follow',
  VERIFICATION: 'verification',
  verification: 'verification',
  CORRECTION: 'correction',
  correction: 'correction',
};

export const notificationApi = {
  list(): Promise<CulturalNotification[]> {
    return request({ url: '/notifications', method: 'GET' }).then((data) =>
      data.notifications.map((n: any) => ({
        id: n.id,
        kind: KIND_MAP[n.type] ?? 'like',
        actorId: n.actor?.id ?? n.actorId ?? n.userId,
        actor: n.actor
          ? { id: n.actor.id, name: n.actor.name, avatarUrl: n.actor.avatarUrl ?? n.actor.profile?.avatar }
          : undefined,
        recordId: n.relatedId,
        body: n.message,
        createdAt: n.createdAt,
        read: n.read,
      }))
    );
  },

  markRead(id: string): Promise<void> {
    return request({ url: `/notifications/${id}/read`, method: 'PATCH' });
  },

  markAllRead(): Promise<void> {
    return request({ url: '/notifications/read-all', method: 'PATCH' });
  }
};
