'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2400);
    const t2 = setTimeout(() => setVisible(false), 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white dark:bg-dark transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Logo with pink spinning ring */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-8">
        {/* Pink spinner ring */}
        <div className="absolute inset-0 rounded-full border-4 border-pink-200 dark:border-pink-900/40" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" />
        {/* Logo */}
        <div className="absolute inset-2 rounded-full overflow-hidden flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Rotaract Club of Bibwewadi"
            width={128}
            height={128}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Welcome text */}
      <p className="text-lg sm:text-xl font-medium text-dark/80 dark:text-white/80 tracking-wide text-center px-4">
        Welcome to Rotaract Club of Bibwewadi
      </p>
    </div>
  );
}
