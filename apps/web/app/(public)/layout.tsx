'use client';

import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import Rota from '@/components/Rota';
import { useStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const hydrateFromStorage = useStore((s) => s.hydrateFromStorage);
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);

  useEffect(() => {
    hydrateFromStorage();
    hydrateAuth();
  }, [hydrateFromStorage, hydrateAuth]);

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="min-h-screen">{children}</main>
        <Footer />
      </PageTransition>
      <Rota />
    </>
  );
}
