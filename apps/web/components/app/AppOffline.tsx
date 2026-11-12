/**
 * What a screen shows instead of its content while the device is offline.
 *
 * It fills the scroll area rather than the viewport, so the title bar and the
 * tab bar stay put and the member can still move around the app.
 */
export default function AppOffline() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8 pb-24 text-center">
      <svg viewBox="0 0 80 104" className="h-44 w-36" role="img" aria-label="Nobody home">
        {/* The ground stays put while the figure leaves it. */}
        <ellipse className="rcb-jump-shadow" cx="40" cy="96" rx="17" ry="4" fill="#2a1118" />

        <g className="rcb-jumper" stroke="#e8456f" fill="#e8456f">
          <circle cx="40" cy="22" r="11" stroke="none" />
          <g strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* torso */}
            <path d="M40 33 L40 60" />
            {/* arms thrown up */}
            <path d="M40 40 L23 24" />
            <path d="M40 40 L57 24" />
            {/* legs, tucked apart mid-jump */}
            <path d="M40 60 L28 82" />
            <path d="M40 60 L52 82" />
          </g>
        </g>
      </svg>

      <h2 className="mt-7 text-xl font-bold text-app-plum">You are offline</h2>
      <p className="mt-2 text-sm leading-relaxed text-app-plum/55">
        Please check your internet connection.
      </p>
    </div>
  );
}
