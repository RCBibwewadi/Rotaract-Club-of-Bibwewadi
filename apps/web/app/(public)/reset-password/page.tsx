'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import { Lock, AlertCircle, ArrowRight, CheckCircle, KeyRound } from 'lucide-react';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
        <p className="text-dark dark:text-white font-semibold text-lg mb-1">
          Invalid Reset Link
        </p>
        <p className="text-dark/60 dark:text-white/60 text-sm mb-4">
          This password reset link is invalid or incomplete.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300"
        >
          Back to Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Failed to reset password');
      }
    } catch {
      setError('Something went wrong. Try again.');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
        <p className="text-dark dark:text-white font-semibold text-lg mb-1">
          Password Updated!
        </p>
        <p className="text-dark/60 dark:text-white/60 text-sm mb-4">
          Your password has been reset successfully. You can now login with your new password.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-dark/60 dark:text-white/60 text-sm text-center mb-2">
        Enter your new password below.
      </p>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div>
        <label className="block text-dark/60 dark:text-white/60 text-sm mb-1.5">
          <Lock size={14} className="inline mr-1" />New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Enter new password (min 6 chars)"
          required
          className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-dark/60 dark:text-white/60 text-sm mb-1.5">
          <Lock size={14} className="inline mr-1" />Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
          required
          className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !newPassword || !confirmPassword}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Updating...
          </span>
        ) : (
          <>Update Password <ArrowRight size={18} /></>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen transition-colors flex items-center justify-center px-6">
      <div className="w-full max-w-md py-20">
        <AnimatedSection>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={28} className="text-accent" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-dark dark:text-white mb-2">
              Reset <span className="gradient-text">Password</span>
            </h1>
            <p className="text-dark/50 dark:text-white/50">
              Set a new password for your account
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="p-8 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <Suspense fallback={
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            }>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
