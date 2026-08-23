export type NotificationKind = 'follow' | 'like' | 'comment' | 'verification' | 'correction';

export interface CulturalNotification {
  id: string;
  kind: NotificationKind;
  actorId: string;
  actor?: { id: string; name: string; avatarUrl?: string };
  recordId?: string;
  body: string;
  createdAt: string;
  read: boolean;
}