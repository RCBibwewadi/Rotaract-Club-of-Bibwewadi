'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useAuthStore } from '@/lib/auth-store';
import { Lock, User, AlertCircle, ArrowRight, X, KeyRound, CheckCircle, Mail } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'form' | 'success'>('form');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const router = useRouter();
  const { login, isLoggedIn, _hydrated, sessionExpired, clearSessionExpired } = useAuthStore();

  useEffect(() => {
    if (_hydrated && isLoggedIn()) {
      router.replace('/profile');
    }
  }, [_hydrated, isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearSessionExpired();
    setLoading(true);

    const result = await login(identifier, password);

    if (result.success) {
      router.push('/directory');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setResetError('');
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }
    setResetLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setResetStep('success');
      } else {
        setResetError(data.error?.message || 'Failed to send reset link');
      }
    } catch {
      setResetError('Something went wrong. Try again.');
    }

    setResetLoading(false);
  };

  const closeForgotModal = () => {
    setShowForgot(false);
    setResetEmail('');
    setResetStep('form');
    setResetError('');
  };

  return (
    <div className="min-h-screen transition-colors flex items-center justify-center px-6">
      <div className="w-full max-w-md py-20">
        <AnimatedSection>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-accent" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-dark dark:text-white mb-2">
              Welcome <span className="gradient-text">Back</span>
            </h1>
            <p className="text-dark/50 dark:text-white/50">
              Login to access the member directory
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="p-8 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            {sessionExpired && !error && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> Your session expired. Please log in again.
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-dark/60 dark:text-white/60 text-sm mb-1.5">
                  <User size={14} className="inline mr-1" />Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Joe"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-dark/60 dark:text-white/60 text-sm mb-1.5">
                  <Lock size={14} className="inline mr-1" />Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  <>Login <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-accent hover:text-accent-light transition-colors text-sm font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-dark/40 dark:text-white/40 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/join" className="text-accent hover:text-accent-light transition-colors font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForgotModal} />
          <div className="relative w-full max-w-md p-8 rounded-2xl bg-white dark:bg-dark-card border border-black/10 dark:border-white/10 shadow-2xl">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-dark/40 dark:text-white/40 hover:text-dark dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <KeyRound size={24} className="text-accent" />
              </div>
              <h2 className="font-display text-2xl text-dark dark:text-white">
                Reset Password
              </h2>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {resetError}
              </div>
            )}

            {resetStep === 'form' && (
              <div className="space-y-4">
                <p className="text-dark/60 dark:text-white/60 text-sm text-center">
                  Enter your registered email address and we&apos;ll send you a link to reset your password.
                </p>
                <div>
                  <label className="block text-dark/60 dark:text-white/60 text-sm mb-1.5">
                    <Mail size={14} className="inline mr-1" />Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleForgotPassword}
                  disabled={resetLoading || !resetEmail}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50"
                >
                  {resetLoading ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send Reset Link <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            )}

            {resetStep === 'success' && (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="text-dark dark:text-white font-semibold text-lg mb-1">
                  Check Your Email
                </p>
                <p className="text-dark/60 dark:text-white/60 text-sm mb-4">
                  If an account with that email exists, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
                </p>
                <button
                  onClick={closeForgotModal}
                  className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
