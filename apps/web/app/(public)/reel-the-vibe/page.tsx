'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ReelTheVibePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/leaderboard');
  }, [router]);

  return null;
}
