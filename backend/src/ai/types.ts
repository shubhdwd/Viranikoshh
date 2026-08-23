export interface TranscriptionResult {
  text: string;
  languageCode: string;
  languageName: string;
  confidence: number;
}

export interface TranslationResult {
  text: string;
  targetLanguageCode: string;
  targetLanguageName: string;
}

export interface TagExtractionResult {
  summary: string;
  tags: string[];
  category: string;
  region?: string;
}

export type PipelineStep =
  | "QUEUED"
  | "PROCESSING"
  | "TRANSCRIBING"
  | "TRANSLATING"
  | "TAGGING"
  | "COMPLETED"
  | "FAILED";

export interface PipelineContext {
  jobId: string;
  postId: string;
  mediaUrl: string;
  mediaType: string;
  mimeType: string;
}
