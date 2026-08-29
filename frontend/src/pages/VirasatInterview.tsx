import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, Loader2Icon, SparklesIcon } from 'lucide-react';
import { interviewApi } from '../api/interviewApi';
import { postsApi } from '../api/postsApi';
import { useAsync } from '../hooks/useAsync';
import { useAIProcessing } from '../hooks/useAIProcessing';
import type { InterviewAnswer } from '../types/interview';
import { useScreenInit } from '../useScreenInit.js';
import { interviewTopics } from '../data/interviewTopics';
import { LANGUAGES, REGIONS } from '../data/taxonomy';
import { InterviewQuestionCard } from '../components/InterviewQuestionCard';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { AIProcessingStatus } from '../components/AIProcessingStatus';
import { StepIndicator } from '../components/StepIndicator';
import { Button } from '../components/ui/Button';
import { Field, Select, TextInput } from '../components/ui/Field';

type Phase = 'topic' | 'generating' | 'interview' | 'processing' | 'result' | 'failed';

const STEPS = ['Subject', 'Questions', 'Record answers', 'AI processing', 'Cultural record'];
const PHASE_STEP: Record<Phase, number> = {
  topic: 0,
  generating: 1,
  interview: 2,
  processing: 3,
  result: 4,
  failed: 1
};

export function VirasatInterview() {
  const navigate = useNavigate();
  const screenInit = useScreenInit();
  const initialPhase = (screenInit['phase'] as Phase) ?? 'topic';
  const seeded = initialPhase !== 'topic';
  const ai = useAIProcessing({
    autoStart: initialPhase === 'processing' || initialPhase === 'result'
  });
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(seeded ? interviewTopics[0]!.id : null);
  const [speakerName, setSpeakerName] = useState(seeded ? 'Sarojini Sen' : '');
  const [language, setLanguage] = useState('Maithili');
  const [region, setRegion] = useState(REGIONS[0] ?? '');
  const [questions, setQuestions] = useState<string[]>(seeded ? interviewTopics[0]!.questions : []);
  const [index, setIndex] = useState(seeded ? 2 : 0);
  const [answers, setAnswers] = useState<InterviewAnswer[]>(seeded ? [{
    questionIndex: 0,
    durationSec: 132,
    skipped: false
  }, {
    questionIndex: 1,
    durationSec: 208,
    skipped: false
  }] : []);
  const [current, setCurrent] = useState<{
    audioUrl: string | null;
    durationSec: number;
  }>({
    audioUrl: null,
    durationSec: 0
  });
  const [recorderKey, setRecorderKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createdRecordId, setCreatedRecordId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const topic = interviewTopics.find((t) => t.id === topicId);

  const createdRecord = useAsync(
    () => createdRecordId ? postsApi.getById(createdRecordId) : Promise.resolve(null),
    [createdRecordId]
  );

  const beginInterview = async () => {
    if (!topicId) return;
    setPhase('generating');
    setError(null);
    try {
      const interview = await interviewApi.createInterview({
        topicId: topicId ?? '',
        speakerName,
        language,
        region: region ?? '',        answers: []
      });
      setInterviewId(interview.id);
      const selectedTopic = interviewTopics.find((t) => t.id === topicId);
      if (!selectedTopic) throw new Error('Topic not found');
      const createdQuestions = await interviewApi.addQuestions(interview.id, selectedTopic.questions);
      setQuestionIds(createdQuestions.map((q) => q.id));
      setQuestions(selectedTopic.questions);
      setIndex(0);
      setAnswers([]);
      setPhase('interview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to prepare questions. Please try again.');
      setPhase('failed');
    }
  };

  const captureCurrent = (skipped: boolean): InterviewAnswer[] => {
    const entry: InterviewAnswer = {
      questionIndex: index,
      audioUrl: current.audioUrl ?? undefined,
      durationSec: current.durationSec,
      skipped: skipped || !current.audioUrl
    };
    const next = [...answers.filter((a) => a.questionIndex !== index), entry];
    setAnswers(next);
    setCurrent({
      audioUrl: null,
      durationSec: 0
    });
    setRecorderKey((k) => k + 1);
    return next;
  };

  const uploadCurrent = async (audioUrl: string) => {
    if (!topicId || !interviewId) return;
    const realQuestionId = questionIds[index];
    if (!realQuestionId) return;
    try {
      const blob = await fetch(audioUrl).then((r) => r.blob());
      await interviewApi.uploadAnswerAudio(interviewId, realQuestionId, blob);
    } catch {
      /* the local recording stays available either way */
    }
  };

  const goNext = async (skipped: boolean) => {
    if (!skipped && current.audioUrl) await uploadCurrent(current.audioUrl);
    captureCurrent(skipped);
    if (index + 1 < questions.length) setIndex((i) => i + 1);
  };

  const finish = async () => {
    if (current.audioUrl) await uploadCurrent(current.audioUrl);
    captureCurrent(!current.audioUrl);
    setPhase('processing');
    ai.start();
    if (interviewId) {
      try {
        await interviewApi.complete(interviewId);
      } catch {
        /* complete may fail but the interview still happened */
      }
    }
  };

  const handlePublish = useCallback(async (published: boolean) => {
    if (!interviewId) return;
    setPublishing(true);
    setPublishStatus(null);
    try {
      const result = await interviewApi.publishInterview(interviewId, {
        published,
        title: topic?.title ?? '',
        description: `Interview with ${speakerName} about ${topic?.title}`,
      });
      setCreatedRecordId(result.recordId);
      setPublishStatus(published ? 'Published!' : 'Saved as draft.');
    } catch (e) {
      setPublishStatus(e instanceof Error ? e.message : 'Failed to save. Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [interviewId, topic, speakerName]);

  const answeredCount = answers.filter((a) => !a.skipped).length + (current.audioUrl ? 1 : 0);
  const isLastQuestion = index + 1 >= questions.length;

  return <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:py-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">Virasat Interview</p>
        <h1 className="mt-2 font-display text-xl font-semibold leading-tight text-charcoal sm:text-2xl lg:text-[30px]">
          Record what someone remembers
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-charcoal-muted sm:text-[15px]">
          Pick a subject and we suggest questions. Your speaker answers out loud in their own language, one question at
          a time — you can answer just one and finish, or keep going. Their recording is kept as the record.
        </p>
      </header>

      <StepIndicator steps={STEPS} current={PHASE_STEP[phase]} className="mt-7 border-y border-sand-light py-4" />

      <AnimatePresence mode="wait">
        <motion.div key={phase + index} initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -6
      }} transition={{
        duration: 0.24,
        ease: [0.23, 1, 0.32, 1]
      }} className="mt-8">
          {phase === 'topic' && <section aria-label="Choose a topic" className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-charcoal">Who are you recording?</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Their name" required className="sm:col-span-2">
                    <TextInput value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} placeholder="Sarojini Sen" />
                  </Field>
                  <Field label="Language they will speak" required>
                    <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                      {LANGUAGES.map((l) => <option key={l} value={l}>
                          {l}
                        </option>)}
                    </Select>
                  </Field>
                  <Field label="Region" required>
                    <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                      {REGIONS.map((r) => <option key={r} value={r}>
                          {r}
                        </option>)}
                    </Select>
                  </Field>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold text-charcoal">Choose a subject</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {interviewTopics.map((t) => {
                const selected = topicId === t.id;
                return <button key={t.id} type="button" onClick={() => setTopicId(t.id)} className={selected ? 'rounded-card border-2 border-terracotta bg-terracotta-50 p-4 text-left' : 'rounded-card border-2 border-sand-light bg-paper p-4 text-left transition-colors duration-150 ease-firm hover:border-charcoal-soft'}>
                        <p className="font-display text-[15px] font-semibold text-charcoal">{t.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-charcoal-muted">{t.description}</p>
                      </button>;
              })}
                </div>
              </div>

              <Button size="lg" className="w-full" disabled={!topicId || speakerName.trim().length < 2} onClick={beginInterview}>
                Prepare the questions
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </section>}

          {phase === 'generating' && <section aria-label="Preparing questions" className="rounded-card border border-ai-border bg-ai-soft/60 p-8 text-center">
              <SparklesIcon className="mx-auto h-6 w-6 text-ai" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-semibold text-charcoal">Writing questions</h2>
              <p className="mt-1.5 text-sm text-charcoal-muted">
                Drafting a set for "{topic?.title}". Skip any that don't fit.
              </p>
              <Loader2Icon className="mx-auto mt-5 h-5 w-5 animate-spin text-ai" aria-hidden="true" />
            </section>}

          {phase === 'failed' && <section aria-label="Question generation failed" className="rounded-card border border-flagged/30 bg-flagged-soft p-8 text-center">
              <p className="font-display text-lg font-semibold text-flagged">Something went wrong</p>
              <p className="mt-2 text-sm text-charcoal-muted">{error}</p>
              <Button className="mt-5" onClick={() => setPhase('topic')}>
                Go back and try again
              </Button>
            </section>}

          {phase === 'interview' && questions.length > 0 && <section aria-label="Interview">
              <InterviewQuestionCard index={index} total={questions.length} question={questions[index] ?? ''} answered={Boolean(current.audioUrl)}>
                <VoiceRecorder key={recorderKey} onChange={setCurrent} hint={`Press record and let ${speakerName || 'your speaker'} answer in ${language}. There is no time limit.`} />
              </InterviewQuestionCard>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="order-1">
                  <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                  Back
                </Button>

                <div className="order-3 flex w-full gap-2 sm:order-2 sm:ml-auto sm:w-auto">
                  {!isLastQuestion && <Button variant="ghost" onClick={() => goNext(true)} className="flex-1 sm:flex-none">
                      Skip
                    </Button>}
                  {!isLastQuestion && <Button variant="secondary" onClick={() => goNext(false)} className="flex-1 sm:flex-none">
                      Next
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </Button>}
                  <Button onClick={finish} className="flex-1 sm:flex-none">
                    <CheckCircle2Icon className="h-4 w-4" aria-hidden="true" />
                    Finish
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-center text-[12px] leading-relaxed text-charcoal-soft">
                {answeredCount === 0 ? `${questions.length} suggested questions — answer as few or as many as you like.` : `${answeredCount} answer${answeredCount === 1 ? '' : 's'} recorded. You can finish here at any point.`}
              </p>
            </section>}

          {phase === 'processing' && <section aria-label="Processing the interview">
              <AIProcessingStatus stage={ai.stage} onRetry={ai.retry} />
              <div className="mt-5 flex justify-end">
                <Button disabled={ai.stage !== 'COMPLETED'} onClick={() => setPhase('result')}>
                  View the cultural record
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>}

          {phase === 'result' && <section aria-label="Interview record" className="space-y-5">
              <div className="rounded-card border border-verified/20 bg-verified-soft p-5 text-center">
                <CheckCircle2Icon className="mx-auto h-8 w-8 text-verified" aria-hidden="true" />
                <h2 className="mt-3 font-display text-xl font-semibold text-charcoal">
                  {speakerName}'s interview is preserved
                </h2>
                <p className="mt-1.5 text-sm text-charcoal-muted">
                  {answeredCount} recorded {answeredCount === 1 ? 'answer' : 'answers'}, kept in {language}, awaiting community review.
                </p>
                {createdRecordId && (
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate(`/post/${createdRecordId}`)}>
                    View the cultural record
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>

              <div className="rounded-card border border-sand-light border-l-[3px] border-l-charcoal bg-paper p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
                  Questions & answers
                </p>
                <div className="mt-3 space-y-3">
                  {questions.map((q, i) => {
                    const answer = answers.find((a) => a.questionIndex === i);
                    return <div key={i} className="text-left">
                      <p className="text-[13px] font-medium text-charcoal">{q}</p>
                      {answer && !answer.skipped && <p className="mt-1 text-[13px] text-verified">
                          Recorded answer ({Math.floor((answer.durationSec || 0) / 60)} min {(answer.durationSec || 0) % 60} sec)
                        </p>}
                      {answer && answer.skipped && <p className="mt-1 text-[13px] text-charcoal-soft">Skipped</p>}
                    </div>;
                  })}
                </div>
              </div>

              {createdRecord.data ? (
                <div className="rounded-card border border-ai-border border-l-[3px] border-l-ai bg-ai-soft/60 p-5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai">
                    <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    AI translation & summary
                  </p>
                  {createdRecord.data.ai?.summary && (
                    <p className="mt-3 text-[14px] leading-relaxed text-charcoal-muted">
                      {createdRecord.data.ai.summary}
                    </p>
                  )}
                  {createdRecord.data.source?.transcript && (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">Transcript</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-charcoal">{createdRecord.data.source.transcript}</p>
                    </div>
                  )}
                  {createdRecord.data.tags && createdRecord.data.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {createdRecord.data.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-ai/10 px-2.5 py-1 text-[11px] font-medium text-ai">{tag}</span>
                      ))}
                    </div>
                  )}
                  {!createdRecord.data.ai?.summary && !createdRecord.data.source?.transcript && (
                    <p className="mt-3 text-[14px] leading-relaxed text-charcoal-muted">
                      AI processing will add transcript, translation and tags once the interview is fully processed.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-card border border-ai-border border-l-[3px] border-l-ai bg-ai-soft/60 p-5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai">
                    <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    AI translation & summary
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-charcoal-muted">
                    AI processing will add transcript, translation and tags once the interview is fully processed.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {createdRecordId ? (
                  <Button onClick={() => navigate(`/post/${createdRecordId}`)}>
                    View the cultural record
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => handlePublish(false)} disabled={publishing}>
                      Save as Draft
                    </Button>
                    <Button onClick={() => handlePublish(true)} disabled={publishing}>
                      {publishing ? 'Publishing...' : 'Publish'}
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={() => navigate('/home')}>Back to the feed</Button>
              </div>
              {publishStatus && (
                <p className="mt-2 text-center text-[13px] text-verified">{publishStatus}</p>
              )}
            </section>}
        </motion.div>
      </AnimatePresence>
    </div>;
}
