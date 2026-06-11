'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    window.scrollTo(0, 0);
    setAnimating(true);

    const timer = setTimeout(() => setAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={animating ? 'page-enter' : 'page-visible'}
    >
      {children}
    </div>
  );
}
