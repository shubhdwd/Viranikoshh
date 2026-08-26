import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Field, Select, TextInput } from '../components/ui/Field';
import { Chip } from '../components/ui/Chip';
import { AuthAside } from '../components/AuthAside';
import { INTERESTS, LANGUAGES, REGIONS } from '../data/taxonomy';
export function Register() {
  const {
    register,
    pending,
    error
  } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState(REGIONS[0] ?? '');
  const [languages, setLanguages] = useState<string[]>(['Hindi']);
  const [interests, setInterests] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const interestsValid = interests.length >= 3;
  const passwordRules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
  };
  const passwordValid = passwordRules.minLength && passwordRules.hasUpper && passwordRules.hasLower && passwordRules.hasDigit;
  const toggle = (list: string[], value: string) => list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!interestsValid || !passwordValid) return;
    try {
      await register({
        name,
        email,
        password,
        region,
        languages,
        interests
      });
      navigate('/home');
    } catch {

      /* error surfaced from context */}
  };
  return <div className="grid min-h-full w-full lg:grid-cols-[1fr_1.1fr]">
      <AuthAside eyebrow="Viranikosh" headline="Your feed begins with what your family knows." body="Tell us where you are and what you care about. We use it to bring you the traditions closest to your own, and to connect your contributions to related cultural records." />

      <div className="flex items-center justify-center bg-cream px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <h1 className="font-display text-2xl font-semibold text-charcoal">Create your account</h1>
          <p className="mt-2 text-sm text-charcoal-muted">Your region and interests shape what you see first.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Full name" required>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required>
                <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </Field>
              <Field label="Password" hint="8+ chars, A-Z, a-z, 0-9" required>
                <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </Field>
            </div>

            {touched && password.length > 0 && !passwordValid && (
              <p className="text-[13px] text-flagged">
                Password must be 8+ characters with at least one uppercase, one lowercase, and one number.
              </p>
            )}

            <Field label="Your region" required>
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r} value={r}>
                    {r}
                  </option>)}
              </Select>
            </Field>

            <Field label="Languages you speak" hint={`${languages.length} selected`}>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lang) => <Chip key={lang} label={lang} selected={languages.includes(lang)} onClick={() => setLanguages((prev) => toggle(prev, lang))} />)}
              </div>
            </Field>

            <Field label="Cultural interests" hint="Choose at least 3" error={touched && !interestsValid ? 'Select at least three interests to seed your feed.' : undefined}>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map((interest) => <Chip key={interest} label={interest} selected={interests.includes(interest)} onClick={() => setInterests((prev) => toggle(prev, interest))} />)}
              </div>
            </Field>

            {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-flagged/20 bg-flagged-soft px-3 py-2.5 text-[13px] text-flagged">
                <AlertCircleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>}

            <Button type="submit" size="lg" loading={pending} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-sm text-charcoal-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-terracotta hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>;
}