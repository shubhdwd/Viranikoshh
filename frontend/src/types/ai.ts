export type AIStage =
'QUEUED' |
'PROCESSING' |
'TRANSCRIBING' |
'TRANSLATING' |
'TAGGING' |
'COMPLETED' |
'FAILED';

export const AI_PIPELINE: Exclude<AIStage, 'FAILED'>[] = [
'QUEUED',
'PROCESSING',
'TRANSCRIBING',
'TRANSLATING',
'TAGGING',
'COMPLETED'];


export const AI_STAGE_COPY: Record<AIStage, {label: string;detail: string;}> = {
  QUEUED: { label: 'Queued', detail: 'Your contribution is in line for processing.' },
  PROCESSING: { label: 'Processing', detail: 'Reading the media and preparing the audio track.' },
  TRANSCRIBING: { label: 'Transcribing', detail: 'Writing down the words in the original language.' },
  TRANSLATING: { label: 'Translating', detail: 'Producing an English translation alongside the source.' },
  TAGGING: { label: 'Tagging', detail: 'Suggesting region, language, tradition and theme tags.' },
  COMPLETED: { label: 'Completed', detail: 'Enrichment finished. The original remains untouched.' },
  FAILED: { label: 'Failed', detail: 'Enrichment could not finish. Your original is still saved.' }
};

/**
 * Machine-generated layer. Sits beside the original source, never replaces it,
 * and can never influence verification status.
 */
export interface AIEnrichment {
  status: AIStage;
  detectedLanguage?: string;
  /** English translation of the original transcript. */
  translation?: string;
  summary?: string;
  tags: string[];
  completedAt?: string;
  failureReason?: string;
}