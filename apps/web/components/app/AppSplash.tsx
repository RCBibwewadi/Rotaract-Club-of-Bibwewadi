import Image from 'next/image';

/** Full-bleed burgundy splash shown while the app decides where to send you. */
export default function AppSplash() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-accent">
      <Image
        src="/logo.png"
        alt="Rotaract Club of Bibwewadi"
        width={112}
        height={112}
        priority
        className="h-28 w-28 object-contain drop-shadow-lg"
      />
      <p className="text-sm font-semibold tracking-[0.3em] text-white/70 uppercase">
        Make it Matter
      </p>
      <span
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
