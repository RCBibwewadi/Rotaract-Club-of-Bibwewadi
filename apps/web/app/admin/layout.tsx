'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const hydrateFromStorage = useStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return <>{children}</>;
}
