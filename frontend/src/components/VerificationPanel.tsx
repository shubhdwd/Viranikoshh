import { useEffect, useState } from 'react';
import { BadgeCheckIcon, FlagIcon, MessageSquarePlusIcon, PencilLineIcon, UsersIcon } from 'lucide-react';
import type { CulturalRecord } from '../types/culture';
import type { VerificationAction, VerificationEvent } from '../types/verification';
import { VERIFICATION_ACTION_LABELS, VERIFICATION_LABELS } from '../types/verification';
import { verificationApi } from '../api/verificationApi';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { TextArea } from './ui/Field';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';
const ACTIONS: {
  id: VerificationAction;
  Icon: typeof BadgeCheckIcon;
  help: string;
}[] = [{
  id: 'verify',
  Icon: BadgeCheckIcon,
  help: 'Confirm this record is accurate to the tradition as you know it.'
}, {
  id: 'correct',
  Icon: PencilLineIcon,
  help: 'Propose a change to a specific field. The original stays as it is.'
}, {
  id: 'context',
  Icon: MessageSquarePlusIcon,
  help: 'Add regional or historical context others should read alongside it.'
}, {
  id: 'flag',
  Icon: FlagIcon,
  help: 'Raise a concern about consent, attribution or misrepresentation.'
}];
interface VerificationPanelProps {
  record: CulturalRecord;
  className?: string;
}
export function VerificationPanel({
  record,
  className
}: VerificationPanelProps) {
  const {
    user,
    isAuthenticated
  } = useAuth();
  const [open, setOpen] = useState<VerificationAction | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [localEvents, setLocalEvents] = useState<VerificationEvent[]>([]);
  const [serverEvents, setServerEvents] = useState<VerificationEvent[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // Load the persisted verification history (verify / flag / context / correct)
  // so it survives refreshes — the feed payload doesn't carry it.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    verificationApi
      .listVerifications(record.id)
      .then((events) => {
        if (!cancelled) setServerEvents(events);
      })
      .catch(() => {
        /* history is supplementary — ignore load failures */
      });
    return () => {
      cancelled = true;
    };
  }, [record.id, isAuthenticated]);

  const history = [...record.community.history, ...serverEvents, ...localEvents].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const isOwner = user?.id === record.creatorId;
  // Number of people who have actually confirmed this record.
  const verifiedBy = Math.max(record.community.verifiedBy, history.filter((event) => event.action === 'verify').length);
  // You cannot suggest a correction to your own record; everything else stays.
  const availableActions = isOwner ? ACTIONS.filter((a) => a.id === 'context') : ACTIONS;
  const flags = history.filter((event) => event.action === 'flag');
  const submit = async () => {
    if (!open || !user) return;
    setSending(true);
    try {
      const event = await verificationApi.submit(record.id, open, note, user.id);
      setLocalEvents((prev) => [...prev, event]);
      setConfirmation(open === 'verify' ? 'Your verification was recorded. It is now part of this record's history.' : open === 'flag' ? 'Flag raised. A moderator will review this record.' : 'Thank you — your contribution was added to the community layer.');
      setNote('');
      setOpen(null);
    } catch {
      /* submission failed — user can retry */
    } finally {
      setSending(false);
    }
  };
  return <section aria-labelledby="verification-heading" className={cn('rounded-card border-l-[3px] border-l-verified border border-sand-light bg-paper p-4 sm:p-5', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-verified">Community verification</p>
      <h2 id="verification-heading" className="mt-1 font-display text-lg font-semibold text-charcoal">
        {VERIFICATION_LABELS[record.community.status]}
      </h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-charcoal-muted">
        <UsersIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {verifiedBy} community {verifiedBy === 1 ? 'member has' : 'members have'} confirmed this record
        {record.community.corrections.length > 0 && ` · ${record.community.corrections.length} correction${record.community.corrections.length > 1 ? 's' : ''}`}
      </p>

      <p className="mt-4 rounded-lg bg-cream px-3 py-2.5 text-[12px] leading-relaxed text-charcoal-muted">
        {isOwner ? 'This is your record. The community reviews it — AI enrichment has no influence on this status.' : 'Verification is decided by people who know the tradition. AI enrichment has no influence on this status.'}
      </p>

      <div className={cn('mt-4 grid gap-2 grid-cols-1 xs:grid-cols-2')}>
        {availableActions.map(({
        id,
        Icon
      }) => <Button key={id} variant="secondary" size="sm" onClick={() => setOpen(id)} className="justify-start min-w-0 overflow-hidden">
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate text-xs sm:text-[13px]">{VERIFICATION_ACTION_LABELS[id]}</span>
          </Button>)}
      </div>

      {isOwner && flags.length > 0 && <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">Review feedback</h3>
          <ul className="mt-2 space-y-2">
            {flags.map((event) => <li key={event.id} className="rounded-lg border border-flagged/20 bg-flagged-soft p-3">
                <p className="text-[13px] leading-relaxed text-charcoal">{event.note || 'A concern was raised about this record.'}</p>
                <p className="mt-1.5 text-[11px] text-charcoal-soft">{timeAgo(event.createdAt)} · under moderator review</p>
              </li>)}
          </ul>
        </div>}

      {confirmation && <p role="status" className="mt-3 rounded-lg border border-verified/20 bg-verified-soft px-3 py-2.5 text-[13px] text-verified">
          {confirmation}
        </p>}

      {record.community.notes.length > 0 && <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">Community context</h3>
          <ul className="mt-2 space-y-3">
            {record.community.notes.map((note) => <li key={note.id} className="rounded-lg border border-sand-light p-3">
                <p className="text-[13px] leading-relaxed text-charcoal">{note.body}</p>
                <p className="mt-1.5 text-[11px] text-charcoal-soft">
                  {note.user?.name ?? ''} · {timeAgo(note.createdAt)}
                </p>
              </li>)}
          </ul>
        </div>}

      {record.community.corrections.length > 0 && <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
            {isOwner ? 'Suggestions you have received' : 'Corrections'}
          </h3>
          <ul className="mt-2 space-y-3">
            {record.community.corrections.map((correction) => <li key={correction.id} className="rounded-lg border border-clay/25 bg-[#fbeee6] p-3">
                <p className="text-[11px] font-medium text-clay">
                  {correction.field} · {correction.accepted ? 'Accepted' : 'Under review'}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-charcoal">{correction.suggestion}</p>
                <p className="mt-1.5 text-[11px] text-charcoal-soft">
                  {correction.user?.name ?? ''} · {timeAgo(correction.createdAt)}
                </p>
              </li>)}
          </ul>
        </div>}

      {history.length > 0 && <div className="mt-5 border-t border-sand-lighter pt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">Verification history</h3>
          <ol className="mt-3 space-y-3">
            {history.map((event) => <li key={event.id} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sand" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[13px] text-charcoal">
                    <strong className="font-medium">{event.user?.name ?? ''}</strong>{' '}
                    {event.action === 'verify' && 'verified this record'}
                    {event.action === 'correct' && 'suggested a correction'}
                    {event.action === 'context' && 'added community context'}
                    {event.action === 'flag' && 'flagged this record'}
                  </span>
                  {event.note && <span className="mt-0.5 block text-[12px] text-charcoal-muted">“{event.note}”</span>}
                  <span className="mt-0.5 block text-[11px] text-charcoal-soft">{timeAgo(event.createdAt)}</span>
                </span>
              </li>)}
          </ol>
        </div>}

      <Modal open={open !== null} onClose={() => setOpen(null)} title={open ? VERIFICATION_ACTION_LABELS[open] : ''} description={open ? ACTIONS.find((a) => a.id === open)?.help : undefined} footer={<>
            <Button variant="secondary" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={sending} variant={open === 'flag' ? 'danger' : 'primary'} disabled={open !== 'verify' && note.trim().length === 0}>
              {open ? VERIFICATION_ACTION_LABELS[open] : 'Submit'}
            </Button>
          </>}>
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={open === 'verify' ? 'Optional — how do you know this tradition?' : open === 'correct' ? 'Which field is wrong, and what should it say?' : open === 'context' ? 'What should people know when they read this record?' : 'What is your concern with this record?'} aria-label="Note" />
        <p className="mt-3 text-[12px] text-charcoal-soft">
          Nothing you submit here changes the original media, language or transcript.
        </p>
      </Modal>
    </section>;
}