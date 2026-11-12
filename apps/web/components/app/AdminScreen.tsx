'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { clearAdminToken } from '@/lib/app/admin';
import { Screen } from './Screen';

/** Page chrome for the admin sections: the member title bar plus a sign-out. */
export default function AdminScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const signOut = () => {
    clearAdminToken();
    router.replace('/app/login');
  };

  return (
    <Screen
      title={title}
      subtitle={subtitle ?? 'Admin'}
      action={
        <button
          type="button"
          onClick={signOut}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-semibold text-app-plum/60"
        >
          <LogOut size={15} aria-hidden />
          Exit
        </button>
      }
    >
      {children}
    </Screen>
  );
}

export type Notice = { text: string; type: 'success' | 'error' } | null;

/**
 * Inline result banner. Admin actions change real records, so every one of
 * them reports what happened rather than silently refreshing.
 */
export function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const good = notice.type === 'success';
  const Icon = good ? CheckCircle2 : AlertCircle;

  return (
    <p
      role="status"
      className={`mb-3 flex items-start gap-2 rounded-2xl p-3 text-sm ${
        good ? 'bg-emerald-50 text-emerald-700' : 'bg-accent/5 text-accent'
      }`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
      {notice.text}
    </p>
  );
}

/** Shows a banner for a few seconds after an action. */
export function useNotice(): [Notice, (text: string, type: 'success' | 'error') => void] {
  const [notice, setNotice] = useState<Notice>(null);

  const show = useCallback((text: string, type: 'success' | 'error') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  return [notice, show];
}
