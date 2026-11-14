import SplashVisual from '@/components/SplashVisual';

/** The website's loading screen, held up while the app reads the session. */
export default function AppSplash() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-dark">
      <SplashVisual />
      <span className="sr-only">Loading</span>
    </div>
  );
}
