import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, FileTextIcon, ImageIcon, MicIcon, VideoIcon } from 'lucide-react';
import { uploadApi, emptyDraft, type ContributionDraft, type TaxonomyItem } from '../api/uploadApi';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { useScreenInit } from '../useScreenInit.js';
import { type CulturalCategory, type MediaType } from '../types/culture';
import { LANGUAGES, TRADITIONS } from '../data/taxonomy';
import { UploadDropzone } from '../components/UploadDropzone';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { AIProcessingStatus } from '../components/AIProcessingStatus';
import { StepIndicator } from '../components/StepIndicator';
import { AudioPlayer } from '../components/AudioPlayer';
import { CulturalTags } from '../components/CulturalTags';
import { Button } from '../components/ui/Button';
import { Field, Select, TextArea, TextInput } from '../components/ui/Field';
import { Chip } from '../components/ui/Chip';
import { Modal } from '../components/ui/Modal';

const STEPS = ['Select', 'Upload', 'Preview', 'Details', 'Submit', 'AI processing', 'Cultural record'];

const MEDIA_OPTIONS: {
  type: MediaType;
  label: string;
  help: string;
  Icon: typeof MicIcon;
}[] = [{
  type: 'audio',
  label: 'Audio or voice',
  help: 'A song, story or explanation in the original voice.',
  Icon: MicIcon
}, {
  type: 'video',
  label: 'Short video',
  help: 'A performance, ritual or technique being carried out.',
  Icon: VideoIcon
}, {
  type: 'image',
  label: 'Image',
  help: 'Artwork, craft, a wall painting or an object.',
  Icon: ImageIcon
}, {
  type: 'text',
  label: 'Written record',
  help: 'A text you have written down in the original language.',
  Icon: FileTextIcon
}];

export function Create() {
  const navigate = useNavigate();
  const screenInit = useScreenInit();
  const initialStep = typeof screenInit['step'] === 'number' ? screenInit['step'] : 0;
  const [step, setStep] = useState<number>(initialStep);
  const [draft, setDraft] = useState<ContributionDraft>(emptyDraft);
  const [file, setFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [recording, setRecording] = useState<{
    audioUrl: string | null;
    durationSec: number;
  }>({
    audioUrl: null,
    durationSec: 0
  });
  const [useRecorder, setUseRecorder] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [regions, setRegions] = useState<TaxonomyItem[]>([]);
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const ai = useAIProcessing({
    autoStart: initialStep >= 5
  });
  useEffect(() => {
    uploadApi.getTaxonomy().then(({ regions: r, categories: c }) => {
      setRegions(r);
      setCategories(c);
    }).catch(() => { /* taxonomy load is best-effort */ });
  }, []);
  const hasMedia = draft.mediaType === 'text' ? draft.originalTranscript.trim().length > 0 : Boolean(file || recording.audioUrl);
  const patch = (values: Partial<ContributionDraft>) => setDraft((d) => ({
    ...d,
    ...values
  }));
  const metadataValid = draft.title.trim().length > 2 && draft.description.trim().length > 10 && draft.regionId && draft.language && draft.categoryId && draft.originalTranscript.trim().length > 0;
  const canAdvance = [true, hasMedia, hasMedia, metadataValid, true, ai.stage === 'COMPLETED', true][step];
  const goBack = () => {
    if (step === 2 && recording.audioUrl) {
      setAbandonOpen(true);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await uploadApi.submit({
        ...draft,
        ...(file?.name != null ? { fileName: file.name } : {}),
        ...(file?.url != null ? { previewUrl: file.url } : recording.audioUrl != null ? { previewUrl: recording.audioUrl } : {}),
        ...(recording.durationSec ? { durationSec: recording.durationSec } : {})
      });
      setRecordId(result.id);

      const mediaUrl = file?.url ?? recording.audioUrl;
      if (mediaUrl) {
        try {
          const blob = await fetch(mediaUrl).then((r) => r.blob());
          await uploadApi.uploadMedia(result.id, blob, file?.name ?? `${result.id}.webm`);
        } catch {
          /* the record and its metadata are already stored */
        }
      }

      setStep(5);
      ai.start();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <header>
        <h1 className="font-display text-xl font-semibold text-charcoal sm:text-2xl lg:text-[28px]">
          Contribute a cultural record
        </h1>
        <p className="mt-2 text-[13px] text-charcoal-muted sm:text-sm">
          Your media, language and words are stored as given. AI only adds a layer beside them.
        </p>
      </header>

      <StepIndicator steps={STEPS} current={step} className="mt-6 border-y border-sand-light py-4" />

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -6
      }} transition={{
        duration: 0.22,
        ease: [0.23, 1, 0.32, 1]
      }} className="mt-7">
          {/* 1 · SELECT CONTENT */}
          {step === 0 && <section aria-label="Select content type">
              <h2 className="font-display text-lg font-semibold text-charcoal">What are you contributing?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {MEDIA_OPTIONS.map(({
              type,
              label,
              help,
              Icon
            }) => {
              const selected = draft.mediaType === type;
              return <button key={type} type="button" onClick={() => {
                patch({
                  mediaType: type
                });
                setUseRecorder(type === 'audio');
                setFile(null);
              }} className={selected ? 'rounded-card border-2 border-terracotta bg-terracotta-50 p-4 text-left' : 'rounded-card border-2 border-sand-light bg-paper p-4 text-left transition-colors duration-150 ease-firm hover:border-charcoal-soft'}>
                      <Icon className={selected ? 'h-5 w-5 text-terracotta' : 'h-5 w-5 text-charcoal-muted'} aria-hidden="true" />
                      <p className="mt-3 text-sm font-medium text-charcoal">{label}</p>
                      <p className="mt-1 text-[13px] text-charcoal-muted">{help}</p>
                    </button>;
            })}
              </div>
              <p className="mt-4 text-[13px] text-charcoal-muted">
                Recording a knowledge holder instead?{' '}
                <Link to="/virasat-interview" className="font-medium text-terracotta hover:underline">
                  Use the Virasat Interview
                </Link>
                .
              </p>
            </section>}

          {/* 2 · UPLOAD / RECORD */}
          {step === 1 && <section aria-label="Upload or record">
              <h2 className="font-display text-lg font-semibold text-charcoal">
                {draft.mediaType === 'text' ? 'Write the record' : 'Upload or record'}
              </h2>

              {draft.mediaType === 'audio' && <div className="mt-4 flex gap-1.5">
                  <Chip label="Record now" selected={useRecorder} onClick={() => setUseRecorder(true)} />
                  <Chip label="Upload a file" selected={!useRecorder} onClick={() => setUseRecorder(false)} />
                </div>}

              <div className="mt-4">
                {draft.mediaType === 'text' ? <Field label="Original text" hint="In the original language and script" required>
                    <TextArea value={draft.originalTranscript} onChange={(e) => patch({
                originalTranscript: e.target.value
              })} rows={8} placeholder="Write it exactly as it is spoken or sung…" className="font-deva text-[16px] leading-relaxed" />
                  </Field> : draft.mediaType === 'audio' && useRecorder ? <VoiceRecorder onChange={setRecording} hint="Find a quiet place and speak naturally." /> : <UploadDropzone mediaType={draft.mediaType} file={file} onFile={setFile} />}
              </div>
            </section>}

          {/* 3 · PREVIEW */}
          {step === 2 && <section aria-label="Preview">
              <h2 className="font-display text-lg font-semibold text-charcoal">Check your original</h2>
              <p className="mt-1 text-sm text-charcoal-muted">This is what will be preserved as the source.</p>

              <div className="mt-4 rounded-card border border-sand-light bg-paper p-5">
                {recording.audioUrl ? <AudioPlayer src={recording.audioUrl} durationSec={recording.durationSec} seed="draft" label="Your recording" className="border-0 p-0" /> : file && draft.mediaType === 'image' ? <img src={file.url} alt="Preview of the contribution" className="w-full rounded-lg object-cover" /> : file && draft.mediaType === 'video' ? <video src={file.url} controls className="w-full rounded-lg" /> : file ? <p className="text-sm text-charcoal">{file.name}</p> : <p className="whitespace-pre-line font-deva text-[17px] leading-[1.9] text-charcoal">
                    {draft.originalTranscript}
                  </p>}
              </div>
            </section>}

          {/* 4 · METADATA */}
          {step === 3 && <section aria-label="Add metadata" className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-charcoal">Describe the record</h2>

              <Field label="Title" required>
                <TextInput value={draft.title} onChange={(e) => patch({
              title: e.target.value
            })} placeholder="Sohar — the birth song of Mithila" />
              </Field>

              <Field label="Description" hint="What is it, and when is it performed?" required>
                <TextArea value={draft.description} onChange={(e) => patch({
              description: e.target.value
            })} rows={3} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Region" required>
                  <Select value={draft.regionId} onChange={(e) => {
                    const id = e.target.value;
                    const match = regions.find((r) => r.id === id);
                    patch({ regionId: id, region: match?.name ?? '' });
                  }}>
                    <option value="">Choose a region</option>
                    {regions.map((r) => <option key={r.id} value={r.id}>
                        {r.name}
                      </option>)}
                  </Select>
                </Field>
                <Field label="Original language" required>
                  <Select value={draft.language} onChange={(e) => patch({
                language: e.target.value
              })}>
                    <option value="">Choose a language</option>
                    {LANGUAGES.map((l) => <option key={l} value={l}>
                        {l}
                      </option>)}
                  </Select>
                </Field>
                <Field label="Cultural category" required>
                  <Select value={draft.categoryId} onChange={(e) => {
                    const id = e.target.value;
                    const match = categories.find((c) => c.id === id);
                    patch({ categoryId: id, category: (match?.name ?? '') as CulturalCategory });
                  }}>
                    <option value="">Choose a category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>
                        {c.name}
                      </option>)}
                  </Select>
                </Field>
                <Field label="Tradition">
                  <Select value={draft.tradition} onChange={(e) => patch({
                tradition: e.target.value
              })}>
                    <option value="">Not sure</option>
                    {TRADITIONS.map((t) => <option key={t} value={t}>
                        {t}
                      </option>)}
                  </Select>
                </Field>
              </div>

              {draft.mediaType !== 'text' && <Field label="Original transcript" hint="In the original script, if you can" required>
                  <TextArea value={draft.originalTranscript} onChange={(e) => patch({
              originalTranscript: e.target.value
            })} rows={4} className="font-deva text-[16px] leading-relaxed" placeholder="Write down the words as they are spoken…" />
                </Field>}

              <Field label="Your tags" hint="Press Enter to add">
                <TextInput value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => {
              if (e.key === 'Enter' && tagInput.trim()) {
                e.preventDefault();
                patch({
                  tags: [...draft.tags, tagInput.trim()]
                });
                setTagInput('');
              }
            }} placeholder="birth ritual, women's song…" />
              </Field>
              {draft.tags.length > 0 && <CulturalTags tags={draft.tags} linked={false} />}

              <Field label="Note for the community" hint="Optional">
                <TextArea value={draft.contributorNote} onChange={(e) => patch({
              contributorNote: e.target.value
            })} rows={2} placeholder="Who is singing, where it was recorded, anything a listener should know." />
              </Field>
            </section>}

          {/* 5 · SUBMIT */}
          {step === 4 && <section aria-label="Submit">
              <h2 className="font-display text-lg font-semibold text-charcoal">Ready to submit</h2>
              <p className="mt-1 text-sm text-charcoal-muted">
                Your original is stored first. AI enrichment runs afterwards and cannot alter it.
              </p>

              {submitError && <div role="alert" className="mt-3 rounded-card border border-red-300 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}

              <dl className="mt-4 divide-y divide-sand-lighter rounded-card border border-sand-light bg-paper">
                {[['Type', draft.mediaType], ['Title', draft.title], ['Region', draft.region], ['Language', draft.language], ['Category', draft.category || '—'], ['Tradition', draft.tradition || '—'], ['Tags', draft.tags.join(', ') || '—']].map(([term, value]) => <div key={term} className="flex gap-4 px-4 py-3">
                    <dt className="w-28 shrink-0 text-[12px] uppercase tracking-[0.12em] text-charcoal-soft">{term}</dt>
                    <dd className="text-[13px] text-charcoal">{value}</dd>
                  </div>)}
              </dl>

              <Button size="lg" className="mt-5 w-full" loading={submitting} onClick={submit}>
                Submit and preserve the original
              </Button>
            </section>}

          {/* 6 · AI PROCESSING */}
          {step === 5 && <section aria-label="AI processing">
              <h2 className="font-display text-lg font-semibold text-charcoal">Enriching your contribution</h2>
              <p className="mt-1 text-sm text-charcoal-muted">
                You can leave this page — processing continues in the background.
              </p>
              <AIProcessingStatus stage={ai.stage} onRetry={ai.retry} className="mt-4" />
            </section>}

          {/* 7 · CULTURAL RECORD */}
          {step === 6 && <section aria-label="Cultural record created" className="text-center">
              <CheckCircle2Icon className="mx-auto h-10 w-10 text-verified" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold text-charcoal">Your cultural record is live</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-charcoal-muted">
                "{draft.title}" is now discoverable. It will show as <strong>Pending verification</strong> until members of
                the community who know this tradition review it.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button onClick={() => navigate('/home')}>Back to the feed</Button>
              </div>
              <p className="mt-6 text-[12px] text-charcoal-soft">Record reference: {recordId}</p>
            </section>}
        </motion.div>
      </AnimatePresence>

      {step < 5 && <div className="mt-8 flex items-center justify-between border-t border-sand-light pt-5">
          <Button variant="ghost" onClick={goBack} disabled={step === 0}>
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
          {step < 4 && <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Continue
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>}
        </div>}

      {step === 5 && <div className="mt-8 flex justify-end border-t border-sand-light pt-5">
          <Button onClick={() => setStep(6)} disabled={ai.stage !== 'COMPLETED'}>
            View cultural record
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>}

      <Modal open={abandonOpen} onClose={() => setAbandonOpen(false)} title="Discard this recording?" description="Going back will clear the audio you just captured. This cannot be undone." footer={<>
            <Button variant="secondary" onClick={() => setAbandonOpen(false)}>
              Keep recording
            </Button>
            <Button variant="danger" onClick={() => {
        setRecording({
          audioUrl: null,
          durationSec: 0
        });
        setAbandonOpen(false);
        setStep(1);
      }}>
              Discard
            </Button>
          </>}>
        <p className="text-sm text-charcoal-muted">
          If the recording holds someone's voice, consider submitting it first — you can always add details later.
        </p>
      </Modal>
    </div>;
}
