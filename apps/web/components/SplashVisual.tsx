import Image from 'next/image';

/**
 * The club's loading screen: the logo inside a spinning pink ring.
 *
 * Only the picture — who shows it and for how long differs. The website fades
 * it out on a timer (SplashScreen); the app holds it until the session has
 * been read (AppGate), so the two must not share a timer, only this.
 */
export default function SplashVisual() {
  return (
    <>
      <div className="relative mb-8 h-28 w-28 sm:h-36 sm:w-36">
        <div className="absolute inset-0 rounded-full border-4 border-pink-200 dark:border-pink-900/40" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-pink-500" />
        <div className="absolute inset-2 flex items-center justify-center overflow-hidden rounded-full">
          <Image
            src="/logo.png"
            alt="Rotaract Club of Bibwewadi"
            width={128}
            height={128}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>

      <p className="px-4 text-center text-lg font-medium tracking-wide text-dark/80 sm:text-xl dark:text-white/80">
        Welcome to Rotaract Club of Bibwewadi
      </p>
    </>
  );
}
