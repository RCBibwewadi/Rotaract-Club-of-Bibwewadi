'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isStandalone } from '@/lib/pwa';
import { useAuthStore } from '@/lib/auth-store';
import { HOME_TAB } from '@/lib/app/tabs';
import { useAdminAuth } from '@/lib/app/admin';
import { ADMIN_HOME } from '@/lib/app/admin-tabs';
import AppSplash from './AppSplash';

const PREVIEW_KEY = 'rcb-app-preview';

/**
 * The app is for the installed PWA only: opened in a browser tab it sends the
 * visitor to the website instead. This is a product boundary, not a security
 * one — every /api route still authorises the member's JWT on its own.
 *
 * Append ?preview=1 once to unlock the app in a normal browser for development
 * and testing; the flag sticks in localStorage until ?preview=0 clears it.
 */
function allowedHere(): boolean {
  if (isStandalone(window)) return true;
  const params = new URLSearchParams(window.location.search);
  try {
    if (params.get('preview') === '1') {
      localStorage.setItem(PREVIEW_KEY, '1');
      return true;
    }
    if (params.get('preview') === '0') {
      localStorage.removeItem(PREVIEW_KEY);
      return false;
    }
    return localStorage.getItem(PREVIEW_KEY) === '1';
  } catch {
    // Private browsing can deny storage; fall back to the strict rule.
    return params.get('preview') === '1';
  }
}

export default function AppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const hydrated = useAuthStore((s) => s._hydrated);
  const token = useAuthStore((s) => s.token);

  // Hydrating the session doubles as the "gate passed" signal: a visitor who
  // is not in the installed app is sent away before it ever runs, so the
  // splash below stays up while the browser navigates to the website.
  useEffect(() => {
    if (!allowedHere()) {
      window.location.replace('/');
      return;
    }
    hydrateAuth();
  }, [hydrateAuth]);

  const onLogin = pathname === '/app/login';
  // The admin area runs on the admin token from /api/admin/login, not on a
  // member session, so it is gated separately.
  const onAdmin = pathname.startsWith('/app/admin');
  const isAdmin = useAdminAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (onAdmin) {
      if (!isAdmin) router.replace('/app/login');
      return;
    }
    if (!token && !onLogin) router.replace('/app/login');
    if ((token || isAdmin) && onLogin) router.replace(isAdmin ? ADMIN_HOME : HOME_TAB);
  }, [hydrated, token, isAdmin, onAdmin, onLogin, router]);

  // Splash covers both the standalone check and session hydration, so the app
  // never flashes a logged-out screen at a member who is signed in.
  const settled = hydrated && (onAdmin ? isAdmin : onLogin ? !token && !isAdmin : !!token);
  if (!settled) return <AppSplash />;

  return <>{children}</>;
}
