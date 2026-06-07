/**
 * Inline SVG avatar for Rota – the RCB mascot.
 * A friendly, round-faced character with an orange beret and Rotary-inspired badge.
 * Renders crisply at any size, no external assets needed.
 */
export default function RotaAvatar({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="100" fill="url(#rotaBg)" />

      {/* Face shape */}
      <ellipse cx="100" cy="112" rx="52" ry="56" fill="#C68642" />

      {/* Hair / Head top */}
      <ellipse cx="100" cy="90" rx="50" ry="46" fill="#2D1B0E" />

      {/* Face overlay */}
      <ellipse cx="100" cy="115" rx="44" ry="44" fill="#D4945A" />

      {/* Beret */}
      <path
        d="M55 82 C55 55, 145 55, 145 82 C145 72, 150 68, 155 70 C148 58, 130 45, 100 45 C70 45, 52 58, 45 70 C50 68, 55 72, 55 82Z"
        fill="#E85D04"
      />
      <ellipse cx="100" cy="82" rx="46" ry="8" fill="#E85D04" />
      {/* Beret nub */}
      <circle cx="100" cy="46" r="6" fill="#F48C06" />

      {/* Left eye white */}
      <ellipse cx="82" cy="110" rx="12" ry="13" fill="white" />
      {/* Right eye white */}
      <ellipse cx="118" cy="110" rx="12" ry="13" fill="white" />

      {/* Left pupil */}
      <ellipse cx="84" cy="112" rx="6" ry="7" fill="#1A1A1A" />
      {/* Right pupil */}
      <ellipse cx="120" cy="112" rx="6" ry="7" fill="#1A1A1A" />

      {/* Left eye shine */}
      <circle cx="87" cy="108" r="2.5" fill="white" />
      {/* Right eye shine */}
      <circle cx="123" cy="108" r="2.5" fill="white" />

      {/* Eyebrows */}
      <path d="M70 98 Q82 92 94 98" stroke="#2D1B0E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M106 98 Q118 92 130 98" stroke="#2D1B0E" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <ellipse cx="100" cy="124" rx="4" ry="3" fill="#C07A3E" />

      {/* Smile */}
      <path
        d="M84 134 Q100 148 116 134"
        stroke="#8B4513"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheek blush left */}
      <ellipse cx="72" cy="128" rx="8" ry="5" fill="#E88D6D" opacity="0.5" />
      {/* Cheek blush right */}
      <ellipse cx="128" cy="128" rx="8" ry="5" fill="#E88D6D" opacity="0.5" />

      {/* Ears */}
      <ellipse cx="54" cy="115" rx="8" ry="12" fill="#D4945A" />
      <ellipse cx="146" cy="115" rx="8" ry="12" fill="#D4945A" />
      <ellipse cx="54" cy="115" rx="4" ry="7" fill="#C68642" />
      <ellipse cx="146" cy="115" rx="4" ry="7" fill="#C68642" />

      {/* Collar / Shirt hint */}
      <path
        d="M65 158 Q100 170 135 158 Q140 175 135 200 L65 200 Q60 175 65 158Z"
        fill="#1A1A1A"
      />
      {/* Badge – Rotary gear */}
      <circle cx="100" cy="176" r="9" fill="#E85D04" />
      <circle cx="100" cy="176" r="5" fill="#F48C06" />
      <circle cx="100" cy="176" r="2.5" fill="white" />
      {/* Gear teeth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 100 + Math.cos(rad) * 9;
        const y = 176 + Math.sin(rad) * 9;
        return <circle key={angle} cx={x} cy={y} r="2" fill="#E85D04" />;
      })}

      {/* Gradient defs */}
      <defs>
        <radialGradient id="rotaBg" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#FFF3E0" />
          <stop offset="100%" stopColor="#FFE0B2" />
        </radialGradient>
      </defs>
    </svg>
  );
}
