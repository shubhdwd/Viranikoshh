import { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { usersApi } from '../api/usersApi';
import { taxonomyApi } from '../api/taxonomyApi';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useInteractions } from '../contexts/InteractionsContext';
import { LANGUAGES, REGIONS } from '../data/taxonomy';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { Field, Select, TextArea, TextInput } from '../components/ui/Field';
import { Chip } from '../components/ui/Chip';
import { Card } from '../components/ui/Card';
import { cn } from '../utils/cn';
const NOTIFICATION_PREFS = [{
  id: 'follow',
  label: 'New followers'
}, {
  id: 'like',
  label: 'Likes on my contributions'
}, {
  id: 'comment',
  label: 'Comments and discussion'
}, {
  id: 'verification',
  label: 'Verification updates'
}, {
  id: 'correction',
  label: 'Suggested corrections'
}];

const PREFS_KEY = 'viranikosh_settings';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function Settings() {
  const {
    user,
    updateUser
  } = useAuth();
  const {
    followedInterests,
    toggleFollowInterest
  } = useInteractions();
  const { data: categories } = useAsync(() => taxonomyApi.getInterestCategories(), []);
  const savedPrefs = loadPrefs();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [region, setRegion] = useState(user?.region ?? REGIONS[0]);
  const [languages, setLanguages] = useState<string[]>(user?.languages ?? []);
  const [prefs, setPrefs] = useState<string[]>(savedPrefs?.prefs ?? ['follow', 'comment', 'verification', 'correction']);
  const [autoTranslate, setAutoTranslate] = useState(savedPrefs?.autoTranslate ?? true);
  const [showOriginalFirst, setShowOriginalFirst] = useState(savedPrefs?.showOriginalFirst ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!user) return null;
  const save = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile(user.id, {
        name,
        bio,
        region: region ?? '',
        languages
      });
      updateUser(updated);
      localStorage.setItem(PREFS_KEY, JSON.stringify({ prefs, autoTranslate, showOriginalFirst }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  };
  const toggleIn = (list: string[], value: string) => list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  return <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <SectionHeading level={1} title="Settings" description="Account, languages and notifications." />

      <div className="mt-6 space-y-5">
        <Card className="p-5">
          <h2 className="font-display text-[15px] font-semibold text-charcoal">Account</h2>
          <div className="mt-4 space-y-4">
            <Field label="Display name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Bio" hint="Shown on your profile">
              <TextArea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-[15px] font-semibold text-charcoal">Region and languages</h2>
          <p className="mt-1 text-[13px] text-charcoal-muted">Used to surface records close to you and in scripts you read.</p>
          <div className="mt-4 space-y-4">
            <Field label="Region">
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r} value={r}>
                    {r}
                  </option>)}
              </Select>
            </Field>
            <Field label="Languages" hint={`${languages.length} selected`}>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((l) => <Chip key={l} label={l} selected={languages.includes(l)} onClick={() => setLanguages((p) => toggleIn(p, l))} />)}
              </div>
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-[15px] font-semibold text-charcoal">Cultural interests</h2>
          <p className="mt-1 text-[13px] text-charcoal-muted">What your feed prioritises.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories?.map((cat) => <Chip key={cat.slug} label={cat.label} selected={followedInterests.includes(cat.slug)} onClick={() => toggleFollowInterest(cat.slug)} />)}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-[15px] font-semibold text-charcoal">Notifications</h2>
          <ul className="mt-4 divide-y divide-sand-lighter">
            {NOTIFICATION_PREFS.map((pref) => {
              const isChecked = prefs.includes(pref.id);
              return (
                <li key={pref.id}>
                  <div
                    onClick={() => setPrefs((p) => toggleIn(p, pref.id))}
                    className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:opacity-90 select-none"
                  >
                    <span className="text-sm font-medium text-charcoal">{pref.label}</span>
                    <Toggle
                      checked={isChecked}
                      onChange={() => setPrefs((p) => toggleIn(p, pref.id))}
                      label={pref.label}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-[15px] font-semibold text-charcoal">Content display</h2>
          <ul className="mt-4 divide-y divide-sand-lighter">
            <li>
              <div
                onClick={() => setShowOriginalFirst((v: boolean) => !v)}
                className="flex cursor-pointer items-center justify-between gap-6 py-3 transition-colors hover:opacity-90 select-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-charcoal">Show the original language first</span>
                  <span className="mt-0.5 block text-[12px] text-charcoal-muted">
                    Keeps the source transcript above any AI translation.
                  </span>
                </span>
                <Toggle
                  checked={showOriginalFirst}
                  onChange={() => setShowOriginalFirst((v: boolean) => !v)}
                  label="Show original first"
                />
              </div>
            </li>
            <li>
              <div
                onClick={() => setAutoTranslate((v: boolean) => !v)}
                className="flex cursor-pointer items-center justify-between gap-6 py-3 transition-colors hover:opacity-90 select-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-charcoal">Expand AI translations automatically</span>
                  <span className="mt-0.5 block text-[12px] text-charcoal-muted">
                    Translations remain clearly marked as machine-generated.
                  </span>
                </span>
                <Toggle
                  checked={autoTranslate}
                  onChange={() => setAutoTranslate((v: boolean) => !v)}
                  label="Expand translations"
                />
              </div>
            </li>
          </ul>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && <p role="status" className="flex items-center gap-1.5 text-[13px] text-verified">
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              Settings saved
            </p>}
          <Button loading={saving} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </div>;
}

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2',
        checked ? 'bg-terracotta' : 'bg-sand'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow-sm ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}