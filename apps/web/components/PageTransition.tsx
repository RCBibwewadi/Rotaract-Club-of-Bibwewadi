'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<'idle' | 'exit' | 'flash' | 'enter'>('idle');
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) {
      setDisplayChildren(children);
      return;
    }
    prevPath.current = pathname;

    // Exit phase
    setPhase('exit');
    const exitTimer = setTimeout(() => {
      setPhase('flash');
      setDisplayChildren(children);
      window.scrollTo(0, 0);

      const flashTimer = setTimeout(() => {
        setPhase('enter');
        const enterTimer = setTimeout(() => {
          setPhase('idle');
        }, 700);
        return () => clearTimeout(enterTimer);
      }, 150);
      return () => clearTimeout(flashTimer);
    }, 500);

    return () => clearTimeout(exitTimer);
  }, [pathname, children]);

  const getStyles = (): React.CSSProperties => {
    switch (phase) {
      case 'exit':
        return {
          transform: 'scale(0.95)',
          filter: 'blur(4px)',
          opacity: 0,
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        };
      case 'flash':
        return {
          transform: 'scale(1.02)',
          filter: 'blur(4px)',
          opacity: 0,
        };
      case 'enter':
        return {
          transform: 'scale(1)',
          filter: 'blur(0px)',
          opacity: 1,
          transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
        };
      default:
        return {
          transform: 'scale(1)',
          filter: 'blur(0px)',
          opacity: 1,
        };
    }
  };

  return (
    <>
      {/* Flash overlay */}
      <div
        className="fixed inset-0 z-[9999] pointer-events-none bg-accent"
        style={{
          opacity: phase === 'flash' ? 0.3 : 0,
          transition: phase === 'flash' ? 'none' : 'opacity 300ms',
        }}
      />
      <div style={getStyles()}>{displayChildren}</div>
    </>
  );
}
