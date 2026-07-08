'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useAuthStore } from '@/lib/auth-store';
import { Lock, User, AlertCircle, ArrowRight, X, KeyRound, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'form' | 'success'>('form');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const router = useRouter();
  const { login, isLoggedIn, _hydrated } = useAuthStore();

  useEffect(() => {
    if (_hydrated && isLoggedIn()) {
      router.replace('/profile');
    }
  }, [_hydrated, isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      router.push('/directory');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    setResetError('');
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    setResetLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: resetCode, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setResetStep('success');
      } else {
        setResetError(data.error?.message || 'Failed to reset password');
      }
    } catch {
      setResetError('Something went wrong. Try again.');
    }

    setResetLoading(false);
  };

  const closeForgotModal = () => {
    setShowForgot(false);
    setResetCode('');
    setNewPassword('');
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
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your_username"
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
                  Enter your reset code in the format:<br />
                  <span className="font-mono text-accent">username-email</span>
                </p>
                <div>
                  <label className="block text-dark/60 dark:text-white/60 text-sm mb-1.5">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    placeholder="username-your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-dark/60 dark:text-white/60 text-sm mb-1.5">
                    <Lock size={14} className="inline mr-1" />New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading || !resetCode || !newPassword}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50"
                >
                  {resetLoading ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Update Password <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            )}

            {resetStep === 'success' && (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="text-dark dark:text-white font-semibold text-lg mb-1">
                  Password Updated!
                </p>
                <p className="text-dark/60 dark:text-white/60 text-sm mb-4">
                  You can now login with your new password.
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
