import { request } from './client';
import type { CulturalNotification, NotificationKind } from '../types/notification';

export const notificationApi = {
  list(): Promise<CulturalNotification[]> {
    return request({ url: '/notifications', method: 'GET' }).then((data) => data.notifications.map((n: any) => ({
      id: n.id,
      kind: n.type as NotificationKind,
      actorId: n.actor?.id ?? n.userId,
      actor: n.actor ? { id: n.actor.id, name: n.actor.name, avatarUrl: n.actor.avatarUrl } : undefined,
      recordId: n.relatedId,
      body: n.message,
      createdAt: n.createdAt,
      read: n.read
    })));
  },

  markRead(id: string): Promise<void> {
    return request({ url: `/notifications/${id}/read`, method: 'PATCH' });
  },

  markAllRead(): Promise<void> {
    return request({ url: '/notifications/read-all', method: 'PATCH' });
  }
};
