import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircleIcon, ArrowLeftIcon, LanguagesIcon, MapPinIcon, ScrollTextIcon, SparklesIcon } from 'lucide-react';
import { postsApi } from '../api/postsApi';
import { useAsync } from '../hooks/useAsync';
import { CATEGORY_LABELS } from '../types/culture';
import { CulturalMediaViewer } from '../components/CulturalMediaViewer';
import { CulturalTags } from '../components/CulturalTags';
import { VerificationBadge } from '../components/VerificationBadge';
import { VerificationPanel } from '../components/VerificationPanel';
import { AIProcessingStatus } from '../components/AIProcessingStatus';
import { CommentSection } from '../components/CommentSection';
import { RelatedCulture } from '../components/RelatedCulture';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { PostActions } from '../components/PostActions';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useInteractions } from '../contexts/InteractionsContext';
import { timeAgo } from '../utils/format';
function SourceBlock({
  label,
  children
}: {label: string;children: React.ReactNode;}) {
  return <section className="rounded-card border border-sand-light border-l-[3px] border-l-charcoal bg-paper p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">{label}</p>
      {children}
    </section>;
}
function AIBlock({
  label,
  title,
  children
}: {label: string;title: string;children: React.ReactNode;}) {
  return <section className="rounded-card border border-ai-border border-l-[3px] border-l-ai bg-ai-soft/60 p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai">
        <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-charcoal">{title}</h2>
      {children}
    </section>;
}
export function PostDetail() {
  const {
    id = ''
  } = useParams();
  const navigate = useNavigate();
  const {
    data: record,
    loading,
    error,
    reload
  } = useAsync(() => postsApi.getById(id), [id]);
  const related = useAsync(() => postsApi.getRelated(id), [id]);
  const {
    isFollowingCreator,
    toggleFollowCreator
  } = useInteractions();
  if (loading) {
    return <div className="mx-auto w-full max-w-[1180px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <Skeleton className="aspect-[16/10] w-full rounded-card" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-40 w-full rounded-card" />
          </div>
        </div>
      </div>;
  }
  if (error || !record) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircleIcon className="mx-auto h-6 w-6 text-flagged" aria-hidden="true" />
        <h1 className="mt-3 font-display text-xl font-semibold text-charcoal">This record could not be opened</h1>
        <p className="mt-2 text-sm text-charcoal-muted">{error ?? 'It may have been moved or removed.'}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
          <Link to="/explore" className="inline-flex h-10 items-center rounded-lg bg-terracotta px-4 text-sm font-medium text-paper">
            Back to explore
          </Link>
        </div>
      </div>;
  }
  const creator = record.user ?? { id: record.creatorId, name: '', avatarUrl: '' };
  const following = isFollowingCreator(creator.id);
  const aiReady = record.ai.status === 'COMPLETED';
  return <article className="mx-auto w-full max-w-[1180px] px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <Link to="/home" className="inline-flex items-center gap-1.5 text-[13px] text-charcoal-muted transition-colors duration-150 ease-firm hover:text-terracotta">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to feed
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[1.05fr_1fr] md:gap-7 lg:gap-8">
        {/* 1 · ORIGINAL MEDIA — always first, always largest */}
        <div className="min-w-0 md:sticky md:top-6 md:self-start">
          <div className="overflow-hidden rounded-card border border-sand-light">
            <CulturalMediaViewer media={record.source.media} seed={record.id} excerpt={record.source.transcript} aspect="detail" />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-charcoal-soft">
            <ScrollTextIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Original source · recorded by {record.source.recordedBy} · {timeAgo(record.source.recordedAt)}</span>
          </p>

          {record.source.contributorNote && <p className="mt-3 rounded-card border border-sand-light bg-paper p-3.5 sm:p-4 text-[13px] leading-relaxed text-charcoal-muted break-words">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
                Contributor's note
              </span>
              {record.source.contributorNote}
            </p>}

          <PostActions recordId={record.id} creatorId={record.creatorId} likes={record.likes} comments={record.comments} saves={record.saves} onToggleComments={() => document.getElementById('comments')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })} onDelete={() => navigate('/home')} className="mt-4 rounded-card border border-sand-light bg-paper px-3.5 py-3 sm:px-4" />
        </div>

        <div className="min-w-0 space-y-5">
          {/* 2 · CULTURAL CONTEXT */}
          <header className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-sand-lighter px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-charcoal-muted">
                {CATEGORY_LABELS[record.category]}
              </span>
              <VerificationBadge status={record.community.status} count={record.community.verifiedBy} />
              {!aiReady && <AIProcessingStatus stage={record.ai.status} compact />}
            </div>

            <h1 className="mt-3 font-display text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight text-charcoal break-words">
              {record.title}
            </h1>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-charcoal-muted break-words">{record.description}</p>

            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 rounded-card border border-sand-light bg-paper p-3.5 sm:p-4 text-[13px] sm:grid-cols-2">
              {[['Region', record.region], ['Original language', record.source.language], ['Tradition', record.tradition], ['Art form', record.artForm ?? '—'], ['Festival', record.festival ?? '—'], ['Recorded', new Date(record.source.recordedAt).toLocaleDateString('en-IN', {
              dateStyle: 'medium'
            })]].map(([term, value]) => <div key={term} className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-charcoal-soft">{term}</dt>
                  <dd className="mt-0.5 text-charcoal break-words">{value}</dd>
                </div>)}
            </dl>

            <div className="mt-4 flex items-center gap-3 rounded-card border border-sand-light bg-paper p-3.5 sm:p-4">
              <Link to={`/profile/${creator.id}`} className="shrink-0">
                <Avatar src={creator.avatarUrl} name={creator.name} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/profile/${creator.id}`} className="block truncate text-sm font-medium text-charcoal hover:text-terracotta">
                  {creator.name}
                </Link>
                <p className="flex items-center gap-1 truncate text-[12px] text-charcoal-soft">
                  <MapPinIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{creator.region}{creator.isKnowledgeHolder && ' · Knowledge holder'}</span>
                </p>
              </div>
              <Button size="sm" variant={following ? 'secondary' : 'primary'} onClick={() => toggleFollowCreator(creator.id)} className="shrink-0">
                {following ? 'Following' : 'Follow'}
              </Button>
            </div>
          </header>

          {/* 3 & 4 · ORIGINAL LANGUAGE + TRANSCRIPT */}
          <SourceBlock label={`Original language · ${record.source.language}`}>
            <h2 className="mt-1 font-display text-lg font-semibold text-charcoal">Original transcript</h2>
            <p className="mt-3 whitespace-pre-line font-deva text-[16px] sm:text-[17px] leading-[1.8] text-charcoal break-words">
              {record.source.transcript}
            </p>
            <p className="mt-4 flex items-center gap-1.5 border-t border-sand-lighter pt-3 text-[12px] text-charcoal-soft">
              <LanguagesIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              As spoken and written by the contributor. Never edited by AI.
            </p>
          </SourceBlock>

          {/* 5 & 6 · AI TRANSLATION + SUMMARY */}
          {aiReady ? <>
              <AIBlock label="AI translation" title="English translation">
                <p className="mt-3 whitespace-pre-line text-[14px] sm:text-[15px] leading-relaxed text-charcoal break-words">
                  {record.ai.translation}
                </p>
                <p className="mt-4 border-t border-ai-border pt-3 text-[12px] text-charcoal-muted">
                  Machine-generated from the original transcript above. Where they differ, the original is correct.
                </p>
              </AIBlock>

              <AIBlock label="AI summary" title="What this record contains">
                <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-charcoal break-words">{record.ai.summary}</p>
                <p className="mt-4 border-t border-ai-border pt-3 text-[12px] text-charcoal-muted">
                  Detected language: {record.ai.detectedLanguage}. A summary is an aid to discovery, not a cultural judgement.
                </p>
              </AIBlock>
            </> : <AIProcessingStatus stage={record.ai.status} />}

          {/* 7 · CULTURAL TAGS */}
          <section className="rounded-card border border-sand-light bg-paper p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-charcoal">Cultural tags</h2>
            <p className="mt-1 text-[13px] text-charcoal-muted">
              Grey tags come from the contributor. Indigo tags were suggested by AI.
            </p>
            <CulturalTags tags={record.tags} aiTags={record.ai.tags} className="mt-3" />
          </section>

          {/* 8 · COMMUNITY VERIFICATION */}
          <VerificationPanel record={record} />

          <CommentSection recordId={record.id} />
        </div>
      </div>

      {/* 9 · RELATED CULTURE */}
      <div className="mt-6 sm:mt-8 grid gap-5 lg:grid-cols-2">
        <KnowledgeGraph record={record} relatedRecords={related.data ?? []} />
        <RelatedCulture records={related.data ?? []} loading={related.loading} />
      </div>
    </article>;
}
