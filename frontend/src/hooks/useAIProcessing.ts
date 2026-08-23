import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_PIPELINE, type AIStage } from '../types/ai';

interface AIProcessingValue {
  stage: AIStage;
  completed: AIStage[];
  running: boolean;
  failed: boolean;
  start: () => void;
  retry: () => void;
}

const STAGE_MS = 1500;

/**
 * Drives the enrichment state machine. It only ever reports progress — it has
 * no access to the original source fields or to verification status.
 */
export function useAIProcessing(options: {autoStart?: boolean;failAt?: AIStage;} = {}): AIProcessingValue {
  const { autoStart = false, failAt } = options;
  const [index, setIndex] = useState(autoStart ? 0 : -1);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clear = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  useEffect(() => clear, []);

  useEffect(() => {
    if (index < 0 || failed) return;
    const stage = AI_PIPELINE[index];
    if (stage === 'COMPLETED') return;
    if (failAt && stage === failAt) {
      timeoutRef.current = window.setTimeout(() => setFailed(true), STAGE_MS);
      return clear;
    }
    timeoutRef.current = window.setTimeout(() => setIndex((i) => Math.min(i + 1, AI_PIPELINE.length - 1)), STAGE_MS);
    return clear;
  }, [index, failed, failAt]);

  const start = useCallback(() => {
    clear();
    setFailed(false);
    setIndex(0);
  }, []);

  const retry = useCallback(() => {
    clear();
    setFailed(false);
    setIndex(0);
  }, []);

  const stage: AIStage = failed ? 'FAILED' : index < 0 ? 'QUEUED' : (AI_PIPELINE[index] ?? 'FAILED');
  const completed = index < 0 ? [] : AI_PIPELINE.slice(0, index);

  return {
    stage,
    completed,
    running: index >= 0 && !failed && stage !== 'COMPLETED',
    failed,
    start,
    retry
  };
}