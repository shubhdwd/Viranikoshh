import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';
import { AuthAside } from '../components/AuthAside';
export function Login() {
  const {
    login,
    pending,
    error
  } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({
        email,
        password
      });
      navigate('/home');
    } catch {

      /* error surfaced from context */}
  };
  return <div className="grid min-h-full w-full lg:grid-cols-[1.1fr_1fr]">
      <AuthAside eyebrow="Viranikosh" headline="Record the voice. Preserve the source." body="A living treasury of India’s folk songs, stories, crafts and oral knowledge — kept in the words of the people who carry them." />

      <div className="flex items-center justify-center bg-cream px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-charcoal">Welcome back</h1>
          <p className="mt-2 text-sm text-charcoal-muted">Sign in to continue where you left off.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email" required>
              <TextInput type="email" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password" required>
              <TextInput type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>

            {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-flagged/20 bg-flagged-soft px-3 py-2.5 text-[13px] text-flagged">
                <AlertCircleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>}

            <Button type="submit" size="lg" loading={pending} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-sm text-charcoal-muted">
            New to Viranikosh?{' '}
            <Link to="/register" className="font-medium text-terracotta hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>;
}