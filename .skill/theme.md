# Agentic AI Prompt — Change Complete Website Design Theme

> **Purpose:** Give this prompt to your agentic AI coding assistant to transform your existing website into the design shown at https://019eb779-3449-74a5-8ccb-8b88df686c34.arena.site/ (Rotaract Club of Bibwewadi, Pune). It covers colors, backgrounds, fonts, typography, homepage layout/sections, animations, navigation, cards, footer, and chat widget — every visual aspect of the site.

---

## PROMPT START — Copy everything below this line

---

You are redesigning the complete visual theme of my website. Apply ALL of the following design specifications exactly. This affects every page, every component, every section. Do not skip any item.

---

### 1. DESIGN TOKENS / CSS CUSTOM PROPERTIES

Replace or add these CSS custom properties in your global CSS file (e.g., `globals.css`, `index.css`, or `tailwind.css`):

```css
:root {
  /* Primary Colors */
  --color-accent: #8b1a2b;        /* Deep burgundy/maroon — primary accent */
  --color-accent-light: #a82640;   /* Lighter burgundy — accent hover state */
  --color-warm: #c9a84c;           /* Muted warm gold — secondary accent */
  --color-dark: #09090b;           /* Near-black — primary text & footer bg */
  --color-dark-card: #111113;      /* Dark card background (dark mode) */
  --color-dark-surface: #18181b;   /* Dark surface background (dark mode) */
  --color-light: #fafaf9;          /* Warm off-white — page background */
  --color-light-card: #f4f4f2;     /* Light warm gray — card backgrounds */
  --color-light-surface: #e8e8e4;  /* Surface / hover state */
  --color-black: #000000;
  --color-white: #ffffff;

  /* Opacity variants to use throughout (apply as Tailwind opacity modifiers) */
  /* text-dark/60  → primary body text */
  /* text-dark/55  → secondary body text */
  /* text-dark/45  → subtle text */
  /* text-dark/35  → labels / micro-text */
  /* text-dark/25  → very subtle decorative text */
  /* text-white/45 → footer link text */
  /* text-white/35 → footer section headers */
  /* text-white/25 → footer copyright */
  /* bg-accent/10  → active nav pill background */
  /* bg-accent/15  → logo circle background */
  /* bg-accent/[0.04] → hero blurred orb */
  /* bg-warm/[0.035] → hero secondary blurred orb */
  /* border-white/12 → footer social icon borders */

  /* Border Radius */
  --radius-full: 9999px;    /* Pill buttons */
  --radius-2xl: 1rem;       /* Card groups */
  --radius-lg: 0.5rem;      /* Nav pills, inputs */
}
```

If using Tailwind CSS, extend the theme config with these colors:

```js
// tailwind.config.js / tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#8b1a2b',
          light: '#a82640',
        },
        warm: '#c9a84c',
        dark: {
          DEFAULT: '#09090b',
          card: '#111113',
          surface: '#18181b',
        },
        light: {
          DEFAULT: '#fafaf9',
          card: '#f4f4f2',
          surface: '#e8e8e4',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

---

### 2. FONT SETUP

**Replace the current font with DM Sans.**

Add to your HTML `<head>` or layout file:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet">
```

Or in CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
```

Set the base font:

```css
body {
  font-family: "DM Sans", system-ui, sans-serif;
}
```

All headings and display text should use `font-family: "DM Sans", system-ui, sans-serif` (both display and body are DM Sans — the weight differentiation creates the hierarchy).

---

### 3. TYPOGRAPHY HIERARCHY

Apply these exact typography rules throughout the site:

| Element | Size (Desktop) | Weight | Tracking | Line Height | Color |
|---------|---------------|--------|----------|-------------|-------|
| **H1 Hero Title** | `88px` (`5.5rem`) | 300 (Light) | `tight` | `1` | `#09090b` / gradient |
| **H1 Subtitle/Label** | `14px` | 400 | `0.3em`, uppercase | — | `text-dark/55` |
| **H2 Section Headings** | `36px` (`text-4xl`) | 300 (Light) | `tight` | `40px` | `#09090b` |
| **H3 Card Titles** | `18px` (`text-lg`) | 600 (Semibold) | `tight` | `28px` | `#09090b` |
| **Body / Paragraph** | `15-16px` | 400 | normal | `26px` / 1.5 | `text-dark/55` |
| **Stat Numbers** | `36px` (`text-4xl`) | 300 (Light) | `tight` | — | `#09090b` |
| **Stat Labels** | `11px` | 400 | `wide` | — | `text-dark/55` |
| **Small Labels** (section tags) | `10-12px` | 400 | `0.2em-0.25em`, uppercase | — | `text-dark/35` |
| **Nav Links** | `13px` | 500 (Medium) | — | — | `text-dark/60` |
| **CTA Button Text** | `14px` (`text-sm`) | 500 (Medium) | — | — | `#fff` |
| **Footer Text** | `10-13px` | varies | varies | — | `text-white/25-45` |

**Special text classes to create:**

```css
/* For the word "Matter" wherever it appears as an accent */
.matter-text {
  letter-spacing: -0.02em;
  font-weight: 600;
  color: var(--color-accent);
}

/* Gradient text — burgundy to gold */
.gradient-text {
  -webkit-text-fill-color: transparent;
  background: linear-gradient(135deg, #8b1a2b 30%, #c9a84c);
  -webkit-background-clip: text;
  background-clip: text;
}
```

---

### 4. BACKGROUNDS

#### Page Background
- Main page background: `#fafaf9` (warm off-white, NOT pure white)
- Alternate section backgrounds alternate between `bg-light` (#fafaf9) and `bg-white` (#ffffff) to create subtle visual separation

#### Hero Background
The hero has three decorative layers on top of `bg-light`:

1. **Accent blurred orb:**
   - 600×600px circle
   - `bg-accent/[0.04]` (4% opacity burgundy)
   - `blur-[120px]`
   - Positioned at `top-1/3 left-1/3`
   - Absolute positioned, pointer-events-none

2. **Warm blurred orb:**
   - 400×400px circle
   - `bg-warm/[0.035]` (3.5% opacity gold)
   - `blur-[100px]`
   - Positioned at `bottom-1/4 right-1/3`
   - Absolute positioned, pointer-events-none

3. **Spinning SVG ornament:**
   - 700×700px SVG with concentric circles and scattered dots
   - Very low opacity (0.05-0.12)
   - Rotating at 180 seconds per revolution (`slow-spin` animation)
   - Color: `text-dark`
   - Centered in hero section
   - Absolute positioned, pointer-events-none

```css
@keyframes slowSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-slow-spin {
  animation: slowSpin 180s linear infinite;
}
```

#### Card Backgrounds
- Cards use `bg-light-card` (#f4f4f2)
- Cards hover to `bg-[#ededea]`
- Transition: `transition-colors duration-500`

#### Footer Background
- Footer uses `bg-dark` (#09090b — near-black)
- All footer text uses white with varying opacities (see typography table)

---

### 5. HOMEPAGE SECTIONS (Complete Layout)

Rebuild the homepage with these exact sections in this order:

#### Section 1: HERO
```
- Full viewport height (min-h-screen), centered content
- Background: bg-light with decorative blurred orbs (see #4 above)
- Spinning SVG ornament (see #4 above)
- Content (centered, max-w-3xl mx-auto, text-center):
  - Top label: "ROTARACT · DISTRICT 3131" — 14px, 0.3em tracking, uppercase, text-dark/55
  - Main heading: "Make it Matter." — two lines
    - "Make it" in solid #09090b, 88px, weight 300
    - "Matter." uses the .gradient-text class (burgundy→gold gradient)
  - Paragraph: 15-16px, text-dark/55, max-w-md mx-auto, mt-10, leading-relaxed
  - CTA Buttons (flex row, gap-4):
    - "Get Involved" — Pill button: bg-accent, white text, rounded-full, px-7 py-3, text-sm font-medium, includes arrow icon, hover→bg-accent-light
    - "Our Story →" — Ghost/link: transparent bg, text-dark/45, text-sm font-medium, hover→text-dark/75
  - Scroll indicator: Bouncing chevron-down icon, 18×18px, text-dark/35, bottom-10, centered, animate-bounce
```

#### Divider: Section Connector
```
- flex justify-center py-1
- .section-connector div: 1px wide, h-16, gradient fade (transparent→currentColor→transparent), opacity: 0.1
```

#### Section 2: STATS + PILLARS
```
- Background: bg-white
- Padding: py-20 md:py-28
- Container: max-w-5xl mx-auto

Sub-section A — Stats:
  - Label: "Making it matter — every day" — centered, text-xs, 0.2em tracking, uppercase, text-dark/35
    - The word "matter" uses .matter-text class (text-accent, semibold)
  - Stats Grid: grid grid-cols-2 md:grid-cols-4, gap-y-10 gap-x-6, mb-20
    - 4 stat items, each centered:
      - Large number: text-3xl md:text-4xl, weight 300, tracking-tight
      - Small label: 11px, text-dark/55, tracking-wide, mt-2

Sub-section B — Pillar Cards:
  - Fade rule divider: 1px height, opacity 0.12, horizontal gradient fade (transparent→currentColor→transparent)
  - Section heading: "What makes it matter" — text-3xl sm:text-4xl, centered, font-display, tracking-tight, mt-20 mb-14
    - "matter" uses .matter-text class
  - Card Grid: grid grid-cols-1 sm:grid-cols-2 gap-0.5 rounded-2xl overflow-hidden
    - Card style: p-8 md:p-10, bg-light-card, hover→bg-[#ededea], transition-colors duration-500
    - Each card: emoji (text-2xl, mb-4) + h3 title (text-lg font-semibold tracking-tight mb-2) + description (text-sm leading-relaxed text-dark/55)
    - 4 cards: 🌱 Social Service, 🤝 Network Building, 🚀 Leadership Development, 💪 Community Engagement
```

#### Section 3: VISION
```
- Background: transparent (inherits bg-light from page)
- Padding: py-24 md:py-36
- Layout: Centered text
- Label: "OUR VISION" — 10px, 0.25em tracking, uppercase, text-dark/35, mb-10
- Blockquote: font-display text-2xl sm:text-3xl md:text-[2.2rem], weight 300, leading-[1.4], tracking-tight, color #09090b
- Divider with label (mt-10): flex row with 8px horizontal lines and centered "MAKE IT MATTER" text (10px, 0.2em tracking, uppercase, text-dark/35)
```

#### Section 4: EXPLORE
```
- Background: bg-white
- Padding: py-20 md:py-28
- Label: "EXPLORE FURTHER" — text-xs, 0.2em tracking, uppercase, text-dark/35, mb-12
- Explore Cards: space-y-0.5 rounded-2xl overflow-hidden
  - Each card = full-width link with group hover:
    - Layout: flex items-center justify-between p-6 md:p-8
    - Background: bg-light-card, hover→bg-[#ededea]
    - Left side: number (10px, text-dark/35, mt-1) + h3 title (text-lg font-semibold tracking-tight, hover→text-accent) + description (text-sm text-dark/55 mt-1)
    - Right side: arrow-right icon (16×16px, text-dark/25, group-hover→text-accent + translate-x-1)
    - 3 cards: 01 Projects, 02 Events, 03 Board
```

#### Section 5: CTA
```
- Background: transparent (inherits bg-light)
- Padding: py-28 md:py-40
- Container: max-w-2xl mx-auto, centered
- Heading: "Your story can matter too." — font-display text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15]
  - Line break before "matter" which uses text-accent with .matter-text class
- Paragraph: mt-6, 15px, leading-relaxed, text-dark/55, max-w-sm mx-auto
- Buttons (mt-10):
  - "Begin Here" — Pill: bg-accent, white text, rounded-full, px-8 py-3, includes arrow icon
  - "Have questions? →" — Ghost link: text-dark/40, hover→text-dark/70
- Footer tagline (mt-16): 10px, 0.25em tracking, uppercase, text-dark/35 — "Make it matter · Since 2015"
```

---

### 6. NAVIGATION BAR

#### Top Navigation
```
- Position: fixed top-0 left-0 right-0, z-[100]
- Height: h-16 md:h-20
- Background: Transparent initially (changes to bg-white/80 backdrop-blur on scroll)
- Progress bar: 2px accent bar at bottom (bg-accent/80), width animates with scroll progress

Layout (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8, flex justify-between):

Left — Logo:
  - Circle badge: w-8 h-8 rounded-full bg-accent/15
  - Text "RC" inside: text-accent text-[11px] font-semibold
  - Text next to circle (hidden on mobile):
    - "Rotaract" → text-sm font-medium tracking-tight text-dark/90
    - "BIBWEWADI · PUNE" → 9px, 0.15em tracking, uppercase, text-dark/35

Center — Nav Links (hidden on mobile, visible lg+):
  - Pill-style links: px-3 py-2 text-[13px] font-medium rounded-lg
  - Active state: text-accent bg-accent/10
  - Inactive state: text-dark/60, hover→text-dark/90 hover:bg-dark/5
  - Links: Home, About, Projects, Events, Board, Directory, Join Us, Contact

Right — Utility Icons:
  - Login (user icon), Theme toggle (moon icon), Admin (shield icon), Mobile menu (hamburger)
  - All: p-2 rounded-lg text-dark/70, hover→text-dark hover:bg-dark/10
  - Icons: Lucide React, 18×18px
```

#### Full-Screen Sidebar (Mobile Menu Overlay)
```
- Overlay: fixed inset-0 z-[90]
- Dark background: bg-dark (#09090b)
- Accent blurred orb: 500×500px, bg-accent/10 blur-[120px], positioned at top-1/4 -right-20, scales in when open
- Layout: flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12
- Container: max-w-7xl mx-auto px-4 sm:px-8 lg:px-16

Left — Navigation List:
  - space-y-2 md:space-y-4
  - Each item: number (10px, tracking-wider, text-white/30 inactive / text-accent active) + title (font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl, text-white/70 inactive / text-accent active) + animated arrow (→ in text-accent, slides in on hover)
  - Active item has pulsing dot: w-2 h-2 rounded-full bg-accent animate-pulse
  - Items slide in from left with staggered delays (duration-700, starting opacity-0 -translate-x-10)

Right — Info Panel (desktop only):
  - "PART OF" → "Rotary International District 3131" (text-white/65 text-sm)
  - "FOLLOW US" → Social circles: w-10 h-10 rounded-full border border-white/15, text "IG"/"FB"/"IN" in text-white/50, hover→text-accent border-accent
  - "© 2026 RCB Pune" (text-white/30 text-xs)
```

---

### 7. FOOTER

```
- Background: bg-dark (#09090b)
- Padding: py-16 on container (max-w-5xl mx-auto)
- Top: Centered "MAKE IT MATTER" — 10px, 0.3em tracking, uppercase, text-white/25, mb-14

4-Column Grid (grid-cols-1 md:grid-cols-4 gap-10):

Column 1 — Identity:
  - "Rotaract Club" → text-sm font-medium text-white/80
  - "Bibwewadi, Pune" → text-xs text-white/40
  - "ROTARY INTERNATIONAL · DISTRICT 3131" → 10px text-white/25 tracking-wider uppercase mt-3

Column 2 — Explore:
  - Header: "EXPLORE" — 10px tracking-[0.15em] uppercase text-white/35 mb-3
  - Links (vertical, space-y-2): About, Projects, Events, Board, Join — 13px text-white/45, hover→text-white/75

Column 3 — Reach Us:
  - Header: "REACH US" — same as Explore header
  - Email with mail icon (12×12px Lucide): text-[13px] text-white/45
  - Phone with phone icon: same style
  - Address with map-pin icon: same style, non-linkable

Column 4 — Connect:
  - Header: "CONNECT" — same style
  - Social icons (w-8 h-8 rounded-full border border-white/12): Instagram, Facebook, LinkedIn
    - Icons: w-4 h-4, stroke-based, text-white/35, hover→text-white/65 border-white/25

Bottom Bar:
  - border-t border-white/8 mt-12 pt-5
  - Left: "© 2026 Rotaract Club of Bibwewadi Pune" — 10px text-white/25
  - Right: "Service Above Self" — 10px text-white/25
```

---

### 8. ANIMATIONS

Create these animations and apply them:

#### Scroll Reveal (Section Level)
All sections (except hero) should have scroll-triggered animations:
- **Initial state:** `transform: scale(0.965) translateY(20px); border-radius: 16px; opacity: 0.3; overflow: hidden;`
- **Visible state:** scale(1), translateY(0), opacity(1), border-radius(0)
- Uses `will-change: transform, opacity, border-radius`
- Creates a card-like scale-up reveal effect

#### Scroll Reveal (Element Level)
Content blocks within sections have individual reveal animations:
- **Fade-up:** `opacity: 0; transform: translateY(50px)` → visible, with staggered transition-delay (0ms, 100ms, 200ms, 300ms)
- **Scale-up:** Stats use `transform: scale(0.92)` → scale(1)
- **Duration:** `duration-[1.2s] ease-out`

#### Keyframe Animations
```css
@keyframes slowSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
/* Applied to hero SVG ornament: animation: slowSpin 180s linear infinite; */

@keyframes gentlePulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
/* 5s ease-in-out infinite — for subtle elements */

@keyframes rotaSlideIn {
  from { transform: translateY(20px) scale(0.9); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
/* 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) — for chat widget entrance */

@keyframes rotaPulseRing {
  0% { box-shadow: 0 0 0 0 rgba(139, 26, 43, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(139, 26, 43, 0); }
  100% { box-shadow: 0 0 0 0 rgba(139, 26, 43, 0); }
}
/* 3s ease-out infinite — for chat button pulse */

@keyframes wave {
  0%, 100% { transform: scaleY(0.6); }
  50% { transform: scaleY(1.3); }
}
/* 2s ease-in-out infinite — for chat wave bars */
```

#### Hover Effects
- Cards: Background color shift (light-card → #ededea), duration-500
- Explore cards: Title turns accent color, arrow slides right (translate-x-1)
- Nav links: Subtle background tint on hover (bg-dark/5)
- Logo circle: Background opacity increases on hover
- Social icons: Border and text turn accent color

---

### 9. CHAT WIDGET (Floating Assistant)

```
- Position: fixed bottom-6 right-6 z-[999]
- Button: w-14 h-14 rounded-full
- Avatar: gradient SVG or image of a character
- Border: 2px border-accent/50, hover→border-accent
- Shadow: shadow-xl shadow-accent/20
- Hover: scale-110, Active: scale-95
- Pulse animation: rotaPulseRing — accent-colored ring expanding outward every 3s
- Entrance: rotaSlideIn — springs in from below with bounce easing
```

---

### 10. SECTION CONNECTORS (Between All Sections)

Add a thin vertical connector between every section:

```css
.section-connector {
  width: 1px;
  height: 64px; /* h-16 */
  background: linear-gradient(
    to bottom,
    transparent,
    currentColor,
    transparent
  );
  opacity: 0.1;
}
```

Container: `flex justify-center py-1` with the `.section-connector` div inside.

---

### 11. FADE RULE DIVIDER

Used within sections to separate content blocks:

```css
.fade-rule {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    currentColor,
    transparent
  );
  opacity: 0.12;
}
```

---

### 12. ICON SYSTEM

Use **Lucide React** icons throughout the site. All icons should be:
- Stroke-based (not filled)
- Size: 16-18px for inline, 12px for micro (like footer)
- Color inherits from parent (use text color utilities)

Required icons: chevron-down, arrow-right, arrow-up-right, user, moon, sun, shield, menu, x, mail, phone, map-pin, instagram, facebook, linkedin

---

### 13. RESPONSIVE BREAKPOINTS

Follow Tailwind CSS defaults:
- `sm:` → 640px
- `md:` → 768px
- `lg:` → 1024px
- `xl:` → 1280px

Mobile-first approach. All sections must be fully responsive. Key responsive changes:
- Hero title: 88px on desktop, smaller on mobile (use responsive text sizing)
- Nav: Full sidebar overlay on mobile, inline pills on desktop (lg+)
- Stats: 2-column on mobile, 4-column on desktop (md+)
- Pillar cards: 1-column on mobile, 2-column on desktop (sm+)
- Footer: 1-column on mobile, 4-column on desktop (md+)

---

### 14. KEY DESIGN PRINCIPLES TO FOLLOW

1. **Warm Minimalism** — Clean surfaces with warm off-white (#fafaf9) instead of pure white. No harsh borders.
2. **Opacity Hierarchy** — Use text opacity variants (60/55/45/35/25) to create visual hierarchy instead of different gray colors.
3. **Generous Whitespace** — Large vertical padding between sections (py-20 to py-40). Let content breathe.
4. **Subtle Atmosphere** — Blurred orbs in hero create warmth without being distracting.
5. **Burgundy + Gold** — The accent (#8b1a2b) and warm (#c9a84c) combo is the signature. Never use blue/indigo.
6. **Pill Buttons** — All CTA buttons are rounded-full (pill shape), never rectangular.
7. **Card Groups** — Cards are grouped in containers with rounded-2xl + overflow-hidden + gap-0.5 (hairline gap between cards).
8. **Scroll Animations** — Sections scale up from 0.965 to 1.0 on scroll into view. Content fades up from 50px below.
9. **Light Weights** — Use weight 300 (Light) for headings and large display text. Weight 600 (Semibold) only for small card titles and accent words.
10. **Uppercase Micro Labels** — Section tags like "OUR VISION", "EXPLORE FURTHER" are small (10-12px), uppercase, with wide tracking (0.2-0.3em), in text-dark/35.

---

### 15. CHECKLIST — Verify After Implementation

- [ ] All colors match the palette (burgundy accent, gold warm, warm off-white bg)
- [ ] Font is DM Sans with correct weights (300, 400, 500, 600, 700)
- [ ] Hero has blurred orbs and spinning SVG ornament
- [ ] Hero title "Matter." has burgundy→gold gradient
- [ ] Navigation has pill-style links with accent/10 active state
- [ ] All CTA buttons are pill-shaped (rounded-full)
- [ ] Cards use bg-light-card with hover to #ededea
- [ ] Card groups have gap-0.5 with rounded-2xl container
- [ ] Section connectors (vertical fade lines) exist between all sections
- [ ] Scroll reveal animations work (scale 0.965→1, fade-up)
- [ ] Footer is near-black (#09090b) with white text at various opacities
- [ ] Micro labels are uppercase with wide tracking
- [ ] No blue/indigo colors anywhere on the site
- [ ] Chat widget has pulse ring animation
- [ ] All icons are Lucide React (stroke-based)
- [ ] Responsive at all breakpoints
- [ ] Nav progress bar shows scroll progress

---

## PROMPT END

---

### Additional Notes for Your Agentic AI

- If the existing site uses a different component library (e.g., Material UI, Chakra), map the design tokens to that library's theming system.
- If the site uses CSS modules instead of Tailwind, convert the Tailwind utility classes to equivalent CSS.
- Preserve all existing functionality (routing, data fetching, forms, etc.) — only change the visual layer.
- The content (text, stats, links) should be updated to match your actual organization's data, but the design structure must follow this spec exactly.
- If there are additional pages beyond the homepage, apply the same design tokens, typography, card styles, and animation patterns consistently.
