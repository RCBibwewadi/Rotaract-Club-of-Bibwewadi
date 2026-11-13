'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { HOME_TAB } from '@/lib/app/tabs';
import { ADMIN_HOME } from '@/lib/app/admin-tabs';
import { ADMIN_USERNAME, adminLogin } from '@/lib/app/admin';
import { ApiError } from '@/lib/app/client';
import { ConsentNotice } from '@/components/app/ConsentGate';

// The club's sign-up form lives on the website and is unlisted; the app sends
// new members straight to it rather than keeping a second copy of the fields.
const JOIN_URL = '/join/tereliyeopenhai';

const fieldClass =
  'w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum ' +
  'placeholder-app-plum/30 outline-none transition-colors focus:border-accent';

export default function AppLoginPage() {
  const router = useRouter();
  const { login, sessionExpired, clearSessionExpired } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    clearSessionExpired();

    if (!identifier.trim() || !password) {
      setError('Enter your username and password');
      return;
    }

    setLoading(true);

    // The admin signs in on this same form with the club's admin password;
    // anything else is a member login against the website's member accounts.
    if (identifier.trim().toLowerCase() === ADMIN_USERNAME) {
      try {
        await adminLogin(identifier.trim(), password);
        router.replace(ADMIN_HOME);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Invalid admin credentials');
      } finally {
        setLoading(false);
      }
      return;
    }

    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result.success) {
      router.replace(HOME_TAB);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-accent">
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <Image
            src="/logo.png"
            alt="Rotaract Club of Bibwewadi"
            width={120}
            height={120}
            priority
            className="h-25 w-25 object-contain"
          />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">Make it Matter</h1>
        <p className="mt-1.5 text-sm text-white/70">Rotaract Club of Bibwewadi</p>
      </div>

      <div
        className="shrink-0 rounded-t-[2.5rem] bg-app-panel px-6 pt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.25)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <h2 className="text-[26px] font-bold tracking-tight text-app-plum">Welcome back</h2>

        {sessionExpired && (
          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-accent/5 p-3 text-sm text-accent">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            Your session expired. Please sign in again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-app-plum/70">
              Username
            </label>
            <input
              id="identifier"
              name="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="next"
              placeholder="username, email or phone"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-app-plum/70">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                enterKeyHint="go"
                placeholder="••••••••"
                className={`${fieldClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-app-plum/40"
              >
                {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm font-medium text-app-plum/55 underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-accent">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <ConsentNotice className="pt-1" />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent hover:bg-accent-light py-4 text-base font-semibold text-white transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
            {loading ? 'Signing in' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-app-plum/55">
          New to the club?{' '}
          <Link href={JOIN_URL} className="font-semibold text-accent underline-offset-4 hover:underline">
            Join us
          </Link>
        </p>
      </div>

      {showForgot && <ForgotPasswordSheet onClose={() => setShowForgot(false)} />}
    </div>
  );
}

function ForgotPasswordSheet({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setSent(true);
      else setError(data.error?.message || 'Could not send the reset link');
    } catch {
      setError('Something went wrong. Try again.');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" role="dialog" aria-modal="true" aria-label="Reset password">
      <div
        className="w-full rounded-t-3xl bg-app-panel p-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-app-plum">
            {sent ? 'Check your inbox' : 'Reset password'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-app-plum/40">
            <X size={20} aria-hidden />
          </button>
        </div>

        {sent ? (
          <p className="mt-2 text-sm text-app-plum/60">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-app-plum/55">
              We&apos;ll email you a link to set a new password.
            </p>
            <label htmlFor="reset-email" className="mt-5 mb-1.5 block text-sm font-medium text-app-plum/70">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              className={fieldClass}
            />
            {error && (
              <p role="alert" className="mt-2 text-sm text-accent">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent transition-colors hover:bg-accent-light py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {sending && <Loader2 size={18} className="animate-spin" aria-hidden />}
              Send reset link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
