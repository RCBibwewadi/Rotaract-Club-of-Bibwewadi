'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useAuthStore } from '@/lib/auth-store';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

            <div className="mt-6 text-center">
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
    </div>
  );
}
