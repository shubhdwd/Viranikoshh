import type { CulturalNotification } from '../types/notification';

export const notifications: CulturalNotification[] = [
{ id: 'nt1', kind: 'verification', actorId: 'u3', recordId: 'r19', body: 'reviewed your recording “My grandmother on the village before the embankment” and marked it verified.', createdAt: '2026-06-03T09:20:00Z', read: false },
{ id: 'nt2', kind: 'comment', actorId: 'u3', recordId: 'r19', body: 'commented: “Keeping the pauses in was the right call.”', createdAt: '2026-06-02T08:00:00Z', read: false },
{ id: 'nt3', kind: 'correction', actorId: 'u6', recordId: 'r20', body: 'suggested a correction to the language field on “The harvest count song of Bastar”.', createdAt: '2026-06-03T07:55:00Z', read: false },
{ id: 'nt4', kind: 'follow', actorId: 'u1', body: 'started following you.', createdAt: '2026-06-02T17:10:00Z', read: true },
{ id: 'nt5', kind: 'like', actorId: 'u4', recordId: 'r19', body: 'liked your contribution.', createdAt: '2026-06-01T20:45:00Z', read: true },
{ id: 'nt6', kind: 'like', actorId: 'u7', recordId: 'r20', body: 'liked your contribution.', createdAt: '2026-05-30T13:00:00Z', read: true },
{ id: 'nt7', kind: 'verification', actorId: 'u5', recordId: 'r20', body: 'added community context to a record you follow.', createdAt: '2026-05-29T11:25:00Z', read: true },
{ id: 'nt8', kind: 'follow', actorId: 'u6', body: 'started following you.', createdAt: '2026-05-28T09:00:00Z', read: true }];