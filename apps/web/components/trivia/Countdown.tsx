'use client';

/** Circular timer; the parent owns the seconds so it can pause and reset. */
export default function Countdown({ left, total, paused }: { left: number; total: number; paused: boolean }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, left) / total;
  const urgent = left <= 5;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke={urgent ? '#f43f5e' : '#fbbf24'} strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-4xl font-black ${urgent ? 'text-rose-400' : 'text-amber-300'}`}>
        {paused ? '❚❚' : left}
      </span>
    </div>
  );
}
