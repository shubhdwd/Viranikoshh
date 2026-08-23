import type { CulturalComment } from '../types/culture';

export const comments: CulturalComment[] = [
{ id: 'cm1', recordId: 'r1', userId: 'u3', body: 'The response line at 1:12 is sung only in Madhubani district as far as I have recorded. Wonderful capture.', createdAt: '2026-05-29T08:15:00Z', likes: 34 },
{ id: 'cm2', recordId: 'r1', userId: 'me', body: 'My grandmother sang almost this exact verse in Bengali. I did not know it travelled.', createdAt: '2026-05-30T12:40:00Z', likes: 12 },
{ id: 'cm3', recordId: 'r1', userId: 'u4', body: 'We have a very similar lamp verse at Teej, but sung to a bride rather than a newborn.', createdAt: '2026-05-31T09:05:00Z', likes: 19 },
{ id: 'cm4', recordId: 'r7', userId: 'u1', body: 'Please do not shorten this one. The long pause before the second line is part of the song.', createdAt: '2026-05-26T05:00:00Z', likes: 51 },
{ id: 'cm5', recordId: 'r7', userId: 'u5', body: 'Recorded at two in the morning and you can hear it. Beautiful.', createdAt: '2026-05-26T10:20:00Z', likes: 27 },
{ id: 'cm6', recordId: 'r13', userId: 'u3', body: 'This is the clearest first-person description of the mirror moment I have come across.', createdAt: '2026-05-20T07:30:00Z', likes: 88 },
{ id: 'cm7', recordId: 'r5', userId: 'u6', body: 'The wall is repainted annually — worth adding which month, it varies by hamlet.', createdAt: '2026-05-23T11:00:00Z', likes: 15 },
{ id: 'cm8', recordId: 'r19', userId: 'u3', body: 'Keeping the pauses in was the right call. Thank you for not editing her.', createdAt: '2026-06-02T08:00:00Z', likes: 22 },
{ id: 'cm9', recordId: 'r11', userId: 'u7', body: 'We sing a drought song in Kutch with the same address to the cloud. Different melody entirely.', createdAt: '2026-05-25T14:00:00Z', likes: 17 },
{ id: 'cm10', recordId: 'r9', userId: 'u2', body: 'Same logic in Warli work — the outer line goes last or the figures leak out.', createdAt: '2026-05-16T09:40:00Z', likes: 29 }];


export function commentsFor(recordId: string): CulturalComment[] {
  return comments.filter((c) => c.recordId === recordId);
}