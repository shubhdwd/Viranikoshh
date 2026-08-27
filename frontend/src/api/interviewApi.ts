import { request } from './client';
import type { InterviewSession } from '../types/interview';

export const interviewApi = {
  createInterview(data: Omit<InterviewSession, 'status'>): Promise<{ id: string }> {
    return request({ url: '/interviews', method: 'POST', data });
  },

  getById(id: string): Promise<InterviewSession> {
    return request({ url: `/interviews/${id}`, method: 'GET' });
  },

  addQuestions(interviewId: string, questions: string[]): Promise<void> {
    return request({ url: `/interviews/${interviewId}/questions`, method: 'POST', data: { questions } });
  },

  uploadAnswerAudio(interviewId: string, questionId: string, audio: Blob): Promise<{audioUrl: string; questionId: string;}> {
    const form = new FormData();
    form.append('audio', audio, `${questionId}.webm`);
    form.append('questionId', questionId);
    return request({
      url: `/interviews/${interviewId}/audio`,
      method: 'POST',
      data: form
    });
  },

  complete(interviewId: string): Promise<{recordId: string; answersStored: number;}> {
    return request({ url: `/interviews/${interviewId}/complete`, method: 'POST' });
  },

  questionId(topicId: string, index: number): string {
    return `${topicId}-q${index + 1}`;
  }
};
