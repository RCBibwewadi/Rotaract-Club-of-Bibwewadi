import { useInView } from '../hooks/useInView';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Animation direction: 'up' (default), 'left', 'right', 'scale' */
  from?: 'up' | 'left' | 'right' | 'scale';
}

export default function AnimatedSection({ children, className = '', delay = 0, from = 'up' }: Props) {
  const { ref, inView } = useInView(0.08);

  const transforms: Record<string, string> = {
    up: 'translateY(50px)',
    left: 'translateX(-50px)',
    right: 'translateX(50px)',
    scale: 'scale(0.92)',
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1.2s] ease-out ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) translateX(0) scale(1)' : transforms[from],
        transitionDelay: `${delay}ms`,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}
