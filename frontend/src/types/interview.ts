import type { AIStage } from './ai';

export interface InterviewTopic {
  id: string;
  title: string;
  description: string;
  /** Questions the assistant proposes once this topic is selected. */
  questions: string[];
}

export interface InterviewAnswer {
  questionIndex: number;
  /** Object URL for the captured recording — the preserved source. */
  audioUrl?: string | undefined;
  durationSec: number;
  skipped: boolean;
}

export interface InterviewSession {
  topicId: string;
  speakerName: string;
  language: string;
  region: string;
  answers: InterviewAnswer[];
  status: AIStage | 'RECORDING';
}